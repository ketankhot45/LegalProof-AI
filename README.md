# LegalProof AI — Secure Digital Evidence & Complaint Management System

LegalProof AI is a secure, modern platform for managing digital complaints, cases, and evidence. It features strict chain-of-custody tracking, cryptographic hash verification, and role-based access control.

## Project Structure

This project is a Monorepo containing:
- `client/` - React frontend built with Vite, Tailwind CSS, and shadcn/ui.
- `server/` - Node.js Express backend with Prisma ORM.
- `prisma/` - Database schema and migrations.
- `contracts/` - (Future phase) Smart contracts for blockchain anchoring.

## Prerequisites

- Node.js (v18+)
- PostgreSQL database

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the `.env.example` file to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Run the Prisma migrations to set up your database schema:
   ```bash
   npx prisma db push
   ```
   *(Note: For production, use `npx prisma migrate dev`)*

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The backend and frontend will be served together on port 3000.

### Local Investigator Demo Account

Create a local-only Investigator account by setting these environment variables in your terminal. Use a local PostgreSQL connection string for `LOCAL_DEMO_DATABASE_URL`; the seed refuses to run with `NODE_ENV=production`.

PowerShell:

```powershell
$env:LOCAL_DEMO_DATABASE_URL = "postgresql://USER:PASSWORD@localhost:5432/DATABASE"
$env:LOCAL_INVESTIGATOR_EMAIL = "investigator@local.test"
$env:LOCAL_INVESTIGATOR_PASSWORD = "set-a-local-password-of-at-least-8-characters"
npm run seed:investigator
```

The operation is idempotent. If that email already belongs to an Investigator, it does nothing; if it belongs to another role, it stops without changing the user. Log in through the normal login page using the email in `LOCAL_INVESTIGATOR_EMAIL` and the password you supplied in `LOCAL_INVESTIGATOR_PASSWORD`.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma
- **Security:** JWT, bcrypt, helmet, express-rate-limit

## Development Phases

This project is currently in **Phase 1: Foundation**.
- [x] Initial Monorepo Setup
- [x] Database Schema and Prisma Setup
- [x] JWT Authentication & Role-Based Access Control
- [x] Protected API Routes and Frontend Shell
