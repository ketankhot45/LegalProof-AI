import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  asLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  subtitleText = 'Digital Evidence & Integrity Verification',
  className,
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8',
  };

  const containerSizes = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-2.5 rounded-xl',
    xl: 'p-3 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-extrabold',
  };

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {/* Restored Previous Brand Icon Mark: Clean Shield in subtle indigo container */}
      <div
        className={cn(
          'flex items-center justify-center bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0 transition-colors',
          containerSizes[size]
        )}
      >
        <Shield className={iconSizes[size]} />
      </div>

      {/* Brand Typography - LegalProof AI without trademark symbol */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center leading-none">
            <span className={cn('text-white tracking-tight', textSizes[size])}>
              LegalProof <span className="text-indigo-400">AI</span>
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[11px] text-zinc-400 mt-1 tracking-normal font-normal">
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
