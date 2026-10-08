import React, { useState } from 'react';
import { Link } from 'react-router';
import { 
  Shield, 
  FileText, 
  Lock, 
  Search, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Scale, 
  UserCheck, 
  UserCog,
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Menu, 
  X, 
  FolderLock, 
  Binary, 
  Eye, 
  Sparkles, 
  FileCheck 
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Footer } from '../components/Footer';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { usePageSEO } from '../hooks/usePageSEO';

export const Landing: React.FC = () => {
  usePageSEO({
    title: 'LegalProof AI – Secure Digital Evidence & Complaint Management',
    description: 'Manage complaints, investigations, and digital evidence through controlled access, SHA-256 integrity checks, and auditable chain-of-custody workflows.',
    canonicalPath: '/',
    robots: 'index, follow',
  });

  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setActiveFaq(prev => prev === index ? null : index);
  };

  const faqs = [
    {
      q: 'What is LegalProof AI?',
      a: 'LegalProof AI is a secure platform for organizations to receive complaints, investigate cases, and manage digital evidence with controlled access, cryptographic integrity checks, and auditable chain-of-custody logs.'
    },
    {
      q: 'Who can use the platform?',
      a: 'The platform supports three authenticated roles: Complainants (submit reports and track progress), Investigators (manage assigned cases, evidence vault, and custody activity), and Admins (oversee platform operations, role permissions, and system audit logs). In addition, anyone can independently verify evidence hashes publicly without an account.'
    },
    {
      q: 'How does SHA-256 integrity checking work?',
      a: 'A unique SHA-256 cryptographic hash is calculated for each evidence file upon upload. If even a single byte of the file is altered later, its hash changes entirely. Comparing current file bytes against the recorded hash confirms whether the file remains unaltered.'
    },
    {
      q: 'What is blockchain anchoring?',
      a: 'Authorized users can anchor an evidence file\'s SHA-256 hash to a smart contract on the Polygon Amoy testnet, creating an independent tamper-resistant record for later reference and verification. The original evidence remains in the Evidence Vault and is never stored on-chain. Anchoring does not prove real-world truth or authenticity.'
    },
    {
      q: 'Can evidence be verified without an account?',
      a: 'Yes. Anyone can independently check whether an evidence file or SHA-256 hash matches available recorded verification data without logging in.'
    },
    {
      q: 'What role does AI play in investigations?',
      a: 'AI assists investigators by transcribing audio, extracting text via OCR, and surfacing key entities like dates and names. It serves as an investigative aid and does not determine guilt, authenticity, or legal conclusions.'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="focus:outline-hidden">
            <Logo size="md" showSubtitle subtitleText="Digital Evidence & Integrity Verification" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#what-it-does" className="hover:text-zinc-200 transition-colors py-2">
              What It Does
            </a>
            <a href="#who-uses-it" className="hover:text-zinc-200 transition-colors py-2">
              Who Uses It
            </a>
            <a href="#workflow" className="hover:text-zinc-200 transition-colors py-2">
              Workflow
            </a>
            <a href="#why-legalproof" className="hover:text-zinc-200 transition-colors py-2">
              Why LegalProof
            </a>
            <a href="#verification" className="hover:text-zinc-200 transition-colors py-2">
              Verification &amp; AI
            </a>
            <a href="#faq" className="hover:text-zinc-200 transition-colors py-2">
              FAQ
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <PWAInstallButton />
            <Link
              to="/verify"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors min-h-[40px]"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verify Evidence</span>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors min-h-[40px]"
            >
              <span>Portal Login</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex sm:hidden items-center gap-2">
            <PWAInstallButton />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/80 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-zinc-800/80 bg-zinc-950/95 px-4 pt-2 pb-5 space-y-3">
            <nav className="flex flex-col space-y-1 text-sm font-medium text-zinc-300">
              <a
                href="#what-it-does"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                What It Does
              </a>
              <a
                href="#who-uses-it"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                Who Uses It
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                Workflow
              </a>
              <a
                href="#why-legalproof"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                Why LegalProof
              </a>
              <a
                href="#verification"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                Verification &amp; AI
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg hover:bg-zinc-900 transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-2 border-t border-zinc-800/60 flex flex-col gap-2">
              <Link
                to="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-800 min-h-[44px]"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Verify Evidence</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white min-h-[44px]"
              >
                <span>Portal Login</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[680px] h-[340px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none -z-10" 
            aria-hidden="true" 
          />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 text-xs font-medium tracking-wide mb-6">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>SECURE DIGITAL EVIDENCE &amp; COMPLAINT MANAGEMENT</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Secure Digital Evidence &amp;<br />
              <span className="text-indigo-400">Complaint Management</span>
            </h1>

            {/* Supporting Copy */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 mb-8 leading-relaxed">
              LegalProof AI helps organizations manage complaints, investigations, and digital evidence through controlled access, integrity checks, and auditable workflows.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20 min-h-[44px]"
              >
                <span>Submit a Complaint</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors min-h-[44px]"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Verify Evidence</span>
              </Link>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px]"
              >
                <span>Portal Login &rarr;</span>
              </Link>
            </div>

            {/* Compact Credibility Row */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-zinc-400 font-medium">
              <span>Digital Evidence Vault</span>
              <span className="text-zinc-600">&bull;</span>
              <span>SHA-256 Integrity</span>
              <span className="text-zinc-600">&bull;</span>
              <span>Blockchain Anchoring</span>
              <span className="text-zinc-600">&bull;</span>
              <span>Chain of Custody</span>
              <span className="text-zinc-600">&bull;</span>
              <span>RBAC Security</span>
              <span className="text-zinc-600">&bull;</span>
              <span>Public Verification</span>
            </div>
          </div>
        </section>

        {/* 2. WHAT LEGALPROOF DOES: CONNECTED 4-STEP TIMELINE */}
        <section id="what-it-does" className="py-14 md:py-18 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                CORE WORKFLOW
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
                What LegalProof Does
              </h2>
              <p className="text-sm text-zinc-400">
                A structured path from intake to independent verification.
              </p>
            </div>

            {/* 4 Connected Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-2">01 &bull; SUBMIT</div>
                  <h3 className="text-base font-semibold text-white mb-1.5">Submit</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Complaint submitted securely with supporting information and evidence files.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-2">02 &bull; INVESTIGATE</div>
                  <h3 className="text-base font-semibold text-white mb-1.5">Investigate</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Authorized investigators review cases, organize dossiers, and document actions.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-2">03 &bull; PRESERVE</div>
                  <h3 className="text-base font-semibold text-white mb-1.5">Preserve</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Evidence is secured in a controlled Evidence Vault with continuous custody tracking.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-indigo-400 font-semibold mb-2">04 &bull; VERIFY</div>
                  <h3 className="text-base font-semibold text-white mb-1.5">Verify</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Evidence integrity can be checked independently using SHA-256 hash comparison.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. WHO USES LEGALPROOF? 3 SIMPLE ROLES */}
        <section id="who-uses-it" className="py-14 md:py-18">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                PLATFORM ACCESS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
                Who Uses LegalProof?
              </h2>
              <p className="text-sm text-zinc-400">
                Tailored experiences designed for each participant in the evidence lifecycle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Complainant */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Complainant</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Submit a complaint, provide supporting information, and track its progress securely.
                  </p>
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-2"
                >
                  <span>Submit a Complaint &rarr;</span>
                </Link>
              </div>

              {/* Investigator */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Investigator</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Review and triage complaints, escalate valid reports, request assignment, work on assigned cases, manage evidence, record chain-of-custody activity, and utilize authorized investigation tools.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-2"
                >
                  <span>Investigator Login &rarr;</span>
                </Link>
              </div>

              {/* Administrator */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3.5">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Administrator</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Oversee complaints and cases, review assignment requests, approve or reject investigator assignments, manage investigator activation, monitor administrative and security activity, review audit logs, and provide platform-level oversight.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors pt-2"
                >
                  <span>Admin Access &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Public Verification Capability Banner */}
            <div className="mt-5 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Search className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong className="text-white font-medium">Public Verification:</strong> Anyone can independently check whether an evidence file or SHA-256 hash matches available recorded verification data without logging in.
                </span>
              </div>
              <Link
                to="/verify"
                className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
              >
                <span>Verify Evidence &rarr;</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 4. HOW LEGALPROOF WORKS: CLEAN 6-STEP PROCESS */}
        <section id="workflow" className="py-14 md:py-18 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                EVIDENCE LIFECYCLE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
                How LegalProof Works
              </h2>
              <p className="text-sm text-zinc-400">
                A clear, end-to-end process from initial intake through public verification.
              </p>
            </div>

            {/* 6 Steps Workflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-indigo-400 mb-1">01 &bull; Complaint</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A report enters the controlled workflow with citizen statements and uploads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-indigo-400 mb-1">02 &bull; Case</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A formal case can be created and assigned through the investigation workflow.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-indigo-400 mb-1">03 &bull; Evidence</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Authorized investigators manage evidence through the Evidence Vault.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-indigo-400 mb-1">04 &bull; SHA-256 Integrity</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A cryptographic hash provides a deterministic way to detect changes to file contents.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-indigo-400 mb-1">05 &bull; Chain of Custody</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Important evidence-handling activity is recorded with actors and timestamps.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                <div className="text-xs font-mono font-semibold text-emerald-400 mb-1">06 &bull; Verification</div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  A recorded hash can be independently checked by anyone with the file or hash.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHY LEGALPROOF: COMPACT 2x2 CORE VALUE */}
        <section id="why-legalproof" className="py-14 md:py-18">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                CORE CAPABILITIES
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
                Why LegalProof
              </h2>
              <p className="text-sm text-zinc-400">
                Built to make digital evidence easier to manage, protect, and verify.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Evidence Vault */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-2.5 mb-2">
                  <FolderLock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">Evidence Vault</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Controlled evidence storage and access for authorized casework, ensuring assets are accessed only by assigned personnel.
                </p>
              </div>

              {/* SHA-256 Integrity */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-2.5 mb-2">
                  <Binary className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">SHA-256 Integrity</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Provides a way to detect changes by comparing file contents with a recorded hash, revealing any byte alterations.
                </p>
              </div>

              {/* Chain of Custody */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-2.5 mb-2">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">Chain of Custody</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Helps track important evidence-handling activity, including actors and timestamps, supporting transparent accountability.
                </p>
              </div>

              {/* Blockchain Anchoring */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex items-center gap-2.5 mb-2">
                  <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h3 className="text-sm font-semibold text-white">Blockchain Anchoring</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                  Authorized users can anchor an evidence file&apos;s SHA-256 hash to a Polygon Amoy smart contract, creating an independent tamper-resistant record for later reference and verification.
                </p>
                <div className="text-[11px] text-zinc-500 leading-normal">
                  Original files remain in the Evidence Vault (never stored on-chain). Anchoring is an authorized workflow action and does not prove real-world truth or authenticity.
                </div>
              </div>
            </div>

            {/* Quiet alignment note */}
            <div className="text-center mt-6">
              <span className="text-[11px] font-mono text-zinc-500">
                Engineered with principles aligned to ISO/IEC 27037 digital evidence handling standards.
              </span>
            </div>
          </div>
        </section>

        {/* 6. PUBLIC VERIFICATION + AI-ASSISTED DISCOVERY */}
        <section id="verification" className="py-14 md:py-18 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subsection A: Public Verification */}
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">
                    <Search className="w-3.5 h-3.5" />
                    <span>INDEPENDENT VERIFICATION</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Verify Evidence Without an Account
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    Public verification checks whether the file contents match an available recorded cryptographic hash. Where available, the verification can also reference the corresponding Polygon Amoy blockchain record.
                  </p>

                  {/* Visual Flow */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-center gap-1 text-[11px]">
                      <span className="text-zinc-400">File</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-indigo-400">SHA-256</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-zinc-400">Record</span>
                      <span className="text-zinc-600">&rarr;</span>
                      <span className="text-emerald-400">Result</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 italic mb-5 leading-relaxed">
                    Verification confirms a hash match. It does not determine real-world truth or authenticity.
                  </p>
                </div>

                <div>
                  <Link
                    to="/verify"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors min-h-[44px]"
                  >
                    <span>Launch Public Verifier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Subsection B: AI-Assisted Discovery */}
              <div id="ai" className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-400 uppercase tracking-wider mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>INVESTIGATIVE AID</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    AI-Assisted Evidence Discovery
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    AI helps investigators find and organize information within supported evidence. It does not determine guilt, authenticity, or legal conclusions.
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">Optical Character Recognition (OCR)</div>
                        <div className="text-[11px] text-zinc-500">Extracts text from scanned documents, receipts, and images.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">Audio Transcription</div>
                        <div className="text-[11px] text-zinc-500">Converts recorded audio evidence into searchable transcripts.</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">Information Extraction</div>
                        <div className="text-[11px] text-zinc-500">Identifies dates, personal names, monetary amounts, and locations.</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 italic">
                  Available to authorized investigators within assigned case dossiers.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ SECTION */}
        <section id="faq" className="py-14 md:py-18">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                QUESTIONS &amp; ANSWERS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1 mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-zinc-400">
                Key questions about evidence verification, platform access, and security.
              </p>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-4 focus:outline-hidden hover:bg-zinc-900/70 transition-colors min-h-[44px]"
                      aria-expanded={isOpen}
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
                      <div className="px-4 pb-4 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2.5">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 8. CLEAN FINAL CTA */}
        <section className="py-16 md:py-20 bg-zinc-900/40 border-t border-zinc-800/60">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
              Secure Your Digital Evidence Workflow
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto mb-7 leading-relaxed">
              Submit a complaint, manage an investigation, or verify an evidence record through a controlled and auditable platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors min-h-[44px]"
              >
                <span>Submit a Complaint</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/verify"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors min-h-[44px]"
              >
                <Search className="w-4 h-4 text-zinc-400" />
                <span>Verify Evidence</span>
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px]"
              >
                <span>Portal Login</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
