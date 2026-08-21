import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Shield, Send, AlertCircle } from 'lucide-react';

export const ComplaintNew = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CYBER_CRIME');
  const [priority, setPriority] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description, category, priority }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit complaint');
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
          <h2 className="text-xl font-semibold text-white tracking-tight">File Digital Complaint</h2>
          <p className="text-xs text-zinc-400 mt-0.5">Submit an incident report into the secure intake registry.</p>
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
              placeholder="e.g. Unauthorized Database Access or Fraudulent Transaction"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none text-xs"
              >
                <option value="CYBER_CRIME">Cyber Crime</option>
                <option value="FRAUD">Fraud</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="OTHER">Other Incident</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Reported Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-100 focus:border-indigo-500 focus:outline-none text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Statement of Fact / Description</label>
            <textarea
              required
              minLength={10}
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none text-xs resize-none leading-relaxed"
              placeholder="Provide a detailed description of the incident, timeline, systems impacted, or involved parties..."
            />
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
