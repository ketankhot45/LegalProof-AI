import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Briefcase, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export const ActivateInvestigator = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Missing invitation token in the link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/investigators/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Activation failed. Invitation token may have expired or already been used.');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to activate investigator account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <Briefcase className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="inline-block bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
          Authorized Personnel Onboarding
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white text-center">
          Forensic Investigator Activation
        </h2>
        <p className="mt-1 text-sm text-zinc-400 text-center">
          Establish your master password to access the forensic custody workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-6 shadow-xl sm:rounded-xl border border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Choose Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat chosen password"
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-950 pl-10 pr-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Activating account...' : 'Activate & Enter Dashboard'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login/investigator" className="text-xs text-zinc-400 hover:text-zinc-200">
                Already activated? Sign in to Investigator Portal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
