import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  FileText, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Link as LinkIcon, 
  Plus, 
  ArrowRight,
  RefreshCw,
  Search,
  Activity,
  Layers,
  FileCheck2,
  FileX2,
  UserCheck
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/dashboard/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        throw new Error('Failed to load operational metrics');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to connect to telemetry services');
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UNDER_REVIEW': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ESCALATED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'OPENED': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ACTIVE_INVESTIGATION': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'CLOSED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'UPLOADED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'VIEWED': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'DOWNLOADED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'INTEGRITY_CHECK': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'BLOCKCHAIN_ANCHORED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'AI_ANALYZED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-zinc-900 rounded-md"></div>
          <div className="h-9 w-28 bg-zinc-900 rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-zinc-900 border border-zinc-800 rounded-xl p-5"></div>
          ))}
        </div>
        <div className="h-80 bg-zinc-900 border border-zinc-800 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-white">Telemetry Unavailable</h3>
            <p className="text-sm text-zinc-400 mt-1">{error}</p>
          </div>
          <button
            onClick={() => fetchStats(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-sm font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isInvestigator = user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Header with Role and Refresh */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              {isInvestigator ? 'Security Operations Command Center' : 'Complainant Workspace'}
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {isInvestigator 
              ? 'Real-time telemetry, active case investigations, evidence integrity, and blockchain anchoring.' 
              : 'Track complaint submissions, review progress, and verify cryptographic evidence records.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="flex items-center px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isInvestigator && (
            <Link
              to="/complaints/new"
              className="flex items-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Complaint
            </Link>
          )}
        </div>
      </div>

      {/* COMPLAINANT DASHBOARD VIEW */}
      {!isInvestigator && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Complaints</span>
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-semibold text-white mt-3">{data?.stats?.totalComplaints || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Lifetime submissions filed</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Pending Review</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-semibold text-amber-400 mt-3">
                {(data?.stats?.submittedCount || 0) + (data?.stats?.underReviewCount || 0)}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {data?.stats?.submittedCount || 0} submitted, {data?.stats?.underReviewCount || 0} in review
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Escalated to Case</span>
                <Briefcase className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-semibold text-emerald-400 mt-3">{data?.stats?.escalatedCount || 0}</p>
              <p className="text-xs text-zinc-500 mt-1">Active formal investigations</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Verification Status</span>
                <Shield className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-semibold text-cyan-400 mt-3">Protected</p>
              <p className="text-xs text-zinc-500 mt-1">SHA-256 integrity enforced</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/complaints/new"
              className="group p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600/10 text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">File New Digital Complaint</h4>
                  <p className="text-xs text-zinc-500">Submit a new incident for review</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/complaints"
              className="group p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-zinc-800 text-zinc-300 rounded-lg group-hover:bg-zinc-700 group-hover:text-white transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Track Submissions</h4>
                  <p className="text-xs text-zinc-500">View status and investigator notes</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/verify"
              className="group p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Public Verification</h4>
                  <p className="text-xs text-zinc-500">Zero-knowledge blockchain audit</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Recent Complaints Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-base font-semibold text-white">My Recent Complaints</h3>
              <Link to="/complaints" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                View All →
              </Link>
            </div>
            
            {(!data?.recentComplaints || data.recentComplaints.length === 0) ? (
              <div className="p-12 text-center flex flex-col items-center">
                <FileText className="w-12 h-12 text-zinc-700 mb-3" />
                <h4 className="text-sm font-medium text-white">No complaints submitted yet</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  You haven't filed any digital complaints yet. Create your first complaint to start an intake process.
                </p>
                <Link
                  to="/complaints/new"
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors"
                >
                  File Complaint
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800 whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-3 font-medium">Title</th>
                      <th className="px-6 py-3 font-medium">Category</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Date Filed</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {data.recentComplaints.map((c: any) => (
                      <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-zinc-200 max-w-[200px] truncate">{c.title}</td>
                        <td className="px-6 py-3.5 text-xs text-zinc-400 whitespace-nowrap">{c.category || 'General'}</td>
                        <td className="px-6 py-3.5 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 text-xs rounded-full border font-medium ${getStatusColor(c.status)}`}>
                            {c.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <Link to={`/complaints/${c.id}`} className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors">
                            Details <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* INVESTIGATOR / ADMIN DASHBOARD VIEW */}
      {isInvestigator && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active Cases</span>
              <p className="text-2xl font-bold text-white mt-2">{data?.stats?.activeCases || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{data?.stats?.totalCases || 0} total cases</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">My Assigned</span>
              <p className="text-2xl font-bold text-indigo-400 mt-2">{data?.stats?.assignedToMe || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Lead investigator</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Pending Intake</span>
              <p className="text-2xl font-bold text-amber-400 mt-2">{data?.stats?.pendingComplaints || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Complaints to triage</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Evidence Vault</span>
              <p className="text-2xl font-bold text-white mt-2">{data?.stats?.totalEvidence || 0}</p>
              <p className="text-[11px] text-zinc-500 mt-1">Digital artifacts stored</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Verified Integrity</span>
              <p className="text-2xl font-bold text-emerald-400 mt-2">{data?.stats?.verifiedEvidence || 0}</p>
              <p className="text-[11px] text-emerald-500/80 mt-1">
                {data?.stats?.failedEvidence > 0 ? `${data?.stats?.failedEvidence} failed` : '100% SHA-256 match'}
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Anchored On-Chain</span>
              <p className="text-2xl font-bold text-purple-400 mt-2">{data?.stats?.anchoredEvidence || 0}</p>
              <p className="text-[11px] text-purple-400/80 mt-1">Polygon Amoy Testnet</p>
            </div>
          </div>

          {/* Quick Actions Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/complaints"
              className="p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Review Incoming Complaints</h4>
                  <p className="text-xs text-zinc-500">Triage, review or escalate new submissions</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
            </Link>

            <Link
              to="/cases"
              className="p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Manage Active Investigations</h4>
                  <p className="text-xs text-zinc-500">Case notes, evidence uploads and progress</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
            </Link>

            <Link
              to="/verify"
              className="p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">Public Verification Tool</h4>
                  <p className="text-xs text-zinc-500">Independent SHA-256 blockchain verification</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600" />
            </Link>
          </div>

          {/* Two-Column Telemetry View: Cases + Chain of Custody */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Recent Cases */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Active Case Roster</h3>
                </div>
                <Link to="/cases" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">
                  All Cases →
                </Link>
              </div>

              {(!data?.recentCases || data.recentCases.length === 0) ? (
                <div className="p-8 text-center text-zinc-500 text-sm flex-1 flex items-center justify-center">
                  No active cases in registry.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800 flex-1">
                  {data.recentCases.map((cs: any) => (
                    <div key={cs.id} className="p-4 hover:bg-zinc-800/30 transition-colors flex items-center justify-between">
                      <div className="space-y-1 max-w-[70%]">
                        <Link to={`/cases/${cs.id}`} className="text-sm font-medium text-zinc-200 hover:text-indigo-400 truncate block">
                          {cs.title}
                        </Link>
                        <div className="flex items-center space-x-2 text-xs text-zinc-500">
                          <span>{cs.investigator?.name || 'Unassigned'}</span>
                          <span>•</span>
                          <span>{new Date(cs.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 text-xs rounded-full border font-medium ${getStatusColor(cs.status)}`}>
                          {cs.status.replace('_', ' ')}
                        </span>
                        <Link to={`/cases/${cs.id}`} className="text-xs text-zinc-400 hover:text-white">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Chain of Custody & Audit Feed */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Live Chain of Custody Feed</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Cryptographically Logged</span>
              </div>

              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <div className="p-8 text-center text-zinc-500 text-sm flex-1 flex items-center justify-center">
                  No chain of custody events recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800 flex-1">
                  {data.recentActivity.map((log: any) => (
                    <div key={log.id} className="p-3.5 hover:bg-zinc-800/30 transition-colors flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded border font-mono text-[10px] font-semibold ${getActionBadgeColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-zinc-300 font-medium truncate max-w-[200px]">
                            {log.evidence?.fileName || 'Evidence'}
                          </span>
                        </div>
                        <p className="text-zinc-500 text-[11px] truncate max-w-[200px] sm:max-w-[250px]">
                          Actor: <span className="text-zinc-400">{log.actorId}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 font-mono text-[11px] flex items-center justify-end">
                          <Clock className="w-3 h-3 mr-1 text-zinc-600" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.evidence?.id && (
                          <Link to={`/evidence/${log.evidence.id}`} className="text-indigo-400 hover:text-indigo-300 text-[11px]">
                            View Vault →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
