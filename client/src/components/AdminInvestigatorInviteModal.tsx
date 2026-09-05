import React, { useState } from 'react';
import { UserPlus, X, Mail, Shield, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export const AdminInvestigatorInviteModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteResult, setInviteResult] = useState<{
    activationUrl?: string;
    message: string;
    email: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/auth/investigators/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch investigator invitation.');
      }

      setInviteResult({
        activationUrl: data.activationUrl,
        message: data.message,
        email: data.invitation?.email || email,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invitation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (inviteResult?.activationUrl) {
      navigator.clipboard.writeText(inviteResult.activationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setError('');
    setInviteResult(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Invite Forensic Investigator</h3>
              <p className="text-xs text-zinc-400">Administrative account provisioning</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {inviteResult ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-200">Invitation Dispatched!</p>
                <p className="text-emerald-300/90 text-[11px] mt-0.5">{inviteResult.message}</p>
              </div>
            </div>

            {inviteResult.activationUrl && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Single-Use Activation Link (Direct / Backup)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteResult.activationUrl}
                    className="block w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500">
                  This activation link is time-limited and cryptographically bound to {inviteResult.email}.
                </p>
              </div>
            )}

            <div className="pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Investigator Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Det. Marcus Vance"
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Official Department Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m.vance@forensics.agency.gov"
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Upon dispatch, a single-use cryptographically hashed activation token will be generated. The invitee will receive instructions to set their master password and activate their forensic workspace.
            </p>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 shadow-md flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                {loading ? 'Dispatching...' : 'Dispatch Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
