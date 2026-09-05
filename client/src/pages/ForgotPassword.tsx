import React, { useState } from 'react';
import { Link } from 'react-router';
import { Shield, KeyRound, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSubmitted(true);
      setMessage(data.message || 'If an account exists with this email address, password reset instructions have been sent.');
    } catch (err) {
      setSubmitted(true);
      setMessage('If an account exists with this email address, password reset instructions have been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <Shield className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white text-center">
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-zinc-400 text-center">
          Enter your registered email to receive single-use reset instructions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 shadow-xl sm:rounded-xl border border-zinc-800">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">Check Your Inbox</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{message}</p>
              <p className="text-xs text-zinc-500">
                The password reset link is time-limited and expires in 15 minutes.
              </p>
              <div className="pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="block w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Dispatching instructions...' : 'Send Password Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Return to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
