import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db.js';
import { generateToken } from '../utils/jwt.js';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/auth.js';
import {
  generateRandomToken,
  hashSecurityToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendInvestigatorInvitationEmail,
} from '../services/email.service.js';

function getAppBaseUrl(req: Request): string {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  return `${protocol}://${host}`;
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
  requiredRole: z.enum(['COMPLAINANT', 'INVESTIGATOR', 'ADMIN']).optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(10, 'Invalid verification token'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const inviteInvestigatorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const activateInvestigatorSchema = z.object({
  token: z.string().min(10, 'Invalid activation token'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const register = async (req: Request, res: Response) => {
  try {
    const validated = registerSchema.parse(req.body);
    const email = validated.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Public registration ALWAYS creates a COMPLAINANT account with isEmailVerified: false
    const user = await prisma.user.create({
      data: {
        name: validated.name.trim(),
        email,
        password: hashedPassword,
        role: 'COMPLAINANT',
        isEmailVerified: false,
        tokenVersion: 1,
      },
    });

    // Generate single-use verification token
    const rawToken = generateRandomToken(32);
    const tokenHash = hashSecurityToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Dispatch verification email
    const baseUrl = getAppBaseUrl(req);
    const emailResult = await sendVerificationEmail(user.email, user.name, rawToken, baseUrl);

    if (!emailResult.success) {
      await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_EMAIL_DELIVERY_FAILED',
          details: 'Failed to dispatch verification email during registration.',
          ipAddress: req.ip,
        },
      }).catch(() => {});
      
      return res.status(500).json({ error: 'System configuration error: Unable to deliver email. Please contact support.' });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: 'User registered as Complainant. Email verification link dispatched.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_EMAIL_VERIFICATION_SENT',
        details: 'Verification email sent upon registration.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.status(201).json({
      message: 'Registration successful. A verification link has been sent to your email. Please verify your email before signing in.',
      email: user.email,
      requiresVerification: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid input' });
    }

    if (
      error?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      (typeof error?.message === 'string' && error.message.includes("Can't reach database server"))
    ) {
      console.warn('Register attempt failed: PostgreSQL database is currently unreachable.');
      return res.status(503).json({
        error: 'Database connection error: Unable to reach PostgreSQL database. Please ensure DATABASE_URL in Settings / Secrets is reachable.'
      });
    }

    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);
    const tokenHash = hashSecurityToken(token);

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_EMAIL_VERIFICATION_FAILED',
          details: 'Failed email verification attempt with expired or invalid token.',
          ipAddress: req.ip,
        },
      }).catch(() => {});

      if (record) {
        await prisma.emailVerificationToken.delete({ where: { id: record.id } }).catch(() => {});
      }

      return res.status(400).json({
        error: 'Invalid or expired verification token. Please request a new verification link.',
      });
    }

    // Mark user verified
    await prisma.user.update({
      where: { id: record.userId },
      data: { isEmailVerified: true },
    });

    // Delete all verification tokens for this user (single-use)
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    });

    await prisma.auditLog.create({
      data: {
        userId: record.userId,
        action: 'AUTH_EMAIL_VERIFIED',
        details: 'Email verified successfully via verification token.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Your email address has been verified successfully. You can now log in to LegalProof AI.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid token format' });
    }
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && !user.isEmailVerified) {
      // Invalidate existing verification tokens
      await prisma.emailVerificationToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate fresh token
      const rawToken = generateRandomToken(32);
      const tokenHash = hashSecurityToken(rawToken);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl = getAppBaseUrl(req);
      const emailResult = await sendVerificationEmail(user.email, user.name, rawToken, baseUrl);

      if (!emailResult.success) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'AUTH_EMAIL_DELIVERY_FAILED',
            details: 'Failed to resend verification email.',
            ipAddress: req.ip,
          },
        }).catch(() => {});
        return res.status(500).json({ error: 'System configuration error: Unable to deliver email.' });
      }

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_EMAIL_VERIFICATION_SENT',
          details: 'New verification email requested and dispatched.',
          ipAddress: req.ip,
        },
      }).catch(() => {});
    }

    // Generic response to avoid leaking email existence
    res.json({
      message: 'If an unverified account is registered with this email, a verification link has been sent.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid email' });
    }
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, requiredRole } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_LOGIN_FAILED',
          resource: 'Auth:Login',
          details: `Failed authentication for email: ${normalizedEmail}`,
          ipAddress: req.ip,
        },
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resource: `User:${user.id}`,
          details: 'Failed authentication: invalid password attempt',
          ipAddress: req.ip,
        },
      }).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Enforce email verification
    if (!user.isEmailVerified) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_LOGIN_FAILED',
          resource: `User:${user.id}`,
          details: 'Login denied: Email address has not been verified.',
          ipAddress: req.ip,
        },
      }).catch(() => {});

      return res.status(403).json({
        error: 'Email verification required. Please verify your email before logging in.',
        requiresVerification: true,
        email: user.email,
      });
    }

    if (requiredRole && user.role !== requiredRole) {
      const roleLabels: Record<string, string> = {
        COMPLAINANT: 'Complainant',
        INVESTIGATOR: 'Investigator',
        ADMIN: 'Administrator',
      };
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_ROLE_MISMATCH',
          resource: `User:${user.id}`,
          details: `User attempted portal login with mismatched role: actual ${user.role}, required ${requiredRole}`,
          ipAddress: req.ip,
        },
      }).catch(() => {});
      return res.status(403).json({
        error: `Access Denied: This account is registered as ${roleLabels[user.role] || user.role}. You cannot sign in through the ${roleLabels[requiredRole] || requiredRole} portal.`,
      });
    }

    const token = generateToken(user.id, user.role, user.tokenVersion);

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGGED_IN',
        details: `User logged in successfully through ${user.role} role.`,
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid input' });
    }

    if (
      error?.name === 'PrismaClientInitializationError' ||
      error?.code === 'P1001' ||
      (typeof error?.message === 'string' && error.message.includes("Can't reach database server"))
    ) {
      console.warn('Login attempt failed: PostgreSQL database is currently unreachable.');
      return res.status(503).json({
        error: 'Database connection error: Unable to reach PostgreSQL database. Please ensure DATABASE_URL in Settings / Secrets is reachable.',
      });
    }

    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      // Invalidate existing reset tokens
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Generate single-use reset token with 15-minute expiration
      const rawToken = generateRandomToken(32);
      const tokenHash = hashSecurityToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl = getAppBaseUrl(req);
      const emailResult = await sendPasswordResetEmail(user.email, user.name, rawToken, baseUrl);

      if (!emailResult.success) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'AUTH_EMAIL_DELIVERY_FAILED',
            details: 'Failed to dispatch password reset email.',
            ipAddress: req.ip,
          },
        }).catch(() => {});
        return res.status(500).json({ error: 'System configuration error: Unable to deliver email.' });
      }

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'AUTH_PASSWORD_RESET_REQUESTED',
          details: 'Password reset link generated and dispatched.',
          ipAddress: req.ip,
        },
      }).catch(() => {});
    }

    // Always generic response to prevent account enumeration
    res.json({
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid email' });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    const tokenHash = hashSecurityToken(token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_PASSWORD_RESET_FAILED',
          details: 'Password reset attempt with invalid or expired token.',
          ipAddress: req.ip,
        },
      }).catch(() => {});

      if (record) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {});
      }

      return res.status(400).json({
        error: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password, increment tokenVersion (revoking all prior JWT sessions), and ensure verified
    await prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
        isEmailVerified: true,
      },
    });

    // Delete single-use reset token
    await prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId },
    });

    await prisma.auditLog.create({
      data: {
        userId: record.userId,
        action: 'AUTH_PASSWORD_RESET_COMPLETED',
        details: 'Password reset successfully completed.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: record.userId,
        action: 'AUTH_SESSION_REVOKED',
        details: 'All existing active user sessions invalidated following password reset.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please sign in with your new password.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid input' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Increment tokenVersion on user record to immediately invalidate active JWTs server-side
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'AUTH_LOGOUT',
        details: 'User logged out; active session invalidated on server.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'AUTH_SESSION_REVOKED',
        details: 'Token version incremented to revoke active JWT tokens.',
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Logged out successfully. Active sessions revoked.',
    });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const inviteInvestigator = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only administrators can invite investigators' });
    }

    const { name, email } = inviteInvestigatorSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({
        error: `An account with email ${normalizedEmail} already exists with role ${existingUser.role}.`,
      });
    }

    // Invalidate prior invitation for this email
    await prisma.investigatorInvitationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Create single-use invitation token with 48h expiration
    const rawToken = generateRandomToken(32);
    const tokenHash = hashSecurityToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invitation = await prisma.investigatorInvitationToken.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        invitedById: req.user.id,
      },
    });

    const baseUrl = getAppBaseUrl(req);
    const emailResult = await sendInvestigatorInvitationEmail(normalizedEmail, name.trim(), rawToken, baseUrl);

    if (!emailResult.success) {
      await prisma.investigatorInvitationToken.delete({ where: { id: invitation.id } });
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id,
          action: 'AUTH_EMAIL_DELIVERY_FAILED',
          details: `Failed to dispatch investigator invitation to ${normalizedEmail}`,
          ipAddress: req.ip,
        },
      }).catch(() => {});
      return res.status(500).json({ error: 'System configuration error: Unable to deliver email.' });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'INVESTIGATOR_INVITED',
        resource: `InvestigatorInvite:${normalizedEmail}`,
        details: `Administrator invited investigator ${name.trim()} (${normalizedEmail}).`,
        ipAddress: req.ip,
      },
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Investigator invitation successfully sent to ${normalizedEmail}.`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid input' });
    }
    console.error('Invite investigator error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const activateInvestigator = async (req: Request, res: Response) => {
  try {
    const { token, password } = activateInvestigatorSchema.parse(req.body);
    const tokenHash = hashSecurityToken(token);

    const record = await prisma.investigatorInvitationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.investigatorInvitationToken.delete({ where: { id: record.id } }).catch(() => {});
      }
      return res.status(400).json({
        error: 'Invalid or expired invitation link. Please contact an administrator for a new invite.',
      });
    }

    // Double check email collision
    const existing = await prisma.user.findUnique({ where: { email: record.email } });
    if (existing) {
      await prisma.investigatorInvitationToken.delete({ where: { id: record.id } }).catch(() => {});
      return res.status(400).json({ error: 'An account with this email address is already active.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: record.name,
        email: record.email,
        password: hashedPassword,
        role: 'INVESTIGATOR',
        isEmailVerified: true,
        tokenVersion: 1,
      },
    });

    // Delete used invitation token
    await prisma.investigatorInvitationToken.delete({ where: { id: record.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVESTIGATOR_ACTIVATED',
        details: `Forensic investigator account activated for ${user.email}.`,
        ipAddress: req.ip,
      },
    }).catch(() => {});

    const jwtToken = generateToken(user.id, user.role, user.tokenVersion);

    res.status(201).json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Invalid input' });
    }
    console.error('Activate investigator error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const listInvestigators = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    const activeInvestigators = await prisma.user.findMany({
      where: { role: 'INVESTIGATOR' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: { assignedCases: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingInvitations = await prisma.investigatorInvitationToken.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      investigators: activeInvestigators,
      pendingInvitations,
    });
  } catch (error: any) {
    console.error('List investigators error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
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
