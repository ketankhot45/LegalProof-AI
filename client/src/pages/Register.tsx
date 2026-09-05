import React, { useState } from 'react';
import { Link } from 'react-router';
import { Shield, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setRegistered(true);
      setRegisteredEmail(email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendStatus('loading');
    setResendMessage('');

    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      setResendStatus('success');
      setResendMessage(data.message || 'Verification link resent.');
    } catch (err) {
      setResendStatus('error');
      setResendMessage('Failed to resend email. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <Shield className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-white">
          Join LegalProof AI
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Citizen Public Intake & Incident Reporting Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 shadow-2xl rounded-2xl border border-zinc-800 p-6 sm:p-8">
          {registered ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">Verification Email Sent</h3>
              <p className="text-sm text-zinc-300">
                We sent a secure verification link to <strong className="text-white">{registeredEmail}</strong>.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Please click the link in your email to verify your identity and activate your account before logging in.
              </p>

              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendStatus === 'loading'}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {resendStatus === 'loading' ? 'Resending...' : 'Resend Verification Link'}
                </button>
                {resendMessage && (
                  <p className="text-[11px] text-zinc-300">{resendMessage}</p>
                )}

                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors shadow-md"
                >
                  Proceed to Citizen Login
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane.doe@domain.com"
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Create Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 shadow-md"
                >
                  {loading ? 'Creating Account...' : 'Register as Citizen Complainant'}
                </button>
              </div>

              <div className="mt-4 text-center text-xs">
                <span className="text-zinc-400">Already have an account? </span>
                <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
