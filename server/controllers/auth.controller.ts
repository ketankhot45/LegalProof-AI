import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db.js';
import { generateToken } from '../utils/jwt.js';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.js';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  requiredRole: z.enum(['COMPLAINANT', 'INVESTIGATOR', 'ADMIN']).optional(),
});

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    
    // Public registration ALWAYS creates a COMPLAINANT account
    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        password: hashedPassword,
        role: 'COMPLAINANT',
      },
    });

    const token = generateToken(user.id, user.role);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip,
      }
    });

    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }

    if (
      error?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      (typeof error?.message === 'string' && error.message.includes("Can't reach database server"))
    ) {
      console.warn('Register attempt failed: PostgreSQL database is currently unreachable.');
      return res.status(503).json({
        error: 'Database connection error: Unable to reach PostgreSQL database at the configured host. Please ensure DATABASE_URL in Settings / Secrets points to a publicly reachable host (not localhost).'
      });
    }

    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, requiredRole } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (requiredRole && user.role !== requiredRole) {
      const roleLabels: Record<string, string> = {
        COMPLAINANT: 'Complainant',
        INVESTIGATOR: 'Investigator',
        ADMIN: 'Administrator'
      };
      return res.status(403).json({
        error: `Access Denied: This account is registered as ${roleLabels[user.role] || user.role}. You cannot sign in through the ${roleLabels[requiredRole] || requiredRole} portal.`
      });
    }

    const token = generateToken(user.id, user.role);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGGED_IN',
        ipAddress: req.ip,
      }
    });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }

    if (
      error?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      (typeof error?.message === 'string' && error.message.includes("Can't reach database server"))
    ) {
      console.warn('Login attempt failed: PostgreSQL database is currently unreachable.');
      return res.status(503).json({
        error: 'Database connection error: Unable to reach PostgreSQL database at the configured host. Please ensure DATABASE_URL in Settings / Secrets points to a publicly reachable host (not localhost).'
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ user });
  } catch (error: any) {
    if (
      error?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      (typeof error?.message === 'string' && error.message.includes("Can't reach database server"))
    ) {
      console.warn('getMe: PostgreSQL database is unreachable.');
      return res.status(503).json({ error: 'Database unreachable' });
    }
    console.error('getMe error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
