import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { ArrowLeft, UploadCloud, ShieldCheck, AlertCircle } from 'lucide-react';

export const EvidenceUpload = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('DOCUMENT');
  const [description, setDescription] = useState('');
  
  const [status, setStatus] = useState<'IDLE' | 'HASHING' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [clientHash, setClientHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const calculateHash = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file); // Note: For very large files, a chunked approach is better, but this suffices for up to ~50MB.
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        setStatus('ERROR');
        setErrorMessage('File size exceeds 50MB limit.');
        return;
      }
      setFile(selectedFile);
      setStatus('IDLE');
      setClientHash('');
      setErrorMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setStatus('HASHING');
      setErrorMessage('');
      const hash = await calculateHash(file);
      setClientHash(hash);

      setStatus('UPLOADING');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientHash', hash);
      formData.append('category', category);
      formData.append('description', description);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/v1/cases/${caseId}/evidence`, true);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setStatus('SUCCESS');
          setTimeout(() => navigate(`/cases/${caseId}`), 1500);
        } else {
          setStatus('ERROR');
          try {
            const res = JSON.parse(xhr.responseText);
            setErrorMessage(res.error || 'Upload failed');
          } catch {
            setErrorMessage('Upload failed');
          }
        }
      };

      xhr.onerror = () => {
        setStatus('ERROR');
        setErrorMessage('Network error during upload');
      };

      xhr.send(formData);
    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage(err.message || 'An error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to={`/cases/${caseId}`} className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Secure Evidence Upload</h2>
          <p className="text-sm text-zinc-400 mt-1">Upload files to the secure evidence vault. Integrity hashing happens locally.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6">
        <form onSubmit={handleUpload} className="space-y-6">
          {status === 'ERROR' && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-md text-sm flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Upload Failed</p>
                <p className="text-red-300/80 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-md text-sm flex items-start">
              <ShieldCheck className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Evidence Secured</p>
                <p className="text-emerald-300/80 mt-1">File uploaded and integrity verified successfully.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Select File</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-lg cursor-pointer bg-zinc-950/50 hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 text-zinc-500 mb-2" />
                  <p className="mb-1 text-sm text-zinc-400"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-zinc-500">Max size 50MB (Executables forbidden)</p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={status === 'HASHING' || status === 'UPLOADING' || status === 'SUCCESS'} />
              </label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-indigo-400 font-medium break-all">Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={status !== 'IDLE' && status !== 'ERROR'}
                className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="DOCUMENT">Document</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
                <option value="ARCHIVE">Archive</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={status !== 'IDLE' && status !== 'ERROR'}
              className="block w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm resize-none"
              placeholder="What does this evidence show?"
            />
          </div>

          {(status === 'HASHING' || status === 'UPLOADING') && (
            <div className="space-y-2 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex justify-between text-xs font-medium text-zinc-400">
                <span>{status === 'HASHING' ? 'Calculating local SHA-256 hash...' : 'Uploading secure payload...'}</span>
                {status === 'UPLOADING' && <span>{progress}%</span>}
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${status === 'HASHING' ? 100 : progress}%` }}></div>
              </div>
              {clientHash && (
                <p className="text-[10px] text-zinc-500 font-mono break-all mt-2">Hash: {clientHash}</p>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <button
              type="submit"
              disabled={!file || status === 'HASHING' || status === 'UPLOADING' || status === 'SUCCESS'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Secure Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
