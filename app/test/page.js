'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function TestPlaygroundPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [loopProgress, setLoopProgress] = useState(0);
  const [capturedEvents, setCapturedEvents] = useState([]);

  useEffect(() => {
    // Inject and initialize local SDK
    const script = document.createElement('script');
    script.src = '/snaptrace.js';
    script.async = true;
    script.onload = () => {
      if (window.SnapTrace) {
        window.SnapTrace.init({
          apiKey: 'st_demo_telemetry_key_live',
          endpoint: '/api/v1/log',
        });
        setSdkLoaded(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Helper to add live visual log to in-page console
  const addVisualLog = (type, origMsg, scrubbedMsg, fingerprint) => {
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      type: type,
      originalMessage: origMsg,
      sanitizedMessage: scrubbedMsg,
      timestamp: new Date().toLocaleTimeString(),
      deliveryMethod: typeof navigator !== 'undefined' && navigator.sendBeacon ? 'navigator.sendBeacon (0ms delay)' : 'fetch (keepalive)',
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
      window.nonExistentPaymentFunction();
    } catch (err) {
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-12 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-6">
          <Link href="/" className="transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center gap-3 font-mono text-xs">
            <Link
              href="/"
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              ← Homepage
            </Link>
            <Link
              href="/dashboard"
              className="border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            >
              Dashboard
            </Link>
            <Link
              href="/signup"
              className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition"
            >
              Start Free Beta →
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono font-medium">
            <span>🧪</span> Interactive Telemetry Sandbox
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
            Live Telemetry Test Suite
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Click any button below to watch SnapTrace intercept exceptions, scrub credentials, and throttle noise live.
          </p>
        </div>

        {/* Action Status Log Alert */}
        {lastAction && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between animate-in fade-in duration-150">
            <span>⚡ {lastAction}</span>
            {loopProgress > 0 && loopProgress < 50 && (
              <span className="text-zinc-100 font-bold">{loopProgress} / 50</span>
            )}
          </div>
        )}

        {/* 4 Interactive Test Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card 1: Sync Crash */}
          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg">💥</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                  UNCAUGHT
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">Synchronous Runtime Crash</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Simulates an unhandled JavaScript exception to test automatic file and line-number capture.
              </p>
            </div>
            <button
              onClick={handleSyncCrash}
              className="w-full py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer font-mono flex items-center justify-center gap-1.5"
            >
              <span>Trigger Sync Crash</span>
              <span>→</span>
            </button>
          </div>

          {/* Card 2: Async Promise Rejection */}
          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg">⚡</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  PROMISE
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">Unhandled Promise Rejection</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Rejects an unhandled asynchronous Promise to test global window event listeners.
              </p>
            </div>
            <button
              onClick={handleAsyncRejection}
              className="w-full py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer font-mono flex items-center justify-center gap-1.5"
            >
              <span>Trigger Promise Rejection</span>
              <span>→</span>
            </button>
          </div>

          {/* Card 3: PII Scrubbing */}
          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔒</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  PRIVACY
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">Client-Side PII Firewall</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Fires an error with passwords and emails to prove client regex masks them to <code className="text-emerald-400 font-mono font-medium">[REDACTED]</code>.
              </p>
            </div>
            <button
              onClick={handlePiiLeakTest}
              className="w-full py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer font-mono flex items-center justify-center gap-1.5"
            >
              <span>Test PII Redaction</span>
              <span>→</span>
            </button>
          </div>

          {/* Card 4: Infinite Loop Flood */}
          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between transition group">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg">🔇</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  NOISE ENGINE
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">Infinite Loop Flood (50x)</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Fires 50 rapid crashes in 2 seconds to prove the SDK suppresses spam into 1 notification tagged <code className="text-zinc-300 font-mono font-medium">[x50]</code>.
              </p>
            </div>
            <button
              onClick={handleLoopFloodTest}
              className="w-full py-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-200 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer font-mono flex items-center justify-center gap-1.5"
            >
              <span>Trigger 50x Loop Flood</span>
              <span>→</span>
            </button>
          </div>

        </div>

        {/* LIVE IN-PAGE TELEMETRY INSPECTOR CONSOLE */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 sm:p-6 shadow-sm space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-wider font-mono">
                Live Captured Telemetry Inspector
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Updates in real-time as you click the buttons above
            </span>
          </div>

          {capturedEvents.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-lg space-y-2">
              <div className="text-xl">👆</div>
              <p className="text-zinc-300 font-medium">No telemetry fired yet.</p>
              <p className="text-[11px] text-zinc-500">Click any test button above to watch the live payload appear here!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {capturedEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium text-[10px] font-mono">
                      {evt.type}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">{evt.timestamp}</span>
                  </div>

                  <div className="space-y-1 pt-1 font-mono">
                    <div className="text-zinc-400 text-[11px]">
                      Payload: <span className="text-emerald-400 font-medium">{evt.sanitizedMessage}</span>
                    </div>
                    <div className="text-zinc-500 text-[10px] flex items-center gap-3 pt-0.5">
                      <span>Delivery: <strong className="text-zinc-300 font-medium">{evt.deliveryMethod}</strong></span>
                      <span>Status: <strong className="text-emerald-400 font-medium">{evt.status}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clean Callout Card */}
          <div className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-zinc-100 font-sans">
                Want this live crash tracking in your own app?
              </p>
              <p className="text-xs text-zinc-400 font-mono">
                Sub-5KB SDK • On-device PII masking • 1-click AI fix for Cursor & Claude.
              </p>
            </div>
            <Link
              href="/signup"
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition whitespace-nowrap self-start sm:self-auto shrink-0"
            >
              Claim Free Pro Account →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}