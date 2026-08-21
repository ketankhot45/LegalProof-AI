import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.SQL_HOST) {
  const dbUser = encodeURIComponent(process.env.SQL_USER || '');
  const dbPass = encodeURIComponent(process.env.SQL_PASSWORD || '');
  const dbName = process.env.SQL_DB_NAME || '';
  const rawHost = process.env.SQL_HOST || '';
  const dbPort = process.env.SQL_PORT || '5432';

  if (rawHost.startsWith('/')) {
    const instanceName = rawHost.replace('/app/cloudsql/', '');
    const targetSocketDir = `/app/cloudsql_fixed_${process.pid}`;
    const fullSocketDir = path.join(targetSocketDir, instanceName);
    const socketFile = path.join(fullSocketDir, '.s.PGSQL.5432');

    // Ensure Cloud SQL proxy process is running with endpoint :443
    if (fs.existsSync('/app/cloud_sql_proxy')) {
      try {
        fs.mkdirSync(targetSocketDir, { recursive: true });
        spawn('/app/cloud_sql_proxy', [
          instanceName,
          `--unix-socket=${targetSocketDir}`,
          '--sql-data',
          '--sql-data-endpoint=sqladmin.googleapis.com:443',
          '--sqladmin-api-endpoint=sqladmin.googleapis.com:443',
          '--impersonate-service-account=service-470484551793@gcp-sa-run-ai.iam.gserviceaccount.com'
        ], { detached: true, stdio: 'ignore' }).unref();

        // Synchronous sleep waiting for socket file creation
        const startTime = Date.now();
        while (Date.now() - startTime < 3000) {
          if (fs.existsSync(socketFile)) break;
          // brief sync pause
          const at = Date.now();
          while (Date.now() - at < 50) {}
        }
      } catch (e) {
        console.error('Failed to spawn Cloud SQL proxy:', e);
      }
    }

    if (fs.existsSync(socketFile)) {
      databaseUrl = `postgresql://${dbUser}:${dbPass}@localhost/${dbName}?host=${fullSocketDir}`;
    } else {
      databaseUrl = `postgresql://${dbUser}:${dbPass}@localhost:${dbPort}/${dbName}?host=${rawHost}`;
    }
  } else {
    databaseUrl = `postgresql://${dbUser}:${dbPass}@${rawHost}:${dbPort}/${dbName}`;
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

export default prisma;

