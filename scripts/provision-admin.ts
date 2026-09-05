import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
const email = (process.env.ADMIN_EMAIL || process.env.INITIAL_ADMIN_EMAIL)?.toLowerCase().trim();
const password = process.env.ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || process.env.INITIAL_ADMIN_NAME || 'System Administrator';

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is required to provision the administrator account.');
  process.exit(1);
}

if (!email || !email.includes('@')) {
  console.error('ERROR: ADMIN_EMAIL environment variable is required and must be a valid email.');
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is required and must be at least 8 characters.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function provisionAdmin() {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      if (existing.role === 'ADMIN') {
        const hashedPassword = await bcrypt.hash(password!, 10);
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            password: hashedPassword,
            isEmailVerified: true,
            tokenVersion: { increment: 1 },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: existing.id,
            action: 'ADMIN_PROVISIONED',
            details: `Existing administrator account updated and verified for ${email}.`,
          },
        }).catch(() => {});

        console.log(`Administrator account for ${email} has been updated and verified successfully.`);
      } else {
        console.error(`ERROR: A user with email ${email} already exists with role ${existing.role}. Please use a dedicated administrator email.`);
        process.exit(1);
      }
    } else {
      const hashedPassword = await bcrypt.hash(password!, 10);

      const admin = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          isEmailVerified: true,
          tokenVersion: 1,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          action: 'ADMIN_PROVISIONED',
          details: `New administrator account provisioned for ${email}.`,
        },
      }).catch(() => {});

      console.log(`New administrator account provisioned successfully for ${email}.`);
    }
  } catch (error: any) {
    console.error('Admin provisioning failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

provisionAdmin();
