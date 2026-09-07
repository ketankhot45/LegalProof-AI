import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { Shield, ShieldAlert, Users, Mail, Clock, Briefcase, UserPlus, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { AdminInvestigatorInviteModal } from '../components/AdminInvestigatorInviteModal';

export const InvestigatorRoster = () => {
  const { user, token } = useAuth();
  const { showToast } = useFeedback();
  const [investigators, setInvestigators] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvestigators = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/v1/auth/investigators', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch investigators');
      }
      const data = await response.json();
      setInvestigators(data.investigators || []);
      setPendingInvitations(data.pendingInvitations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading investigators.');
      showToast(err.message || 'Failed to load roster.', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchInvestigators();
    }
  }, [user, token]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert className="w-12 h-12 text-rose-500/50 mb-4" />
        <h3 className="text-lg font-medium text-white mb-1">Access restricted</h3>
        <p className="text-sm text-zinc-400 max-w-sm">
          This section is available only to authorized administrative personnel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Investigator Roster' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-400" />
            Investigator Roster
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage and oversee active forensic personnel and department invitations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchInvestigators(true)}
            disabled={refreshing || loading}
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Refresh roster"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Investigator
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-sm">
          Loading roster...
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-rose-300">Failed to Load Roster</h3>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        </div>
      ) : investigators.length === 0 && pendingInvitations.length === 0 ? (
        <div className="p-12 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center flex flex-col items-center">
          <Shield className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No investigators found</h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-4">
            Invited and active investigators will appear here.
          </p>
          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite First Investigator
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Investigators */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center">
              <span>Active Investigators ({investigators.length})</span>
            </h2>
            {investigators.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No activated investigator accounts yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {investigators.map((inv) => (
                  <div key={inv.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                          {inv.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white truncate max-w-[200px]">{inv.name}</h3>
                          <div className="flex items-center text-xs text-zinc-400 mt-0.5 space-x-2">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{inv.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${inv.isEmailVerified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {inv.isEmailVerified ? 'Active' : 'Unverified'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                      <div className="flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                        <span>{inv._count?.assignedCases || 0} active cases</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        <span>Joined {new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center">
                <span>Pending Invitations ({pendingInvitations.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">{inv.name}</h3>
                        <p className="text-xs text-zinc-400 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1 text-zinc-500" />
                          {inv.email}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Activation
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>Invited {new Date(inv.createdAt).toLocaleDateString()}</span>
                      <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <AdminInvestigatorInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          fetchInvestigators();
        }}
      />
    </div>
  );
};
