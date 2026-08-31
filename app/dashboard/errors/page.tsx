'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ErrorLog {
  id: number;
  message: string;
  stack: string | null;
  url: string | null;
  environment: string;
  created_at: string;
}

export default function ErrorFeedPage() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'development'>('all');

  useEffect(() => {
    fetchErrors();
  }, []);

  async function fetchErrors() {
    setLoading(true);
    const { data, error } = await supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setErrors(data);
    }
    setLoading(false);
  }

  async function deleteError(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase.from('errors').delete().eq('id', id);
    if (!error) {
      setErrors((prev) => prev.filter((err) => err.id !== id));
      if (selectedError?.id === id) setSelectedError(null);
    }
  }

  // Client-side filtering
  const filteredErrors = errors.filter((err) => {
    const matchesSearch =
      err.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (err.url && err.url.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (err.stack && err.stack.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEnv =
      envFilter === 'all' ? true : err.environment.toLowerCase() === envFilter;

    return matchesSearch && matchesEnv;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Exception Logs</h1>
            <p className="text-sm text-slate-400">Real-time error stream ingested by SnapTrace</p>
          </div>
          <button
            onClick={fetchErrors}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700 transition self-start sm:self-auto"
          >
            Refresh Feed
          </button>
        </div>

        {/* Controls Bar: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search error messages, URLs, or stack traces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Environment Filter Pills */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-lg self-start sm:self-auto">
            {(['all', 'production', 'development'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvFilter(env)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition ${
                  envFilter === env
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {env}
              </button>
            ))}
          </div>
        </div>

        {/* Error Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading exception logs...</div>
          ) : filteredErrors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {errors.length === 0 ? 'No errors logged yet.' : 'No matching errors found for your query.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">URL</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredErrors.map((err) => (
                    <tr key={err.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                        {new Date(err.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200 truncate max-w-xs">
                        {err.message}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            err.environment === 'production'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {err.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4 truncate max-w-xs text-slate-400 font-mono text-xs">
                        {err.url || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedError(err)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded border border-slate-700 transition"
                        >
                          Inspect
                        </button>
                        <button
                          onClick={(e) => deleteError(err.id, e)}
                          className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-xs text-red-400 font-medium rounded border border-red-800/50 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stack Trace Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-red-400">{selectedError.message}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Logged at {new Date(selectedError.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Stack Trace
                </label>
                <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-64">
                  {selectedError.stack || 'No stack trace provided.'}
                </pre>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}