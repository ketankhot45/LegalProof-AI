import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  UserPlus, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Briefcase, 
  Send,
  UserCheck,
  FileText,
  ArrowRight,
  Shield,
  Upload
} from 'lucide-react';
import { EvidenceList } from '../components/EvidenceList';

export const CaseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchCase = () => {
    setError(null);
    fetch(`/api/v1/cases/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Case not found');
          if (res.status === 403) throw new Error('Access denied to this investigation');
          throw new Error('Failed to retrieve case details');
        }
        return res.json();
      })
      .then(data => {
        setCaseData(data.case);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Unable to access case');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCase();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/v1/cases/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setFeedbackMessage(`Case status changed to ${status.replace('_', ' ')}`);
        fetchCase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignSelf = async () => {
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/v1/cases/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ investigatorId: user?.id, status: 'ASSIGNED' }),
      });
      if (res.ok) {
        setFeedbackMessage('You have assigned yourself as lead investigator on this case.');
        fetchCase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/v1/cases/${id}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      if (res.ok) {
        setNoteContent('');
        setFeedbackMessage('Investigation note recorded.');
        fetchCase();
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPENED': return 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30';
      case 'ASSIGNED': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold';
      case 'ACTIVE_INVESTIGATION': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-semibold';
      case 'UNDER_REVIEW': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold';
      case 'CLOSED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-400 border-red-500/30 font-semibold';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-medium';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 font-medium';
      case 'LOW': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-xs text-zinc-500 font-mono">LOADING CASE DOSSIER...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-semibold text-white">Investigation Not Found</h3>
        <p className="text-sm text-zinc-400">{error || 'The requested case dossier could not be retrieved.'}</p>
        <div className="pt-2">
          <Link
            to="/cases"
            className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Cases Roster
          </Link>
        </div>
      </div>
    );
  }

  const isAssignedInvestigator = user?.id === caseData.investigatorId || user?.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Status Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/cases" 
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Return to cases list"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-semibold text-white tracking-tight">Case Operations</h2>
              <span className={`px-2.5 py-0.5 text-xs rounded-full border ${getStatusBadge(caseData.status)}`}>
                {caseData.status.replace('_', ' ')}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityBadge(caseData.priority)}`}>
                {caseData.priority} Priority
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Ref: {caseData.id}</p>
          </div>
        </div>
        
        {/* Status Transition Selector */}
        <div className="flex items-center space-x-2.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-sm">
          <label className="text-xs text-zinc-400 font-medium">Case Status:</label>
          <select 
            value={caseData.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value="OPENED">Opened</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACTIVE_INVESTIGATION">Active Investigation</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-emerald-400 text-xs">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 mr-2.5 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-emerald-300 font-semibold">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Investigation Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Information & Origin Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1.5 break-words">{caseData.title}</h3>
              <div className="text-xs text-zinc-500 font-mono">Formal Digital Investigation Record</div>
            </div>

            {/* Origin Complaint Contextual Navigation */}
            {caseData.complaint ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="p-2 bg-indigo-500/15 rounded-lg border border-indigo-500/30 text-indigo-400 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold">Origin Complaint</div>
                    <div className="font-medium text-white truncate">{caseData.complaint.title}</div>
                    <div className="text-zinc-500 font-mono text-[11px]">ID: {caseData.complaint.id.substring(0, 8)}...</div>
                  </div>
                </div>
                <Link
                  to={`/complaints/${caseData.complaint.id}`}
                  className="inline-flex items-center justify-center text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors shrink-0 self-start sm:self-auto"
                >
                  <span>View Origin Complaint</span>
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Link>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 italic p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/80">
                Direct intake case (No linked origin complaint)
              </div>
            )}

            {/* Narrative Description */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Case Narrative & Scope</h4>
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {caseData.description}
              </div>
            </div>
          </div>

          {/* Digital Evidence Vault Section */}
          <EvidenceList 
            caseId={id!} 
            isAssignedInvestigator={isAssignedInvestigator} 
          />

          {/* Investigation Notes Timeline */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Investigation Notes Timeline</h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60">
                {caseData.caseNotes?.length || 0} entries
              </span>
            </div>
            
            {/* Scrollable Timeline */}
            <div className="p-4 sm:p-5 space-y-3.5 max-h-[420px] overflow-y-auto">
              {caseData.caseNotes?.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-10 flex flex-col items-center">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                  <span>No notes logged for this investigation. Add initial findings below.</span>
                </div>
              ) : (
                caseData.caseNotes?.map((note: any) => (
                  <div key={note.id} className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3.5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        {note.author.name} 
                        <span className="text-zinc-500 text-[10px] font-mono uppercase bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
                          {note.author.role}
                        </span>
                      </span>
                      <span className="text-[11px] text-zinc-500 flex items-center font-mono">
                        <Clock className="w-3 h-3 mr-1 text-zinc-600" />
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/60">
              <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Record an investigation note, timeline event, or finding..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={submittingNote || !noteContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {submittingNote ? 'Saving...' : 'Add Note'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Lead Investigator Assignment</h3>
            {caseData.investigator ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                  <div className="w-9 h-9 rounded-md bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {caseData.investigator.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{caseData.investigator.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{caseData.investigator.email}</p>
                  </div>
                </div>
                {caseData.investigatorId === user?.id && (
                  <div className="text-[11px] text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg flex items-center">
                    <UserCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-400 shrink-0" />
                    <span>You are the assigned lead on this case.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-300 font-medium">Unassigned Case</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">This investigation dossier currently has no designated lead.</p>
                </div>
                {user?.role === 'INVESTIGATOR' && (
                  <button 
                    onClick={handleAssignSelf}
                    className="w-full flex items-center justify-center px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-2" />
                    Assign to me
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Origin & Metadata Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm">
             <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Case Registry Metadata</h3>
             <dl className="space-y-3.5 text-xs">
              <div>
                <dt className="text-zinc-500">Current Status</dt>
                <dd className="mt-1 font-medium text-zinc-200">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] ${getStatusBadge(caseData.status)}`}>
                    {caseData.status.replace('_', ' ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Investigation Priority</dt>
                <dd className="mt-1 font-medium text-zinc-200">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] ${getPriorityBadge(caseData.priority)}`}>
                    {caseData.priority}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Origin Complaint</dt>
                <dd className="mt-1">
                  {caseData.complaint ? (
                    <Link to={`/complaints/${caseData.complaint.id}`} className="font-semibold text-indigo-400 hover:text-indigo-300 break-words block">
                      {caseData.complaint.title} →
                    </Link>
                  ) : (
                    <span className="text-zinc-500">Direct Intake</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Date Escalated</dt>
                <dd className="mt-1 font-medium text-zinc-300">{new Date(caseData.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last Activity</dt>
                <dd className="mt-1 font-medium text-zinc-300">{new Date(caseData.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
