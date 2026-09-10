import React, { useState, useRef, useEffect } from 'react';
import { Copy, FileDigit, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFeedback } from '../contexts/FeedbackContext';

export interface ReferenceDisplayProps {
  reference: string;
  label?: string;
  className?: string;
}

export const ReferenceDisplay: React.FC<ReferenceDisplayProps> = ({ reference, label = 'Ref', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useFeedback();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const copyToClipboard = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(reference);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = reference;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopied(true);
        showToast('Reference number copied to clipboard', 'success');
        setTimeout(() => {
          setCopied(false);
          setIsOpen(false);
        }, 1500);
      } catch {
        showToast('Failed to copy reference', 'error');
      }
    };
    copyToClipboard();
  };

  if (!reference) return null;

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="inline-flex items-center justify-center p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
        title="Show reference number"
        aria-label="Show reference number"
        aria-expanded={isOpen}
      >
        <FileDigit className="w-3.5 h-3.5" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 top-full left-0 mt-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 min-w-[200px]">
          <span className="text-[10px] font-semibold uppercase text-zinc-500 whitespace-nowrap">{label}:</span>
          <span className="font-mono text-xs text-zinc-300 select-all truncate max-w-[140px]" title={reference}>
            {reference.length > 16 ? `${reference.slice(0, 8)}...${reference.slice(-6)}` : reference}
          </span>
          <button
            onClick={handleCopy}
            className="p-1.5 ml-auto rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
            title="Copy reference number"
            aria-label="Copy reference number"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};
