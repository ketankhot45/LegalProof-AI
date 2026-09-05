import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Briefcase, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle,
  FileCheck,
  Check
} from 'lucide-react';

export const ComplaintDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchComplaint = () => {
    setError(null);
    fetch(`/api/v1/complaints/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Complaint record not found');
          if (res.status === 403) throw new Error('Unauthorized to view this complaint');
          throw new Error('Failed to load complaint');
        }
        return res.json();
      })
      .then(data => {
        setComplaint(data.complaint);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to load complaint details');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const handleReview = async () => {
    setValidationError(null);
    setActionSuccess(null);
    if (!reviewAction) return;
    
    if (reviewAction === 'REJECT' && !rejectionReason.trim()) {
      setValidationError('Please provide a mandatory explanation for rejecting this complaint.');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/complaints/${id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action: reviewAction, rejectionReason: rejectionReason.trim() }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete review action');
      }
      
      setComplaint({
        ...data.complaint,
        case: data.case || complaint.case,
        caseId: data.case?.id || complaint.caseId
      });
      setActionSuccess(
        reviewAction === 'ESCALATE' 
          ? 'Complaint successfully escalated to a formal Case investigation.' 
          : reviewAction === 'REJECT'
          ? 'Complaint marked as Rejected.'
          : 'Complaint status updated to Under Review.'
      );
      setReviewAction('');
      setRejectionReason('');
    } catch (err: any) {
      setValidationError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-xs text-zinc-500 font-mono">LOADING COMPLAINT METADATA...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Complaint Not Accessible</h3>
        <p className="text-sm text-zinc-400">{error || 'This complaint does not exist or you do not have permission to view it.'}</p>
        <div className="pt-2">
          <Link
            to="/complaints"
            className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Complaints
          </Link>
        </div>
      </div>
    );
  }

  const isInvestigator = user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN';
  const needsReview = isInvestigator && (complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to="/complaints" 
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-white tracking-tight">Complaint Record</h2>
              <span className={`px-2.5 py-0.5 text-xs rounded-full border font-medium ${getStatusColor(complaint.status)}`}>
                {complaint.status.replace('_', ' ')}
              </span>
              {isInvestigator && complaint.status === 'ESCALATED' && (complaint.case?.id || complaint.caseId) && (
                <Link
                  to={`/cases/${complaint.case?.id || complaint.caseId}`}
                  className="inline-flex items-center px-2.5 py-0.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-medium transition-colors"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  View Linked Case →
                </Link>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {complaint.id}</p>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-400 text-sm">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-3 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4 break-words">{complaint.title}</h3>
            
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Statement of Fact / Description</h4>
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </div>
            </div>
            
            {complaint.rejectionReason && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center">
                  <XCircle className="w-4 h-4 mr-1.5" />
                  Rejection Rationale
                </h4>
                <p className="mt-2 text-sm text-red-300">{complaint.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Linked Case Card if Escalated */}
          {(complaint.case || complaint.status === 'ESCALATED') && (
            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/30 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Formal Investigation Active</span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">
                    {complaint.case?.title || `Case: ${complaint.title}`}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Status: <span className="text-zinc-200 font-medium">{(complaint.case?.status || 'OPENED').replace('_', ' ')}</span>
                  </p>
                </div>
              </div>
              {isInvestigator && (complaint.case?.id || complaint.caseId) && (
                <Link
                  to={`/cases/${complaint.case?.id || complaint.caseId}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-sm"
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  View Linked Case →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Metadata & Triage Controls */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Complaint Metadata</h3>
            <dl className="space-y-4 text-xs">
              <div>
                <dt className="text-zinc-500">Category</dt>
                <dd className="mt-1 font-medium text-zinc-200">{complaint.category || 'General Incident'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Priority Level</dt>
                <dd className="mt-1 font-medium text-zinc-200">{complaint.priority || 'Standard'}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Complainant / Submitter</dt>
                <dd className="mt-1 font-medium text-zinc-200 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                  {complaint.user?.name || 'Unknown'} ({complaint.user?.email})
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Submission Timestamp</dt>
                <dd className="mt-1 font-medium text-zinc-200 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                  {new Date(complaint.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last Modified</dt>
                <dd className="mt-1 font-medium text-zinc-400">
                  {new Date(complaint.updatedAt).toLocaleString()}
                </dd>
              </div>
              {complaint.status === 'ESCALATED' && (
                <div>
                  <dt className="text-zinc-500">Investigation Status</dt>
                  <dd className="mt-1 font-medium text-indigo-400 flex items-center">
                    <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                    Escalated to Formal Case
                  </dd>
                </div>
              )}
              {complaint.clientHash && (
                <div className="pt-2 border-t border-zinc-800/60">
                  <dt className="text-zinc-500">Client SHA-256 Hash</dt>
                  <dd className="mt-1 font-mono text-[11px] text-zinc-300 break-all bg-zinc-950 p-2 rounded border border-zinc-800 select-all">
                    {complaint.clientHash}
                  </dd>
                  <div className="mt-2">
                    <Link
                      to={`/verify?hash=${complaint.clientHash}`}
                      className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                    >
                      <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                      Verify on Public Ledger →
                    </Link>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Investigator Action Panel */}
          {needsReview && (
            <div className="bg-zinc-900 border border-indigo-500/30 rounded-xl p-6 space-y-4">
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Investigator Triage Panel
              </h3>

              {validationError && (
                <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-xs text-red-300">
                  {validationError}
                </div>
              )}

              {!reviewAction ? (
                <div className="space-y-3">
                  {/* Primary Next Action */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Primary Next Action
                    </span>
                    <button 
                      onClick={() => { setReviewAction('ESCALATE'); setValidationError(null); }} 
                      className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-between shadow-sm"
                    >
                      <span className="flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-2" />
                        Escalate to Formal Case
                      </span>
                      <span className="text-[10px] font-mono bg-indigo-700/80 px-1.5 py-0.5 rounded text-indigo-100">Primary</span>
                    </button>
                  </div>

                  {/* Status Progression */}
                  <div className="pt-2 border-t border-zinc-800/80">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1.5">
                      Alternative Actions
                    </span>
                    <div className="space-y-2">
                      {complaint.status === 'SUBMITTED' && (
                        <button 
                          onClick={() => { setReviewAction('APPROVE'); setValidationError(null); }} 
                          className="w-full px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors text-left flex items-center justify-between border border-zinc-700/60"
                        >
                          <span className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-2 text-amber-400" />
                            Mark Under Review
                          </span>
                          <span className="text-[10px] text-zinc-400">Preliminary</span>
                        </button>
                      )}
                      <button 
                        onClick={() => { setReviewAction('REJECT'); setValidationError(null); }} 
                        className="w-full px-3.5 py-2 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-800/30 rounded-lg text-xs font-medium transition-colors text-left flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <XCircle className="w-3.5 h-3.5 mr-2 text-red-400" />
                          Reject Complaint
                        </span>
                        <span className="text-[10px] text-red-400/80">Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 text-xs text-zinc-300">
                    <div className="font-semibold text-white mb-1">
                      {reviewAction === 'ESCALATE' ? 'Escalate to Formal Case' : reviewAction === 'APPROVE' ? 'Mark Under Review' : 'Reject Complaint'}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {reviewAction === 'ESCALATE'
                        ? 'This will immediately generate a formal Case investigation dossier linked to this complaint and notify assigned personnel.'
                        : reviewAction === 'APPROVE'
                        ? 'Update this complaint status from Submitted to Under Review while preliminary facts are checked.'
                        : 'Reject this complaint and provide mandatory rationale to the complainant.'}
                    </p>
                  </div>

                  {reviewAction === 'REJECT' && (
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Reason for Rejection <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        placeholder="Explain why this submission is rejected..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-100 placeholder-zinc-500 focus:border-red-500 focus:outline-none text-xs resize-none"
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex space-x-2 pt-1">
                    <button 
                      onClick={handleReview}
                      disabled={submitting}
                      className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Confirm Action'}
                    </button>
                    <button 
                      onClick={() => { setReviewAction(''); setValidationError(null); }}
                      disabled={submitting}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
