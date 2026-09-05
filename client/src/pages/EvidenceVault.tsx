import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { 
  FolderLock, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  File, 
  ArrowRight, 
  Upload, 
  Copy, 
  Check, 
  Briefcase,
  Layers,
  X,
  ExternalLink
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  caseId: string;
  caseTitle?: string;
  fileName: string;
  mimeType: string;
  size: number;
  clientHash?: string | null;
  sha256Hash?: string | null;
  status: string;
  blockchainStatus?: string | null;
  blockchainTxHash?: string | null;
  createdAt: string;
  uploadedBy?: {
    name: string;
    role: string;
  };
}

interface CaseOption {
  id: string;
  title: string;
  status: string;
  investigatorId?: string | null;
}

export const EvidenceVault = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCaseSelectModal, setShowCaseSelectModal] = useState(false);
  const [modalCaseId, setModalCaseId] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Complainants are unauthorized
  if (user && user.role === 'COMPLAINANT') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchVaultData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch accessible cases
      const casesRes = await fetch('/api/v1/cases', { headers });
      if (!casesRes.ok) {
        if (casesRes.status === 403) throw new Error('Access denied to evidence registry');
        throw new Error('Failed to load cases');
      }
      const casesData = await casesRes.json();
      const accessibleCases: CaseOption[] = casesData.cases || [];
      setCases(accessibleCases);

      // 2. Fetch evidence for all accessible cases
      // For investigators, only cases where investigatorId === user.id can have evidence accessed
      const targetCases = accessibleCases.filter(c => {
        if (user?.role === 'ADMIN') return true;
        return c.investigatorId === user?.id;
      });

      const evidencePromises = targetCases.map(async (c) => {
        try {
          const res = await fetch(`/api/v1/cases/${c.id}/evidence`, { headers });
          if (!res.ok) return [];
          const data = await res.json();
          return (data.evidence || []).map((e: any) => ({
            ...e,
            caseTitle: c.title
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(evidencePromises);
      const combined = results.flat();
      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEvidenceList(combined);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to retrieve evidence artifacts');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, []);

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = evidenceList.length;
    const verified = evidenceList.filter(e => e.status === 'VERIFIED').length;
    const failed = evidenceList.filter(e => e.status === 'INTEGRITY_FAILED').length;
    const anchored = evidenceList.filter(e => e.blockchainStatus === 'ANCHORED').length;
    return { total, verified, failed, anchored };
  }, [evidenceList]);

  // Filtered evidence items
  const filteredEvidence = useMemo(() => {
    return evidenceList.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        !searchQuery ||
        item.fileName.toLowerCase().includes(q) ||
        (item.caseTitle && item.caseTitle.toLowerCase().includes(q)) ||
        (item.sha256Hash && item.sha256Hash.toLowerCase().includes(q)) ||
        (item.uploadedBy?.name && item.uploadedBy.name.toLowerCase().includes(q));

      const matchesCase = selectedCaseId === 'ALL' || item.caseId === selectedCaseId;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesBlockchain = 
        blockchainFilter === 'ALL' || 
        (blockchainFilter === 'ANCHORED' && item.blockchainStatus === 'ANCHORED') ||
        (blockchainFilter === 'NOT_ANCHORED' && item.blockchainStatus !== 'ANCHORED');

      return matchesSearch && matchesCase && matchesStatus && matchesBlockchain;
    });
  }, [evidenceList, searchQuery, selectedCaseId, statusFilter, blockchainFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCaseId('ALL');
    setStatusFilter('ALL');
    setBlockchainFilter('ALL');
  };

  const isFiltered = searchQuery !== '' || selectedCaseId !== 'ALL' || statusFilter !== 'ALL' || blockchainFilter !== 'ALL';

  // Can the current user upload to the currently selected case?
  const selectedCaseObj = cases.find(c => c.id === selectedCaseId);
  const canUploadToSelected = 
    selectedCaseObj && 
    (user?.role === 'ADMIN' || (user?.role === 'INVESTIGATOR' && selectedCaseObj.investigatorId === user?.id));

  const isAuthorizedUploader = user?.role === 'ADMIN' || user?.role === 'INVESTIGATOR';

  const uploadableCases = useMemo(() => {
    return cases.filter(c => {
      if (user?.role === 'ADMIN') return true;
      if (user?.role === 'INVESTIGATOR') return c.investigatorId === user?.id;
      return false;
    });
  }, [cases, user]);

  const handleUploadClick = () => {
    if (selectedCaseId !== 'ALL' && canUploadToSelected) {
      navigate(`/cases/${selectedCaseId}/evidence/upload`);
    } else {
      if (!modalCaseId && uploadableCases.length > 0) {
        setModalCaseId(uploadableCases[0].id);
      }
      setShowCaseSelectModal(true);
    }
  };

  const handleProceedUpload = () => {
    const targetCaseId = modalCaseId || uploadableCases[0]?.id;
    if (!targetCaseId) return;
    setShowCaseSelectModal(false);
    navigate(`/cases/${targetCaseId}/evidence/upload`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-semibold text-white tracking-tight">Evidence Vault</h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
              Cryptographic Storage
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Centralized registry of chain-of-custody digital evidence artifacts, SHA-256 integrity records, and on-chain verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => fetchVaultData(true)}
            disabled={refreshing}
            className="flex items-center px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Vault
          </button>
          {isAuthorizedUploader && (
            <button
              type="button"
              onClick={handleUploadClick}
              className="flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Evidence
            </button>
          )}
        </div>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Artifacts</span>
          <p className="text-2xl font-bold text-white mt-1.5">{metrics.total}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Securely cataloged</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Verified Integrity</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">{metrics.verified}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">SHA-256 confirmed</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Anchored On-Chain</span>
          <p className="text-2xl font-bold text-purple-400 mt-1.5">{metrics.anchored}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Polygon Amoy Testnet</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Integrity Status</span>
          <p className={`text-2xl font-bold mt-1.5 ${metrics.failed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {metrics.failed > 0 ? `${metrics.failed} Failed` : '100% Match'}
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5">Zero tampering detected</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by file name, case title, or SHA-256 hash..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Case Selector */}
          <div>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Associated Cases ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title.length > 30 ? c.title.substring(0, 30) + '...' : c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified</option>
              <option value="INTEGRITY_FAILED">Failed</option>
              <option value="UPLOADING">Uploading</option>
            </select>

            <select
              value={blockchainFilter}
              onChange={(e) => setBlockchainFilter(e.target.value)}
              className="w-1/2 px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="ALL">All Blockchain</option>
              <option value="ANCHORED">Anchored</option>
              <option value="NOT_ANCHORED">Pending</option>
            </select>
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
            <span>
              Showing {filteredEvidence.length} of {evidenceList.length} evidence artifacts
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Evidence Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-3"></div>
            Loading Evidence Vault records...
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FolderLock className="w-12 h-12 text-zinc-700 mb-3" />
            <h4 className="text-sm font-semibold text-white">No Evidence Items Found</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-md">
              {isFiltered 
                ? 'No artifacts match your current filter parameters. Try clearing the search query or case filter.'
                : 'No evidence artifacts are currently cataloged in your assigned investigation roster.'}
            </p>
            {isFiltered ? (
              <button
                onClick={clearFilters}
                className="mt-4 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-medium transition-colors"
              >
                Reset Filters
              </button>
            ) : cases.length > 0 ? (
              <Link
                to="/cases"
                className="mt-4 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
              >
                Go to Active Cases
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800 whitespace-nowrap">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Artifact Name</th>
                  <th className="px-5 py-3.5 font-medium">Associated Case</th>
                  <th className="px-5 py-3.5 font-medium">SHA-256 Hash</th>
                  <th className="px-5 py-3.5 font-medium">Integrity</th>
                  <th className="px-5 py-3.5 font-medium">Blockchain</th>
                  <th className="px-5 py-3.5 font-medium">Uploaded</th>
                  <th className="px-5 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredEvidence.map((item) => {
                  const isVerified = item.status === 'VERIFIED';
                  const isFailed = item.status === 'INTEGRITY_FAILED';
                  const isAnchored = item.blockchainStatus === 'ANCHORED';

                  return (
                    <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Artifact Name & Size */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                            {isVerified ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            ) : isFailed ? (
                              <ShieldAlert className="w-4 h-4 text-red-400" />
                            ) : (
                              <File className="w-4 h-4 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/evidence/${item.id}`}
                              className="font-medium text-white hover:text-indigo-400 transition-colors block max-w-[200px] truncate"
                              title={item.fileName}
                            >
                              {item.fileName}
                            </Link>
                            <span className="text-xs text-zinc-500">
                              {(item.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Associated Case */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Link
                          to={`/cases/${item.caseId}`}
                          className="text-xs font-medium text-zinc-300 hover:text-indigo-400 transition-colors flex items-center max-w-[180px] truncate"
                          title={item.caseTitle}
                        >
                          <Briefcase className="w-3.5 h-3.5 mr-1.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{item.caseTitle || 'View Case'}</span>
                        </Link>
                      </td>

                      {/* SHA-256 Hash with copy */}
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs">
                        {item.sha256Hash ? (
                          <div className="flex items-center space-x-1.5 text-zinc-400">
                            <span>{item.sha256Hash.substring(0, 10)}...{item.sha256Hash.substring(item.sha256Hash.length - 6)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyHash(item.id, item.sha256Hash!)}
                              className="p-1 hover:text-white rounded transition-colors"
                              title="Copy full SHA-256 hash"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600">Pending</span>
                        )}
                      </td>

                      {/* Integrity Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isVerified ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                            Verified
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5"></span>
                            Integrity Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {item.status.replace('_', ' ')}
                          </span>
                        )}
                      </td>

                      {/* Blockchain Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {isAnchored ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mr-1.5"></span>
                            Polygon Amoy
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Not Anchored
                          </span>
                        )}
                      </td>

                      {/* Upload Date & Uploader */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400">
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                        <div className="text-[11px] text-zinc-500">
                          by {item.uploadedBy?.name || 'Investigator'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <Link
                          to={`/evidence/${item.id}`}
                          className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-600/10 hover:bg-indigo-600/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
                        >
                          Open Artifact
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Case Selection Modal for Evidence Upload */}
      {showCaseSelectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Select Case for Evidence Upload</h3>
                  <p className="text-xs text-zinc-400">Choose an investigation case to intake digital artifacts.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCaseSelectModal(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadableCases.length > 0 ? (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Assigned Investigation Case
                  </label>
                  <select
                    value={modalCaseId || (uploadableCases[0]?.id ?? '')}
                    onChange={(e) => setModalCaseId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-zinc-100 text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    {uploadableCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.status.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCaseSelectModal(false)}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedUpload}
                    disabled={!modalCaseId && !uploadableCases[0]?.id}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Continue to Upload
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2 text-center">
                <p className="text-xs text-zinc-400">
                  You are not currently assigned to any active investigation cases. You must be assigned as the lead investigator on a case before uploading forensic evidence.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCaseSelectModal(false)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
