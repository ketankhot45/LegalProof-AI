# LegalProof AI — Technical Blueprint

## 1. Final Product Vision
A highly secure, enterprise-grade digital evidence and complaint management platform. LegalProof AI bridges traditional digital forensics concepts with modern immutable blockchain anchoring and AI-driven insights. It is designed to track the complete lifecycle of digital evidence—from civilian upload to investigator analysis—ensuring cryptographic integrity, an unbreakable chain of custody, and intelligent (but legally neutral) AI assistance.

## 2. Target Users and Roles
- **Complainant (Citizen/User):** Submits initial complaints, uploads raw digital evidence, checks case status.
- **Investigator (Law Enforcement/Security):** Reviews complaints, opens cases, analyzes evidence, utilizes AI for insights, manages chain of custody.
- **Admin/Auditor:** Manages RBAC, audits system logs, ensures platform integrity, exports compliance reports.

## 3. Functional Requirements
- Secure authentication and Role-Based Access Control (RBAC).
- Submit, triage, and manage digital complaints.
- Upload multimedia evidence with automatic client-side SHA-256 hashing.
- Anchor evidence hashes to a blockchain for immutable public proof-of-existence.
- Strict chain-of-custody logging (who viewed, transferred, or modified case metadata).
- AI-assisted OCR, transcription, and entity extraction on evidence.
- Public verify portal allowing external verification of evidence hashes against the blockchain.

## 4. Non-Functional Requirements
- **Security:** Zero-trust principles for file uploads, server-side secrets, and strict CORS/CSP headers.
- **Performance:** Sub-200ms API response times; async processing for large file uploads and AI tasks.
- **Integrity:** The system must cryptographically prove that a file has not been altered since upload.
- **Availability:** Stateless architecture suitable for horizontal scaling (e.g., Cloud Run).

## 5. Complete Module Architecture
1. **Identity & Access Module:** JWT auth, RBAC middleware.
2. **Intake & Triage Module:** Complaint drafting and submission.
3. **Case Management Module:** Case timelines, assignments, and reporting.
4. **Evidence Engine:** Secure upload via presigned URLs, format validation, and metadata extraction.
5. **Blockchain Anchor Module:** Web3 provider interaction, smart contract transaction signing.
6. **AI Intelligence Core:** Gemini API integration for NER (Named Entity Recognition) and summarization.
7. **Audit & Compliance Module:** Append-only logging subsystem.

## 6. Evidence Lifecycle
1. **Acquisition:** User selects file; client calculates SHA-256 hash *before* transmission.
2. **Transmission:** File uploaded securely (e.g., via S3 Presigned URL) to object storage.
3. **Verification:** Server recalculates hash and compares it with the client's claim.
4. **Anchoring:** Server queues the verified hash to be committed to the blockchain.
5. **Analysis:** Investigators review the file; AI extracts entities and metadata.
6. **Archival:** Evidence is locked securely, retaining hash and metadata indefinitely.

## 7. Complaint Lifecycle
Draft → Submitted → Under Review → Escalated to Case (or) Rejected → Archived.

## 8. Case Lifecycle
Opened → Assigned → Active Investigation (Evidence gathering) → Under Review → Closed.

## 9. Chain-of-Custody Design
Every interaction with an evidence record generates an immutable ledger entry.
*Why:* Courts require proof of who handled evidence and when. An append-only relational table referencing the `evidence_id`, `actor_id`, `action_type`, and `timestamp` satisfies this.

## 10. Evidence Integrity / Hash Architecture
**Client-side hashing is critical.** The browser uses the Web Crypto API (`crypto.subtle.digest`) to hash the file locally before upload. The server independently hashes the received file. If they match, integrity during transit is proven. The hash is then stored in the DB and blockchain.

## 11. Blockchain Architecture
- **Network:** Polygon Amoy (Testnet) for low-cost, fast confirmations.
- **Smart Contract:** A simple registry mapping `bytes32 evidenceHash` to a `struct { timestamp, submitterAddress }`.
- *Why:* Storing raw files on blockchain is impossible/expensive. Storing just the SHA-256 hash proves the file existed at that exact moment without revealing its contents.

## 12. AI Architecture and Responsible-AI Boundaries
- **Capabilities:** Use Gemini to transcribe audio, OCR images, extract names/locations/dates (NER), and summarize long documents.
- **Boundary:** AI must *never* label evidence as "fake/real", nor determine "guilt". The UI must clearly label AI outputs as "AI Assisted Analysis - Requires Human Verification."
- *Why:* Maintains ethical standards and mimics real-world legal software constraints.

## 13. Authentication and Authorization Architecture
- **Auth:** JWT-based stateless authentication.
- **Authz:** Role-based middleware (`ensureRole(['INVESTIGATOR', 'ADMIN'])`) at the API route level.
- *Why:* Keeps the API stateless and horizontally scalable while strictly partitioning citizen data from investigator tools.

## 14. Database Entities and Relationships
- `User` (1:N) `Complaint`
- `Complaint` (1:1) `Case`
- `Case` (1:N) `Evidence`
- `Evidence` (1:N) `ChainOfCustodyLog`
- `User` (1:N) `AuditLog`

## 15. Complete Database Schema Proposal
```prisma
model User {
  id        String   @id @default(uuid())
  role      Role     @default(CITIZEN) // CITIZEN, INVESTIGATOR, ADMIN
  email     String   @unique
  password  String
}

model Case {
  id          String   @id @default(uuid())
  title       String
  status      CaseStatus
  evidence    Evidence[]
}

model Evidence {
  id             String   @id @default(uuid())
  caseId         String
  fileName       String
  mimeType       String
  sha256Hash     String   @unique
  storageUrl     String
  txHash         String?  // Blockchain transaction hash
  aiSummary      String?
  custodyLogs    ChainOfCustodyLog[]
}

model ChainOfCustodyLog {
  id         String   @id @default(uuid())
  evidenceId String
  actorId    String
  action     String   // e.g., "UPLOADED", "VIEWED", "AI_ANALYZED"
  timestamp  DateTime @default(now())
  ipAddress  String?
}
```

## 16. Backend Architecture
Node.js + Express (or Hono) built as a **Modular Monolith**.
*Why:* Microservices introduce unnecessary complexity for a final-year project. A clean, modular folder structure (Controller → Service → Repository) demonstrates enterprise patterns without the DevOps nightmare.

## 17. Frontend Architecture
React 19 + Vite + Tailwind CSS + Shadcn UI.
*Why:* Industry-standard, highly performant, and allows for building a professional, polished UI rapidly without writing raw CSS.

## 18. API Architecture
RESTful API, strictly versioned (`/api/v1/...`). Standard JSON error envelopes.
*Why:* Predictable, easy to test, and easy to document (Swagger/OpenAPI).

## 19. Storage Architecture
Object Storage (AWS S3, or Supabase Storage / Cloud Storage) for binary files.
*Why:* Databases are terrible at storing large blobs. Object storage with private, signed URLs ensures evidence is not publicly accessible unless explicitly shared.

## 20. Public Verification Architecture
A standalone page (`/verify`) that requires no login. A user drops a file, the browser calculates the SHA-256 hash locally, and the page queries the blockchain via a public RPC node to see if that hash exists in the smart contract registry.
*Why:* Demonstrates zero-knowledge proof of existence without exposing the backend.

## 21. Audit-Log Architecture
A global middleware intercepts sensitive requests (POST/PUT/DELETE) and asynchronously writes an entry to the `AuditLog` table.
*Why:* Security auditing is a core requirement for enterprise applications.

## 22. Security Threat Model (STRIDE)
- **Spoofing:** Mitigated by strong JWTs and bcrypt password hashing.
- **Tampering:** Mitigated by SHA-256 file hashing and blockchain anchoring.
- **Repudiation:** Mitigated by strict Chain of Custody and Audit Logging.
- **Information Disclosure:** Mitigated by Row-Level Security (RLS) / Application RBAC, and keeping storage buckets strictly private.
- **Denial of Service:** Mitigated by rate limiting file uploads and API endpoints.

## 23. Main UI Pages and Navigation
- **Public:** Landing Page, Public Verify Portal, Login/Register.
- **Citizen:** Dashboard, My Complaints, Upload Evidence.
- **Investigator:** Command Center (Dashboard), Case Explorer, Evidence Vault, Case Details, AI Insights Panel.

## 24. Dashboard Design
- **Theme:** High-contrast dark mode option for a "security ops" feel.
- **Layout:** Sidebar navigation. Top metric cards (Open Cases, Evidence Processed). Recent Activity timeline.
- *Why:* Mirrors real-world SIEM and investigative tools (e.g., Splunk, Palantir).

## 25. Deployment Architecture
- **Frontend + Backend:** Packaged together or deployed via container (Docker) to Google Cloud Run or Render.
- **Database:** Managed PostgreSQL (e.g., Neon, Supabase, Cloud SQL).

## 26. Testing Strategy
- Unit tests for cryptography/hashing utility functions.
- Integration tests for the API (Supertest).
- *Why:* Shows interviewers you understand CI/CD and software reliability.

## 27. GitHub Repository Structure
```text
/client           # React/Vite frontend
/server           # Node/Express backend
/contracts        # Solidity smart contracts (Hardhat/Foundry)
/shared           # Shared TypeScript interfaces (if using a monorepo workspace)
```

## 28. Development Phases
1. **Foundation:** Setup monorepo, database schema, and JWT Auth.
2. **Core Crud:** Complaint & Case management APIs and UI.
3. **The Evidence Engine:** Secure uploads, client/server SHA-256 hashing.
4. **Blockchain & Trust:** Smart contract deployment, Web3 integration, Public Verify portal.
5. **AI Intelligence:** Integrate Gemini for OCR, transcription, and summarization.
6. **Polish:** Dashboards, Audit logs, final UX tuning.

## 29. MVP vs Advanced Features
- **MVP:** Auth, Case management, secure upload, SHA-256 hashing, Chain of Custody.
- **Advanced:** Blockchain anchoring, Public Verify portal, Gemini AI integration, advanced dashboards.

## 30. Potential Technical Risks and Mitigation
- **Risk:** Blockchain gas fees/RPC limits. **Fix:** Use Polygon Testnet and Alchemy/Infura free tier.
- **Risk:** Large file uploads timing out. **Fix:** Use S3 Presigned URLs so the client uploads directly to storage, bypassing the Node server.
- **Risk:** AI Hallucinations. **Fix:** Strict system prompts confining the AI to extraction only, plus UI disclaimers.

---

## Deliverables Summary

### A. Recommended Final Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **Backend:** Node.js, Express (TypeScript), Prisma ORM.
- **Database:** PostgreSQL (Neon or Cloud SQL).
- **Storage:** S3-compatible Object Storage.
- **Blockchain:** Solidity, Ethers.js, Polygon Amoy Testnet.
- **AI:** Google Gemini API.

### B. Final Module List
Auth, Case Management, Evidence Engine, Blockchain Anchoring, AI Intelligence, Audit & Compliance.

### C. Database Entity List
User, Complaint, Case, Evidence, ChainOfCustodyLog, AuditLog.

### D. Development Roadmap
Phase 1: DB/Auth → Phase 2: Cases/Uploads → Phase 3: Hash/Blockchain → Phase 4: AI Insights → Phase 5: UI Polish.

### E. MVP Definition
A working portal where a citizen can submit a complaint with a file, an investigator can view it, and the system guarantees the file's SHA-256 hash matches the original upload, with a basic chain-of-custody log.

### F. Advanced Feature Roadmap
Smart contract deployment for hash anchoring, a public "drag-and-drop" verification page, and Gemini-powered automated evidence entity extraction (NER).

### G. Top 5–7 Features for Interviews
1. **Zero-Trust Client-Side Hashing:** Proves you understand data integrity before transmission.
2. **Blockchain Hash Anchoring:** Demonstrates Web3 integration without the hype—using it purely for immutable timestamping.
3. **Cryptographic Public Verification:** A slick, interactive portal that verifies files against the blockchain purely in the browser.
4. **Responsible AI Integration:** Shows maturity by using AI for OCR/NER, strictly bounded by UI constraints so it doesn't "play judge."
5. **Strict Chain of Custody System:** Highlights your understanding of enterprise audit requirements and relational database design.
6. **Presigned URL Architecture:** Proves you know how to handle large files at scale without crashing a Node.js server.
7. **Role-Based Command Center:** A professional, dark-themed investigator UI that looks like enterprise security software.
