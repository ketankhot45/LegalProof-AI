import React, { useState } from 'react';
import { Link } from 'react-router';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  Search, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Binary, 
  Layers, 
  Scale, 
  Eye, 
  UserCheck, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  Database, 
  FileCheck, 
  KeyRound, 
  ExternalLink 
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePageSEO } from '../hooks/usePageSEO';

export const Landing: React.FC = () => {
  usePageSEO({
    title: 'LegalProof AI – Cryptographic Evidence & Digital Chain of Custody',
    description: 'Enterprise-grade digital evidence management, immutable chain-of-custody tracking, and independent blockchain verification for legal proceedings.',
    canonicalPath: '/',
    robots: 'index, follow',
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => prev === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does LegalProof AI prevent evidence tampering?',
      a: 'The moment a file is selected, the application computes an authoritative SHA-256 cryptographic digest. Once ingested and validated by authorized investigators, this unique 256-bit hash is written directly to the Polygon Amoy blockchain smart contract. Any alteration to a single byte of the file alters its hash entirely, rendering tampering immediately detectable.'
    },
    {
      q: 'Can attorneys or courts verify evidence without an account?',
      a: 'Yes. LegalProof AI provides a zero-login Public Verification portal at /verify. Anyone in possession of a physical printout, QR code, SHA-256 hash, or raw digital file can test it directly against our blockchain smart contract registry and view block confirmation timestamps without registering.'
    },
    {
      q: 'How are complaints and citizen submissions handled?',
      a: 'Citizens register directly as Complainants to file formal incident reports. Each report is assigned a reference tracking ID and enters the administrative queue for triage. Sworn investigators review reports, verify corroborating media, and escalate validated complaints into formal judicial case dossiers.'
    },
    {
      q: 'What role does AI play in evidence evaluation?',
      a: 'LegalProof AI uses server-side multimodal AI models strictly for objective forensic indexing—including high-accuracy Optical Character Recognition (OCR) on documents, structured named-entity extraction (identifying parties, timestamps, locations), and audio transcription. The AI assists investigators with discovery without altering underlying media.'
    },
    {
      q: 'What security standards does the platform adhere to?',
      a: 'The system enforces granular Role-Based Access Control (RBAC), cryptographically signed JWT sessions with database session invalidation, parameterized database querying via Prisma, encrypted object storage via Supabase, and tamper-evident, auditable event logging for custody tracking.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="focus:outline-hidden">
            <Logo size="md" showSubtitle subtitleText="Digital Evidence & Integrity Verification" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#workflow" className="hover:text-zinc-200 transition-colors">
              Judicial Workflow
            </a>
            <a href="#blockchain" className="hover:text-zinc-200 transition-colors">
              Chain of Custody
            </a>
            <a href="#forensic-ai" className="hover:text-zinc-200 transition-colors">
              Forensic AI
            </a>
            <a href="#verification" className="hover:text-zinc-200 transition-colors">
              Public Verification
            </a>
            <a href="#faq" className="hover:text-zinc-200 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <PWAInstallButton />
            <Link
              to="/verify"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verify Evidence</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
            >
              <span>Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-zinc-850">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),rgba(255,255,255,0))]" />
          
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-mono mb-6">
              <Binary className="w-3.5 h-3.5 text-indigo-400" />
              <span>CRYPTOGRAPHIC VERIFICATION &bull; AUDITABLE CHAIN OF CUSTODY</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight sm:leading-none">
              Cryptographic Certainty for <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-indigo-200 to-indigo-400">
                Digital Evidence &amp; Chain of Custody
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-400 mb-9 leading-relaxed">
              LegalProof AI unites complainants, sworn investigators, and legal administrators
              on a unified platform anchored by SHA-256 cryptographic digests, immutable Polygon
              blockchain notarization, and automated forensic indexing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-14">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
              >
                <span>Submit Citizen Complaint</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Verify Evidence Integrity</span>
              </Link>
            </div>

            {/* Live Standards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400 mb-1">HASH INTEGRITY</div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  SHA-256 Digesting
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400 mb-1">LEDGER ANCHOR</div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Polygon Amoy Testnet
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400 mb-1">ACCESS CONTROL</div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Role-Based (RBAC)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="text-[11px] font-mono text-zinc-400 mb-1">FORENSIC STANDARD</div>
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Aligned with ISO/IEC 27037 Digital Evidence Handling Principles
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Three-Tier Judicial Workflow */}
        <section id="workflow" className="py-20 md:py-24 border-b border-zinc-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                ROBUST WORKFLOW SEGREGATION
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-4">
                Three Distinct Portals. One Source of Truth.
              </h2>
              <p className="text-sm text-zinc-400">
                Designed according to strict role separation principles to prevent unauthorized access
                and ensure clean chain-of-custody transfer from filing to trial.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portal 1: Complainant */}
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-mono text-indigo-400 mb-1">ROLE 01</div>
                  <h3 className="text-lg font-bold text-white mb-2">Complainant Portal</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Public citizen portal allowing victims, witnesses, or whistleblowers to submit incident reports,
                    attach corroborating files, and track real-time resolution status.
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Incident description &amp; category tagging
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Client-side SHA-256 pre-calculation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Private reference tracking token
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login/complainant"
                  className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-850 hover:bg-zinc-800 transition-colors border border-zinc-800"
                >
                  <span>Complainant Login</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                </Link>
              </div>

              {/* Portal 2: Investigator */}
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-500/50 transition-colors relative">
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                  SWORN PERSONNEL
                </div>
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-mono text-indigo-400 mb-1">ROLE 02</div>
                  <h3 className="text-lg font-bold text-white mb-2">Investigator Workspace</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Authorized investigative hub with secure case dossier management, evidence inspection,
                    multimodal AI document extraction, and custody transfer logging.
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Comprehensive Case Dossier records
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Gemini OCR &amp; Audio Transcription
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      One-click Polygon Blockchain Anchoring
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login/investigator"
                  className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-indigo-600/90 hover:bg-indigo-600 transition-colors"
                >
                  <span>Investigator Access</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-200" />
                </Link>
              </div>

              {/* Portal 3: Administrator */}
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-mono text-indigo-400 mb-1">ROLE 03</div>
                  <h3 className="text-lg font-bold text-white mb-2">Administrative Console</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Centralized management for judicial administration, case assignment queues,
                    investigator invitation tokens, and system audit log oversight.
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-300 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Investigator token provisioning
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      Case reassignment &amp; triage queues
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      System-wide audit event ledger
                    </li>
                  </ul>
                </div>
                <Link
                  to="/login/admin"
                  className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-850 hover:bg-zinc-800 transition-colors border border-zinc-800"
                >
                  <span>Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Blockchain & Chain of Custody */}
        <section id="blockchain" className="py-20 md:py-24 bg-zinc-900/20 border-b border-zinc-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                  CRYPTOGRAPHIC ARCHITECTURE
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-5">
                  Tamper-Resistant Blockchain Anchoring &amp; Auditable Custody Logs
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                  Digital evidence is notoriously susceptible to claims of spoliation and post-incident modification.
                  LegalProof AI anchors evidence integrity using dual verification:
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                        <Binary className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          1. Deterministic SHA-256 Hashing
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Evidence files are hashed using standard cryptographic algorithms upon upload. 
                          The resulting 64-character hexadecimal digest serves as the evidence's unique forensic fingerprint.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          2. Polygon Amoy Smart Contract Anchoring
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Hashes are committed to a deployed EVM smart contract on Polygon Amoy. The transaction hash,
                          block number, and block timestamp establish tamper-evident cryptographic timestamp verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          3. Complete Custody Log Audit Trail
                        </h4>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Every inspection, download, note addition, and transfer is permanently appended with actor identities,
                          role verification, and exact timestamps.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Architecture Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 font-mono text-xs text-zinc-300">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
                  <span className="text-indigo-400 font-semibold tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    ANCHORING LIFECYCLE
                  </span>
                  <span className="text-[11px] text-zinc-500">SMART CONTRACT v1.0</span>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[10px] text-zinc-500 uppercase">Input Payload</div>
                    <div className="text-zinc-200 mt-0.5 truncate">evidence_sample_cctv_01.mp4</div>
                  </div>

                  <div className="flex justify-center text-zinc-600">
                    &darr;
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <div className="text-[10px] text-zinc-500 uppercase">SHA-256 Digest</div>
                    <div className="text-emerald-400 font-semibold text-[11px] truncate">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </div>
                  </div>

                  <div className="flex justify-center text-zinc-600">
                    &darr;
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-950 border border-indigo-900/40">
                    <div className="text-[10px] text-indigo-400 uppercase">Polygon Block Confirmation</div>
                    <div className="text-zinc-300 text-[11px] mt-0.5">
                      Tx: <span className="text-indigo-300">0x7f9a...83d2</span> &bull; Block: <span className="text-zinc-100">#18,492,019</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
                    <Link
                      to="/verify"
                      className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span>Test verification on live blockchain</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Forensic AI Capabilities */}
        <section id="forensic-ai" className="py-20 md:py-24 border-b border-zinc-850">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                MULTIMODAL FORENSIC INTELLIGENCE
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-4">
                Automated Forensic Discovery with Gemini
              </h2>
              <p className="text-sm text-zinc-400">
                Speeding up case triage and document discovery without compromising evidentiary standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">High-Precision OCR</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Extracts machine-readable text from scanned contracts, police reports, receipts, and handwritten affidavits with layout preservation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Named Entity Recognition</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Automatically flags key entities across evidence files—including names of parties, vehicle license plates, monetary sums, and critical timestamps.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Binary className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Audio Forensic Transcription</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Converts recorded 911 calls, bodycam audio, and witness statements into verbatim searchable transcripts indexed alongside evidence files.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Public Verification Showcase */}
        <section id="verification" className="py-20 md:py-24 bg-gradient-to-b from-zinc-950 to-zinc-900/40 border-b border-zinc-850">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
              ZERO-AUTH VERIFICATION
            </span>

            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-4">
              Instant Courtroom &amp; Public Evidence Verification
            </h2>

            <p className="max-w-2xl mx-auto text-sm text-zinc-400 mb-8 leading-relaxed">
              Anyone—including judges, defense attorneys, news organizations, or independent auditors—can
              verify cryptographic integrity and match against anchored blockchain records by dragging the digital file into our verification engine or providing its hash.
            </p>

            <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 max-w-2xl mx-auto text-left shadow-2xl">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    readOnly
                    value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-xs font-mono text-zinc-400 select-all focus:outline-hidden"
                  />
                </div>
                <Link
                  to="/verify"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
                >
                  <span>Launch Verifier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>Checks SHA-256 database record</span>
                <span>Queries Polygon Amoy smart contract</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Frequently Asked Questions */}
        <section id="faq" className="py-20 md:py-24 border-b border-zinc-850">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                COMMON INQUIRIES
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-zinc-400">
                Everything you need to know about LegalProof AI security, blockchain anchoring, and access.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-hidden hover:bg-zinc-900/50 transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-20 bg-zinc-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Ready to Secure Digital Evidence with Cryptographic Proof?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto mb-8">
              Protect judicial integrity, mitigate custody integrity disputes, providing cryptographic verification for legal review.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <span>Register Citizen Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span>Verify File or Hash</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
