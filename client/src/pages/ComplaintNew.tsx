import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Send, AlertCircle, Upload, Paperclip, X, FileText, Info } from 'lucide-react';

export const ComplaintNew = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CYBER_CRIME');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = (file: File) => {
    // 25MB check
    if (file.size > 25 * 1024 * 1024) {
      setError('Supporting proof file size exceeds maximum 25MB limit.');
      return;
    }
    setError('');
    setProofFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit incident report');
      }

      navigate('/complaints');
    } catch (err: any) {
      setError(err.message || 'Error occurred while filing complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link 
          to="/complaints" 
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">File Digital Incident Report</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Submit factual incident information into the official intake registry.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-lg text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Incident Title</label>
            <input
              type="text"
              required
              minLength={5}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs"
              placeholder="e.g. Unauthorized Account Access or Financial Fraud Alert"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Incident Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none text-xs"
            >
              <option value="CYBER_CRIME">Cyber Crime / Unauthorized Breach</option>
              <option value="FRAUD">Financial Fraud / Identity Theft</option>
              <option value="HARASSMENT">Online Harassment / Extortion</option>
              <option value="DATA_THEFT">Data Leak / IP Compromise</option>
              <option value="OTHER">Other Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Statement of Fact / Detailed Narrative</label>
            <textarea
              required
              minLength={10}
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs resize-none leading-relaxed"
              placeholder="Provide an objective description of the incident: timeline, impacted systems, account identifiers, transactions, or involved third parties..."
            />
          </div>

          {/* Supporting Proof (Optional) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-300 flex items-center">
                <Paperclip className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Supporting Proof (Optional)
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">Max 25MB</span>
            </div>

            {!proofFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-5 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                <p className="text-xs text-zinc-300 font-medium">
                  Click or drag and drop supporting proof file
                </p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Screenshots, transaction records, communications, or PDF reports
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="p-2 bg-indigo-500/15 text-indigo-400 rounded-lg border border-indigo-500/30 shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{proofFile.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{formatFileSize(proofFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProofFile(null)}
                  className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                  aria-label="Remove supporting proof"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Informational Guidance */}
            <div className="p-3 bg-zinc-950/80 border border-zinc-800/80 rounded-lg flex items-start space-x-2 text-[11px] text-zinc-400 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Intake Guidance:</strong> Supporting proof is informal intake material to help investigators understand the incident during initial triage. It is stored securely but does not automatically become formal blockchain-anchored evidence.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <Link
              to="/complaints"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Submitting Report...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
