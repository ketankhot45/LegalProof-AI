import { Request, Response } from 'express';
import prisma from '../utils/db.js';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role === 'COMPLAINANT') {
      const [
        totalComplaints,
        submittedCount,
        underReviewCount,
        escalatedCount,
        rejectedCount,
        draftCount,
        recentComplaints,
        linkedCasesCount
      ] = await Promise.all([
        prisma.complaint.count({ where: { userId: user.id } }),
        prisma.complaint.count({ where: { userId: user.id, status: 'SUBMITTED' } }),
        prisma.complaint.count({ where: { userId: user.id, status: 'UNDER_REVIEW' } }),
        prisma.complaint.count({ where: { userId: user.id, status: 'ESCALATED' } }),
        prisma.complaint.count({ where: { userId: user.id, status: 'REJECTED' } }),
        prisma.complaint.count({ where: { userId: user.id, status: 'DRAFT' } }),
        prisma.complaint.findMany({
          where: { userId: user.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            case: {
              select: {
                id: true,
                status: true,
                title: true
              }
            }
          }
        }),
        prisma.complaint.count({
          where: { userId: user.id, caseId: { not: null } }
        })
      ]);

      return res.json({
        role: user.role,
        stats: {
          totalComplaints,
          submittedCount,
          underReviewCount,
          escalatedCount,
          rejectedCount,
          draftCount,
          linkedCasesCount
        },
        recentComplaints
      });
    } else {
      // INVESTIGATOR or ADMIN
      const isInvestigator = user.role === 'INVESTIGATOR';

      const custodyLogWhere = isInvestigator
        ? {
            evidence: {
              case: {
                OR: [
                  { investigatorId: user.id },
                  { investigatorId: null }
                ]
              }
            }
          }
        : {};

      const casesWhere = isInvestigator
        ? {
            OR: [
              { investigatorId: user.id },
              { investigatorId: null }
            ]
          }
        : {};

      const [
        totalCases,
        activeCases,
        assignedToMe,
        closedCases,
        pendingComplaints,
        totalComplaints,
        totalEvidence,
        verifiedEvidence,
        failedEvidence,
        anchoredEvidence,
        recentCustodyLogs,
        recentCases
      ] = await Promise.all([
        prisma.case.count({ where: casesWhere }),
        prisma.case.count({
          where: { 
            ...casesWhere,
            status: { in: ['OPENED', 'ASSIGNED', 'ACTIVE_INVESTIGATION', 'UNDER_REVIEW'] } 
          }
        }),
        prisma.case.count({
          where: { investigatorId: user.id, status: { not: 'CLOSED' } }
        }),
        prisma.case.count({ where: { ...casesWhere, status: 'CLOSED' } }),
        prisma.complaint.count({
          where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } }
        }),
        prisma.complaint.count(),
        prisma.evidence.count({
          where: isInvestigator ? { case: casesWhere } : {}
        }),
        prisma.evidence.count({ 
          where: { 
            ...(isInvestigator ? { case: casesWhere } : {}),
            status: 'VERIFIED' 
          } 
        }),
        prisma.evidence.count({ 
          where: { 
            ...(isInvestigator ? { case: casesWhere } : {}),
            status: 'INTEGRITY_FAILED' 
          } 
        }),
        prisma.evidence.count({ 
          where: { 
            ...(isInvestigator ? { case: casesWhere } : {}),
            blockchainStatus: 'ANCHORED' 
          } 
        }),
        prisma.chainOfCustodyLog.findMany({
          where: custodyLogWhere,
          take: 8,
          orderBy: { timestamp: 'desc' },
          include: {
            evidence: {
              select: {
                id: true,
                fileName: true,
                caseId: true,
                status: true,
                blockchainStatus: true
              }
            }
          }
        }),
        prisma.case.findMany({
          where: casesWhere,
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            investigator: {
              select: { id: true, name: true, email: true }
            },
            complaint: {
              select: { id: true, title: true }
            }
          }
        })
      ]);

      return res.json({
        role: user.role,
        stats: {
          totalCases,
          activeCases,
          assignedToMe,
          closedCases,
          pendingComplaints,
          totalComplaints,
          totalEvidence,
          verifiedEvidence,
          failedEvidence,
          anchoredEvidence
        },
        recentActivity: recentCustodyLogs,
        recentCases
      });
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};
