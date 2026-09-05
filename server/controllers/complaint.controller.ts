import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middlewares/auth.js';
import { saveEvidence, getEvidenceStream } from '../services/storage.service.js';
import { validateEvidenceFile } from '../utils/file-validator.js';
import crypto from 'crypto';
import path from 'path';

// Complainant schema: priority is strictly excluded (cannot be chosen by complainant)
const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  category: z.string().optional(),
});

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ESCALATE']),
  rejectionReason: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createSchema.parse(req.body);

    let verifiedMimeType = 'application/octet-stream';
    if (req.file && req.file.buffer) {
      const validationResult = validateEvidenceFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (!validationResult.isValid) {
        return res.status(400).json({ 
          error: validationResult.error || 'Supporting proof validation failed: unauthorized or malformed file content.' 
        });
      }
      verifiedMimeType = validationResult.verifiedMimeType;
    }

    const complaint = await prisma.complaint.create({
      data: {
        title: validated.title,
        description: validated.description,
        category: validated.category || 'OTHER',
        status: 'SUBMITTED',
        userId: req.user!.id,
      },
    });

    let proofRecord = null;
    if (req.file && req.file.buffer) {
      const ext = path.extname(req.file.originalname) || '.bin';
      const storageKey = `proof-${crypto.randomUUID()}${ext}`;

      await saveEvidence(storageKey, req.file.buffer, verifiedMimeType);

      proofRecord = await prisma.supportingProof.create({
        data: {
          complaintId: complaint.id,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: verifiedMimeType,
          storageKey,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'COMPLAINT_CREATED',
        resource: `Complaint:${complaint.id}`,
        details: proofRecord ? `Complaint created with supporting proof: ${proofRecord.fileName}` : 'Complaint created without supporting proof',
        ipAddress: req.ip,
      }
    });

    res.status(201).json({ complaint, supportingProof: proofRecord });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error('createComplaint error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    let whereClause = {};
    if (req.user!.role === 'COMPLAINANT') {
      whereClause = { userId: req.user!.id };
    }
    // INVESTIGATOR and ADMIN can see all complaints

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: { 
        user: { select: { name: true, email: true } },
        supportingProofs: { select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ complaints });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { 
        user: { select: { name: true, email: true } }, 
        case: true,
        supportingProofs: true,
      },
    });

    if (!complaint) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === 'COMPLAINANT' && complaint.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ complaint });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadSupportingProof = async (req: AuthRequest, res: Response) => {
  try {
    const { id, proofId } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { supportingProofs: true },
    });

    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user!.role === 'COMPLAINANT' && complaint.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const proof = complaint.supportingProofs.find(p => p.id === proofId);
    if (!proof) return res.status(404).json({ error: 'Supporting proof not found' });

    const streamData = await getEvidenceStream(proof.storageKey);
    if (!streamData) {
      return res.status(404).json({ error: 'Supporting proof file not found in storage' });
    }

    res.setHeader('Content-Type', proof.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(proof.fileName)}"`);
    if (streamData.contentLength) {
      res.setHeader('Content-Length', streamData.contentLength);
    }

    streamData.stream.pipe(res);
  } catch (error) {
    console.error('downloadSupportingProof error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const reviewComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason, priority } = reviewSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    let newStatus = complaint.status;
    let newCase = null;

    if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'APPROVE') {
      newStatus = 'UNDER_REVIEW';
    } else if (action === 'ESCALATE') {
      newStatus = 'ESCALATED';
      
      // Investigator/Admin assigns official priority upon escalation
      const assignedPriority = priority || complaint.priority || 'MEDIUM';

      // Create formal case
      newCase = await prisma.case.create({
        data: {
          title: `Case: ${complaint.title}`,
          description: complaint.description,
          priority: assignedPriority,
          status: 'OPENED',
          complaint: { connect: { id: complaint.id } }
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CASE_CREATED',
          resource: `Case:${newCase.id}`,
          details: `Escalated from Complaint:${complaint.id} with priority ${assignedPriority}`,
          ipAddress: req.ip,
        }
      });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: newStatus,
        priority: priority || complaint.priority,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `COMPLAINT_REVIEWED_${action}`,
        resource: `Complaint:${complaint.id}`,
        ipAddress: req.ip,
      }
    });

    res.json({ complaint: updated, case: newCase });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
