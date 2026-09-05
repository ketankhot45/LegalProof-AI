import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCw, 
  X, 
  UserCheck, 
  AlertCircle, 
  ArrowRight,
  Inbox,
  Layers,
  CheckCircle2
} from 'lucide-react';

type QuickFilter = 'ALL' | 'ASSIGNED_TO_ME' | 'UNASSIGNED';

export const CasesList = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchCases = (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    fetch('/api/v1/cases', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load active cases');
        return res.json();
      })
      .then(data => {
        setCases(data.cases || []);
        setLoading(false);
        if (isManual) setRefreshing(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to retrieve cases');
        setLoading(false);
        if (isManual) setRefreshing(false);
      });
  };

  const handleClaimCase = async (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || user.role !== 'INVESTIGATOR') return;

    setClaimingId(caseId);
    try {
      const res = await fetch(`/api/v1/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ investigatorId: user.id, status: 'ASSIGNED' }),
      });
      if (res.ok) {
        fetchCases();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to claim case');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to claim case');
    } finally {
      setClaimingId(null);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPENED': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ACTIVE_INVESTIGATION': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'UNDER_REVIEW': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CLOSED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/30 font-semibold';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'LOW': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const counts = useMemo(() => {
    const assigned = cases.filter(c => Boolean(c.investigatorId && c.investigatorId === user?.id)).length;
    const unassigned = cases.filter(c => !c.investigatorId).length;
    return {
      all: cases.length,
      assigned,
      unassigned
    };
  }, [cases, user?.id]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = 
        (c.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.investigator?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.priority?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      
      let matchesQuickFilter = true;
      if (quickFilter === 'ASSIGNED_TO_ME') {
        matchesQuickFilter = Boolean(c.investigatorId && c.investigatorId === user?.id);
      } else if (quickFilter === 'UNASSIGNED') {
        matchesQuickFilter = !c.investigatorId;
      }

      return matchesSearch && matchesStatus && matchesQuickFilter;
    });
  }, [cases, searchQuery, statusFilter, quickFilter, user?.id]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setQuickFilter('ALL');
  };

  const isFiltered = searchQuery !== '' || statusFilter !== 'ALL' || quickFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Case Operations & Vault</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage escalated formal investigations, assigned leads, case notes, and evidence vault artifacts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchCases(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Quick Filter Bar & Search/Status Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        
        {/* Quick Filter Segmented Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-zinc-950 border border-zinc-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => setQuickFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                quickFilter === 'ALL'
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Cases</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                quickFilter === 'ALL' ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
              }`}>
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('ASSIGNED_TO_ME')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                quickFilter === 'ASSIGNED_TO_ME'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                quickFilter === 'ASSIGNED_TO_ME' ? 'bg-indigo-700 text-white' : 'bg-zinc-900 text-zinc-500'
              }`}>
                {counts.assigned}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setQuickFilter('UNASSIGNED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                quickFilter === 'UNASSIGNED'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Unassigned Triage</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                quickFilter === 'UNASSIGNED' ? 'bg-amber-700 text-white' : 'bg-zinc-900 text-zinc-500'
              }`}>
                {counts.unassigned}
              </span>
            </button>
          </div>

          {/* Active Quick Filter Label */}
          <div className="text-xs text-zinc-400 hidden lg:flex items-center gap-1.5">
            <span className="text-zinc-500">Active View:</span>
            <span className="text-zinc-300 font-medium">
              {quickFilter === 'ALL' ? 'Complete Authorized Roster' :
               quickFilter === 'ASSIGNED_TO_ME' ? 'Cases Claimed by Current Investigator' :
               'Open Cases Awaiting Investigation Lead'}
            </span>
          </div>
        </div>

        {/* Search Input & Status Select Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case title, case UUID, or investigator name..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                title="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-zinc-300 focus:outline-none py-1 pr-2"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPENED">Opened</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="ACTIVE_INVESTIGATION">Active Investigation</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1 border border-zinc-700/80"
              >
                <X className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table / Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="text-xs">Loading case roster...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <h4 className="text-sm font-medium text-white">Failed to load case registry</h4>
              <p className="text-xs text-zinc-400 mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchCases(true)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-xl border border-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center space-y-2">
            <Briefcase className="w-12 h-12 text-zinc-700 mb-2" />
            <h3 className="text-lg font-medium text-white">No active cases in registry</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Cases are created when submitted complaints are formally escalated by investigators.
            </p>
          </div>
        ) : filteredCases.length === 0 ? (
          /* Contextual Empty State depending on active filter */
          <div className="p-12 text-center flex flex-col items-center space-y-3">
            {quickFilter === 'ASSIGNED_TO_ME' ? (
              <>
                <UserCheck className="w-10 h-10 text-indigo-400/60" />
                <h4 className="text-sm font-medium text-white">No Cases Assigned to You</h4>
                <p className="text-xs text-zinc-400 max-w-md">
                  You currently have no cases claimed in your portfolio. You can inspect unassigned cases in the triage queue and claim them.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFilter('UNASSIGNED');
                      setSearchQuery('');
                      setStatusFilter('ALL');
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium rounded-xl transition-colors"
                  >
                    View Unassigned Triage Queue ({counts.unassigned})
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-xl transition-colors border border-zinc-700"
                  >
                    View All Cases
                  </button>
                </div>
              </>
            ) : quickFilter === 'UNASSIGNED' ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-400/60" />
                <h4 className="text-sm font-medium text-white">Triage Queue Clear</h4>
                <p className="text-xs text-zinc-400 max-w-md">
                  There are no unassigned cases awaiting lead investigator assignment. All active cases currently have assigned leads.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-xl transition-colors border border-zinc-700 mt-1"
                >
                  View All Cases ({counts.all})
                </button>
              </>
            ) : (
              <>
                <Search className="w-8 h-8 text-zinc-600" />
                <h4 className="text-sm font-medium text-white">No Matching Cases Found</h4>
                <p className="text-xs text-zinc-400 max-w-sm">
                  No cases matched your search query or selected status filter.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-1 px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-xl transition-colors border border-zinc-700"
                >
                  Clear All Filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 text-xs text-zinc-500 flex justify-between items-center">
              <span>Showing <strong className="text-zinc-300">{filteredCases.length}</strong> of {cases.length} cases</span>
              {quickFilter !== 'ALL' && (
                <span className="text-[11px] text-zinc-400">
                  Filtered by: <span className="text-indigo-400 font-medium">{quickFilter === 'ASSIGNED_TO_ME' ? 'My Assigned Cases' : 'Unassigned Triage'}</span>
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/70 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Case Title & ID</th>
                    <th className="px-6 py-3.5 font-medium">Priority</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Lead Investigator</th>
                    <th className="px-6 py-3.5 font-medium">Date Escalated</th>
                    <th className="px-6 py-3.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredCases.map((c: any) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 max-w-[200px] sm:max-w-[300px]">
                        <Link to={`/cases/${c.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 block transition-colors truncate">
                          {c.title}
                        </Link>
                        <span className="text-[11px] text-zinc-500 font-mono truncate block">UUID: {c.id.substring(0, 13)}...</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs rounded-md border ${getPriorityBadge(c.priority)}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${getStatusColor(c.status)}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-300 whitespace-nowrap">
                        {c.investigator ? (
                          <span className="font-medium text-zinc-200 flex items-center gap-1.5 truncate max-w-[150px]">
                            <span className="truncate">{c.investigator.name}</span>
                            {c.investigatorId === user?.id && (
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 flex-shrink-0">You</span>
                            )}
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-amber-400/90 font-medium italic bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                              Unassigned
                            </span>
                            {user?.role === 'INVESTIGATOR' && (
                              <button
                                type="button"
                                onClick={(e) => handleClaimCase(e, c.id)}
                                disabled={claimingId === c.id}
                                className="inline-flex items-center px-2 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                              >
                                {claimingId === c.id ? (
                                  <>
                                    <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                                    Claiming...
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-2.5 h-2.5 mr-1 text-indigo-400" />
                                    Assign to me
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end space-x-2">
                          {!c.investigatorId && user?.role === 'INVESTIGATOR' && (
                            <button
                              type="button"
                              onClick={(e) => handleClaimCase(e, c.id)}
                              disabled={claimingId === c.id}
                              className="inline-flex items-center text-xs font-medium text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/40 px-2.5 py-1.5 rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50"
                            >
                              {claimingId === c.id ? (
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3 mr-1 text-indigo-400" />
                              )}
                              Assign to me
                            </button>
                          )}
                          <Link 
                            to={`/cases/${c.id}`} 
                            className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
                          >
                            Manage <ArrowRight className="w-3 h-3 ml-1" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

