import React from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
  variant?: 'app' | 'public';
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer
      className={cn(
        'border-t border-zinc-800/80 bg-zinc-950/80 text-zinc-400 py-3.5 px-4 sm:px-6 lg:px-8 text-xs transition-colors shrink-0',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-0.5">
          <span className="font-semibold text-zinc-200">LegalProof AI</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="text-zinc-400">Secure digital evidence &amp; complaint management</span>
        </div>
        <p className="text-zinc-500 text-[11px]">
          &copy; 2026 LegalProof AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
