'use client';

import { useState } from 'react';
import { parseStackTrace, ParsedFrame } from '@/lib/stackParser';
import Link from 'next/link';

interface ErrorLog {
  id: number;
  message: string;
  stack_trace?: string;
  stack?: string;
  environment: string;
  url?: string;
  user_agent?: string;
  created_at: string;
}

interface InspectModalProps {
  log: ErrorLog;
  onClose: () => void;
  onDelete?: (id: number) => void;
}

export default function InspectErrorModal({ log, onClose, onDelete }: InspectModalProps) {
  const [activeTab, setActiveTab] = useState<'stack' | 'ai' | 'raw'>('stack');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const rawStack = log.stack_trace || log.stack || '';
  const parsedFrames: ParsedFrame[] = parseStackTrace(rawStack);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawStack || log.message);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleAnalyzeWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setActiveTab('ai');

    try {
      const savedApiKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_openai_key') : null;

      if (!savedApiKey) {
        setAiError('NO_KEY');
        setAiLoading(false);
        return;
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert software engineer and crash diagnostic AI. Analyze the given exception and stack trace. Provide a clean 3-part response: 1. Plain English Summary, 2. Root Cause, 3. Proposed Code Fix with snippet.',
            },
            {
              role: 'user',
              content: `Error: ${log.message}\nEnvironment: ${log.environment}\nURL: ${log.url || 'N/A'}\nStack Trace:\n${rawStack}`,
            },
          ],
          temperature: 0.2,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to generate AI diagnosis');
      }

      setAiAnalysis(data.choices[0]?.message?.content || 'No analysis generated.');
    } catch (err: any) {
      setAiError(err.message || 'An unexpected error occurred during AI analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/70 gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  log.environment === 'production'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {log.environment || 'production'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Event #{log.id} • {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            <h2 className="text-base font-bold text-red-400 font-mono break-words">
              {log.message}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAnalyzeWithAI}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <span>✨</span>
              <span>Analyze with AI</span>
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Trigger URL</span>
            <span className="text-slate-200 font-mono truncate block mt-0.5" title={log.url || 'N/A'}>
              {log.url || 'N/A'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">User Agent</span>
            <span className="text-slate-200 font-mono truncate block mt-0.5" title={log.user_agent || 'Telemetry Engine'}>
              {log.user_agent || 'Telemetry Client'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">First Logged</span>
            <span className="text-slate-200 font-mono block mt-0.5">
              {new Date(log.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-6 text-xs">
          <button
            onClick={() => setActiveTab('stack')}
            className={`py-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'stack'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Formatted Stack ({parsedFrames.length} frames)
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'raw'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Trace
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✨ AI Diagnosis</span>
            {aiAnalysis && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/60">
          
          {/* 1. Formatted Stack Trace */}
          {activeTab === 'stack' && (
            <div className="space-y-2.5">
              {parsedFrames.length === 0 ? (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs font-mono">
                  {rawStack || 'No stack trace captured for this event.'}
                </div>
              ) : (
                parsedFrames.map((frame, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border font-mono text-xs transition ${
                      idx === 0
                        ? 'bg-red-950/20 border-red-500/50 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${idx === 0 ? 'text-red-400' : 'text-purple-300'}`}>
                          {frame.functionName}()
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">
                            CRASH ORIGIN
                          </span>
                        )}
                      </div>
                      {frame.lineNumber && (
                        <span className="px-2 py-0.5 bg-slate-950 text-purple-300 border border-slate-800 rounded text-[11px] font-semibold">
                          Line {frame.lineNumber}:{frame.columnNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1.5 font-mono">
                      {frame.fileName}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Raw Trace View */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Raw Stack Payload</span>
                <button
                  onClick={handleCopyRaw}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-xs transition cursor-pointer font-medium"
                >
                  {copiedRaw ? '✓ Copied' : '📋 Copy Raw Trace'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {rawStack || 'No raw stack trace provided.'}
              </pre>
            </div>
          )}

          {/* 3. AI Diagnosis View */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {aiLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-mono">Analyzing stack trace with AI...</p>
                </div>
              ) : aiError === 'NO_KEY' ? (
                <div className="p-6 bg-slate-900 border border-purple-500/30 rounded-2xl text-center space-y-3">
                  <div className="text-2xl">🔑</div>
                  <h3 className="text-sm font-bold text-white">No OpenAI API Key Configured</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Add your OpenAI API key in your Settings panel to enable instant AI bug summaries, root-cause diagnosis, and code patches.
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-purple-600/20"
                  >
                    ⚙️ Open Settings to Add Key
                  </Link>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl space-y-1">
                  <p className="text-xs font-semibold text-red-400">⚠️ AI Diagnosis Error</p>
                  <p className="text-xs text-slate-300">{aiError}</p>
                </div>
              ) : aiAnalysis ? (
                <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider border-b border-purple-500/20 pb-2">
                    <span>✨ AI Diagnosis & Code Fix</span>
                  </div>
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {aiAnalysis}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                  <p>Click "Analyze with AI" above to generate root-cause analysis and code fix recommendations.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div>
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(log.id);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Delete Log
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}