import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'subtle';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'subtle',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, suppress install button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          variant === 'primary'
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60'
        } ${className}`}
        title="Install LegalProof AI application"
      >
        <Download className="w-3.5 h-3.5 text-indigo-400" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition-colors ${className}`}
          title="Add to Home Screen on iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-zinc-100">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-zinc-400 hover:text-zinc-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-300 leading-relaxed">
                To install LegalProof AI as a standalone secure application:
              </p>
              <ol className="mt-2.5 space-y-2 text-xs text-zinc-400 list-decimal list-inside">
                <li>Tap the <strong className="text-zinc-200">Share</strong> button in the Safari navigation bar.</li>
                <li>Scroll down and select <strong className="text-zinc-200">Add to Home Screen</strong>.</li>
                <li>Tap <strong className="text-zinc-200">Add</strong> to complete installation.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2 text-xs font-medium text-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
