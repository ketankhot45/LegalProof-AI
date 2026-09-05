import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middlewares/auth.js';
import { anchorEvidenceOnBlockchain } from '../services/blockchain.js';
import { runAIAnalysis } from '../services/ai/index.js';
import { 
  saveEvidence, 
  getEvidenceBuffer, 
  getEvidenceStream, 
  deleteEvidence 
} from '../services/storage.service.js';
import { validateEvidenceFile } from '../utils/file-validator.js';
import crypto from 'crypto';
import path from 'path';

// Zod schemas
const uploadBodySchema = z.object({
  clientHash: z.string().min(64).max(64),
  category: z.string().optional(),
  description: z.string().optional(),
});

export const uploadEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    
    // Check if case exists and user has permission
    const c = await prisma.case.findUnique({
      where: { id: caseId },
      include: { complaint: true }
    });
    
    if (!c) {
      return res.status(404).json({ error: 'Case not found' });
    }

    if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden: Complainants cannot upload evidence' });
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to upload evidence' });
      }
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate request body
    const bodyValidation = uploadBodySchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({ error: 'Invalid metadata, clientHash is required' });
    }

    const { clientHash, category, description } = bodyValidation.data;

    // Calculate server-side SHA-256
    const fileBuffer = req.file.buffer;
    const serverHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (clientHash.toLowerCase() !== serverHash.toLowerCase()) {
      return res.status(400).json({ 
        error: 'Integrity verification failed. The calculated file hash does not match the provided hash.'
      });
    }

    // Inspect file signature / magic bytes to prevent renamed/disguised binaries
    const validationResult = validateEvidenceFile(
      fileBuffer,
      req.file.originalname,
      req.file.mimetype
    );

    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: validationResult.error || 'File validation failed: unauthorized or malformed file content.' 
      });
    }

    // Generate unique object key for storage
    const ext = path.extname(req.file.originalname);
    const storageUrl = crypto.randomUUID() + ext;

    // Create Evidence record with verified MIME type
    const evidence = await prisma.evidence.create({
      data: {
        caseId,
        uploadedById: req.user!.id,
        fileName: req.file.originalname,
        mimeType: validationResult.verifiedMimeType,
        size: req.file.size,
        clientHash: clientHash.toLowerCase(),
        sha256Hash: serverHash.toLowerCase(),
        storageUrl,
        status: 'VERIFIED',
        category,
        description,
      }
    });

    // Save verified evidence to persistent storage service
    try {
      await saveEvidence(storageUrl, fileBuffer, validationResult.verifiedMimeType);
    } catch (storageError) {
      // Cleanup if storage fails
      await prisma.evidence.delete({ where: { id: evidence.id } });
      throw storageError;
    }

    // Audit and Custody logs
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'EVIDENCE_UPLOADED',
        resource: `Evidence:${evidence.id}`,
        details: `File ${req.file.originalname} uploaded`,
        ipAddress: req.ip,
      }
    });

    await prisma.chainOfCustodyLog.createMany({
      data: [
        {
          evidenceId: evidence.id,
          actorId: req.user!.id,
          action: 'UPLOADED',
          ipAddress: req.ip,
        },
        {
          evidenceId: evidence.id,
          actorId: req.user!.id,
          action: 'HASH_CALCULATED_AND_VERIFIED',
          ipAddress: req.ip,
        }
      ]
    });

    res.status(201).json({ evidence });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getEvidenceList = async (req: AuthRequest, res: Response) => {
  try {
    const { caseId } = req.params;
    
    // Authz check
    const c = await prisma.case.findUnique({
      where: { id: caseId },
      include: { complaint: true }
    });
    
    if (!c) return res.status(404).json({ error: 'Case not found' });

    if (req.user!.role === 'COMPLAINANT') {
      if (!c.complaint || c.complaint.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to access evidence' });
      }
    }

    const evidenceList = await prisma.evidence.findMany({
      where: { caseId },
      include: { uploadedBy: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ evidence: evidenceList });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getEvidenceDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { 
        case: { include: { complaint: true } },
        uploadedBy: { select: { name: true, role: true } },
        custodyLogs: { orderBy: { timestamp: 'desc' }, include: { evidence: false } }
      }
    });

    if (!evidence) return res.status(404).json({ error: 'Not found' });

    const c = evidence.case;
    if (req.user!.role === 'COMPLAINANT') {
      if (!c.complaint || c.complaint.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to access this evidence' });
      }
    }

    res.json({ evidence });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const downloadEvidence = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { case: { include: { complaint: true } } }
    });

    if (!evidence) return res.status(404).json({ error: 'Not found' });

    // Authz check
    const c = evidence.case;
    if (req.user!.role === 'COMPLAINANT') {
      if (!c.complaint || c.complaint.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to download this evidence' });
      }
    }

    const streamData = await getEvidenceStream(evidence.storageUrl);
    if (!streamData) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    await prisma.chainOfCustodyLog.create({
      data: {
        evidenceId: evidence.id,
        actorId: req.user!.id,
        action: 'DOWNLOADED_OR_VIEWED',
        ipAddress: req.ip,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'EVIDENCE_DOWNLOADED_OR_VIEWED',
        resource: `Evidence:${evidence.id}`,
        details: `Evidence ${evidence.fileName} downloaded or viewed by ${req.user!.role}`,
        ipAddress: req.ip,
      }
    });

    res.setHeader('Content-Type', evidence.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(evidence.fileName)}"`);
    if (streamData.contentLength) {
      res.setHeader('Content-Length', streamData.contentLength);
    }

    streamData.stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyEvidenceIntegrity = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { case: { include: { complaint: true } } }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found', code: 'NOT_FOUND' });
    }

    // Authz check
    const c = evidence.case;
    if (req.user!.role === 'COMPLAINANT') {
      if (!c.complaint || c.complaint.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized: You do not have permission to verify this evidence', code: 'UNAUTHORIZED' });
      }
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to verify this evidence', code: 'UNAUTHORIZED' });
      }
    }

    const fileBuffer = await getEvidenceBuffer(evidence.storageUrl);
    if (!fileBuffer) {
      return res.status(404).json({ 
        verified: false,
        error: 'Evidence file is currently unavailable in storage. The stored SHA-256 digest and blockchain proof remain intact, but the physical file could not be verified.',
        code: 'FILE_MISSING',
        originalHash: evidence.sha256Hash
      });
    }

    // Re-calculate hash
    const serverHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const verified = serverHash.toLowerCase() === evidence.sha256Hash?.toLowerCase();

    // Update status based on cryptographic verification result
    await prisma.evidence.update({
      where: { id: evidence.id },
      data: {
        status: verified ? 'VERIFIED' : 'INTEGRITY_FAILED'
      }
    });

    await prisma.chainOfCustodyLog.create({
      data: {
        evidenceId: evidence.id,
        actorId: req.user!.id,
        action: verified ? 'INTEGRITY_VERIFIED_MANUALLY' : 'INTEGRITY_VERIFICATION_FAILED_MANUALLY',
        ipAddress: req.ip,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: verified ? 'EVIDENCE_INTEGRITY_VERIFIED' : 'EVIDENCE_INTEGRITY_FAILED',
        resource: `Evidence:${evidence.id}`,
        details: verified ? `Integrity check passed: SHA-256 digest confirmed for ${evidence.fileName}` : `Integrity check failed: digest mismatch for ${evidence.fileName}`,
        ipAddress: req.ip,
      }
    });

    if (!verified) {
      return res.json({ 
        verified: false, 
        code: 'HASH_MISMATCH',
        currentHash: serverHash, 
        originalHash: evidence.sha256Hash,
        error: 'Integrity verification failed: the stored file hash does not match the original intake hash.'
      });
    }

    return res.json({ 
      verified: true, 
      code: 'VERIFIED',
      currentHash: serverHash, 
      originalHash: evidence.sha256Hash,
      message: 'Verification successful. Server hash matches client intake digest.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error', code: 'SERVER_ERROR' });
  }
};

export const anchorEvidenceController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (req.user!.role !== 'INVESTIGATOR' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Investigators or Admins can anchor evidence' });
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { case: true }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    if (req.user!.role === 'INVESTIGATOR') {
      if (!evidence.case || !evidence.case.investigatorId || evidence.case.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Only the assigned lead investigator or an admin can anchor this evidence' });
      }
    }

    const updatedEvidence = await anchorEvidenceOnBlockchain(id, req.user!.id, req.ip);
    res.json({ message: 'Evidence successfully anchored to blockchain', evidence: updatedEvidence });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to anchor evidence' });
  }
};

export const analyzeEvidenceController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { case: { include: { complaint: true } } }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Authz check: Only ADMIN or the assigned lead INVESTIGATOR can run AI analysis
    const c = evidence.case;
    if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden: Only the assigned lead investigator or an administrator can run AI evidence analysis' });
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to run AI evidence analysis' });
      }
    }

    // Invariant: AI analysis should only be performed on evidence with verified integrity
    if (evidence.status !== 'VERIFIED') {
      return res.status(400).json({ error: 'AI analysis can only be performed on evidence with VERIFIED cryptographic integrity status.' });
    }

    const fileBuffer = await getEvidenceBuffer(evidence.storageUrl);
    if (!fileBuffer) {
      return res.status(404).json({ error: 'File missing from server storage' });
    }

    // Run AI analysis
    let analysis;
    try {
      analysis = await runAIAnalysis({
        evidenceId: evidence.id,
        filePathOrBuffer: fileBuffer,
        mimeType: evidence.mimeType,
        fileName: evidence.fileName,
      });
    } catch (aiErr: any) {
      // Record failure audit log without leaking sensitive info
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'EVIDENCE_AI_ANALYSIS_FAILED',
          resource: `Evidence:${evidence.id}`,
          details: `AI analysis attempt failed for ${evidence.fileName}: ${aiErr?.message || 'Processing error'}`,
          ipAddress: req.ip,
        }
      });
      return res.status(500).json({ error: aiErr?.message || 'Failed to process AI evidence analysis' });
    }

    // Save summary into DB - isolated from evidence file and blockchain state
    const updatedEvidence = await prisma.evidence.update({
      where: { id: evidence.id },
      data: {
        aiSummary: JSON.stringify(analysis),
      }
    });

    // Record Chain of Custody & Audit logs on confirmed success
    await prisma.chainOfCustodyLog.create({
      data: {
        evidenceId: evidence.id,
        actorId: req.user!.id,
        action: 'AI_ANALYSIS_PERFORMED',
        ipAddress: req.ip,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'EVIDENCE_AI_ANALYZED',
        resource: `Evidence:${evidence.id}`,
        details: `AI evidence text extraction and OCR completed for ${evidence.fileName}`,
        ipAddress: req.ip,
      }
    });

    res.json({
      message: 'AI evidence analysis completed successfully',
      analysis,
      evidence: updatedEvidence,
    });
  } catch (error: any) {
    console.error('AI Analysis Controller Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI evidence analysis' });
  }
};

export const getEvidenceAnalysisController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: { case: { include: { complaint: true } } }
    });

    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    // Authz check
    const c = evidence.case;
    if (req.user!.role === 'COMPLAINANT') {
      if (!c.complaint || c.complaint.userId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you to view this evidence analysis' });
      }
    }

    if (!evidence.aiSummary) {
      return res.json({
        evidenceId: evidence.id,
        hasAnalysis: false,
        message: 'No AI analysis has been generated for this evidence yet.',
      });
    }

    try {
      const parsedAnalysis = JSON.parse(evidence.aiSummary);
      res.json({
        evidenceId: evidence.id,
        hasAnalysis: true,
        analysis: parsedAnalysis,
      });
    } catch {
      res.json({
        evidenceId: evidence.id,
        hasAnalysis: true,
        rawSummary: evidence.aiSummary,
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


