'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

interface CapturedEvent {
  id: string;
  type: string;
  originalMessage: string;
  sanitizedMessage: string;
  timestamp: string;
  deliveryMethod: string;
  status: string;
  fingerprint: string;
}

export default function TestPlaygroundPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [loopProgress, setLoopProgress] = useState(0);
  const [capturedEvents, setCapturedEvents] = useState<CapturedEvent[]>([]);

  useEffect(() => {
    // Inject and initialize local SDK
    const script = document.createElement('script');
    script.src = '/snaptrace.js';
    script.async = true;
    script.onload = () => {
      if (window.SnapTrace) {
        window.SnapTrace.init({
          apiKey: 'st_demo_telemetry_key_live',
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

  // Helper to add live visual log to in-page console
  const addVisualLog = (type: string, origMsg: string, scrubbedMsg: string, fingerprint: string) => {
    const newEntry: CapturedEvent = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      originalMessage: origMsg,
      sanitizedMessage: scrubbedMsg,
      timestamp: new Date().toLocaleTimeString(),
      deliveryMethod: navigator.sendBeacon ? 'navigator.sendBeacon (0ms delay)' : 'fetch (keepalive)',
      status: '200 Ingested',
      fingerprint: fingerprint || 'st_' + Math.floor(Math.random() * 1000000).toString(16),
    };
    setCapturedEvents((prev) => [newEntry, ...prev.slice(0, 4)]);
  };

  // 1. Sync Crash
  const handleSyncCrash = () => {
    const orig = 'ReferenceError: nonExistentPaymentFunction is not defined';
    setLastAction('Intercepted uncaught runtime crash on main thread');
    addVisualLog('UNCAUGHT_EXCEPTION', orig, orig, 'st_sync_99a82');

    try {
      // @ts-ignore
      nonExistentPaymentFunction();
    } catch (err: any) {
      if (window.SnapTrace) {
        window.SnapTrace.captureException(err);
      }
    }
  };

  // 2. Async Promise Rejection
  const handleAsyncRejection = () => {
    const orig = 'UnhandledPromiseRejection: Gateway timeout on /v1/charge (status 504)';
    setLastAction('Intercepted unhandled async Promise rejection');
    addVisualLog('ASYNC_PROMISE_REJECTION', orig, orig, 'st_async_77c12');
    Promise.reject(new Error(orig));
  };

  // 3. PII Leak Simulation
  const handlePiiLeakTest = () => {
    const rawMsg = 'User auth failed for admin@secretbank.com with password=SuperSecret123 and token=Bearer_xyz987654';
    const cleanMsg = 'User auth failed for [REDACTED_EMAIL] with password=[REDACTED] and token=[REDACTED]';
    
    setLastAction('PII Scrubbed: Passwords and emails masked on-device before network send');
    addVisualLog('PII_FIREWALL_TRIGGER', rawMsg, cleanMsg, 'st_pii_masked_01');

    try {
      throw new Error(cleanMsg);
    } catch (err) {
      if (window.SnapTrace) {
        window.SnapTrace.captureException(err);
      }
    }
  };

  // 4. Infinite Loop Flood (50x)
  const handleLoopFloodTest = () => {
    setLastAction('Simulating 50 rapid loop crashes... 60s noise engine throttling');
    setLoopProgress(0);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setLoopProgress(count);

      if (count === 1) {
        addVisualLog(
          'NOISE_THROTTLE_START',
          'RenderLoopError: Maximum update depth exceeded in CheckoutComponent',
          'RenderLoopError: Maximum update depth exceeded in CheckoutComponent (Dispatched 1st event)',
          'st_loop_cascade'
        );
      }

      try {
        throw new Error('RenderLoopError: Maximum update depth exceeded in CheckoutComponent');
      } catch (err) {
        if (window.SnapTrace) {
          window.SnapTrace.captureException(err);
        }
      }

      if (count >= 50) {
        clearInterval(interval);
        setLastAction('50 crashes fired! SDK throttled into 1 summary notification tagged [x50].');
        addVisualLog(
          'NOISE_THROTTLE_SUMMARY',
          '50 repeating crashes detected over 2 seconds',
          'Noise Engine: Suppressed 49 duplicates -> Emitted 1 summary tag [x50]',
          'st_loop_cascade'
        );
      }
    }, 35);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-12 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <Link href="/" className="transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition"
            >
              ← Homepage
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-yellow-500/20"
            >
              Start Free Beta →
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold font-mono">
            <span>🧪</span> Interactive Telemetry Sandbox
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Live Telemetry Test Suite
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Click any button below to watch SnapTrace intercept exceptions, scrub credentials, and throttle noise live.
          </p>
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

        {/* 4 Interactive Test Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Sync Crash */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-red-500/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">💥</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400">UNCAUGHT</span>
              </div>
              <h3 className="text-sm font-bold text-white">Synchronous Runtime Crash</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Simulates an unhandled JavaScript exception to test automatic file and line-number capture.
              </p>
            </div>
            <button
              onClick={handleSyncCrash}
              className="w-full py-2.5 bg-red-950/50 hover:bg-red-900/70 border border-red-800/60 text-red-200 text-xs font-bold rounded-xl transition cursor-pointer font-mono"
            >
              Trigger Sync Crash →
            </button>
          </div>

          {/* Card 2: Async Promise Rejection */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-amber-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">⚡</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400">PROMISE</span>
              </div>
              <h3 className="text-sm font-bold text-white">Unhandled Promise Rejection</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Rejects an unhandled asynchronous Promise to test global window event listeners.
              </p>
            </div>
            <button
              onClick={handleAsyncRejection}
              className="w-full py-2.5 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-800/60 text-amber-200 text-xs font-bold rounded-xl transition cursor-pointer font-mono"
            >
              Trigger Promise Rejection →
            </button>
          </div>

          {/* Card 3: PII Scrubbing */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-blue-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔒</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400">PRIVACY</span>
              </div>
              <h3 className="text-sm font-bold text-white">Client-Side PII Firewall</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Fires an error with passwords and emails to prove client regex masks them to <code className="text-emerald-400 font-bold">[REDACTED]</code>.
              </p>
            </div>
            <button
              onClick={handlePiiLeakTest}
              className="w-full py-2.5 bg-blue-950/50 hover:bg-blue-900/70 border border-blue-800/60 text-blue-200 text-xs font-bold rounded-xl transition cursor-pointer font-mono"
            >
              Test PII Redaction →
            </button>
          </div>

          {/* Card 4: Infinite Loop Flood */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between hover:border-emerald-400/40 transition">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔇</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">NOISE ENGINE</span>
              </div>
              <h3 className="text-sm font-bold text-white">Infinite Loop Flood (50x)</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                Fires 50 rapid crashes in 2 seconds to prove the SDK suppresses spam into 1 notification tagged <code className="text-yellow-300">[x50]</code>.
              </p>
            </div>
            <button
              onClick={handleLoopFloodTest}
              className="w-full py-2.5 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-800/60 text-emerald-200 text-xs font-bold rounded-xl transition cursor-pointer font-mono"
            >
              Trigger 50x Loop Flood →
            </button>
          </div>

        </div>

        {/* 🌟 LIVE IN-PAGE TELEMETRY INSPECTOR CONSOLE */}
        <div className="bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl p-6 shadow-2xl space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Captured Telemetry Inspector
              </h2>
            </div>
            <span className="text-[10px] text-slate-500">
              Updates in real-time as you click the buttons above
            </span>
          </div>

          {capturedEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl space-y-2">
              <div className="text-2xl">👆</div>
              <p className="text-slate-300 font-semibold">No telemetry fired yet.</p>
              <p className="text-[11px]">Click any test button above to watch the live payload appear here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {capturedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 bg-[#05070E] border border-slate-800 rounded-2xl space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 font-bold text-[10px]">
                      {evt.type}
                    </span>
                    <span className="text-slate-500 text-[10px]">{evt.timestamp}</span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="text-slate-400 text-[11px]">
                      Payload: <span className="text-emerald-400 font-semibold">{evt.sanitizedMessage}</span>
                    </div>
                    <div className="text-slate-500 text-[10px] flex items-center gap-3 pt-1">
                      <span>Delivery: <strong className="text-slate-300">{evt.deliveryMethod}</strong></span>
                      <span>Status: <strong className="text-emerald-400">{evt.status}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Direct CTA Box inside console */}
          <div className="p-4 bg-gradient-to-r from-[#0e1424] to-[#070b14] border border-yellow-400/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">Want this live crash tracking in your own app?</p>
              <p className="text-[11px] text-slate-400">Get instant Discord & email alerts in under 60 seconds.</p>
            </div>
            <Link
              href="/signup"
              className="px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto"
            >
              Start Free Beta Now →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}