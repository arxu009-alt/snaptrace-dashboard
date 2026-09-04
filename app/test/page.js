'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function TestPlaygroundPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [lastAction, setLastAction] = useState(null);
  const [loopProgress, setLoopProgress] = useState(0);

  useEffect(() => {
    // Load active API key from localStorage or fallback
    const savedKey = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_active_key') : null;
    const activeKey = savedKey || 'st_test_telemetry_token_demo';
    setApiKey(activeKey);

    // Inject SDK script
    const script = document.createElement('script');
    script.src = '/snaptrace.js';
    script.async = true;
    script.onload = () => {
      if (window.SnapTrace) {
        window.SnapTrace.init({
          apiKey: activeKey,
          endpoint: '/api/v1/log'
        });
        setSdkLoaded(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // 1. Sync Crash
  const handleSyncCrash = () => {
    setLastAction('Triggered standard uncaught runtime exception');
    // @ts-ignore
    nonExistentFunctionCallToSimulateCrash();
  };

  // 2. Async Promise Rejection
  const handleAsyncRejection = () => {
    setLastAction('Triggered unhandled async Promise rejection');
    Promise.reject(new Error('Async Network Timeout: Failed to fetch payment gateway status'));
  };

  // 3. PII Leak Simulation
  const handlePiiLeakTest = () => {
    setLastAction('Triggered PII leak test (check console & logs to see [REDACTED] masking!)');
    try {
      throw new Error('Authentication failed for admin@secretbank.com with password=SuperSecretPassword123 and token=Bearer_xyz987654');
    } catch (err) {
      if (window.SnapTrace) {
        window.SnapTrace.captureException(err);
      }
    }
  };

  // 4. Infinite Loop Flood (50x)
  const handleLoopFloodTest = () => {
    setLastAction('Simulating 50 rapid loop crashes... (Testing 60s noise deduplication)');
    setLoopProgress(0);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setLoopProgress(count);
      try {
        throw new Error('RenderLoopError: Maximum update depth exceeded in CheckoutComponent');
      } catch (err) {
        if (window.SnapTrace) {
          window.SnapTrace.captureException(err);
        }
      }

      if (count >= 50) {
        clearInterval(interval);
        setLastAction('Fired 50 loop crashes! SDK throttled them into 1 summary notification.');
      }
    }, 40);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-12 font-sans selection:bg-yellow-400 selection:text-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <Link href="/dashboard" className="transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <Link
            href="/dashboard/errors"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-yellow-400 font-semibold text-xs rounded-xl transition"
          >
            ← Back to Live Stream
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold font-mono">
            <span>🧪</span> SDK Interactive Simulation Playground
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Telemetry Test Suite
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Click any action below to test crash interception, PII scrubbing, and noise deduplication.
          </p>
        </div>

        {/* SDK Connection Status Banner */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold text-white uppercase font-mono">Client SDK Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                sdkLoaded
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {sdkLoaded ? '● SDK Active & Listening' : '○ Loading SDK...'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-[#05070E] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono block">Active Ingestion Key</span>
              <span className="text-yellow-300 font-mono truncate block mt-0.5">{apiKey}</span>
            </div>
            <div className="bg-[#05070E] p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono block">Ingestion Endpoint</span>
              <span className="text-slate-300 font-mono truncate block mt-0.5">POST /api/v1/log</span>
            </div>
          </div>
        </div>

        {/* Action Status Log Alert */}
        {lastAction && (
          <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono animate-in fade-in duration-150 flex items-center justify-between">
            <span>⚡ {lastAction}</span>
            {loopProgress > 0 && loopProgress < 50 && (
              <span className="text-white font-bold">{loopProgress} / 50</span>
            )}
          </div>
        )}

        {/* 4 Interactive Test Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Test 1: Sync Crash */}
          <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-red-500/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">💥</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400">UNCAUGHT</span>
              </div>
              <h3 className="text-sm font-bold text-white">Synchronous Runtime Crash</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Calls a non-existent JavaScript function to test standard browser exception interception.
              </p>
            </div>
            <button
              onClick={handleSyncCrash}
              className="w-full py-2.5 bg-red-950/50 hover:bg-red-900/70 border border-red-800/60 text-red-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Trigger Sync Crash →
            </button>
          </div>

          {/* Test 2: Async Promise Rejection */}
          <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">⚡</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">PROMISE</span>
              </div>
              <h3 className="text-sm font-bold text-white">Unhandled Promise Rejection</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Rejects an unhandled asynchronous Promise to test global unhandledrejection event listeners.
              </p>
            </div>
            <button
              onClick={handleAsyncRejection}
              className="w-full py-2.5 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-800/60 text-amber-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Trigger Promise Rejection →
            </button>
          </div>

          {/* Test 3: PII Scrubbing */}
          <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-blue-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔒</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400">PRIVACY</span>
              </div>
              <h3 className="text-sm font-bold text-white">Client-Side PII Firewall</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fires an error with passwords and emails to prove client regex scrubs it to <code className="text-emerald-400 font-mono font-bold">[REDACTED]</code>.
              </p>
            </div>
            <button
              onClick={handlePiiLeakTest}
              className="w-full py-2.5 bg-blue-950/50 hover:bg-blue-900/70 border border-blue-800/60 text-blue-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Test PII Redaction →
            </button>
          </div>

          {/* Test 4: Infinite Loop Deduplication */}
          <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-emerald-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔇</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">NOISE ENGINE</span>
              </div>
              <h3 className="text-sm font-bold text-white">Infinite Loop Flood (50x)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fires 50 rapid crashes in 2 seconds to prove the SDK suppresses spam into 1 notification with <code className="text-yellow-300 font-mono">[x50]</code>.
              </p>
            </div>
            <button
              onClick={handleLoopFloodTest}
              className="w-full py-2.5 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800/60 text-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Trigger 50x Loop Flood →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}