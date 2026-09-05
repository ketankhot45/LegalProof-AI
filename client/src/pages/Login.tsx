import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User, Briefcase, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

type RoleType = 'COMPLAINANT' | 'INVESTIGATOR' | 'ADMIN';

export const Login = () => {
  const { portalRole } = useParams<{ portalRole?: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const getInitialRole = (): RoleType => {
    if (portalRole?.toLowerCase() === 'investigator') return 'INVESTIGATOR';
    if (portalRole?.toLowerCase() === 'admin') return 'ADMIN';
    return 'COMPLAINANT';
  };

  const [activeRole, setActiveRole] = useState<RoleType>(getInitialRole());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (portalRole?.toLowerCase() === 'investigator') setActiveRole('INVESTIGATOR');
    else if (portalRole?.toLowerCase() === 'admin') setActiveRole('ADMIN');
    else if (portalRole?.toLowerCase() === 'complainant') setActiveRole('COMPLAINANT');
  }, [portalRole]);

  const handleRoleChange = (role: RoleType) => {
    setActiveRole(role);
    setError('');
    const path = role === 'COMPLAINANT' ? '/login/complainant' : role === 'INVESTIGATOR' ? '/login/investigator' : '/login/admin';
    window.history.replaceState(null, '', path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          requiredRole: activeRole 
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Please verify your credentials and selected portal.');
    } finally {
      setLoading(false);
    }
  };

  const roleMeta: Record<RoleType, { title: string; subtitle: string; icon: any; color: string; badge: string }> = {
    COMPLAINANT: {
      title: 'Complainant Incident Portal',
      subtitle: 'Citizen access to submit incident reports, attach supporting proof, and monitor progress.',
      icon: User,
      color: 'text-blue-400',
      badge: 'Public Intake'
    },
    INVESTIGATOR: {
      title: 'Forensic Investigator Portal',
      subtitle: 'Law enforcement & forensic workspace for case review, assignment requests, and evidence handling.',
      icon: Briefcase,
      color: 'text-indigo-400',
      badge: 'Authorized Personnel'
    },
    ADMIN: {
      title: 'System Administration Console',
      subtitle: 'Administrative oversight for incident triage, case assignments approval, and audit logs.',
      icon: KeyRound,
      color: 'text-amber-400',
      badge: 'Admin Security'
    }
  };

  const activeMeta = roleMeta[activeRole];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-3 shadow-inner">
          <Shield className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          LegalProof AI
        </h2>
        <p className="mt-1 text-center text-xs text-zinc-400">
          Decentralized Digital Forensics & Integrity Verification
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 shadow-2xl rounded-2xl border border-zinc-800 p-6 sm:p-8 space-y-6">
          {/* Role Portal Selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Access Portal
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => handleRoleChange('COMPLAINANT')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center flex flex-col items-center justify-center ${
                  activeRole === 'COMPLAINANT'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <User className="w-3.5 h-3.5 mb-1 text-blue-400" />
                <span>Complainant</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('INVESTIGATOR')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center flex flex-col items-center justify-center ${
                  activeRole === 'INVESTIGATOR'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 mb-1 text-indigo-400" />
                <span>Investigator</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center flex flex-col items-center justify-center ${
                  activeRole === 'ADMIN'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 mb-1 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Active Portal Header */}
          <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white flex items-center">
                <activeMeta.icon className={`w-3.5 h-3.5 mr-1.5 ${activeMeta.color}`} />
                {activeMeta.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {activeMeta.badge}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {activeMeta.subtitle}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Official Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={
                  activeRole === 'COMPLAINANT' ? 'citizen@domain.com' :
                  activeRole === 'INVESTIGATOR' ? 'detective@agency.gov' : 'admin@agency.gov'
                }
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter account password"
                className="block w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 shadow-md"
              >
                {loading ? 'Authenticating Role...' : `Sign in to ${activeRole === 'COMPLAINANT' ? 'Citizen Portal' : activeRole === 'INVESTIGATOR' ? 'Investigator Portal' : 'Admin Console'}`}
              </button>
            </div>
          </form>

          {/* Registration / Policy Notice */}
          <div className="pt-2 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            {activeRole === 'COMPLAINANT' ? (
              <div>
                <span>Need to submit an incident report? </span>
                <Link to="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Create citizen account
                </Link>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-500 leading-normal">
                Departmental access only. Investigator and Administrator accounts are provisioned by agency administration.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
