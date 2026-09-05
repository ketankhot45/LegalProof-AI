import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Shield, CheckCircle2, AlertCircle, RefreshCw, Mail, ArrowRight } from 'lucide-react';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token in the URL. Please check your verification email link.');
      return;
    }

    const performVerification = async () => {
      try {
        const res = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Verification failed. The token may be expired or already used.');
        }

        setStatus('success');
        setMessage(data.message || 'Your email has been verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Verification failed.');
      }
    };

    performVerification();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;

    setResendLoading(true);
    setResendMessage('');

    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message || 'If an unverified account exists, a link has been dispatched.');
    } catch (err: any) {
      setResendMessage('Failed to request verification link. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <Shield className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white text-center">
          Email Verification
        </h2>
        <p className="mt-1 text-sm text-zinc-400 text-center">
          LegalProof AI Cryptographic Identity Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 shadow-xl sm:rounded-xl border border-zinc-800">
          {status === 'verifying' && (
            <div className="text-center py-6">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
              <p className="text-zinc-200 font-medium">Verifying your cryptographic token...</p>
              <p className="text-xs text-zinc-500 mt-2">Checking database and single-use signature validity</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">Account Verified!</h3>
              <p className="text-sm text-zinc-300">{message}</p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Proceed to Login
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-200">Verification Link Invalid</p>
                  <p className="mt-1 text-xs text-red-300/90">{message}</p>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-5">
                <h4 className="text-sm font-medium text-zinc-200 mb-2">Request a New Verification Link</h4>
                <p className="text-xs text-zinc-400 mb-4">
                  Enter your registered email address to receive a fresh verification link.
                </p>

                <form onSubmit={handleResend} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="name@domain.com"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      className="block w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {resendMessage && (
                    <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300">
                      {resendMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    {resendLoading ? 'Sending link...' : 'Resend Verification Email'}
                  </button>
                </form>
              </div>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Return to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
