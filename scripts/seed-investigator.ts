import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
    throw new Error('The local Investigator seed cannot run when NODE_ENV=production.');
}

const databaseUrl = process.env.LOCAL_DEMO_DATABASE_URL;
const email = process.env.LOCAL_INVESTIGATOR_EMAIL;
const password = process.env.LOCAL_INVESTIGATOR_PASSWORD;
const name = process.env.LOCAL_INVESTIGATOR_NAME || 'Local Investigator';

if (!databaseUrl) {
    throw new Error('LOCAL_DEMO_DATABASE_URL is required.');
}

if (!email) {
    throw new Error('LOCAL_INVESTIGATOR_EMAIL is required.');
}

if (!password || password.length < 8) {
    throw new Error('LOCAL_INVESTIGATOR_PASSWORD is required and must be at least 8 characters.');
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: databaseUrl },
    },
});

try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        if (existingUser.role !== 'INVESTIGATOR') {
            throw new Error(`A user with ${email} already exists with role ${existingUser.role}; no changes were made.`);
        }

        console.log(`Investigator already exists for ${email}; no changes were made.`);
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'INVESTIGATOR',
            },
        });

        console.log(`Created local Investigator account for ${email}.`);
    }
} finally {
    await prisma.$disconnect();
}