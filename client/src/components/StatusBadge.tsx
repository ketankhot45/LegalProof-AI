import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCheck, 
  XCircle, 
  Radio, 
  FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';

export type LegalStatusType =
  // Complaints
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ESCALATED'
  | 'REJECTED'
  | 'ARCHIVED'
  // Cases
  | 'OPENED'
  | 'ASSIGNED'
  | 'ACTIVE_INVESTIGATION'
  | 'CLOSED'
  // Evidence Integrity
  | 'UPLOADING'
  | 'VERIFYING'
  | 'VERIFIED'
  | 'INTEGRITY_FAILED'
  // Blockchain
  | 'NOT_ANCHORED'
  | 'ANCHORING'
  | 'ANCHORED'
  | 'ANCHOR_FAILED'
  // Assignment requests
  | 'PENDING'
  | 'APPROVED'
  | string;

interface StatusConfig {
  label: string;
  className: string;
  dotColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const getStatusConfig = (rawStatus: string): StatusConfig => {
  const normalized = (rawStatus || '').toUpperCase().trim();

  switch (normalized) {
    // 1. Complaint statuses
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        dotColor: 'bg-blue-400',
        icon: FileText,
        description: 'Complaint submitted by complainant and queued for initial intake review.',
      };
    case 'UNDER_REVIEW':
      return {
        label: 'Under Review',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        dotColor: 'bg-amber-400',
        icon: Clock,
        description: 'Incident details are currently undergoing preliminary assessment.',
      };
    case 'ESCALATED':
      return {
        label: 'Case Created',
        className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
        dotColor: 'bg-indigo-400',
        icon: ArrowUpRight,
        description: 'Formally escalated into an active case investigation.',
      };
    case 'REJECTED':
      return {
        label: 'Rejected',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dotColor: 'bg-rose-400',
        icon: XCircle,
        description: 'Submission rejected following administrative review.',
      };
    case 'ARCHIVED':
      return {
        label: 'Archived',
        className: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80',
        dotColor: 'bg-zinc-500',
        icon: FileText,
        description: 'Archived historical record.',
      };

    // 2. Case Dossier statuses
    case 'OPENED':
      return {
        label: 'Unassigned Case',
        className: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
        dotColor: 'bg-sky-400',
        icon: Clock,
        description: 'Case created and awaiting investigator assignment.',
      };
    case 'ASSIGNED':
      return {
        label: 'Investigator Assigned',
        className: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        dotColor: 'bg-blue-400',
        icon: CheckCircle2,
        description: 'Lead forensic investigator officially assigned.',
      };
    case 'ACTIVE_INVESTIGATION':
      return {
        label: 'Active Investigation',
        className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
        dotColor: 'bg-indigo-400',
        icon: Radio,
        description: 'Active case proceedings, evidence intake, and analysis underway.',
      };
    case 'CLOSED':
      return {
        label: 'Closed',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        icon: CheckCheck,
        description: 'Investigation concluded and case closed.',
      };

    // 3. Cryptographic Evidence Integrity
    case 'VERIFIED':
      return {
        label: 'Integrity Verified',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        icon: CheckCircle2,
        description: 'Physical stored file matches client intake SHA-256 digest byte-for-byte.',
      };
    case 'INTEGRITY_FAILED':
    case 'HASH_MISMATCH':
      return {
        label: 'Integrity Failed',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dotColor: 'bg-rose-400',
        icon: AlertTriangle,
        description: 'Stored binary digest deviates from intake checksum. Tampering detected.',
      };
    case 'VERIFYING':
    case 'UPLOADING':
      return {
        label: 'Verifying',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        dotColor: 'bg-amber-400',
        icon: Clock,
        description: 'SHA-256 calculation and server checksum validation in progress.',
      };

    // 4. Blockchain Anchoring
    case 'ANCHORED':
      return {
        label: 'Blockchain Anchored',
        className: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
        dotColor: 'bg-purple-400',
        icon: CheckCircle2,
        description: 'SHA-256 digest cryptographically committed to Polygon Amoy smart contract.',
      };
    case 'ANCHORING':
      return {
        label: 'Mempool Pending',
        className: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        dotColor: 'bg-amber-400',
        icon: Clock,
        description: 'Transaction broadcast to Polygon network; awaiting block confirmation.',
      };
    case 'NOT_ANCHORED':
      return {
        label: 'Not Anchored',
        className: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80',
        dotColor: 'bg-zinc-500',
        description: 'Evidence stored with SHA-256 integrity verification, pending on-chain registration.',
      };
    case 'ANCHOR_FAILED':
      return {
        label: 'Anchor Failed',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        dotColor: 'bg-rose-400',
        icon: AlertCircle,
        description: 'Transaction was dropped or rejected by on-chain consensus.',
      };

    // 5. Assignment Requests
    case 'PENDING':
      return {
        label: 'Awaiting Admin Approval',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
        dotColor: 'bg-amber-400',
        icon: Clock,
        description: 'Investigator assignment requested; awaiting administrative review.',
      };
    case 'APPROVED':
      return {
        label: 'Approved',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        icon: CheckCircle2,
        description: 'Assignment approved by administrator.',
      };

    // Fallback
    default:
      return {
        label: normalized.replace(/_/g, ' ') || 'Unknown',
        className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        dotColor: 'bg-zinc-500',
      };
  }
};

interface StatusBadgeProps {
  status: LegalStatusType;
  showDot?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showDot = true,
  showIcon = false,
  size = 'md',
  className,
  customLabel,
}) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-2 py-0.5 tracking-wide' 
    : 'text-xs px-2.5 py-1 tracking-normal';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-md border shrink-0 transition-colors',
        sizeClasses,
        config.className,
        className
      )}
      title={config.description}
    >
      {showDot && config.dotColor && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      )}
      {showIcon && Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="truncate">{customLabel || config.label}</span>
    </span>
  );
};
