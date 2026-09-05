import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { 
  ArrowLeft, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Activity, 
  Link as LinkIcon, 
  ExternalLink,
  Sparkles,
  Brain,
  RefreshCw,
  FileText,
  Tag,
  User,
  Building,
  MapPin,
  Calendar,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Volume2,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Lock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VerifyResultState {
  status: 'SUCCESS' | 'HASH_MISMATCH' | 'FILE_MISSING' | 'UNAUTHORIZED' | 'SERVER_ERROR';
  verified: boolean;
  message: string;
  currentHash?: string;
  originalHash?: string;
}

export const EvidenceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Operation states
  const [verifying, setVerifying] = useState(false);
  const [anchoring, setAnchoring] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Feedback messages
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorSuccess, setAnchorSuccess] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResultState | null>(null);
  
  // Copy state trackers
  const [copiedClientHash, setCopiedClientHash] = useState(false);
  const [copiedServerHash, setCopiedServerHash] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedAiText, setCopiedAiText] = useState(false);
  const [copiedRawText, setCopiedRawText] = useState(false);

  // In-Browser Preview States
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const fetchEvidence = () => {
    setError(null);
    fetch(`/api/v1/evidence/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => {
      if (!res.ok) {
        if (res.status === 404) throw new Error('Evidence artifact not found');
        if (res.status === 403) throw new Error('Unauthorized: You do not have permission to view this evidence');
        throw new Error('Failed to retrieve evidence record');
      }
      return res.json();
    })
    .then(data => {
      setEvidence(data.evidence);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message || 'Evidence record not accessible');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchEvidence();
  }, [id]);

  // Load In-Browser Preview Securely
  useEffect(() => {
    if (!evidence) return;

    const mime = (evidence.mimeType || '').toLowerCase();
    const fileName = (evidence.fileName || '').toLowerCase();

    const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|tiff?)$/i.test(fileName);
    const isPdf = mime === 'application/pdf' || /\.pdf$/i.test(fileName);
    const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName);
    const isText = mime.startsWith('text/') || mime === 'application/json' || /\.(txt|csv|json|md|log|xml|tsv|env)$/i.test(fileName);

    if (isImage || isPdf || isAudio || isText) {
      setPreviewLoading(true);
      setPreviewError(null);

      // Clean up prior object URL
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
      setPreviewUrl(null);
      setPreviewTextContent(null);

      fetch(`/api/v1/evidence/${evidence.id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Unable to stream evidence for in-browser preview');
        }
        const blob = await res.blob();
        if (isText) {
          const text = await blob.text();
          setPreviewTextContent(text);
        } else {
          const url = URL.createObjectURL(blob);
          currentObjectUrlRef.current = url;
          setPreviewUrl(url);
        }
        setPreviewLoading(false);
      })
      .catch((err) => {
        console.error('Preview streaming error:', err);
        setPreviewError('Unable to stream evidence preview securely.');
        setPreviewLoading(false);
      });
    }

    return () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
    };
  }, [evidence?.id, evidence?.mimeType, evidence?.fileName]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (evidence?.caseId) {
      navigate(`/cases/${evidence.caseId}`);
    } else {
      navigate('/cases');
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`/api/v1/evidence/${id}/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.verified) {
          setVerifyResult({
            status: 'SUCCESS',
            verified: true,
            currentHash: data.currentHash,
            originalHash: data.originalHash,
            message: data.message || 'Verification successful. Server hash matches client intake digest.'
          });
          fetchEvidence(); // refresh status and chain of custody
        } else {
          setVerifyResult({
            status: 'HASH_MISMATCH',
            verified: false,
            currentHash: data.currentHash,
            originalHash: data.originalHash || evidence?.sha256Hash,
            message: data.error || 'Integrity verification failed: the stored file hash does not match the original intake hash.'
          });
          fetchEvidence();
        }
      } else if (res.status === 404 && data.code === 'FILE_MISSING') {
        setVerifyResult({
          status: 'FILE_MISSING',
          verified: false,
          originalHash: data.originalHash || evidence?.sha256Hash,
          message: data.error || 'Evidence file is currently unavailable in storage. The stored SHA-256 digest and blockchain proof remain intact, but the physical file could not be verified.'
        });
      } else if (res.status === 401 || res.status === 403) {
        setVerifyResult({
          status: 'UNAUTHORIZED',
          verified: false,
          message: data.error || 'Authorization Error: You are not authorized to verify or access this evidence.'
        });
      } else {
        setVerifyResult({
          status: 'SERVER_ERROR',
          verified: false,
          message: data.error || 'Server error occurred during verification. Please try again.'
        });
      }
    } catch (e: any) {
      console.error(e);
      setVerifyResult({
        status: 'SERVER_ERROR',
        verified: false,
        message: 'Network connection failure while communicating with verification service.'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleAnchor = async () => {
    setAnchoring(true);
    setAnchorError(null);
    setAnchorSuccess(null);
    try {
      const res = await fetch(`/api/v1/evidence/${id}/anchor`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAnchorSuccess('Evidence hash successfully anchored to Polygon Amoy smart contract registry!');
        fetchEvidence();
      } else {
        setAnchorError(data.error || 'Failed to anchor evidence to blockchain');
        fetchEvidence();
      }
    } catch (e: any) {
      setAnchorError('Network or server communication error during blockchain anchoring');
    } finally {
      setAnchoring(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiError(null);
    setAiSuccess(null);
    try {
      const res = await fetch(`/api/v1/evidence/${id}/analyze`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI analysis failed');
      }

      setAiSuccess('AI evidence analysis completed successfully!');
      fetchEvidence(); // refresh details
    } catch (err: any) {
      setAiError(err.message || 'AI analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'clientHash' | 'serverHash' | 'contract' | 'tx' | 'aiText' | 'rawText') => {
    navigator.clipboard.writeText(text);
    if (type === 'clientHash') {
      setCopiedClientHash(true);
      setTimeout(() => setCopiedClientHash(false), 2000);
    } else if (type === 'serverHash') {
      setCopiedServerHash(true);
      setTimeout(() => setCopiedServerHash(false), 2000);
    } else if (type === 'contract') {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else if (type === 'aiText') {
      setCopiedAiText(true);
      setTimeout(() => setCopiedAiText(false), 2000);
    } else if (type === 'rawText') {
      setCopiedRawText(true);
      setTimeout(() => setCopiedRawText(false), 2000);
    }
  };

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      const res = await fetch(`/api/v1/evidence/${id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = evidence.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        fetchEvidence(); // Refresh custody logs
      } else {
        const errJson = await res.json().catch(() => ({}));
        setDownloadError(errJson.error || 'Failed to download evidence artifact');
      }
    } catch (e: any) {
      setDownloadError('Network error while retrieving evidence artifact');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-semibold text-zinc-300">Loading Evidence Vault Workspace</h3>
          <p className="text-xs text-zinc-500 font-mono">Retrieving cryptographic hashes & custody chain...</p>
        </div>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center space-y-4 my-10 shadow-lg">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-white">Evidence Record Unavailable</h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{error || 'This evidence artifact could not be found or access is restricted by case assignment rules.'}</p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors border border-zinc-700"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Go Back
          </button>
          <Link
            to="/cases"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors"
          >
            View All Cases
          </Link>
        </div>
      </div>
    );
  }

  // Parse structured AI analysis
  let parsedAnalysis: {
    documentType?: string;
    processedAt?: string;
    objectiveSummary?: string;
    extractedText?: string;
    audioTranscript?: string;
    entities?: {
      persons?: string[];
      organizations?: string[];
      locations?: string[];
      dates?: string[];
      identifiers?: string[];
    };
    disclaimer?: string;
  } | null = null;

  if (evidence.aiSummary) {
    try {
      parsedAnalysis = typeof evidence.aiSummary === 'string' ? JSON.parse(evidence.aiSummary) : evidence.aiSummary;
    } catch (e) {
      console.error('Failed to parse aiSummary', e);
    }
  }

  const mime = (evidence.mimeType || '').toLowerCase();
  const fileName = (evidence.fileName || '').toLowerCase();

  const isImage = mime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp|tiff?)$/i.test(fileName);
  const isPdf = mime === 'application/pdf' || /\.pdf$/i.test(fileName);
  const isAudio = mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(fileName);
  const isText = mime.startsWith('text/') || mime === 'application/json' || /\.(txt|csv|json|md|log|xml|tsv|env)$/i.test(fileName);
  const isInvestigator = user?.role === 'ADMIN' || (user?.role === 'INVESTIGATOR' && (!evidence?.case?.investigatorId || evidence?.case?.investigatorId === user?.id));

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* 1. Header Navigation & Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center space-x-3.5 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
            title="Return to previous screen"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate max-w-lg" title={evidence.fileName}>
                {evidence.fileName}
              </h2>
              <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-md border ${
                evidence.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                evidence.status === 'INTEGRITY_FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {evidence.status === 'VERIFIED' ? 'Integrity Verified' :
                 evidence.status === 'INTEGRITY_FAILED' ? 'Integrity Failed' :
                 evidence.status ? evidence.status.replace('_', ' ') : 'Verification Pending'}
              </span>
              {evidence.blockchainStatus === 'ANCHORED' && (
                <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-400" /> Polygon Anchored
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Case:</span>
              <Link to={`/cases/${evidence.caseId}`} className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline inline-flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-zinc-500" />
                <span>{evidence.case?.title || evidence.caseTitle || `Case #${evidence.caseId.substring(0, 8)}`}</span>
              </Link>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-500 font-mono text-[11px]">UUID: {evidence.id}</span>
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button 
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors border border-zinc-700/80 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-zinc-300" />
            Download Original
          </button>

          <Link
            to={evidence.sha256Hash ? `/verify?hash=${evidence.sha256Hash}` : '/verify'}
            className="inline-flex items-center px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Public Verification Portal
          </Link>
        </div>
      </div>

      {/* Download Error Banner */}
      {downloadError && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between text-red-400 text-xs">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{downloadError}</span>
          </div>
          <button onClick={() => setDownloadError(null)} className="text-red-400 hover:text-red-300 font-semibold uppercase text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Metadata, In-Browser Preview, and AI Insights */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Evidence Identity & Metadata */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-800/80 pb-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Evidence Artifact Record
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white break-all tracking-tight">{evidence.fileName}</h3>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">UUID: {evidence.id}</p>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-[11px] bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-400">
                <Calendar className="w-3 h-3 text-zinc-500" />
                <span>Uploaded: {new Date(evidence.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Metadata Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">MIME Type</p>
                <p className="text-xs font-mono text-zinc-200 truncate" title={evidence.mimeType}>{evidence.mimeType}</p>
              </div>
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">File Size</p>
                <p className="text-xs font-medium text-zinc-200">
                  {evidence.fileSize ? (evidence.fileSize / 1024 / 1024).toFixed(2) : (evidence.size ? (evidence.size / 1024 / 1024).toFixed(2) : '0.00')} MB
                </p>
              </div>
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Category</p>
                <p className="text-xs font-medium text-zinc-200 truncate">{evidence.category || 'General'}</p>
              </div>
              <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/70">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Uploaded By</p>
                <p className="text-xs font-medium text-zinc-200 truncate">{evidence.uploadedBy?.name || 'Complainant'}</p>
              </div>
            </div>

            {/* Description */}
            {evidence.description && (
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Intake Description</h4>
                <div className="p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {evidence.description}
                </div>
              </div>
            )}

            {/* SHA-256 Hashes Dual Comparison Box */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Cryptographic Integrity Hashes
                </h4>
                <span className="text-[10px] text-zinc-500 font-mono">Algorithm: SHA-256 (FIPS 180-4)</span>
              </div>

              <div className="space-y-2">
                {/* Client Hash */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-400">Client-Side Intake Digest:</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">Browser Web Crypto</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-300 break-all select-all">{evidence.clientHash}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(evidence.clientHash, 'clientHash')}
                    className="self-end sm:self-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg shrink-0 transition-colors text-[11px] inline-flex items-center gap-1"
                    title="Copy Client Hash"
                  >
                    {copiedClientHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="sm:hidden text-[10px]">{copiedClientHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Server Hash */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-400">Server-Side Storage Digest:</span>
                      <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded font-mono">Node Crypto Stream</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-300 break-all select-all">{evidence.sha256Hash}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(evidence.sha256Hash, 'serverHash')}
                    className="self-end sm:self-center p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg shrink-0 transition-colors text-[11px] inline-flex items-center gap-1"
                    title="Copy Server Hash"
                  >
                    {copiedServerHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="sm:hidden text-[10px]">{copiedServerHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. In-Browser Evidence Preview Section */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/40">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Evidence In-Browser Preview</h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Read-Only Sandbox
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">Original binary bytes streamed directly into client-side memory without modification</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-zinc-500 font-mono">
                  {isImage ? 'IMAGE VIEWER' : isPdf ? 'PDF VIEWER' : isAudio ? 'AUDIO PLAYER' : isText ? 'TEXT VIEWER' : 'BINARY ARTIFACT'}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {previewLoading ? (
                <div className="py-16 text-center space-y-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs font-medium text-zinc-300">Retrieving secure preview stream...</p>
                  <p className="text-[11px] text-zinc-500">Decrypting and streaming buffer into browser memory</p>
                </div>
              ) : previewError ? (
                <div className="p-6 text-center space-y-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <EyeOff className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400">{previewError}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download File Directly
                  </button>
                </div>
              ) : isImage && previewUrl ? (
                /* Image Previewer */
                <div className="space-y-3">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 flex items-center justify-center min-h-[280px] max-h-[520px] overflow-hidden relative group">
                    <img 
                      src={previewUrl} 
                      alt={evidence.fileName}
                      className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 px-1 gap-2">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Original resolution rendered without compression or byte mutation.
                    </span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Open in Fullscreen Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : isPdf && previewUrl ? (
                /* PDF Viewer */
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                    <object 
                      data={previewUrl} 
                      type="application/pdf" 
                      className="w-full h-[520px] rounded-lg"
                    >
                      <div className="p-8 text-center space-y-3">
                        <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                        <h4 className="text-sm font-semibold text-white">PDF Preview Plugin Not Available</h4>
                        <p className="text-xs text-zinc-400 max-w-md mx-auto">
                          Your browser does not have an inline PDF reader enabled. You can open the PDF directly or download it.
                        </p>
                        <div className="pt-2 flex justify-center gap-3">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Open PDF Tab
                          </a>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
                          </button>
                        </div>
                      </div>
                    </object>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <span>In-Browser PDF Inspector • Integrity Protected</span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      <span>Open Full PDF in Separate Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : isAudio && previewUrl ? (
                /* Audio Player */
                <div className="p-6 bg-zinc-950 rounded-xl border border-zinc-800 space-y-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{evidence.fileName}</h4>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        Format: {evidence.mimeType} • Native Browser Audio Engine
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                    <audio 
                      controls 
                      preload="metadata" 
                      src={previewUrl} 
                      className="w-full h-10 outline-none"
                    />
                  </div>

                  <p className="text-[11px] text-zinc-500 italic">
                    Note: Audio playback is rendered locally in memory. Use Gemini AI analysis below for automated speech-to-text transcription.
                  </p>
                </div>
              ) : isText && previewTextContent !== null ? (
                /* Text & Code Viewer */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Lines: {previewTextContent.split('\n').length} • Characters: {previewTextContent.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(previewTextContent, 'rawText')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      {copiedRawText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRawText ? 'Copied Full Text' : 'Copy Text'}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 max-h-[380px] overflow-y-auto overflow-x-hidden leading-relaxed whitespace-pre-wrap break-all select-all">
                    {previewTextContent || <span className="text-zinc-600 italic">Empty text file</span>}
                  </div>
                </div>
              ) : (
                /* Unsupported / Binary Format State */
                <div className="py-12 px-6 text-center space-y-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                  <div className="w-12 h-12 bg-zinc-800/80 border border-zinc-700/80 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto">
                    {mime.includes('zip') || mime.includes('tar') || mime.includes('archive') ? (
                      <FileArchive className="w-6 h-6 text-amber-400" />
                    ) : mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') ? (
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <FileCode className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-sm font-bold text-white">In-Browser Preview Not Supported</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This file format (<span className="text-zinc-200 font-mono">{evidence.mimeType}</span>) is a binary or proprietary container. Download the raw forensic package to inspect locally in specialized forensic software.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors border border-zinc-700"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download Original Artifact
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Investigator AI Analysis Section */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-zinc-950/60 p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Investigator AI Insights</h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      Gemini Multimodal
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Automated document OCR, speech transcription & named entity extraction</p>
                </div>
              </div>

              {isInvestigator && (
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing || evidence.status !== 'VERIFIED'}
                  title={evidence.status !== 'VERIFIED' ? 'Cryptographic integrity must be verified before running AI analysis' : ''}
                  className="inline-flex items-center justify-center px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm shrink-0"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Analyzing Evidence...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      <span>{parsedAnalysis ? 'Re-Analyze Evidence' : 'Analyze Evidence'}</span>
                    </>
                  )}
                </button>
              )}

            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {aiError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between">
                  <span>{aiError}</span>
                  <button onClick={() => setAiError(null)} className="text-red-400 font-semibold uppercase text-[10px]">Dismiss</button>
                </div>
              )}

              {aiSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
                  <span>{aiSuccess}</span>
                  <button onClick={() => setAiSuccess(null)} className="text-emerald-400 font-semibold uppercase text-[10px]">Dismiss</button>
                </div>
              )}

              {analyzing && (
                <div className="p-8 bg-purple-950/20 border border-purple-800/30 rounded-xl text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-purple-200">Processing evidence with Gemini Multimodal Engine...</p>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">Extracting verbatim text, OCR layout structure, audio transcripts, and named entities.</p>
                  </div>
                </div>
              )}

              {!analyzing && !parsedAnalysis && (
                <div className="text-center py-10 px-4 border border-dashed border-zinc-800 rounded-xl space-y-3 bg-zinc-950/30">
                  <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
                  <div className="space-y-1 max-w-sm mx-auto">
                    <h4 className="text-sm font-semibold text-zinc-300">No AI Analysis Generated Yet</h4>
                    <p className="text-xs text-zinc-500">
                      Run automated text extraction, document OCR, audio transcription, and entity categorization.
                    </p>
                  </div>
                  {isInvestigator && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleAnalyze}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-sm"
                      >
                        <Brain className="w-3.5 h-3.5 mr-1.5" />
                        Run AI Analysis Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!analyzing && parsedAnalysis && (
                <div className="space-y-5">
                  {/* Mandatory Guardrail Disclaimer */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <h5 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">Responsible AI Guardrail</h5>
                      <p className="text-amber-200/90 mt-0.5 leading-relaxed">
                        AI-Assisted Analysis — For information and text indexing purposes only. Requires human verification. Contains no automated legal decisions or conclusions.
                      </p>
                    </div>
                  </div>

                  {/* Document Type & Timestamp */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-zinc-400">Classified Artifact Type:</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                        {parsedAnalysis.documentType || 'Document'}
                      </span>
                    </div>
                    {parsedAnalysis.processedAt && (
                      <span className="text-zinc-500 font-mono text-[11px]">
                        Processed: {new Date(parsedAnalysis.processedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Objective Summary */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      Objective Content Summary
                    </h4>
                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                      {parsedAnalysis.objectiveSummary}
                    </div>
                  </div>

                  {/* Extracted Named Entities */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      Extracted Named Entities
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Persons */}
                      <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-center font-semibold text-zinc-400 text-[11px]">
                          <User className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                          Persons Mentioned ({parsedAnalysis.entities?.persons?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedAnalysis.entities?.persons && parsedAnalysis.entities.persons.length > 0 ? (
                            parsedAnalysis.entities.persons.map((p, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Organizations */}
                      <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-center font-semibold text-zinc-400 text-[11px]">
                          <Building className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                          Organizations ({parsedAnalysis.entities?.organizations?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedAnalysis.entities?.organizations && parsedAnalysis.entities.organizations.length > 0 ? (
                            parsedAnalysis.entities.organizations.map((o, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                                {o}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Locations */}
                      <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-center font-semibold text-zinc-400 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-rose-400" />
                          Locations ({parsedAnalysis.entities?.locations?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedAnalysis.entities?.locations && parsedAnalysis.entities.locations.length > 0 ? (
                            parsedAnalysis.entities.locations.map((l, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px]">
                                {l}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                        <div className="flex items-center font-semibold text-zinc-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          Dates / Timestamps ({parsedAnalysis.entities?.dates?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedAnalysis.entities?.dates && parsedAnalysis.entities.dates.length > 0 ? (
                            parsedAnalysis.entities.dates.map((d, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None identified</span>
                          )}
                        </div>
                      </div>

                      {/* Identifiers */}
                      <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 md:col-span-2 space-y-2">
                        <div className="flex items-center font-semibold text-zinc-400 text-[11px]">
                          <Tag className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                          Identifiers, Document Numbers & Keys ({parsedAnalysis.entities?.identifiers?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedAnalysis.entities?.identifiers && parsedAnalysis.entities.identifiers.length > 0 ? (
                            parsedAnalysis.entities.identifiers.map((idVal, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono text-[11px]">
                                {idVal}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-600 italic text-[11px]">None identified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Verbatim Text / Transcript */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        Verbatim Text / OCR Transcript
                      </h4>

                      {(parsedAnalysis.extractedText || parsedAnalysis.audioTranscript) && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(parsedAnalysis?.extractedText || parsedAnalysis?.audioTranscript || '', 'aiText')}
                          className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                          {copiedAiText ? (
                            <>
                              <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300 max-h-60 overflow-y-auto overflow-x-hidden leading-relaxed whitespace-pre-wrap break-words select-all">
                      {parsedAnalysis.extractedText || parsedAnalysis.audioTranscript || 'No verbatim text extracted.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Integrity Verification, Blockchain Anchoring, & Chain of Custody */}
        <div className="space-y-6">

          {/* 4. Cryptographic Integrity Verification */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-400" />
                Integrity Status
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">FIPS 180-4</span>
            </div>
            
            <div className={`p-4 rounded-xl border ${
              evidence.status === 'VERIFIED' ? 'bg-emerald-500/10 border-emerald-500/30' : 
              evidence.status === 'INTEGRITY_FAILED' ? 'bg-red-500/10 border-red-500/30' : 
              'bg-zinc-950/60 border-zinc-800'
            }`}>
              <div className="flex items-center mb-2">
                {evidence.status === 'VERIFIED' ? <ShieldCheck className="w-5 h-5 text-emerald-400 mr-2 shrink-0" /> : 
                 evidence.status === 'INTEGRITY_FAILED' ? <ShieldAlert className="w-5 h-5 text-red-400 mr-2 shrink-0" /> : 
                 <Shield className="w-5 h-5 text-zinc-400 mr-2 shrink-0" />}
                <span className={`font-bold text-sm ${
                  evidence.status === 'VERIFIED' ? 'text-emerald-400' : 
                  evidence.status === 'INTEGRITY_FAILED' ? 'text-red-400' : 
                  'text-zinc-300'
                }`}>
                  {evidence.status ? evidence.status.replace('_', ' ') : 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {evidence.status === 'VERIFIED' ? 'Cryptographic match confirmed: The physical file on storage matches the client intake hash byte-for-byte.' : 
                 evidence.status === 'INTEGRITY_FAILED' ? 'CRITICAL WARNING: The file hash does not match the original client intake checksum. Potential data tampering detected.' : 
                 'Hash verification pending.'}
              </p>
            </div>

            <button 
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="w-full flex justify-center items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Re-Calculating Server SHA-256...</span>
                </>
              ) : (
                <span>Re-Verify Hash Integrity Now</span>
              )}
            </button>

            {verifyResult && (
              <div className="space-y-2">
                {verifyResult.status === 'SUCCESS' && (
                  <div className="p-3.5 rounded-xl text-xs border bg-emerald-500/10 border-emerald-500/30 text-emerald-300 space-y-1.5">
                    <div className="flex items-center font-semibold text-emerald-400">
                      <ShieldCheck className="w-4 h-4 mr-1.5 shrink-0" />
                      Verification Successful
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-200/90">
                      {verifyResult.message}
                    </p>
                  </div>
                )}

                {verifyResult.status === 'HASH_MISMATCH' && (
                  <div className="p-3.5 rounded-xl text-xs border bg-red-500/15 border-red-500/40 text-red-200 space-y-2">
                    <div className="flex items-center font-bold text-red-400">
                      <ShieldAlert className="w-4 h-4 mr-1.5 shrink-0" />
                      Integrity Verification Failed
                    </div>
                    <p className="text-xs leading-relaxed text-red-300 font-medium">
                      Integrity verification failed: the stored file hash does not match the original intake hash.
                    </p>
                    {verifyResult.currentHash && (
                      <div className="bg-black/40 p-2 rounded-lg border border-red-500/20 font-mono text-[10px] space-y-1">
                        <div className="text-zinc-400">Current Computed Hash:</div>
                        <div className="text-red-400 break-all">{verifyResult.currentHash}</div>
                        <div className="text-zinc-400 pt-1">Original Intake Hash:</div>
                        <div className="text-emerald-400 break-all">{verifyResult.originalHash || evidence?.sha256Hash}</div>
                      </div>
                    )}
                  </div>
                )}

                {verifyResult.status === 'FILE_MISSING' && (
                  <div className="p-3.5 rounded-xl text-xs border bg-amber-500/10 border-amber-500/30 text-amber-200 space-y-2">
                    <div className="flex items-center font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" />
                      Storage File Unavailable
                    </div>
                    <p className="text-xs leading-relaxed text-amber-200/90">
                      Evidence file is currently unavailable in storage. The stored SHA-256 digest and blockchain proof remain intact, but the physical file could not be verified.
                    </p>
                    <div className="bg-zinc-950/60 p-2 rounded-lg border border-amber-500/20 text-[11px] text-zinc-300 flex items-center justify-between">
                      <span className="text-zinc-400">Canonical Digest:</span>
                      <span className="font-mono text-[10px] text-amber-300">
                        {evidence?.sha256Hash ? `${evidence.sha256Hash.substring(0, 10)}...${evidence.sha256Hash.substring(54)}` : 'Intact'}
                      </span>
                    </div>
                  </div>
                )}

                {verifyResult.status === 'UNAUTHORIZED' && (
                  <div className="p-3.5 rounded-xl text-xs border bg-red-500/10 border-red-500/30 text-red-300 space-y-1.5">
                    <div className="flex items-center font-semibold text-red-400">
                      <Lock className="w-4 h-4 mr-1.5 shrink-0" />
                      Authorization Error
                    </div>
                    <p className="text-xs leading-relaxed text-red-200/90">
                      {verifyResult.message || 'You are not authorized to verify or access this evidence.'}
                    </p>
                  </div>
                )}

                {verifyResult.status === 'SERVER_ERROR' && (
                  <div className="p-3.5 rounded-xl text-xs border bg-zinc-800/90 border-zinc-700 text-zinc-300 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center font-semibold text-zinc-200">
                        <AlertCircle className="w-4 h-4 mr-1.5 text-red-400 shrink-0" />
                        Verification Error
                      </div>
                      <button
                        type="button"
                        onClick={handleVerify}
                        disabled={verifying}
                        className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-[11px] font-medium transition-colors flex items-center"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-400">
                      {verifyResult.message}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Forensic Note: SHA-256 hashing guarantees mathematical non-repudiation and byte integrity from the moment of intake.
            </p>
          </div>

          {/* 5. Blockchain Anchoring Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center">
                <LinkIcon className="w-4 h-4 mr-2 text-indigo-400" />
                Polygon Blockchain Anchoring
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">Chain ID 80002</span>
            </div>

            <div className={`p-4 rounded-xl border ${
              evidence.blockchainStatus === 'ANCHORED' ? 'bg-emerald-500/10 border-emerald-500/30' :
              evidence.blockchainStatus === 'ANCHORING' ? 'bg-amber-500/10 border-amber-500/30' :
              evidence.blockchainStatus === 'ANCHOR_FAILED' ? 'bg-red-500/10 border-red-500/30' :
              'bg-zinc-950/60 border-zinc-800'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-zinc-400">On-Chain Status</span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                  evidence.blockchainStatus === 'ANCHORED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  evidence.blockchainStatus === 'ANCHORING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  evidence.blockchainStatus === 'ANCHOR_FAILED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {evidence.blockchainStatus || 'NOT_ANCHORED'}
                </span>
              </div>

              {evidence.blockchainStatus === 'ANCHORED' ? (
                <div className="mt-3 space-y-2.5 text-xs border-t border-zinc-800/80 pt-3">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Network</span>
                    <span className="text-zinc-200 font-semibold">{evidence.blockchainNetwork || 'Polygon Amoy'}</span>
                  </div>
                  
                  {evidence.blockchainContractAddress && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-[10px]">Smart Contract</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(evidence.blockchainContractAddress, 'contract')}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200"
                        >
                          {copiedContract ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <span className="text-zinc-300 font-mono text-[11px] break-all block select-all">
                        {evidence.blockchainContractAddress}
                      </span>
                    </div>
                  )}

                  {evidence.blockchainTxHash && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-[10px]">Transaction Hash</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(evidence.blockchainTxHash, 'tx')}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200"
                        >
                          {copiedTx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${evidence.blockchainTxHash}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-mono text-[11px] break-all inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>{evidence.blockchainTxHash}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {evidence.blockchainBlockNumber && (
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Block Number</span>
                      <span className="text-zinc-200 font-mono">#{evidence.blockchainBlockNumber}</span>
                    </div>
                  )}

                  {evidence.blockchainTimestamp && (
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Blockchain Timestamp</span>
                      <span className="text-zinc-200">{new Date(evidence.blockchainTimestamp).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {evidence.blockchainStatus === 'ANCHORING'
                    ? 'Transaction submitted to Polygon mempool. Awaiting block receipt...'
                    : evidence.blockchainStatus === 'ANCHOR_FAILED'
                    ? 'Previous anchoring failed. Click below to retry anchoring to Polygon Amoy.'
                    : 'This evidence SHA-256 digest has not yet been registered on the Polygon Amoy blockchain.'}
                </p>
              )}
            </div>

            {isInvestigator && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAnchor}
                  disabled={
                    anchoring ||
                    evidence.status !== 'VERIFIED' ||
                    evidence.blockchainStatus === 'ANCHORED' ||
                    evidence.blockchainStatus === 'ANCHORING'
                  }
                  className="w-full flex justify-center items-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {anchoring ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      <span>Anchoring to Polygon Amoy...</span>
                    </>
                  ) : evidence.blockchainStatus === 'ANCHORED' ? (
                    <span>Already Anchored On-Chain</span>
                  ) : (
                    <span>Anchor Verified Hash to Blockchain</span>
                  )}
                </button>
                {evidence.status !== 'VERIFIED' && evidence.blockchainStatus !== 'ANCHORED' && (
                  <p className="text-[11px] text-zinc-500 text-center">
                    Verify integrity before anchoring.
                  </p>
                )}
              </div>
            )}

            {anchorError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between">
                <span>{anchorError}</span>
                <button onClick={() => setAnchorError(null)} className="text-red-400 font-semibold uppercase text-[10px]">Dismiss</button>
              </div>
            )}

            {anchorSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
                <span>{anchorSuccess}</span>
                <button onClick={() => setAnchorSuccess(null)} className="text-emerald-400 font-semibold uppercase text-[10px]">Dismiss</button>
              </div>
            )}
          </div>

          {/* Public Verification Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-400" />
                Public Verification Portal
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">External Audit</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verify this evidence artifact's SHA-256 cryptographic digest independently on the public verification portal without requiring an account.
            </p>
            <Link
              to={evidence.sha256Hash ? `/verify?hash=${evidence.sha256Hash}` : '/verify'}
              className="w-full flex justify-center items-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Open Verification Portal
            </Link>
          </div>

          {/* 6. Chain of Custody Timeline */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col max-h-[460px]">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Chain of Custody Logs</h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {evidence.custodyLogs?.length || 0} Entries
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {evidence.custodyLogs && evidence.custodyLogs.length > 0 ? (
                evidence.custodyLogs.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="relative pl-5 border-l border-zinc-800 last:border-0 pb-3.5 last:pb-0">
                    <div className="absolute w-2.5 h-2.5 bg-indigo-500 rounded-full -left-[5.5px] top-1 border-2 border-zinc-900 shadow-sm"></div>
                    <p className="text-xs font-semibold text-zinc-200">{log.action.replace(/_/g, ' ')}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5 font-mono">
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      {log.ipAddress && <span>• IP: {log.ipAddress}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic py-4 text-center">No custody logs recorded yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
