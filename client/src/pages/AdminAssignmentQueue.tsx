import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { ClipboardList, ShieldAlert, CheckCircle, XCircle, ArrowRight, User, RefreshCw, X, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { HashDisplay } from '../components/HashDisplay';

export const AdminAssignmentQueue = () => {
  const { user, token } = useAuth();
  const { showToast } = useFeedback();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // In-app Rejection Dialog state
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

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

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/v1/cases/assignment-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'APPROVE',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve request');
      }

      showToast('Assignment request approved successfully.', 'success');
      setRequests((current) => current.filter((req) => req.id !== requestId));
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (request: any) => {
    setRejectingRequest(request);
    setRejectionReason('');
    setRejectionError(null);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setRejectionError('Please provide a reason for rejecting this assignment request.');
      return;
    }

    if (!rejectingRequest) return;
    const requestId = rejectingRequest.id;
    setProcessingId(requestId);

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await fetch(`/api/v1/cases/assignment-requests/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject request');
      }

      showToast('Assignment request rejected.', 'success');
      setRequests((current) => current.filter((req) => req.id !== requestId));
      setRejectingRequest(null);
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
            <ClipboardList className="w-6 h-6 mr-2 text-indigo-400 shrink-0" />
            Pending Assignment Requests
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review and triage lead investigator case claims.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchRequests(true)}
          disabled={refreshing || loading}
          className="p-2.5 min-h-[44px] min-w-[44px] bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-50 inline-flex items-center justify-center self-start sm:self-auto"
          title="Refresh assignment queue"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500 text-sm flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
          <span>Loading pending requests...</span>
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
            <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col md:flex-row shadow-sm">
              <div className="p-5 flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-zinc-800 space-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                  <div className="flex items-center space-x-1.5 font-medium text-zinc-200">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{req.investigator?.name || 'Unknown Investigator'}</span>
                  </div>
                  <span>({req.investigator?.email})</span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">{req.case?.title || 'Untitled Case'}</h3>
                  <div className="mt-1">
                    <HashDisplay hash={req.caseId} truncate="short" size="xs" variant="inline" label="Case ID" />
                  </div>
                </div>

                {req.notes && (
                  <p className="text-xs text-zinc-300 italic bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 leading-relaxed">
                    "{req.notes}"
                  </p>
                )}

                <Link to={`/cases/${req.caseId}`} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center pt-1">
                  <span>Review Full Case Context</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
              
              <div className="p-5 bg-zinc-950/60 flex items-center justify-end md:justify-center gap-3 md:min-w-[220px]">
                <button
                  type="button"
                  onClick={() => openRejectModal(req)}
                  disabled={processingId !== null}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(req.id)}
                  disabled={processingId !== null}
                  className="px-5 py-2.5 min-h-[44px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm inline-flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Lead
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* In-App Rejection Modal */}
      {rejectingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20 shrink-0">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Reject Assignment Request</h3>
                  <p className="text-xs text-zinc-400">Provide formal feedback for the investigator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingRequest(null)}
                className="text-zinc-500 hover:text-zinc-300 p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 overflow-y-auto flex-1">
              <div>
                <p className="text-xs text-zinc-300">
                  Rejecting assignment request for <span className="text-white font-medium">{rejectingRequest.investigator?.name}</span> on <span className="text-white font-medium">{rejectingRequest.case?.title}</span>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Reason for Rejection <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  rows={3}
                  placeholder="e.g. Lead already assigned to senior detective / case reassigned / jurisdictional mismatch..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                  autoFocus
                />
                {rejectionError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {rejectionError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRejectingRequest(null)}
                  className="px-4 py-2.5 min-h-[44px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId !== null}
                  className="px-5 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
