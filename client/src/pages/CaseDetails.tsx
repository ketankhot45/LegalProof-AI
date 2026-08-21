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
  UserCheck
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/cases" 
            className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-white tracking-tight">Case Operations</h2>
              <span className="text-xs font-mono text-zinc-500">ID: {caseData.id.substring(0, 8)}...</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Formal Digital Investigation Record</p>
          </div>
        </div>
        
        {/* Status Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs text-zinc-400 font-medium">Status:</label>
          <select 
            value={caseData.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
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
        {/* Case Narrative and Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2 break-words">{caseData.title}</h3>
            <p className="text-xs text-zinc-500 font-mono mb-4">Case Reference: {caseData.id}</p>
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
              {caseData.description}
            </div>
          </div>

          {/* Investigation Notes Feed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[480px]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Investigation Notes Timeline</h3>
              </div>
              <span className="text-[11px] text-zinc-500">{caseData.caseNotes?.length || 0} entries</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {caseData.caseNotes?.length === 0 ? (
                <div className="text-center text-zinc-500 text-xs py-12 flex flex-col items-center">
                  <MessageSquare className="w-8 h-8 text-zinc-700 mb-2" />
                  <span>No notes logged for this investigation. Add findings below.</span>
                </div>
              ) : (
                caseData.caseNotes?.map((note: any) => (
                  <div key={note.id} className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3.5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-zinc-200">
                        {note.author.name} 
                        <span className="text-zinc-500 text-[10px] ml-1.5 font-mono uppercase">({note.author.role})</span>
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

            <div className="p-3.5 border-t border-zinc-800 bg-zinc-950/60">
              <form onSubmit={handleAddNote} className="flex space-x-2">
                <input
                  type="text"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Record an investigation note or update..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit" 
                  disabled={submittingNote || !noteContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Post
                </button>
              </form>
            </div>
          </div>

          {/* Evidence Vault for this case */}
          <EvidenceList caseId={id!} isAssignedInvestigator={user?.id === caseData.investigatorId || user?.role === 'ADMIN'} />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Assignment Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Lead Investigator</h3>
            {caseData.investigator ? (
              <div className="flex items-center space-x-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="w-9 h-9 rounded-md bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {caseData.investigator.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{caseData.investigator.name}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{caseData.investigator.email}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">This case has not been assigned to a lead investigator.</p>
                <button 
                  onClick={handleAssignSelf}
                  className="w-full flex items-center justify-center px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors border border-zinc-700"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                  Assign to me
                </button>
              </div>
            )}
          </div>
          
          {/* Origin & Metadata Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
             <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Origin & History</h3>
             <dl className="space-y-3.5 text-xs">
              <div>
                <dt className="text-zinc-500">Origin Complaint</dt>
                <dd className="mt-1">
                  {caseData.complaint ? (
                    <Link to={`/complaints/${caseData.complaint.id}`} className="font-medium text-indigo-400 hover:text-indigo-300 break-words block">
                      {caseData.complaint.title} →
                    </Link>
                  ) : (
                    <span className="text-zinc-500">Direct Intake</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Date Escalated</dt>
                <dd className="mt-1 font-medium text-zinc-200">{new Date(caseData.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last Activity</dt>
                <dd className="mt-1 font-medium text-zinc-200">{new Date(caseData.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
