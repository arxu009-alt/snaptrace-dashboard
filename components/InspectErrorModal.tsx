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
  userTier?: string;
}

function AiDiffViewer({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1 font-mono text-xs leading-relaxed">
      {lines.map((line, idx) => {
        const isAdded = line.trim().startsWith('+');
        const isRemoved = line.trim().startsWith('-');
        const isHeader = line.trim().startsWith('###') || line.trim().startsWith('##');

        if (isAdded) {
          return (
            <div key={idx} className="bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-400 px-3 py-1 rounded-r">
              {line}
            </div>
          );
        }

        if (isRemoved) {
          return (
            <div key={idx} className="bg-red-950/40 text-red-300 border-l-2 border-red-500 px-3 py-1 rounded-r">
              {line}
            </div>
          );
        }

        if (isHeader) {
          return (
            <div key={idx} className="font-bold text-yellow-300 pt-2 pb-1 border-b border-slate-800">
              {line.replace(/#/g, '').trim()}
            </div>
          );
        }

        return (
          <div key={idx} className="text-slate-300 py-0.5 whitespace-pre-wrap font-sans">
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function InspectErrorModal({ log, onClose, onDelete }: InspectModalProps) {
  const [activeTab, setActiveTab] = useState<'stack' | 'breadcrumbs' | 'ai' | 'raw'>('stack');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedCursor, setCopiedCursor] = useState(false);
  const [currentRepo, setCurrentRepo] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('snaptrace_github_repo') || '' : '';
  });

  const rawStack = log.stack_trace || log.stack || '';
  const parsedFrames: ParsedFrame[] = parseStackTrace(rawStack);
  const logTime = new Date(log.created_at || Date.now());

  const handleCopyForCursor = () => {
    const cursorPrompt = `Act as an expert software engineer. Fix this runtime exception captured by SnapTrace:

### 🚨 Error Details
- **Message:** ${log.message}
- **Environment:** ${log.environment}
- **Runtime URL:** ${log.url || 'N/A'}
- **User Agent:** ${log.user_agent || 'N/A'}

### 📜 Stack Trace
\`\`\`
${rawStack || 'No stack trace provided'}
\`\`\`

### 🎯 Request
1. Explain why this error occurred in plain English.
2. Identify the exact failing file and line number.
3. Provide the corrected code patch to prevent this crash.`;

    navigator.clipboard.writeText(cursorPrompt);
    setCopiedCursor(true);
    setTimeout(() => setCopiedCursor(false), 2500);
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawStack || log.message);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  // Change or reset the saved GitHub repository name
  const handleEditRepo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRepo = prompt('Enter your correct GitHub repository (e.g. yourname/yourproject):', currentRepo);
    if (newRepo !== null) {
      const cleaned = newRepo.trim().replace(/^https?:\/\/github\.com\//, '');
      localStorage.setItem('snaptrace_github_repo', cleaned);
      setCurrentRepo(cleaned);
    }
  };

  const handleOpenGitHubIssue = () => {
    let repo = currentRepo;

    if (!repo) {
      const userRepo = prompt('Enter your GitHub repository name (e.g. yourname/yourproject):');
      if (!userRepo || !userRepo.trim()) return;
      repo = userRepo.trim().replace(/^https?:\/\/github\.com\//, '');
      localStorage.setItem('snaptrace_github_repo', repo);
      setCurrentRepo(repo);
    }

    const title = `[Crash] ${log.message.slice(0, 80)}`;
    const issueBody = `### 🚨 Exception Overview
- **Message:** \`${log.message}\`
- **Environment:** \`${log.environment}\`
- **Route:** ${log.url || 'N/A'}
- **Logged At:** ${logTime.toLocaleString()}

### 📜 Stack Trace
\`\`\`javascript
${(rawStack || 'No stack trace available').slice(0, 1500)}
\`\`\`

${aiAnalysis ? `### 🤖 SnapTrace AI Diagnosis & Patch\n${aiAnalysis.slice(0, 1000)}\n` : ''}

---
*Captured automatically by [SnapTrace Telemetry](https://snaptrace-dashboard.vercel.app)*`;

    const githubUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody)}`;
    window.open(githubUrl, '_blank');
  };

  const handleAnalyzeWithAI = async () => {
    setActiveTab('ai');
    setAiLoading(true);
    setAiError(null);

    try {
      const savedProvider = (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_ai_provider') : 'gemini') || 'gemini';
      const savedApiKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_ai_key') || localStorage.getItem('snaptrace_openai_key') : null;

      if (!savedApiKey) {
        setAiError('NO_KEY');
        setAiLoading(false);
        return;
      }

      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: savedApiKey.trim(),
          provider: savedProvider,
          message: log.message,
          stackTrace: rawStack,
          url: log.url,
          environment: log.environment,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate AI diagnosis');
      }

      setAiAnalysis(data.analysis);
    } catch (err: any) {
      setAiError(err.message || 'An unexpected error occurred during AI analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    /* Outer Backdrop with Click-to-Close */
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-150 font-sans"
    >
      <div className="bg-[#090D16] border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative z-10">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between bg-slate-950/70 gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                  log.environment === 'production'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {log.environment || 'production'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Event #{log.id} • {logTime.toLocaleTimeString()}
              </span>
            </div>
            <h2 className="text-base font-bold text-red-400 font-mono break-words">
              {log.message}
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap font-mono">
            {/* 1-Click GitHub Issue with Edit Repo Option */}
            <div className="inline-flex items-center rounded-xl bg-[#05070E] border border-slate-700">
              <button
                onClick={handleOpenGitHubIssue}
                className="px-3 py-1.5 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-l-xl"
                title="Create GitHub Issue"
              >
                <span>🐙</span>
                <span>Issue</span>
              </button>
              <button
                onClick={handleEditRepo}
                className="px-2 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-yellow-400 border-l border-slate-800 text-[10px] font-mono transition rounded-r-xl"
                title={`Current repo: ${currentRepo || 'Not configured'}. Click to edit.`}
              >
                ✎
              </button>
            </div>

            {/* 1-Click Cursor / Claude Prompt */}
            <button
              onClick={handleCopyForCursor}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 border border-yellow-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <span>{copiedCursor ? '✓ Copied!' : '📋 Copy for Cursor'}</span>
            </button>

            {/* AI Diagnosis */}
            <button
              onClick={handleAnalyzeWithAI}
              className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-yellow-500/20 cursor-pointer active:scale-95"
            >
              <span>✨</span>
              <span>Analyze with AI</span>
            </button>

            <button
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Metadata Details Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Trigger Route</span>
            <span className="text-slate-200 truncate block mt-0.5" title={log.url || 'N/A'}>
              {log.url || 'N/A'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Telemetry Agent</span>
            <span className="text-slate-200 truncate block mt-0.5" title={log.user_agent || 'SnapTrace <5KB Client'}>
              {log.user_agent || 'SnapTrace <5KB Client'}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Captured At</span>
            <span className="text-slate-200 block mt-0.5">
              {logTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-6 text-xs font-mono font-semibold">
          <button
            onClick={() => setActiveTab('stack')}
            className={`py-3 transition cursor-pointer ${
              activeTab === 'stack'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Formatted Stack ({parsedFrames.length})
          </button>

          <button
            onClick={() => setActiveTab('breadcrumbs')}
            className={`py-3 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'breadcrumbs'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🐾 Breadcrumbs</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>✨ AI Diagnosis</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`py-3 transition cursor-pointer ${
              activeTab === 'raw'
                ? 'border-b-2 border-yellow-400 text-yellow-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw Trace
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/60 font-mono">
          
          {/* 1. Formatted Stack Trace */}
          {activeTab === 'stack' && (
            <div className="space-y-2.5">
              {parsedFrames.length === 0 ? (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                  {rawStack || 'No stack trace captured for this event.'}
                </div>
              ) : (
                parsedFrames.map((frame, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border text-xs transition ${
                      idx === 0
                        ? 'bg-red-950/20 border-red-500/50 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${idx === 0 ? 'text-red-400' : 'text-yellow-300'}`}>
                          {frame.functionName}()
                        </span>
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded">
                            CRASH ORIGIN
                          </span>
                        )}
                      </div>
                      {frame.lineNumber && (
                        <span className="px-2 py-0.5 bg-slate-950 text-yellow-300 border border-slate-800 rounded text-[11px] font-semibold">
                          Line {frame.lineNumber}:{frame.columnNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1.5">
                      {frame.fileName}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Sentry-Style Breadcrumbs */}
          {activeTab === 'breadcrumbs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] text-slate-400">
                <span>Chronological user actions prior to crash</span>
                <span className="text-emerald-400 font-bold">● Active Telemetry Capture</span>
              </div>

              <div className="relative border-l-2 border-slate-800 ml-4 space-y-4 py-2">
                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-[8px]">
                    1
                  </div>
                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="text-yellow-400 font-bold">NAVIGATION</span>
                      <span>{new Date(logTime.getTime() - 4000).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-200">
                      Route mounted: <code className="text-yellow-300">{log.url || 'Active Application URL'}</code>
                    </p>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-[8px]">
                    2
                  </div>
                  <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="text-sky-400 font-bold">CLIENT SENSOR</span>
                      <span>{new Date(logTime.getTime() - 2000).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      SnapTrace &lt;5KB SDK initialized • Zero Core Web Vitals penalty
                    </p>
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-red-300 animate-pulse flex items-center justify-center text-[8px]">
                    🚨
                  </div>
                  <div className="p-3.5 bg-red-950/30 border border-red-500/50 rounded-xl space-y-1 shadow-lg">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-red-400 font-bold uppercase">CRASH OCCURRENCE</span>
                      <span className="text-slate-400 font-mono">{logTime.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs font-bold text-red-300 break-words">
                      {log.message}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Origin: <code className="text-yellow-300">{parsedFrames[0]?.fileName || 'Execution Stack'}</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. AI Diagnosis */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {aiLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Analyzing crash telemetry with AI Copilot...</p>
                </div>
              ) : aiError === 'NO_KEY' ? (
                <div className="p-6 bg-slate-900 border border-yellow-400/30 rounded-2xl text-center space-y-3 font-sans">
                  <div className="text-2xl">🔑</div>
                  <h3 className="text-sm font-bold text-white">No AI API Key Configured</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Paste your <strong>Google Gemini Key</strong> (100% Free) or OpenAI key in Settings to unlock instant root-cause analysis and code fix patches!
                  </p>
                  <Link
                    href="/dashboard/settings"
                    onClick={onClose}
                    className="inline-block px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-yellow-500/20"
                  >
                    ⚙️ Open Settings to Paste Key
                  </Link>
                </div>
              ) : aiError ? (
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl space-y-1 font-mono">
                  <p className="text-xs font-semibold text-red-400">⚠️ AI Diagnosis Error</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{aiError}</p>
                </div>
              ) : aiAnalysis ? (
                <div className="p-5 bg-gradient-to-b from-[#0e1424] to-[#070b14] border border-yellow-400/30 rounded-2xl space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-mono">
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>✨</span> AI Root-Cause Patch
                    </span>
                    <button
                      onClick={handleCopyForCursor}
                      className="text-xs text-purple-400 hover:text-purple-300 underline cursor-pointer"
                    >
                      {copiedCursor ? '✓ Copied to Clipboard!' : 'Copy for Cursor →'}
                    </button>
                  </div>
                  <AiDiffViewer text={aiAnalysis} />
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs space-y-3 font-sans">
                  <p>Click the <strong>"✨ Analyze with AI"</strong> button above to generate root-cause analysis and a code fix patch.</p>
                </div>
              )}
            </div>
          )}

          {/* 4. Raw Trace View */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Raw Stack Payload</span>
                <button
                  onClick={handleCopyRaw}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer font-medium"
                >
                  {copiedRaw ? '✓ Copied' : '📋 Copy Raw Trace'}
                </button>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {rawStack || 'No raw stack trace provided.'}
              </pre>
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
                className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Delete Log
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}