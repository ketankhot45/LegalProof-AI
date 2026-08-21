import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  X,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

export const ComplaintsList = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    fetch('/api/v1/complaints', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load complaints');
        return res.json();
      })
      .then(data => {
        setComplaints(data.complaints || []);
        setLoading(false);
        if (isManual) setRefreshing(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to retrieve complaints');
        setLoading(false);
        if (isManual) setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'SUBMITTED': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UNDER_REVIEW': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ESCALATED': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = 
        (c.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.user?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (c.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Complaints Registry</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {user?.role === 'COMPLAINANT' 
              ? 'View and monitor the progress of your submitted digital complaints.' 
              : 'Review and triage incoming complaints across the jurisdiction.'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
            className="flex items-center px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {user?.role === 'COMPLAINANT' && (
            <Link 
              to="/complaints/new" 
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              File Complaint
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID, submitter, or category..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-zinc-500 hidden sm:inline" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-medium rounded-lg transition-colors flex items-center"
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            <span className="text-xs">Loading complaints registry...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center flex flex-col items-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <h4 className="text-sm font-medium text-white">Failed to load registry</h4>
            <p className="text-xs text-zinc-400 mt-1">{error}</p>
            <button
              onClick={() => fetchComplaints(true)}
              className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No complaints found</h3>
            <p className="text-sm text-zinc-400 max-w-sm">
              {user?.role === 'COMPLAINANT' 
                ? 'You have not submitted any complaints yet.' 
                : 'There are currently no complaints in the system.'}
            </p>
            {user?.role === 'COMPLAINANT' && (
              <Link 
                to="/complaints/new" 
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-medium hover:bg-indigo-700 transition-colors"
              >
                Create Complaint
              </Link>
            )}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Search className="w-8 h-8 text-zinc-600 mb-2" />
            <h4 className="text-sm font-medium text-white">No matching complaints</h4>
            <p className="text-xs text-zinc-400 mt-1">No complaints match your current search or filter criteria.</p>
            <button
              onClick={clearFilters}
              className="mt-3 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 rounded-md transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="px-6 py-3 border-b border-zinc-800 bg-zinc-950/40 text-xs text-zinc-500 flex justify-between items-center">
              <span>Showing {filteredComplaints.length} of {complaints.length} complaints</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/70 text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 whitespace-nowrap">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Title & Reference</th>
                    <th className="px-6 py-3.5 font-medium">Category</th>
                    <th className="px-6 py-3.5 font-medium">Submitter</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Date Filed</th>
                    <th className="px-6 py-3.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredComplaints.map((c: any) => (
                    <tr key={c.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-6 py-4 max-w-[200px] sm:max-w-[300px]">
                        <Link to={`/complaints/${c.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 block truncate">
                          {c.title}
                        </Link>
                        <span className="text-[11px] text-zinc-500 font-mono truncate block">ID: {c.id.substring(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-300 whitespace-nowrap">
                        {c.category || 'General'}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-300 whitespace-nowrap truncate max-w-[150px]">
                        {c.user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${getStatusColor(c.status)}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link 
                          to={`/complaints/${c.id}`} 
                          className="inline-flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
                        >
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
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
