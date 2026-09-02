'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import InspectErrorModal from '@/components/InspectErrorModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ExceptionLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInitialLogs() {
      setLoading(true);
      const { data } = await supabase
        .from('error_logs')
        .select('*')
        .order('id', { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    }

    loadInitialLogs();

    const realtimeChannel = supabase
      .channel('realtime-error-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs',
        },
        (payload) => {
          setLogs((prevLogs) => [payload.new, ...prevLogs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const handleResolveLog = async (id: string) => {
    await supabase.from('error_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const handleDeleteLog = async (id: string) => {
    await supabase.from('error_logs').delete().eq('id', id);
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  return (
    <div className="p-8 text-white space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Exception Logs</h1>
          <p className="text-gray-400 text-sm">Real-time error stream ingested by SnapTrace</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-400 font-semibold uppercase">Live Connection Active</span>
        </div>
      </div>

      <div className="bg-[#0f111a] border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-[#121524] text-xs text-gray-400 uppercase">
              <th className="p-4">Message</th>
              <th className="p-4">Environment</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  Loading exceptions...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  No exceptions logged yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#14182b] transition">
                  <td className="p-4 font-semibold text-gray-200">
                    {log.error_msg || log.message || 'No description'}
                  </td>
                  <td className="p-4">
                    <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {log.environment || 'production'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-md text-xs font-medium"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-md text-xs font-medium"
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

      {selectedLog && (
        <InspectErrorModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onResolve={handleResolveLog}
        />
      )}
    </div>
  );
}