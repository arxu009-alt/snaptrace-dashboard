'use client';

import { useState } from 'react';

interface ErrorLog {
  id: string;
  error_msg?: string;
  message?: string;
  stack_trace?: string;
  environment?: string;
  url?: string;
  user_agent?: string;
  created_at?: string;
  status?: string;
}

export default function InspectErrorModal({
  log,
  onClose,
  onResolve,
}: {
  log: ErrorLog;
  onClose: () => void;
  onResolve: (id: string) => void;
}) {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    await onResolve(log.id);
    setIsResolving(false);
    onClose();
  };

  const errorMessage = log.error_msg || log.message || 'Unknown Error';
  const timestamp = log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f111a] border border-purple-900/50 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider">
              {log.environment || 'production'}
            </span>
            <h2 className="text-lg font-bold text-white truncate max-w-lg">{errorMessage}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="grid grid-cols-2 gap-4 bg-[#161a2e] p-4 rounded-lg border border-gray-800">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Timestamp</p>
              <p className="text-gray-200 mt-1">{timestamp}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Origin URL</p>
              <p className="text-gray-200 mt-1 truncate">{log.url || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase font-semibold">User Agent / Runtime</p>
              <p className="text-gray-300 font-mono text-xs mt-1">{log.user_agent || 'Unknown Client'}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Stack Trace</p>
            <pre className="bg-[#08090f] p-4 rounded-lg font-mono text-xs text-red-300 border border-red-900/30 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {log.stack_trace || 'No detailed stack trace recorded.'}
            </pre>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 flex justify-end gap-3 bg-[#121524]">
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition"
          >
            {isResolving ? 'Updating...' : 'Mark as Resolved'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}