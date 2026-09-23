'use client';

import { useState, useEffect, useMemo } from 'react';
import { parseStackTrace, ParsedFrame } from '@/lib/stackParser';
import Link from 'next/link';
import {
  Layers,
  History,
  Sparkles,
  Terminal,
  Copy,
  Check,
  X,
  Pencil,
  Trash2,
  Globe,
  Cpu,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  FileCode,
  Key,
} from 'lucide-react';
import SnapTraceLoading from '@/components/SnapTraceLoading';

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

// GitHub SVG Icon for crisp Linear/Vercel dark branding
function GitHubIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// GitHub-Style Git Diff & Markdown Code Block Formatter
function AiDiffViewer({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1 font-mono text-xs leading-relaxed selection:bg-zinc-800">
      {lines.map((line, idx) => {
        const isAdded = line.trim().startsWith('+');
        const isRemoved = line.trim().startsWith('-');
        const isHeader = line.trim().startsWith('###') || line.trim().startsWith('##');
        const isCodeFence = line.trim().startsWith('```');

        if (isAdded) {
          return (
            <div
              key={idx}
              className="bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500 px-3 py-1 rounded-r flex items-start gap-2"
            >
              <span className="select-none text-emerald-500/70 font-mono text-[11px] w-3 shrink-0">+</span>
              <span className="break-all">{line.replace(/^\+/, '')}</span>
            </div>
          );
        }

        if (isRemoved) {
          return (
            <div
              key={idx}
              className="bg-rose-500/10 text-rose-300 border-l-2 border-rose-500 px-3 py-1 rounded-r flex items-start gap-2"
            >
              <span className="select-none text-rose-500/70 font-mono text-[11px] w-3 shrink-0">-</span>
              <span className="break-all">{line.replace(/^-/, '')}</span>
            </div>
          );
        }

        if (isHeader) {
          return (
            <div
              key={idx}
              className="font-semibold text-zinc-100 pt-3 pb-1 border-b border-zinc-800/80 font-mono text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span className="text-zinc-500">#</span>
              <span>{line.replace(/#/g, '').trim()}</span>
            </div>
          );
        }

        if (isCodeFence) {
          return (
            <div key={idx} className="text-zinc-500 text-[10px] font-mono py-0.5 select-none">
              {line}
            </div>
          );
        }

        return (
          <div key={idx} className="text-zinc-300 py-0.5 whitespace-pre-wrap font-sans text-xs">
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
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedFrameIndex, setCopiedFrameIndex] = useState<number | null>(null);
  const [stackFilter, setStackFilter] = useState<'all' | 'app'>('all');

  const [currentRepo, setCurrentRepo] = useState<string>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('snaptrace_github_repo') || '' : '';
  });

  const [mountedTime] = useState(() => Date.now());
  const rawStack = log.stack_trace || log.stack || '';
  const parsedFrames: ParsedFrame[] = useMemo(() => parseStackTrace(rawStack), [rawStack]);
  const logTime = useMemo(() => new Date(log.created_at || mountedTime), [log.created_at, mountedTime]);

  // Relative time helper
  const relativeTime = useMemo(() => {
    const diffMs = mountedTime - logTime.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  }, [logTime, mountedTime]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Identify Vendor / Internal vs Application frames
  const isVendorFrame = (frame: ParsedFrame) => {
    const f = frame.fileName.toLowerCase();
    return (
      f.includes('node_modules') ||
      f.includes('node:') ||
      f.includes('internal/') ||
      f.includes('webpack-internal:') ||
      frame.functionName === 'anonymous'
    );
  };

  const filteredFrames = useMemo(() => {
    if (stackFilter === 'app') {
      const appFrames = parsedFrames.filter((f) => !isVendorFrame(f));
      return appFrames.length > 0 ? appFrames : parsedFrames;
    }
    return parsedFrames;
  }, [parsedFrames, stackFilter]);

  // Extract Error Name and Message
  const { errorType, errorDetail } = useMemo(() => {
    const msg = log.message || '';
    const colonIdx = msg.indexOf(':');
    if (colonIdx > 0 && colonIdx < 35 && !msg.slice(0, colonIdx).includes(' ')) {
      return {
        errorType: msg.slice(0, colonIdx),
        errorDetail: msg.slice(colonIdx + 1).trim(),
      };
    }
    return {
      errorType: 'Exception',
      errorDetail: msg,
    };
  }, [log.message]);

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

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(log.message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyUrl = () => {
    if (!log.url) return;
    navigator.clipboard.writeText(log.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyFramePath = (frame: ParsedFrame, index: number) => {
    const text = frame.lineNumber
      ? `${frame.fileName}:${frame.lineNumber}${frame.columnNumber ? `:${frame.columnNumber}` : ''}`
      : frame.fileName;
    navigator.clipboard.writeText(text);
    setCopiedFrameIndex(index);
    setTimeout(() => setCopiedFrameIndex(null), 2000);
  };

  const sanitizeRepoName = (input: string) => {
    let cleaned = input.trim();
    cleaned = cleaned.replace(/\/+$/, '');
    cleaned = cleaned.replace(/^https?:\/\/github\.com\//i, '');
    return cleaned;
  };

  // Change or reset GitHub Repository
  const handleEditRepo = (e: React.MouseEvent) => {
    e.stopPropagation();
    const userRepo = prompt(
      'Enter your GitHub repository in the format "username/repository-name"\nExample: arxu009-alt/snaptrace-dashboard',
      currentRepo || 'arxu009-alt/snaptrace-dashboard'
    );
    if (userRepo !== null) {
      const cleaned = sanitizeRepoName(userRepo);
      if (!cleaned.includes('/')) {
        alert('Invalid format! You must include both your username and repository name separated by a slash (e.g. arxu009-alt/snaptrace-dashboard).');
        return;
      }
      localStorage.setItem('snaptrace_github_repo', cleaned);
      setCurrentRepo(cleaned);
    }
  };

  const handleOpenGitHubIssue = () => {
    let repo = currentRepo;

    if (!repo || !repo.includes('/')) {
      const userRepo = prompt(
        'Enter your GitHub repository in the format "username/repository-name"\nExample: arxu009-alt/snaptrace-dashboard'
      );
      if (!userRepo || !userRepo.trim()) return;
      repo = sanitizeRepoName(userRepo);
      if (!repo.includes('/')) {
        alert('Invalid format! You must include both your username and repository name separated by a slash (e.g. arxu009-alt/snaptrace-dashboard).');
        return;
      }
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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during AI analysis.';
      setAiError(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-[9999] animate-in fade-in duration-200 font-sans"
    >
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-black/90 overflow-hidden relative z-10 ring-1 ring-white/[0.08]">
        
        {/* Subtle Ambient Top Accent Glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent pointer-events-none" />

        {/* ========================================================================= */}
        {/* MODAL HEADER: Environment, Event ID, Action Buttons & Error Title         */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 border-b border-zinc-800/80 bg-zinc-950 flex flex-col gap-4">
          
          {/* Top Bar: Badges + Toolbar Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Left Badges: Environment & Event Info */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-medium uppercase tracking-wider ${
                  log.environment === 'production'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : log.environment === 'development'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    log.environment === 'production'
                      ? 'bg-rose-500 animate-pulse'
                      : log.environment === 'development'
                      ? 'bg-amber-500'
                      : 'bg-zinc-400'
                  }`}
                />
                {log.environment || 'production'}
              </span>

              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-800/80 rounded-md text-[11px] font-mono">
                Event #{log.id}
              </span>

              <span className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
                <span>•</span>
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>{relativeTime}</span>
              </span>
            </div>

            {/* Right Actions: Linear / Vercel Precision Toolbar */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              
              {/* GitHub Issue Button with Quick Repo Picker */}
              <div className="inline-flex items-center rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm transition hover:border-zinc-700">
                <button
                  type="button"
                  onClick={handleOpenGitHubIssue}
                  className="px-3 py-1.5 hover:bg-zinc-800/80 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer rounded-l-lg active:scale-95"
                  title={`Create issue on: ${currentRepo || 'Click pencil to set repo'}`}
                >
                  <GitHubIcon className="w-3.5 h-3.5 text-zinc-300" />
                  <span>GitHub Issue</span>
                </button>
                <button
                  type="button"
                  onClick={handleEditRepo}
                  className="px-2.5 py-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-l border-zinc-800 text-xs transition rounded-r-lg cursor-pointer"
                  title={`Current repo: ${currentRepo || 'None'}. Click to configure.`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              {/* Copy for Cursor / Claude Button */}
              <button
                type="button"
                onClick={handleCopyForCursor}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                title="Copy formatted prompt for AI code editors (Cursor / Claude)"
              >
                {copiedCursor ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">Copied Prompt</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy for Cursor</span>
                  </>
                )}
              </button>

              {/* AI Diagnosis CTA Button */}
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm shadow-white/5"
                title="Run BYOK Automated Root Cause & Patch Diagnosis"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                <span>AI Diagnosis</span>
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs transition cursor-pointer active:scale-95"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Message & Type Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wide bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {errorType}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Runtime Exception
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100 font-mono break-words leading-relaxed select-text">
                {errorDetail || log.message}
              </h2>
            </div>

            {/* Quick Copy Error Message Button */}
            <button
              type="button"
              onClick={handleCopyMessage}
              className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg border border-transparent hover:border-zinc-700 text-xs transition cursor-pointer shrink-0"
              title="Copy error message"
            >
              {copiedMessage ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* METADATA METRICS STRIP: Trigger Route, Telemetry Sensor, Time & Origin     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 sm:p-4 bg-zinc-950/60 border-b border-zinc-800/80 text-xs font-mono">
          
          {/* Card 1: Trigger Route */}
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/70 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-zinc-400" />
                Route
              </span>
              {log.url && (
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="hover:text-zinc-200 transition cursor-pointer"
                  title="Copy URL"
                >
                  {copiedUrl ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                </button>
              )}
            </div>
            <span className="text-zinc-200 truncate block mt-1 text-xs" title={log.url || 'N/A'}>
              {log.url || 'Internal / Background Task'}
            </span>
          </div>

          {/* Card 2: Telemetry Agent */}
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/70 flex flex-col justify-between">
            <div className="flex items-center text-[10px] text-zinc-500 uppercase tracking-widest font-medium gap-1">
              <Cpu className="w-3 h-3 text-zinc-400" />
              Sensor
            </div>
            <span className="text-zinc-200 truncate block mt-1 text-xs" title={log.user_agent || 'SnapTrace <5KB SDK'}>
              {log.user_agent || 'SnapTrace SDK'}
            </span>
          </div>

          {/* Card 3: Captured At */}
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/70 flex flex-col justify-between">
            <div className="flex items-center text-[10px] text-zinc-500 uppercase tracking-widest font-medium gap-1">
              <Clock className="w-3 h-3 text-zinc-400" />
              Captured At
            </div>
            <span className="text-zinc-200 block mt-1 text-xs" title={logTime.toISOString()}>
              {logTime.toLocaleTimeString()}
            </span>
          </div>

          {/* Card 4: Crash Origin */}
          <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/70 flex flex-col justify-between">
            <div className="flex items-center text-[10px] text-zinc-500 uppercase tracking-widest font-medium gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Crash Origin
            </div>
            <span
              className="text-rose-300 truncate block mt-1 text-xs"
              title={parsedFrames[0] ? `${parsedFrames[0].fileName}:${parsedFrames[0].lineNumber}` : 'Unknown'}
            >
              {parsedFrames[0] ? `${parsedFrames[0].functionName}()` : 'Top-level Script'}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION: Segmented linear tab switcher                             */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-4 sm:px-6 text-xs font-mono">
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Tab 1: Formatted Stack */}
            <button
              type="button"
              onClick={() => setActiveTab('stack')}
              className={`py-3 px-3 transition flex items-center gap-2 cursor-pointer border-b-2 font-medium text-xs ${
                activeTab === 'stack'
                  ? 'border-zinc-100 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stack Trace</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] ${
                  activeTab === 'stack' ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {parsedFrames.length}
              </span>
            </button>

            {/* Tab 2: Breadcrumbs */}
            <button
              type="button"
              onClick={() => setActiveTab('breadcrumbs')}
              className={`py-3 px-3 transition flex items-center gap-2 cursor-pointer border-b-2 font-medium text-xs ${
                activeTab === 'breadcrumbs'
                  ? 'border-zinc-100 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Breadcrumbs</span>
            </button>

            {/* Tab 3: AI Diagnosis */}
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`py-3 px-3 transition flex items-center gap-2 cursor-pointer border-b-2 font-medium text-xs ${
                activeTab === 'ai'
                  ? 'border-zinc-100 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span>AI Diagnosis</span>
              {aiAnalysis && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Tab 4: Raw Trace */}
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`py-3 px-3 transition flex items-center gap-2 cursor-pointer border-b-2 font-medium text-xs ${
                activeTab === 'raw'
                  ? 'border-zinc-100 text-zinc-100'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Raw Trace</span>
            </button>
          </div>

          {/* Quick tab contextual filter/stats */}
          {activeTab === 'stack' && parsedFrames.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
              <span className="text-zinc-500">Filter:</span>
              <button
                type="button"
                onClick={() => setStackFilter('all')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  stackFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-200 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStackFilter('app')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${
                  stackFilter === 'app'
                    ? 'bg-zinc-800 text-zinc-200 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                App Code
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENT BODY                                                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-zinc-950 font-mono">
          
          {/* --------------------------------------------------------------------- */}
          {/* TAB 1: FORMATTED STACK TRACE                                          */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'stack' && (
            <div className="space-y-3">
              {parsedFrames.length === 0 ? (
                <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center text-zinc-400 text-xs space-y-2">
                  <FileCode className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-zinc-300 font-medium">No stack frames detected</p>
                  <p className="text-zinc-500 text-[11px] font-sans">
                    {rawStack || 'Stack trace payload was not provided with this telemetry event.'}
                  </p>
                </div>
              ) : (
                filteredFrames.map((frame, idx) => {
                  const isCrashOrigin = idx === 0 && stackFilter === 'all';
                  const isVendor = isVendorFrame(frame);

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs transition relative group ${
                        isCrashOrigin
                          ? 'bg-gradient-to-r from-rose-950/20 via-zinc-900/60 to-zinc-950 border-rose-500/40 shadow-sm'
                          : isVendor
                          ? 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700/80 opacity-80 hover:opacity-100'
                          : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono font-semibold text-xs truncate ${
                              isCrashOrigin ? 'text-rose-400' : isVendor ? 'text-zinc-400' : 'text-zinc-100'
                            }`}
                          >
                            {frame.functionName}()
                          </span>

                          {isCrashOrigin && (
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono font-medium rounded tracking-wider uppercase shrink-0">
                              Crash Origin
                            </span>
                          )}

                          {isVendor && !isCrashOrigin && (
                            <span className="px-1.5 py-0.2 bg-zinc-900 text-zinc-500 border border-zinc-800 text-[9px] font-mono rounded tracking-wider uppercase shrink-0">
                              Vendor / Node
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {frame.lineNumber && (
                            <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-800 rounded text-[11px] font-mono">
                              Line {frame.lineNumber}:{frame.columnNumber || 0}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyFramePath(frame, idx)}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Copy frame path"
                          >
                            {copiedFrameIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-zinc-400 truncate mt-1.5 font-sans flex items-center gap-1.5">
                        <span className="text-zinc-600 select-none">at</span>
                        <code className="text-zinc-300 font-mono text-[11px] truncate">{frame.fileName}</code>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 2: TELEMETRY BREADCRUMBS                                          */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'breadcrumbs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 text-[11px] text-zinc-400 font-sans">
                <span className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Chronological telemetry timeline prior to incident</span>
                </span>
                <span className="text-emerald-400 font-medium font-mono flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Sensor Feed
                </span>
              </div>

              <div className="relative border-l border-zinc-800 ml-4 space-y-4 py-2">
                
                {/* Step 1: Route Mount */}
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-400">
                    1
                  </div>
                  <div className="p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="text-zinc-300 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-zinc-400" />
                        Navigation
                      </span>
                      <span className="text-zinc-400">-4.0s</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-mono">
                      Route mounted:{' '}
                      <code className="text-zinc-100 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                        {log.url || '/'}
                      </code>
                    </p>
                  </div>
                </div>

                {/* Step 2: Telemetry Sensor Boot */}
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-400">
                    2
                  </div>
                  <div className="p-3.5 bg-zinc-900/40 border border-zinc-800/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span className="text-zinc-300 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                        <Cpu className="w-3 h-3 text-zinc-400" />
                        Client Sensor
                      </span>
                      <span className="text-zinc-400">-2.0s</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans">
                      SnapTrace lightweight telemetry initialized &bull; Zero Core Web Vitals penalty
                    </p>
                  </div>
                </div>

                {/* Step 3: Fatal Crash Occurrence */}
                <div className="relative pl-6">
                  <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-[9px] text-rose-400 font-bold">
                    !
                  </div>
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/30 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        Fatal Crash Trigger
                      </span>
                      <span className="text-rose-300/80 font-mono">0.0s (Crash Event)</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-100 break-words font-mono">
                      {log.message}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Origin:{' '}
                      <code className="text-zinc-300 font-mono text-[11px]">
                        {parsedFrames[0]?.fileName || 'Execution Stack'}
                      </code>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 3: AI DIAGNOSIS COPILOT                                           */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              
              {/* State A: Loading Diagnosis */}
              {aiLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-4 bg-zinc-900/20 border border-zinc-800/80 rounded-xl">
                  <SnapTraceLoading size="md" text="Analyzing crash telemetry with AI Copilot..." />
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono pt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-ping" />
                    <span>Correlating runtime stack with root-cause patterns</span>
                  </div>
                </div>
              ) : aiError === 'NO_KEY' ? (
                /* State B: No API Key Configured */
                <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-xl text-center space-y-4 font-sans">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-300">
                    <Key className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      BYOK AI Copilot API Key Required
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Configure your free <strong className="text-zinc-200">Google Gemini Key</strong> or OpenAI key in Settings to unlock automated root-cause analysis and code fixes.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/settings"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-semibold transition shadow-sm active:scale-95"
                    >
                      <span>Open Settings to Paste Key</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : aiError ? (
                /* State C: AI Diagnosis Error */
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>AI Diagnosis Failed</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">{aiError}</p>
                </div>
              ) : aiAnalysis ? (
                /* State D: Diagnosis & Diff Results */
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-4 font-sans">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                        AI Root-Cause Diagnosis & Fix
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Diagnosis Complete
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAnalyzeWithAI}
                        className="text-xs text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1 cursor-pointer font-mono"
                        title="Re-run analysis"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Re-run</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyForCursor}
                        className="text-xs text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer font-mono bg-zinc-800/80 px-2.5 py-1 rounded border border-zinc-700 hover:border-zinc-600"
                      >
                        {copiedCursor ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCursor ? 'Copied' : 'Copy for Cursor'}</span>
                      </button>
                    </div>
                  </div>

                  <AiDiffViewer text={aiAnalysis} />
                </div>
              ) : (
                /* State E: Idle State (Prior to Run) */
                <div className="p-10 text-center space-y-4 font-sans bg-zinc-900/20 border border-zinc-800/80 rounded-xl">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-200">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-zinc-100">
                      Automated Root-Cause Analysis & Code Fix
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      SnapTrace uses your configured BYOK API key (Gemini 2.5 Flash Free or OpenAI) to inspect runtime trace data, explain the crash origin, and generate a Git diff patch.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition inline-flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Start AI Diagnosis</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAB 4: RAW TRACE PAYLOAD                                              */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              {/* Terminal Title Bar */}
              <div className="flex justify-between items-center bg-zinc-900/70 border border-zinc-800 px-4 py-2.5 rounded-t-xl text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
                  </div>
                  <span className="text-zinc-400 text-xs ml-2">stack_payload.log</span>
                  <span className="text-[10px] text-zinc-600">({rawStack.length} chars)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  {copiedRaw ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-400" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>

              {/* Terminal Code Body */}
              <pre className="p-4 bg-zinc-950 border border-t-0 border-zinc-800 rounded-b-xl text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text font-mono">
                {rawStack || log.message}
              </pre>
            </div>
          )}

        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER: Delete Log Action, Keyboard Hints & Close CTA               */}
        {/* ========================================================================= */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(log.id);
                  onClose();
                }}
                className="px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-500/30 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Log</span>
              </button>
            )}
            <span className="hidden sm:inline-block text-[11px] text-zinc-600 font-mono">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">Esc</kbd> to close
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium transition cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}