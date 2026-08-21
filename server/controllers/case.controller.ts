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
      include: { investigator: { select: { name: true } }, complaint: { select: { title: true } } },
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
      // If unassigned, permit basic triage metadata, but hide sensitive investigation notes until claimed
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
      // Investigators can only assign cases to themselves
      if (validated.investigatorId !== undefined && validated.investigatorId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden: Investigators can only assign cases to themselves' });
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
