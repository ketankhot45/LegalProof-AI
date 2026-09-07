import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { ClipboardList, ShieldAlert, CheckCircle, XCircle, ArrowRight, User, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

export const AdminAssignmentQueue = () => {
  const { user, token } = useAuth();
  const { showToast } = useFeedback();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/v1/cases/assignment-requests?status=PENDING', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch assignment requests');
      }
      const data = await response.json();
      setRequests(data.requests || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading requests.');
      showToast(err.message || 'Failed to load requests.', 'error');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchRequests();
    }
  }, [user, token]);

  const handleReview = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setProcessingId(requestId);
    try {
      let rejectionReason: string | undefined;
      if (action === 'REJECT') {
        const notes = window.prompt('Please provide a reason for rejection (required):');
        if (notes === null) return; // cancelled
        if (!notes.trim()) {
          showToast('Rejection reason is required.', 'error');
          return;
        }
        rejectionReason = notes.trim();
      }

      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/v1/cases/assignment-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to review request');
      }

      showToast(
        action === 'APPROVE'
          ? 'Assignment request approved successfully.'
          : 'Assignment request rejected.',
        'success'
      );
      setRequests((current) => current.filter((req) => req.id !== requestId));
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

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
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Assignment Queue' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center">
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-400" />
            Pending Assignment Requests
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review and approve investigator case assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(true)}
          disabled={refreshing || loading}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 self-start sm:self-auto"
          title="Refresh assignment queue"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-sm">
          Loading pending requests...
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center">
          <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-rose-300">Failed to Load Requests</h3>
          <p className="text-xs text-rose-400/80 mt-1">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center flex flex-col items-center">
          <ClipboardList className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No pending assignment requests</h3>
          <p className="text-sm text-zinc-400 max-w-sm">
            New investigator assignment requests will appear here for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col sm:flex-row">
              <div className="p-5 flex-1 flex flex-col justify-center border-b sm:border-b-0 sm:border-r border-zinc-800">
                <div className="flex items-center space-x-2 text-xs font-medium text-zinc-400 mb-2">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-white font-medium">{req.investigator?.name || 'Unknown Investigator'}</span>
                  <span>({req.investigator?.email})</span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>
                <h3 className="text-sm font-semibold text-white truncate mb-1">{req.case?.title || 'Untitled Case'}</h3>
                {req.notes && (
                  <p className="text-xs text-zinc-400 italic mb-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800">
                    "{req.notes}"
                  </p>
                )}
                <Link to={`/cases/${req.caseId}`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center mt-1 w-fit">
                  Review Case Context <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              
              <div className="p-5 bg-zinc-950/50 flex items-center justify-end sm:justify-center space-x-3 sm:min-w-[200px]">
                <button
                  type="button"
                  onClick={() => handleReview(req.id, 'REJECT')}
                  disabled={processingId !== null}
                  className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-md transition-colors disabled:opacity-50 border border-transparent hover:border-rose-500/20 flex flex-col items-center"
                >
                  <XCircle className="w-4 h-4 mb-1 mx-auto" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(req.id, 'APPROVE')}
                  disabled={processingId !== null}
                  className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors disabled:opacity-50 shadow-sm flex flex-col items-center"
                >
                  <CheckCircle className="w-4 h-4 mb-1" />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
