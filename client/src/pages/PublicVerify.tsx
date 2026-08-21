import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  ArrowLeft, 
  RefreshCw,
  Copy,
  Check,
  Search,
  Lock,
  Cpu,
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';

export const PublicVerify = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [calculatingHash, setCalculatingHash] = useState(false);
  const [computedHash, setComputedHash] = useState<string | null>(null);
  const [verifyingBlockchain, setVerifyingBlockchain] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [manualHashInput, setManualHashInput] = useState('');
  const [manualInputError, setManualInputError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'file' | 'hash'>('file');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  // Calculate SHA-256 in browser using Web Crypto API
  const calculateSHA256 = async (selectedFile: File) => {
    setCalculatingHash(true);
    setVerifyResult(null);
    setComputedHash(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);
      setCalculatingHash(false);

      // Perform public blockchain lookup
      await verifyHashOnBlockchain(hashHex);
    } catch (err) {
      console.error('Error calculating hash:', err);
      setCalculatingHash(false);
      setVerifyResult({
        verified: false,
        error: true,
        message: 'Failed to compute SHA-256 hash in browser memory. Please try a different file.'
      });
    }
  };

  const verifyHashOnBlockchain = async (hashHex: string) => {
    setVerifyingBlockchain(true);
    try {
      const res = await fetch('/api/v1/blockchain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: hashHex })
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err) {
      console.error('Blockchain lookup error:', err);
      setVerifyResult({ 
        verified: false, 
        error: true,
        message: 'Failed to communicate with verification service. Please check your network connection and retry.' 
      });
    } finally {
      setVerifyingBlockchain(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      calculateSHA256(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      calculateSHA256(selected);
    }
  };

  const handleManualHashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualInputError(null);
    const cleaned = manualHashInput.trim().toLowerCase();
    
    // Normalize 0x prefix if provided
    const rawHash = cleaned.startsWith('0x') ? cleaned.slice(2) : cleaned;

    if (!/^[a-f0-9]{64}$/i.test(rawHash)) {
      setManualInputError('Please enter a valid 64-character hexadecimal SHA-256 hash (or 66-character 0x-prefixed hash).');
      return;
    }

    setComputedHash(rawHash);
    setFile(null);
    verifyHashOnBlockchain(rawHash);
  };

  const copyToClipboard = (text: string, type: 'hash' | 'contract' | 'tx') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else if (type === 'contract') {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  const reset = () => {
    setFile(null);
    setComputedHash(null);
    setVerifyResult(null);
    setManualHashInput('');
    setManualInputError(null);
  };

  const isBusy = calculatingHash || verifyingBlockchain;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">LegalProof AI</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 hidden sm:inline-block">
                  Public Verification Portal
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-none hidden sm:block">Polygon Amoy Blockchain Evidence Verifier</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/login"
              className="text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <span>App Portal Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        
        {/* Navigation & Context Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800/60 px-2.5 py-1 rounded-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Polygon Amoy (Chain ID 80002)</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Independent Blockchain Verification
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Verify digital evidence against the Polygon Amoy blockchain. 
            <span className="text-indigo-400 font-semibold"> Zero file upload</span> — your file is hashed locally and remains 100% private in your browser.
          </p>

          {/* Privacy Guarantee Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
              <Lock className="w-3 h-3 text-emerald-400" /> 100% Client-Side Hashing
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
              <Cpu className="w-3 h-3 text-indigo-400" /> Web Crypto API SHA-256
            </span>
            <span className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
              <ShieldCheck className="w-3 h-3 text-cyan-400" /> Polygon Smart Contract
            </span>
          </div>
        </div>

        {/* Verification Method Tabs */}
        {!file && !computedHash && (
          <div className="flex justify-center">
            <div className="bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 inline-flex space-x-1">
              <button
                type="button"
                onClick={() => { setActiveTab('file'); setManualInputError(null); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'file'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Upload & Hash File
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('hash'); setManualInputError(null); }}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'hash'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Enter SHA-256 Hash
              </button>
            </div>
          </div>
        )}

        {/* Input Interface */}
        {!file && !computedHash ? (
          activeTab === 'file' ? (
            /* Upload Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-zinc-900/40 hover:bg-zinc-900/70 relative ${
                dragActive ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <input
                type="file"
                id="fileInput"
                onChange={handleFileChange}
                disabled={isBusy}
                className="hidden"
              />
              <label htmlFor="fileInput" className="cursor-pointer space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <p className="text-base font-semibold text-white">
                    Drop evidence file here or <span className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">browse</span>
                  </p>
                  <p className="text-xs text-zinc-500 leading-normal">
                    Supports all file types (PDF, PNG, JPG, MP4, MP3, DOCX, ZIP) up to 500MB. Processed strictly inside your browser memory.
                  </p>
                </div>
              </label>
            </div>
          ) : (
            /* Direct Hash Input Form */
            <form onSubmit={handleManualHashSubmit} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="space-y-1">
                <label htmlFor="manualHash" className="text-xs font-semibold uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-400" />
                  Direct SHA-256 Hash Lookup
                </label>
                <p className="text-xs text-zinc-400">
                  Enter the 64-character hexadecimal SHA-256 checksum to verify its on-chain registration.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  id="manualHash"
                  type="text"
                  value={manualHashInput}
                  onChange={(e) => setManualHashInput(e.target.value)}
                  placeholder="e.g. 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
                  disabled={isBusy}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />

                {manualInputError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {manualInputError}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!manualHashInput.trim() || isBusy}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify On Blockchain</span>
                </button>
              </div>
            </form>
          )
        ) : (
          /* Active Verification Result View */
          <div className="space-y-6">
            {/* File Header Panel */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-3 bg-zinc-800/90 rounded-xl text-zinc-300 shrink-0 border border-zinc-700/50">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                      {file ? file.name : 'Manual Hash Query'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Local Memory Computation` : 'Direct SHA-256 Digest'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={reset}
                  disabled={isBusy}
                  className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 border border-zinc-700/70"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 
                  <span>Verify Another Item</span>
                </button>
              </div>

              {/* Status Section 1: Client Hash Match */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px]">
                    1. Calculated SHA-256 Digest
                  </span>
                  {computedHash && !calculatingHash && (
                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> COMPUTED LOCALLY
                    </span>
                  )}
                </div>
                
                <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                  <div className="font-mono text-xs text-zinc-300 break-all select-all min-w-0">
                    {calculatingHash ? (
                      <span className="text-indigo-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Calculating SHA-256 checksum locally in browser memory...
                      </span>
                    ) : (
                      computedHash
                    )}
                  </div>
                  {computedHash && !calculatingHash && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(computedHash, 'hash')}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg shrink-0 transition-colors"
                      title="Copy SHA-256 Hash"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Section 2: Blockchain Verification */}
              <div className="space-y-3 pt-2">
                <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[11px] block">
                  2. Polygon Amoy Smart Contract Registry
                </span>

                {verifyingBlockchain ? (
                  <div className="p-6 bg-zinc-950/80 rounded-xl border border-zinc-800 text-center space-y-2.5">
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs text-zinc-300 font-medium">Querying smart contract on Polygon Amoy network...</p>
                    <p className="text-[11px] text-zinc-500">Checking <code className="text-zinc-400 font-mono">isRegistered(bytes32)</code> and <code className="text-zinc-400 font-mono">getEvidenceDetails(bytes32)</code></p>
                  </div>
                ) : verifyResult?.error ? (
                  /* Error State */
                  <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start space-x-3 text-red-400">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-red-300">Verification Service Error</h4>
                        <p className="text-zinc-300 leading-relaxed">
                          {verifyResult.message || 'Unable to complete smart contract lookup at this time.'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => computedHash && verifyHashOnBlockchain(computedHash)}
                        className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry Verification
                      </button>
                    </div>
                  </div>
                ) : verifyResult?.verified ? (
                  /* Verified On-Chain State */
                  <div className="p-5 sm:p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-4">
                    <div className="flex items-start space-x-3 text-emerald-400">
                      <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-emerald-300 tracking-tight">
                          BLOCKCHAIN ANCHOR CONFIRMED
                        </h4>
                        <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
                          This exact SHA-256 digest is immutably anchored in the official smart contract registry on Polygon Amoy.
                        </p>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-zinc-950/90 p-4 rounded-xl border border-emerald-500/20 font-sans">
                      <div>
                        <span className="text-zinc-500 text-[11px] block">Network</span>
                        <span className="text-zinc-200 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          {verifyResult.network || 'Polygon Amoy'}
                        </span>
                      </div>

                      {verifyResult.blockchainTimestamp && (
                        <div>
                          <span className="text-zinc-500 text-[11px] block">On-Chain Timestamp</span>
                          <span className="text-zinc-200 font-medium mt-0.5 block">
                            {new Date(verifyResult.blockchainTimestamp).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {verifyResult.blockNumber && (
                        <div>
                          <span className="text-zinc-500 text-[11px] block">Block Number</span>
                          <span className="text-zinc-200 font-mono mt-0.5 block">
                            #{verifyResult.blockNumber}
                          </span>
                        </div>
                      )}

                      {verifyResult.contractAddress && (
                        <div className="sm:col-span-2 pt-1 border-t border-zinc-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-[11px]">Contract Address</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(verifyResult.contractAddress, 'contract')}
                              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                            >
                              {copiedContract ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedContract ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <span className="text-zinc-300 font-mono text-[11px] break-all block mt-0.5 select-all">
                            {verifyResult.contractAddress}
                          </span>
                        </div>
                      )}

                      {verifyResult.txHash && (
                        <div className="sm:col-span-2 pt-1 border-t border-zinc-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-500 text-[11px]">Transaction Hash</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(verifyResult.txHash, 'tx')}
                                className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                              >
                                {copiedTx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedTx ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>
                          </div>
                          <a
                            href={`https://amoy.polygonscan.com/tx/${verifyResult.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-mono text-[11px] break-all inline-flex items-center gap-1 mt-0.5"
                          >
                            <span>{verifyResult.txHash}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      )}

                      {verifyResult.submitter && (
                        <div className="sm:col-span-2 pt-1 border-t border-zinc-800/80">
                          <span className="text-zinc-500 text-[11px] block">Submitter Wallet</span>
                          <span className="text-zinc-300 font-mono text-[11px] break-all block mt-0.5 select-all">
                            {verifyResult.submitter}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Not Found State */
                  <div className="p-5 sm:p-6 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    <div className="flex items-start space-x-3 text-amber-400">
                      <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-amber-300 tracking-tight">
                          NO BLOCKCHAIN ANCHOR FOUND
                        </h4>
                        <p className="text-xs text-amber-300/80 mt-0.5 leading-relaxed">
                          This file's computed SHA-256 digest was not found in the Polygon Amoy registry.
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-950/80 p-4 rounded-xl border border-amber-500/20 space-y-2 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-300 block text-[11px] uppercase tracking-wider">
                        Possible Explanations
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-zinc-400 text-xs">
                        <li>The evidence artifact has not yet been anchored to the blockchain by an assigned investigator.</li>
                        <li>The file contents, metadata, or formatting have been altered since original intake.</li>
                        <li>The SHA-256 hash was generated using a different encoding or compression format.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Legal Disclaimer Box */}
            <div className="p-4 sm:p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 leading-relaxed space-y-1">
              <span className="font-semibold text-zinc-300 block">Legal & Chain-of-Custody Notice</span>
              <p>
                Blockchain anchoring independently validates that this exact 256-bit cryptographic digest existed at the specified block timestamp. On-chain records provide proof of non-tampering from the moment of registration, but do not replace comprehensive chain-of-custody documentation or forensic certification.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LegalProof AI • Immutable Evidence Verification System</span>
          <span className="text-zinc-600 font-mono text-[11px]">Polygon Amoy Contract: 0x8898...cE87</span>
        </div>
      </footer>
    </div>
  );
};

