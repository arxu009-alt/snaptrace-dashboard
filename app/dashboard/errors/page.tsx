'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ExceptionLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProjectName, setCurrentProjectName] = useState<string>('All Projects');

  const loadLogs = useCallback(async () => {
    setLoading(true);

    // 1. Get logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 2. Get active project from switcher (localStorage)
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;

    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by selected project if available
    if (savedProjectId) {
      query = query.eq('project_id', savedProjectId);

      // Fetch project name for header
      const { data: proj } = await supabase.from('projects').select('name').eq('id', savedProjectId).single();
      if (proj) setCurrentProjectName(proj.name);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error.message);
    } else if (data) {
      setLogs(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();

    // 1. Re-fetch when user switches project in sidebar dropdown
    window.addEventListener('snaptrace_project_change', loadLogs);

    // 2. Realtime WebSocket Listener (Instant Live Feed)
    const channel = supabase
      .channel('realtime-errors-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
        },
        (payload) => {
          const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
          // If project filter matches or no filter, insert at the top of the feed instantly
          if (!savedProjectId || payload.new.project_id === savedProjectId) {
            setLogs((prevLogs) => [payload.new, ...prevLogs]);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadLogs);
      supabase.removeChannel(channel);
    };
  }, [loadLogs]);

  const handleDeleteLog = async (id: number) => {
    const { error } = await supabase.from('errors').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
    }
  };

  return (
    <div className="p-8 text-white space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exception Logs</h1>
          <p className="text-slate-400 text-sm">
            Showing real-time telemetry for <span className="text-purple-400 font-semibold">{currentProjectName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full self-start sm:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">Live Stream Active</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-800/60 text-xs text-slate-400 uppercase tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">Message</th>
              <th className="p-4">Environment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400 font-mono text-xs">
                  Loading exception stream...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                  No exceptions logged for this project yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 font-semibold truncate max-w-md">
                    {log.message || log.error_msg || 'Unknown error'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.environment === 'production'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {log.environment || 'production'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded border border-slate-700 transition cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-xs text-red-400 font-medium rounded border border-red-800/50 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-red-400 break-words">{selectedLog.message}</h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Logged at {new Date(selectedLog.created_at).toLocaleString()} • {selectedLog.environment || 'production'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 bg-slate-800 rounded"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Stack Trace
              </label>
              <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-64 whitespace-pre-wrap">
                {selectedLog.stack_trace || selectedLog.stack || 'No stack trace provided.'}
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg border border-slate-700 text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}