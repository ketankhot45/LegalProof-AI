import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface FeedbackContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirmAction: (options: ConfirmOptions) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const confirmAction = useCallback((options: ConfirmOptions) => {
    setConfirmConfig(options);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmConfig(null);
    setIsConfirming(false);
  }, []);

  const handleConfirm = async () => {
    if (!confirmConfig) return;
    setIsConfirming(true);
    try {
      await confirmConfig.onConfirm();
    } finally {
      closeConfirm();
    }
  };

  return (
    <FeedbackContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md',
                toast.type === 'success' && 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200',
                toast.type === 'error' && 'bg-red-950/80 border-red-500/30 text-red-200',
                toast.type === 'warning' && 'bg-amber-950/80 border-amber-500/30 text-amber-200',
                toast.type === 'info' && 'bg-zinc-900/90 border-zinc-700 text-zinc-200'
              )}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
              </div>
              <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 text-zinc-400 hover:text-white transition-colors p-1 -mr-2 -mt-1 rounded-md hover:bg-white/10"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={!isConfirming ? closeConfirm : undefined}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{confirmConfig.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{confirmConfig.message}</p>
              </div>
              <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/80 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={isConfirming}
                  className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-transparent hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {confirmConfig.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className={cn(
                    'px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center',
                    confirmConfig.destructive
                      ? 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30'
                      : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30'
                  )}
                >
                  {isConfirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    confirmConfig.confirmText || 'Confirm'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}
