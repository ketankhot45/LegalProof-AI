import React, { useEffect, useState } from 'react';
import { File, Upload, Lock, ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

export const EvidenceList = ({ caseId, isAssignedInvestigator }: { caseId: string, isAssignedInvestigator: boolean }) => {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetch(`/api/v1/cases/${caseId}/evidence`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setEvidence(data.evidence || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [caseId]);

  const canUpload = user?.role === 'ADMIN' || (user?.role === 'INVESTIGATOR' && isAssignedInvestigator);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INTEGRITY_FAILED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div id="digital-evidence-section" className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <File className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-white">Digital Evidence Vault</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/80">
                {evidence.length} artifact{evidence.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Cryptographically hashed forensic files associated with this investigation</p>
          </div>
        </div>
        {canUpload && (
          <Link 
            to={`/cases/${caseId}/evidence/upload`} 
            className="inline-flex items-center justify-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Upload Evidence
          </Link>
        )}
      </div>
      
      <div className="divide-y divide-zinc-800">
        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
            <span>Loading case evidence artifacts...</span>
          </div>
        ) : evidence.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <Lock className="w-8 h-8 text-zinc-700 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">No Evidence Attached</h4>
            <p className="text-xs text-zinc-400 max-w-sm">The digital evidence vault for this case is currently empty.</p>
            {canUpload && (
              <Link 
                to={`/cases/${caseId}/evidence/upload`}
                className="mt-4 inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload Evidence
              </Link>
            )}
          </div>
        ) : (
          evidence.map((item) => (
            <div key={item.id} className="p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-start min-w-0">
                <div className="mt-0.5 mr-3 shrink-0">
                  {item.status === 'VERIFIED' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : item.status === 'INTEGRITY_FAILED' ? (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  ) : (
                    <File className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/evidence/${item.id}`} className="text-sm font-medium text-white hover:text-indigo-300 block truncate transition-colors">
                    {item.fileName}
                  </Link>
                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <span>Uploaded by {item.uploadedBy?.name || 'Investigator'}</span>
                    <span>•</span>
                    <span className={`px-2 py-0.2 rounded-full border text-[10px] font-medium ${getStatusBadge(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="sm:shrink-0 self-end sm:self-auto">
                <Link 
                  to={`/evidence/${item.id}`} 
                  className="inline-flex items-center text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                >
                  <span>View Evidence</span>
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
