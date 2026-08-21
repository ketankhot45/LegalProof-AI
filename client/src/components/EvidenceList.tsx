import React, { useEffect, useState } from 'react';
import { File, Upload, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
        <div className="flex items-center">
          <File className="w-4 h-4 mr-2 text-indigo-400" />
          <h3 className="text-sm font-medium text-white">Digital Evidence</h3>
        </div>
        {canUpload && (
          <Link to={`/cases/${caseId}/evidence/upload`} className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center">
            <Upload className="w-3 h-3 mr-1.5" />
            Upload Evidence
          </Link>
        )}
      </div>
      
      <div className="divide-y divide-zinc-800">
        {loading ? (
          <div className="p-6 text-center text-sm text-zinc-500">Loading evidence...</div>
        ) : evidence.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <Lock className="w-8 h-8 text-zinc-700 mb-3" />
            <h4 className="text-sm font-medium text-white mb-1">No Evidence Attached</h4>
            <p className="text-xs text-zinc-500">The evidence vault for this case is empty.</p>
          </div>
        ) : (
          evidence.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-start">
                <div className="mt-1 mr-3">
                  {item.status === 'VERIFIED' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  ) : item.status === 'INTEGRITY_FAILED' ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : (
                    <File className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <div>
                  <Link to={`/evidence/${item.id}`} className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                    {item.fileName}
                  </Link>
                  <div className="text-xs text-zinc-500 mt-1 flex space-x-3">
                    <span>{(item.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>Uploaded by {item.uploadedBy?.name}</span>
                    <span className={item.status === 'VERIFIED' ? 'text-emerald-500/80' : item.status === 'INTEGRITY_FAILED' ? 'text-red-500/80' : 'text-zinc-500'}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
