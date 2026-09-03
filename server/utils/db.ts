import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const host = process.env.SQL_HOST;
  const port = process.env.SQL_PORT || '5432';
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;
  const db = process.env.SQL_DB_NAME;

  if (host && user && db) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = password ? encodeURIComponent(password) : '';
    databaseUrl = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${db}`;
  }
}

if (!databaseUrl) {
  console.warn('DATABASE_URL or SQL credentials not found. Database operations will fail.');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;



