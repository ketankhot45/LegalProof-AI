import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export interface HashDisplayProps {
  hash: string | null | undefined;
  label?: string;
  truncate?: boolean | 'short' | 'middle' | 'long' | 'none';
  prefixLength?: number;
  suffixLength?: number;
  copyable?: boolean;
  mono?: boolean;
  className?: string;
  url?: string;
  external?: boolean;
  variant?: 'badge' | 'inline' | 'subtle' | 'card';
  size?: 'xs' | 'sm' | 'base';
}

export const HashDisplay: React.FC<HashDisplayProps> = ({
  hash,
  label,
  truncate = 'middle',
  prefixLength = 8,
  suffixLength = 8,
  copyable = true,
  mono = true,
  className,
  url,
  external = true,
  variant = 'badge',
  size = 'xs',
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) {
    return <span className="text-zinc-600 italic text-xs font-mono">None</span>;
  }

  const formatHash = (str: string): string => {
    if ((typeof truncate === 'boolean' && !truncate) || truncate === 'none') return str;
    if (str.length <= prefixLength + suffixLength + 3) return str;

    let pLen = prefixLength;
    let sLen = suffixLength;

    if (truncate === 'short') {
      pLen = 6;
      sLen = 4;
    } else if (truncate === 'long') {
      pLen = 12;
      sLen = 12;
    }

    return `${str.slice(0, pLen)}...${str.slice(-sLen)}`;
  };

  const displayText = formatHash(hash);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(hash);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = hash;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const sizeClasses = {
    xs: 'text-[11px] py-0.5 px-2 gap-1.5',
    sm: 'text-xs py-1 px-2.5 gap-2',
    base: 'text-sm py-1.5 px-3 gap-2.5',
  };

  const fontSizes = {
    xs: 'text-[11px]',
    sm: 'text-xs',
    base: 'text-sm',
  };

  const variantClasses = {
    badge: 'bg-zinc-950/80 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900 rounded-lg',
    subtle: 'bg-transparent text-zinc-400 hover:text-zinc-200',
    inline: 'bg-zinc-900/60 border border-zinc-800/60 text-zinc-300 rounded px-1.5 py-0.5',
    card: 'bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-zinc-300 w-full',
  };

  const content = (
    <div
      className={cn(
        'inline-flex items-center max-w-full group transition-colors select-none',
        mono && 'font-mono',
        variantClasses[variant],
        variant !== 'subtle' && variant !== 'inline' && sizeClasses[size],
        variant === 'subtle' && fontSizes[size],
        className
      )}
      title={hash}
    >
      {label && <span className="text-zinc-500 font-sans text-[10px] uppercase font-semibold mr-1">{label}:</span>}
      <span className="truncate break-all select-all">{displayText}</span>

      {url && (
        <a
          href={url}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          onClick={(e) => e.stopPropagation()}
          className="text-indigo-400 hover:text-indigo-300 p-0.5 rounded transition-colors shrink-0"
          title="Open explorer"
          aria-label="Open external link"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            'p-1 -mr-1 rounded text-zinc-400 hover:text-white transition-colors shrink-0 focus:outline-none focus:ring-1 focus:ring-indigo-500',
            copied ? 'text-emerald-400' : 'hover:bg-zinc-800/80'
          )}
          title={copied ? 'Copied to clipboard' : 'Copy full hash'}
          aria-label={copied ? 'Copied hash' : 'Copy hash'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 animate-in fade-in zoom-in duration-150" />
          ) : (
            <Copy className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
          )}
        </button>
      )}
    </div>
  );

  return content;
};
