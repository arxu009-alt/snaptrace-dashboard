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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Exception Logs</h1>
            <p className="text-sm text-slate-400">Real-time error stream ingested by SnapTrace</p>
          </div>
          <button
            onClick={fetchErrors}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            Refresh Feed
          </button>
        </div>

        {/* Error Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading exception logs...</div>
          ) : errors.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No errors logged yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase text-xs tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">URL</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {errors.map((err) => (
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
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedError(err)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded border border-slate-700"
                        >
                          Inspect
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