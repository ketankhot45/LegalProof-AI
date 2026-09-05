import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/db.js';
import { AuthRequest } from '../middlewares/auth.js';

const updateSchema = z.object({
  status: z.enum(['OPENED', 'ASSIGNED', 'ACTIVE_INVESTIGATION', 'UNDER_REVIEW', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  investigatorId: z.string().uuid().optional().nullable(),
});

const noteSchema = z.object({
  content: z.string().min(1),
});

export const getCases = async (req: AuthRequest, res: Response) => {
  try {
    let whereClause = {};
    if (req.user!.role === 'INVESTIGATOR') {
      // Investigators only see cases assigned to them or unassigned
      whereClause = {
        OR: [
          { investigatorId: req.user!.id },
          { investigatorId: null }
        ]
      };
    } else if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const cases = await prisma.case.findMany({
      where: whereClause,
      include: { 
        investigator: { select: { name: true, email: true } }, 
        complaint: { select: { title: true } },
        assignmentRequests: {
          where: req.user!.role === 'INVESTIGATOR' ? { investigatorId: req.user!.id } : undefined,
          select: { id: true, status: true, investigatorId: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ cases });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const c = await prisma.case.findUnique({
      where: { id },
      include: {
        investigator: { select: { name: true, email: true } },
        caseNotes: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: 'desc' } },
        complaint: true,
        assignmentRequests: {
          include: {
            investigator: { select: { id: true, name: true, email: true } },
            reviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!c) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (req.user!.role === 'INVESTIGATOR') {
      if (c.investigatorId && c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: You are not authorized to view this case' });
      }
      // If unassigned, permit basic triage metadata, but hide sensitive investigation notes until approved
      if (!c.investigatorId) {
        return res.json({
          case: {
            ...c,
            caseNotes: [],
          }
        });
      }
    }

    res.json({ case: c });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateCase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validated = updateSchema.parse(req.body);

    const existing = await prisma.case.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user!.role === 'INVESTIGATOR') {
      // Cannot modify a case assigned to another investigator
      if (existing.investigatorId && existing.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: You are not authorized to modify this case' });
      }
      // Business Rule: Investigators CANNOT directly assign cases to themselves or anyone else
      if (validated.investigatorId !== undefined) {
        return res.status(403).json({ 
          error: 'Forbidden: Investigators cannot directly assign cases. You must submit an assignment request for Administrator review.' 
        });
      }
    }

    const updated = await prisma.case.update({
      where: { id },
      data: validated,
    });

    if (validated.status && validated.status !== existing.status) {
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CASE_STATUS_CHANGED',
          resource: `Case:${id}`,
          details: `Status changed to ${validated.status}`,
          ipAddress: req.ip,
        }
      });
    }

    if (validated.investigatorId !== undefined && validated.investigatorId !== existing.investigatorId) {
       await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'INVESTIGATOR_ASSIGNED',
          resource: `Case:${id}`,
          details: `Assigned investigator ${validated.investigatorId}`,
          ipAddress: req.ip,
        }
      });
    }

    res.json({ case: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addCaseNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = noteSchema.parse(req.body);

    const c = await prisma.case.findUnique({ where: { id } });
    if (!c) return res.status(404).json({ error: 'Not found' });

    if (req.user!.role === 'COMPLAINANT') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user!.role === 'INVESTIGATOR') {
      if (!c.investigatorId || c.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Case must be explicitly assigned to you before recording investigation notes' });
      }
    }

    const note = await prisma.caseNote.create({
      data: {
        caseId: id,
        authorId: req.user!.id,
        content,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'CASE_NOTE_CREATED',
        resource: `Case:${id}`,
        ipAddress: req.ip,
      }
    });

    res.status(201).json({ note });
  } catch (error) {
     if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const assignmentRequestSchema = z.object({
  notes: z.string().optional(),
});

export const requestAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole !== 'INVESTIGATOR') {
      return res.status(403).json({ error: 'Forbidden: Only investigators can submit case assignment requests' });
    }

    const c = await prisma.case.findUnique({ where: { id } });
    if (!c) return res.status(404).json({ error: 'Case not found' });

    if (c.investigatorId) {
      return res.status(400).json({ error: 'Case is already assigned to an investigator' });
    }

    // Check if investigator already has a pending request
    const existingPending = await prisma.caseAssignmentRequest.findFirst({
      where: {
        caseId: id,
        investigatorId: userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending assignment request for this case' });
    }

    const { notes } = assignmentRequestSchema.parse(req.body || {});

    const request = await prisma.caseAssignmentRequest.create({
      data: {
        caseId: id,
        investigatorId: userId,
        status: 'PENDING',
        notes: notes || null,
      },
      include: {
        investigator: { select: { id: true, name: true, email: true } },
        case: { select: { id: true, title: true, priority: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CASE_ASSIGNMENT_REQUESTED',
        resource: `Case:${id}`,
        details: `Investigator requested assignment to Case:${id}`,
        ipAddress: req.ip,
      },
    });

    res.status(201).json({ request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error('requestAssignment error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getAssignmentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user!.role;
    let whereClause: any = {};

    if (userRole === 'INVESTIGATOR') {
      whereClause.investigatorId = req.user!.id;
    } else if (userRole === 'ADMIN') {
      const { status } = req.query;
      if (status && (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED')) {
        whereClause.status = status;
      }
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const requests = await prisma.caseAssignmentRequest.findMany({
      where: whereClause,
      include: {
        case: { select: { id: true, title: true, status: true, priority: true, investigatorId: true } },
        investigator: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ requests });
  } catch (error) {
    console.error('getAssignmentRequests error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const reviewRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export const reviewAssignmentRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can review assignment requests' });
    }

    const { requestId } = req.params;
    const { action, rejectionReason } = reviewRequestSchema.parse(req.body);

    const request = await prisma.caseAssignmentRequest.findUnique({
      where: { id: requestId },
      include: { case: true, investigator: true },
    });

    if (!request) {
      return res.status(404).json({ error: 'Assignment request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Request has already been ${request.status.toLowerCase()}` });
    }

    if (action === 'APPROVE') {
      // Check if case is already assigned
      if (request.case.investigatorId) {
        return res.status(400).json({ error: 'Case has already been assigned to an investigator' });
      }

      // Assign the case to the requesting investigator
      const updatedCase = await prisma.case.update({
        where: { id: request.caseId },
        data: {
          investigatorId: request.investigatorId,
          status: 'ASSIGNED',
        },
      });

      // Update the request status to APPROVED
      const updatedRequest = await prisma.caseAssignmentRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewerId: req.user!.id,
        },
        include: {
          case: true,
          investigator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      // Automatically reject other pending requests for the same case
      await prisma.caseAssignmentRequest.updateMany({
        where: {
          caseId: request.caseId,
          id: { not: requestId },
          status: 'PENDING',
        },
        data: {
          status: 'REJECTED',
          notes: 'Case assigned to another investigator by administrator',
          reviewedAt: new Date(),
          reviewerId: req.user!.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CASE_ASSIGNMENT_APPROVED',
          resource: `Case:${request.caseId}`,
          details: `Approved assignment to investigator ${request.investigator.name} (${request.investigatorId})`,
          ipAddress: req.ip,
        },
      });

      return res.json({ request: updatedRequest, case: updatedCase });
    } else {
      // Reject request
      const updatedRequest = await prisma.caseAssignmentRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          notes: rejectionReason || 'Assignment request rejected by administrator',
          reviewedAt: new Date(),
          reviewerId: req.user!.id,
        },
        include: {
          case: true,
          investigator: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CASE_ASSIGNMENT_REJECTED',
          resource: `Case:${request.caseId}`,
          details: `Rejected assignment request for investigator ${request.investigator.name} (${request.investigatorId})`,
          ipAddress: req.ip,
        },
      });

      return res.json({ request: updatedRequest });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    console.error('reviewAssignmentRequest error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
