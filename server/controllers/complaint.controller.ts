import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middlewares/auth.js';

const createSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  category: z.string().optional(),
});

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'ESCALATE']),
  rejectionReason: z.string().optional(),
});

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const validated = createSchema.parse(req.body);
    const complaint = await prisma.complaint.create({
      data: {
        ...validated,
        status: 'SUBMITTED', // Or DRAFT if we want to allow saving drafts
        userId: req.user!.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'COMPLAINT_CREATED',
        resource: `Complaint:${complaint.id}`,
        ipAddress: req.ip,
      }
    });

    res.status(201).json({ complaint });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    let whereClause = {};
    if (req.user!.role === 'COMPLAINANT') {
      whereClause = { userId: req.user!.id };
    }
    // INVESTIGATOR and ADMIN can see all complaints (or we could limit it further)

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: { user: { select: { name: true, email: true } } },
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
      include: { user: { select: { name: true, email: true } }, case: true },
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

export const reviewComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = reviewSchema.parse(req.body);

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return res.status(404).json({ error: 'Not found' });

    let newStatus = complaint.status;
    let newCase = null;

    if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else if (action === 'APPROVE') {
      newStatus = 'UNDER_REVIEW'; // or stay approved
    } else if (action === 'ESCALATE') {
      newStatus = 'ESCALATED';
      
      // Create a case
      newCase = await prisma.case.create({
        data: {
          title: `Case: ${complaint.title}`,
          description: complaint.description,
          priority: complaint.priority,
          status: 'OPENED',
          complaint: { connect: { id: complaint.id } }
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CASE_CREATED',
          resource: `Case:${newCase.id}`,
          details: `Escalated from Complaint:${complaint.id}`,
          ipAddress: req.ip,
        }
      });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: newStatus,
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
