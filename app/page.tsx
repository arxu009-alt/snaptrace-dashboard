'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import RevealOnScroll from '@/components/RevealOnScroll';

export const dynamic = 'force-dynamic';

type StackKey = 'nextjs' | 'js' | 'python' | 'node' | 'go' | 'rust' | 'csharp' | 'php' | 'ruby' | 'kotlin' | 'flutter' | 'cloudflare';

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<StackKey>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkUserSession();
  }, [router]);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const snippets: Record<StackKey, string> = {
    nextjs: `// app/layout.tsx (Next.js App Router)
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
          strategy="beforeInteractive"
          data-api-key="sk_live_your_project_key"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    js: `<!-- React, Vue, Svelte, or Vanilla JavaScript -->
<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="sk_live_your_project_key"
  async
></script>`,
    python: `# Python / Django / FastAPI / Flask
import traceback, requests

def log_to_snaptrace(exception, url="https://api.mycompany.com"):
    try:
        requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={
            "apiKey": "sk_live_your_project_key",
            "message": str(exception),
            "stackTrace": traceback.format_exc(),
            "url": url,
            "environment": "production"
        }, timeout=2)
    except Exception:
        pass`,
    node: `// Node.js / Express / NestJS
process.on('uncaughtException', (err) => {
  fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: 'sk_live_your_project_key',
      message: err.message,
      stackTrace: err.stack,
      environment: process.env.NODE_ENV || 'production'
    })
  }).catch(() => {});
});`,
    go: `// Go (Golang) Crash Reporter
package main

import (
  "bytes"
  "encoding/json"
  "net/http"
)

func SendSnapTrace(err error, route string) {
  payload, _ := json.Marshal(map[string]string{
    "apiKey":      "sk_live_your_project_key",
    "message":     err.Error(),
    "environment": "production",
    "url":         route,
  })
  http.Post("https://snaptrace-dashboard.vercel.app/api/v1/log", "application/json", bytes.NewBuffer(payload))
}`,
    rust: `// Rust / Axum / Actix-web
async fn capture_snaptrace(err: &str, route: &str) {
    let payload = serde_json::json!({
        "apiKey": "sk_live_your_project_key",
        "message": err,
        "url": route,
        "environment": "production"
    });
    let _ = reqwest::Client::new()
        .post("https://snaptrace-dashboard.vercel.app/api/v1/log")
        .json(&payload)
        .send()
        .await;
}`,
    csharp: `// C# / ASP.NET Core
public static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {
    var payload = new {
        apiKey = "sk_live_your_project_key",
        message = ex.Message,
        stackTrace = ex.StackTrace,
        url = url,
        environment = "production"
    };
    await new HttpClient().PostAsJsonAsync("https://snaptrace-dashboard.vercel.app/api/v1/log", payload);
}`,
    php: `<?php
// PHP / Laravel / WordPress
set_exception_handler(function ($e) {
    $ch = curl_init('https://snaptrace-dashboard.vercel.app/api/v1/log');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'apiKey' => 'sk_live_your_project_key',
        'message' => $e->getMessage(),
        'stackTrace' => $e->getTraceAsString(),
        'environment' => 'production'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
});
?>`,
    ruby: `# Ruby on Rails / Sinatra
def send_snaptrace_alert(exception)
  uri = URI('https://snaptrace-dashboard.vercel.app/api/v1/log')
  Net::HTTP.post(uri, {
    apiKey: 'sk_live_your_project_key',
    message: exception.message,
    stackTrace: exception.backtrace&.join("\\n"),
    environment: 'production'
  }.to_json, "Content-Type" => "application/json") rescue nil
end`,
    kotlin: `// Kotlin / Android / Java (OkHttp)
fun sendSnapTrace(e: Throwable, context: String = "Android App") {
    val json = JSONObject().apply {
        put("apiKey", "sk_live_your_project_key")
        put("message", e.localizedMessage ?: "Unknown Error")
        put("environment", "production")
        put("url", context)
    }
    // Asynchronous POST dispatch to https://snaptrace-dashboard.vercel.app/api/v1/log
}`,
    flutter: `// Flutter / Dart Crash Handler
void captureSnapTrace(Object error, StackTrace stack) {
  http.post(
    Uri.parse('https://snaptrace-dashboard.vercel.app/api/v1/log'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'apiKey': 'sk_live_your_project_key',
      'message': error.toString(),
      'stackTrace': stack.toString(),
      'environment': 'production'
    }),
  );
}`,
    cloudflare: `// Cloudflare Workers / Serverless Edge
export default {
  async fetch(req, env, ctx) {
    try {
      return await handleRequest(req);
    } catch (err) {
      ctx.waitUntil(fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'sk_live_your_project_key',
          message: err.message,
          stackTrace: err.stack,
          environment: 'production'
        })
      }));
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeQuickTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyCursorDemo = () => {
    const promptText = `Act as an expert software engineer. Fix this runtime exception captured by SnapTrace:
Error: ReferenceError: Connection pool exhausted at 10:00:00 PM
File: C:\\app\\database.js:18:11
Provide a plain English diagnosis and the exact corrected code patch.`;
    navigator.clipboard.writeText(promptText);
    setCopiedCursorPrompt(true);
    setTimeout(() => setCopiedCursorPrompt(false), 2500);
  };

  const faqs = [
    {
      q: 'Do I need to keep the SnapTrace website open to receive alerts?',
      a: 'No! The SnapTrace SDK runs silently inside your live application. When an unhandled exception or crash happens in production, SnapTrace catches it and immediately pings your configured Discord channel and Gmail inbox with the exact error details and stack trace in milliseconds.'
    },
    {
      q: 'How does SnapTrace integrate with VS Code, Cursor, and AI coding agents?',
      a: 'When an exception occurs, SnapTrace provides a 1-click "Copy for Cursor / AI" button inside the Inspect modal. It generates an AI-optimized prompt containing the runtime environment, error message, and stack frames, ready to paste into Cursor, VS Code Copilot, or Claude Code for instant local code fixes.'
    },
    {
      q: 'What languages and frameworks does SnapTrace support?',
      a: 'SnapTrace uses a universal, lightweight REST telemetry endpoint. We provide drop-in snippets for Next.js (App Router & Pages Router), JavaScript, React, Vue, Svelte, Node.js, Python, Go, Rust, C# (.NET), PHP (Laravel, WordPress), Ruby, Kotlin, Java, Flutter, Cloudflare Workers, and raw cURL/Bash.'
    },
    {
      q: 'How does SnapTrace maintain a <5KB bundle size with 0ms delay?',
      a: 'Unlike legacy APMs that bundle 100KB+ of heavy performance profilers and session serializers, SnapTrace is focused strictly on crash telemetry, client-side PII regex scrubbing, and asynchronous beacon delivery via navigator.sendBeacon. It never delays page hydration or blocks Google Core Web Vitals.'
    },
    {
      q: 'What is the 60-second noise deduplication engine?',
      a: 'If a broken React component re-renders infinitely or a failing database query fires 500 times in 10 seconds, SnapTrace hashes the error into a deterministic fingerprint. It sends the 1st crash instantly, silences duplicate alerts, and delivers 1 clean summary notification tagged [x500].'
    },
    {
      q: 'How does the on-device Client-Side PII Firewall protect data?',
      a: 'Before an error payload ever leaves the user\'s browser, an on-device regex filter scans error messages and URLs for emails, 16-digit credit cards, auth tokens (apiKey=...), and passwords (password=...), replacing them with [REDACTED] tokens on the client.'
    },
    {
      q: 'How does the limited-time Beta promotion work?',
      a: 'All developers who sign up during our Public Beta receive automatic, grandfathered Lifetime Pro access with 150,000 monthly events and full in-dashboard AI diagnostics for $0. No credit card required.'
    }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden">
      
      {/* 1. Urgency Expiration Date Top Banner */}
      <div className="bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950 px-4 py-2 text-center text-xs font-bold font-mono shadow-md flex items-center justify-center gap-2">
        <span>⏰ Limited Beta Launch Offer:</span>
        <span className="bg-slate-950 text-yellow-300 px-2.5 py-0.5 rounded text-[11px]">Free Pro Tier Unlocked Until Oct 31, 2026</span>
        <span className="hidden sm:inline">• Claim your lifetime grandfathered spot today!</span>
      </div>

      {/* 2. Sentry-Style Sticky Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#090D16]/85 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition">
            <SnapTraceLogo size="md" showText={true} />
          </Link>

          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-300 font-mono">
            <a href="#how-it-works" className="hover:text-yellow-400 transition">How It Works</a>
            <a href="#quickstart" className="hover:text-yellow-400 transition">SDK Setup</a>
            <a href="#ai-copilot" className="hover:text-yellow-400 transition flex items-center gap-1.5 text-yellow-300">
              <span>✨</span> AI Diagnostics
            </a>
            <a href="#comparison" className="hover:text-yellow-400 transition">Why Us</a>
            <a href="#pricing" className="hover:text-yellow-400 transition font-bold text-yellow-400">Pricing</a>
            <a href="#faq" className="hover:text-yellow-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-800/50 transition font-mono"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 font-mono"
            >
              Claim Beta Pass →
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-yellow-500/15 via-purple-500/10 to-emerald-500/15 blur-[140px] pointer-events-none animate-pulse" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10 animate-in fade-in duration-500">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#090D16] border-2 border-yellow-400/40 text-xs font-bold text-yellow-300 shadow-xl shadow-yellow-500/10 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ Sub-5KB SDK • Universal 14-Stack Support • Zero Alert Fatigue</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Code <span className="text-red-400 underline decoration-red-500/50 decoration-wavy">breaks</span>. Fix it in seconds without the{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              bloat or alert flood.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            The featherweight (<span className="text-yellow-300 font-mono font-bold">&lt;5KB</span>) telemetry client with on-device PII masking, 60s noise throttling, and 1-click AI prompt exports for VS Code, Cursor, and Claude.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 font-mono">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-sm font-black rounded-xl shadow-xl shadow-yellow-500/25 transition transform hover:-translate-y-0.5"
            >
              Claim Free Lifetime Pro Pass (Before Oct 31) →
            </Link>
            <Link
              href="/test"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-yellow-300 text-sm font-semibold rounded-xl transition"
            >
              🧪 Try Live Test Playground (No Signup)
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Zero dependencies</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> No credit card required</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Drop-in 3 lines of code</span>
          </div>
        </div>
      </section>

      {/* 4. Interactive 12-Language Quickstart Terminal */}
      <RevealOnScroll className="max-w-5xl mx-auto px-6 pb-28" delay={100}>
        <div id="quickstart" className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-[#060911] px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2 font-mono whitespace-nowrap">Stack:</span>
              {[
                { id: 'nextjs', label: 'Next.js' },
                { id: 'js', label: 'JavaScript' },
                { id: 'python', label: 'Python' },
                { id: 'node', label: 'Node.js' },
                { id: 'go', label: 'Go' },
                { id: 'rust', label: 'Rust' },
                { id: 'csharp', label: 'C# .NET' },
                { id: 'php', label: 'PHP' },
                { id: 'ruby', label: 'Ruby' },
                { id: 'kotlin', label: 'Kotlin' },
                { id: 'flutter', label: 'Flutter' },
                { id: 'cloudflare', label: 'Cloudflare' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveQuickTab(tab.id as StackKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition uppercase cursor-pointer whitespace-nowrap font-mono ${
                    activeQuickTab === tab.id
                      ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer self-start md:self-auto font-mono whitespace-nowrap"
            >
              {copiedSnippet ? '✓ Snippet Copied!' : '📋 Copy SDK Code'}
            </button>
          </div>

          <div className="p-6 bg-[#05070E] overflow-x-auto">
            <pre className="font-mono text-xs text-yellow-300 leading-relaxed">
              <code>{snippets[activeQuickTab]}</code>
            </pre>
          </div>
        </div>
      </RevealOnScroll>

      {/* 5. How It Works Pipeline */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/80 bg-[#060911]/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <RevealOnScroll className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold font-mono uppercase">
              <span>⚙️</span> The Telemetry Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How SnapTrace Catches Crashes in 4 Steps</h2>
            <p className="text-sm text-slate-400 font-mono">From client browser crash to instant Discord alert in milliseconds.</p>
          </RevealOnScroll>

          <RevealOnScroll className="grid grid-cols-1 md:grid-cols-4 gap-4" delay={150}>
            
            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/10">01 • AUTO-INTERCEPT</span>
              <h3 className="text-sm font-bold text-white">Capture Uncaught Crash</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global listeners intercept runtime exceptions and promise rejections with zero main-thread delay.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">02 • PII FIREWALL</span>
              <h3 className="text-sm font-bold text-white">On-Device Masking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client regex replaces passwords, auth tokens, emails, and credit cards with [REDACTED] before transmission.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">03 • NOISE THROTTLING</span>
              <h3 className="text-sm font-bold text-white">60s Loop Suppressor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fingerprints group repeat crashes. 500 loop errors collapse into 1 alert tagged with occurrence count [x500].
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10">04 • DISCORD & EMAIL</span>
              <h3 className="text-sm font-bold text-white">Instant Alert Delivery</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Telemetry streams live to your dashboard, rich Discord embeds, and Gmail inbox in under 1 second.
              </p>
            </div>

          </RevealOnScroll>
        </div>
      </section>

      {/* 6. Sub-5KB SDK Section */}
      <section id="features" className="py-24 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <RevealOnScroll className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                <span>🪶</span> Performance & Core Web Vitals
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                An error tracker that never slows down your users
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Legacy APMs force your users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores. SnapTrace is a zero-dependency script under <strong>5KB</strong> gzipped.
              </p>

              <div className="space-y-3 pt-2 font-mono">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs">
                  <span className="text-slate-300 font-semibold">SnapTrace JS Telemetry SDK</span>
                  <span className="text-emerald-400 font-bold">&lt; 5 KB</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs opacity-70">
                  <span className="text-slate-400">Honeybadger Client</span>
                  <span className="text-slate-400 font-bold">~35 KB</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs opacity-50">
                  <span className="text-slate-500">Sentry Browser SDK</span>
                  <span className="text-red-400 font-bold">100+ KB</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 bg-[#090D16] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Google Lighthouse Impact</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono">
                  Score: 100/100
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-[#05070E] border border-slate-800 space-y-1">
                  <div className="text-2xl font-black text-emerald-400 font-mono">0.0ms</div>
                  <p className="text-[11px] text-slate-400">Main Thread Blocking Time</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#05070E] border border-slate-800 space-y-1">
                  <div className="text-2xl font-black text-emerald-400 font-mono">3.4 KB</div>
                  <p className="text-[11px] text-slate-400">Total Gzipped Size</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-4 font-mono">
                "We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly."
              </p>
            </div>

          </RevealOnScroll>
        </div>
      </section>

      {/* 7. BYOK AI Section */}
      <section id="ai-copilot" className="py-24 border-t border-slate-800/80 bg-[#060911]/60 relative">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <RevealOnScroll className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase font-mono">
              <span>🤖</span> BYOK AI Diagnostic Engine
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
              Turn runtime stack traces into instant AI bug fixes
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect your own Google Gemini (100% Free) or OpenAI API key for instant in-dashboard code patches, or use our <strong>1-Click Prompt Export</strong> directly into <strong>VS Code, Cursor, or Claude Code</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-mono">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-purple-500/40 shadow-lg shadow-purple-500/10">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 19.5L12 15.5L22 19.5L12 2Z" />
                </svg>
                <span className="text-xs font-bold text-slate-200">Cursor / VS Code</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-amber-500/40 shadow-lg shadow-amber-500/10">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Claude Code</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <span className="text-emerald-400 text-xs font-bold">⚡</span>
                <span className="text-xs font-bold text-slate-200">Google Gemini & GPT-4o</span>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto space-y-6" delay={150}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="text-xs font-bold text-red-400 font-mono block">CRASH: ReferenceError: Connection pool exhausted</span>
                <span className="text-[11px] text-slate-500 font-mono">Captured at C:\app\database.js:18:11</span>
              </div>
              <button
                onClick={handleCopyCursorDemo}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer self-start sm:self-auto font-mono"
              >
                {copiedCursorPrompt ? '✓ Copied AI Prompt!' : '📋 Copy Prompt for Cursor / Claude'}
              </button>
            </div>

            <div className="bg-[#05070E] border border-purple-500/30 rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                <span>✨</span> Instant AI Root-Cause Diagnosis
              </div>
              <p className="text-slate-300 leading-relaxed">
                <strong>1. Plain English:</strong> The PostgreSQL client in <code className="text-yellow-300">database.js</code> is opening connections inside a tight loop without releasing them back to the pool.
              </p>
              <pre className="p-3 bg-[#090D16] rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto">
{`// Fix in database.js: Release connection back to pool
const client = await pool.connect();
try {
  await client.query('SELECT * FROM users WHERE id = $1', [userId]);
} finally {
  client.release(); // Releases connection
}`}
              </pre>
            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* 8. Comparison Table */}
      <section id="comparison" className="max-w-5xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-12">
        <RevealOnScroll className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Why Developers Choose SnapTrace</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Built to replace bloated, noisy enterprise APMs.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-x-auto shadow-2xl" delay={150}>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#060911] text-slate-400 font-semibold uppercase font-mono">
                <th className="p-4">Feature</th>
                <th className="p-4 text-yellow-400 font-bold">⚡ SnapTrace</th>
                <th className="p-4">Sentry</th>
                <th className="p-4">GlitchTip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              <tr>
                <td className="p-4 font-semibold text-white">SDK Weight</td>
                <td className="p-4 text-emerald-400 font-bold">&lt; 5 KB (Featherweight)</td>
                <td className="p-4 text-slate-500">~100 KB+</td>
                <td className="p-4 text-slate-500">~100 KB+</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Free Tier Events</td>
                <td className="p-4 text-emerald-400 font-bold">10,000 / month</td>
                <td className="p-4 text-slate-500">5,000 / month</td>
                <td className="p-4 text-slate-500">1,000 / month</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Client-Side PII Scrubbing</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Native on-device</td>
                <td className="p-4 text-slate-500">Complex server rules</td>
                <td className="p-4 text-slate-500">✕ None</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">In-Dashboard AI Diagnosis (BYOK)</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Included in Beta Pass</td>
                <td className="p-4 text-slate-500">$$$ Expensive addon</td>
                <td className="p-4 text-slate-500">✕ None</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">1-Click Prompt Export for Cursor</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Free Forever</td>
                <td className="p-4 text-slate-500">✕ Manual copy</td>
                <td className="p-4 text-slate-500">✕ Manual copy</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Loop Throttling (Anti-Spam)</td>
                <td className="p-4 text-emerald-400 font-bold">✓ 60s window [x500]</td>
                <td className="p-4 text-slate-500">Manual spike rules</td>
                <td className="p-4 text-slate-500">✕ Quota burns</td>
              </tr>
            </tbody>
          </table>
        </RevealOnScroll>
      </section>

      {/* 9. Pricing Section with Expiration Date */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-12">
        <RevealOnScroll className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
            <span>⏰</span> Limited Beta Window (Until Oct 31, 2026)
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Simple, transparent developer tiers</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Zero surprise overage bills. Full Pro access unlocked during public beta.
          </p>
        </RevealOnScroll>

        <RevealOnScroll className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch" delay={150}>
          
          {/* Card 1: Developer Free */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Developer Free</span>
                <div className="text-3xl font-black text-white">$0 <span className="text-xs text-slate-500 font-normal">/ month</span></div>
                <p className="text-xs text-slate-400 pt-1">Essential crash monitoring for side projects and hobby apps.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-5 font-mono">
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>10,000</strong> Events / Month</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 14-Day Data Retention</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Up to 2 Projects</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Sub-5KB Featherweight SDK</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 1-Click Cursor / Claude Export</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Discord & Gmail Alert Channels</li>
              </ul>
            </div>

            <Link
              href="/signup"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
            >
              Start Free Forever →
            </Link>
          </div>

          {/* Card 2: Starter Pro */}
          <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/60 rounded-3xl p-7 space-y-6 shadow-2xl relative flex flex-col justify-between transform md:-translate-y-2 hover:border-yellow-400 transition">
            <span className="absolute -top-3.5 right-6 px-3.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg font-mono">
              ★ Free Until Oct 31
            </span>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono">Starter Pro (Beta Pass)</span>
                <div className="text-3xl font-black text-white">$0 <span className="text-xs text-yellow-300 font-mono font-bold line-through ml-1">$9/mo</span></div>
                <p className="text-xs text-slate-400 pt-1">Free full Pro features unlocked for all early beta developers.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800/80 pt-5 font-mono">
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>150,000</strong> Events / Month</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> 30-Day Data Retention</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>Unlimited Projects</strong></li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>In-Dashboard BYOK AI Copilot</strong></li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> Noise Deduplication Throttling</li>
                <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> 1-Click Database Purge Tools</li>
              </ul>
            </div>

            <Link
              href="/signup"
              className="block w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-center text-xs rounded-xl transition shadow-xl shadow-yellow-500/20 cursor-pointer font-mono"
            >
              Claim Free Pro Beta Pass →
            </Link>
          </div>

          {/* Card 3: Team Scale */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Team Scale</span>
                <div className="text-3xl font-black text-white">$29 <span className="text-xs text-slate-500 font-normal font-mono">/ month</span></div>
                <p className="text-xs text-slate-400 pt-1">For high-traffic production workloads and growing teams.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-5 font-mono">
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> <strong>1,000,000</strong> Events / Month</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> 90-Day Telemetry Retention</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Unlimited Projects & API Keys</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Priority Discord & Email Delivery</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Team Invites & Multi-Seat Access</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Raw Log CSV / JSON Data Export</li>
              </ul>
            </div>

            <Link
              href="/signup"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
            >
              Join Beta Waitlist →
            </Link>
          </div>

        </RevealOnScroll>
      </section>

      {/* 10. Developer FAQs */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-10">
        <RevealOnScroll className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400 font-mono">Real technical answers for developers evaluating SnapTrace.</p>
        </RevealOnScroll>

        <RevealOnScroll className="space-y-3" delay={150}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#090D16] border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:text-yellow-400 transition"
                >
                  <span className="font-bold text-sm text-white">{faq.q}</span>
                  <span className="text-slate-500 font-mono text-base">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </RevealOnScroll>
      </section>

      {/* 11. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-20 text-center space-y-6 relative overflow-hidden">
        <RevealOnScroll className="max-w-2xl mx-auto px-6 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to catch bugs in a snap?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Join developers catching crashes in real time with zero noise and instant AI diagnoses.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-yellow-500/20 transition transform hover:-translate-y-0.5 font-mono"
            >
              Claim Your Free Beta Pass in 60s →
            </Link>
          </div>
          
          <div className="pt-10 text-xs text-slate-500 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <span>© {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.</span>
            <div className="flex items-center space-x-6 text-slate-400">
              <Link href="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-yellow-400 transition">Terms of Service</Link>
            </div>
          </div>
        </RevealOnScroll>
      </footer>

    </div>
  );
}