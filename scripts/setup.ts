import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function log(msg: string) {
  console.log(`\x1b[36m[LegalProof AI Setup]\x1b[0m ${msg}`);
}

function success(msg: string) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

function warn(msg: string) {
  console.log(`\x1b[33m⚠\x1b[0m ${msg}`);
}

function runCommand(command: string, cwd: string = rootDir) {
  try {
    execSync(command, { stdio: 'inherit', cwd });
  } catch (error) {
    console.error(`\x1b[31m✖ Error executing command: ${command}\x1b[0m`);
    process.exit(1);
  }
}

async function main() {
  log('Starting one-command setup for LegalProof AI...');

  // 1. Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);
  if (majorVersion < 18) {
    console.error(`\x1b[31m✖ Error: You are using Node.js ${nodeVersion}. Node.js 18 or higher is explicitly required.\x1b[0m`);
    process.exit(1);
  } else {
    success(`Node.js version is compatible (${nodeVersion}).`);
  }

  // 2. Setup environment variables
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  if (fs.existsSync(envPath)) {
    success('.env file already exists. Skipping environment variable creation.');
  } else {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      success('Created .env file from .env.example.');
      warn('IMPORTANT: Please configure your database and authentication secrets in the new .env file.');
    } else {
      warn('.env.example not found. Cannot create .env automatically.');
    }
  }

  // 3. Prisma Setup
  log('Generating Prisma Client...');
  runCommand('npx prisma generate');
  success('Prisma Client generated.');

  log('Setup complete!');
  console.log('\n\x1b[35m=== Next Steps ===\x1b[0m');
  console.log('1. Configure your \x1b[33m.env\x1b[0m file with a valid PostgreSQL connection string (DATABASE_URL).');
  console.log('2. Apply the database schema by running: \x1b[36mnpx prisma db push\x1b[0m');
  console.log('3. Start the development server by running: \x1b[36mnpm run dev\x1b[0m\n');
}

main().catch((error) => {
  console.error('\x1b[31mSetup failed:\x1b[0m', error);
  process.exit(1);
});
