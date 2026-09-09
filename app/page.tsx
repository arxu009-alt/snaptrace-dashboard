'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import RevealOnScroll from '@/components/RevealOnScroll';

export const dynamic = 'force-dynamic';

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<'nextjs' | 'js' | 'python' | 'node'>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Auto-redirect authenticated users directly to dashboard
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

  const snippets = {
    nextjs: `// app/layout.tsx
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
    js: `<!-- Drop this <5KB script in your HTML <head> -->
<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="sk_live_your_project_key"
  async
></script>`,
    python: `# Install: pip install requests
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
    node: `// server.js (Express / Node runtime)
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
});`
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
      q: 'How does SnapTrace maintain a <5KB bundle size?',
      a: 'Most APMs bundle heavy tracing dependencies, performance profilers, and complex session serialization. SnapTrace focuses strictly on what matters: unhandled exceptions, promise rejections, client-side PII scrubbing, and beacon-based delivery. Zero bloated dependencies.'
    },
    {
      q: 'What is the 60-second loop throttling engine?',
      a: 'If an error occurs in an infinite React re-render loop or a failing database polling loop 500 times in 10 seconds, SnapTrace sends the 1st error instantly, silences the repetitive noise, and sends 1 clean summary notification tagged [x500]. Your inbox and Discord remain quiet.'
    },
    {
      q: 'How does the Client-Side PII Firewall protect data?',
      a: 'Before an error payload ever leaves the user\'s browser, an on-device regex filter scans error messages and URLs for emails, 16-digit credit cards, auth tokens (apiKey=...), and passwords (password=...), replacing them with [REDACTED] tokens automatically.'
    },
    {
      q: 'How does BYOK AI work for bug fixes?',
      a: 'You can paste your own Google Gemini (100% Free) or OpenAI API key in Settings. When you inspect an error, you can click "Analyze with AI" for an instant root-cause breakdown and code patch, or click "Copy for Cursor" to export a ready-to-paste prompt into your AI code editor.'
    },
    {
      q: 'What happens during the Public Beta?',
      a: 'During our public beta launch, all developers receive free access to the Starter Pro tier with 150,000 monthly events and full in-dashboard AI diagnostics. No credit card required.'
    }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">Checking Active Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden">
      
      {/* 1. Sentry-Style Sticky Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#090D16]/85 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition">
            <SnapTraceLogo size="md" showText={true} />
          </Link>

          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-300 font-mono">
            <a href="#how-it-works" className="hover:text-yellow-400 transition">How It Works</a>
            <a href="#features" className="hover:text-yellow-400 transition">Architecture</a>
            <a href="#quickstart" className="hover:text-yellow-400 transition">SDK Setup</a>
            <a href="#ai-copilot" className="hover:text-yellow-400 transition flex items-center gap-1.5 text-yellow-300">
              <span>✨</span> AI Diagnostics
            </a>
            <a href="#comparison" className="hover:text-yellow-400 transition">Why SnapTrace</a>
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

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-yellow-500/15 via-purple-500/10 to-emerald-500/15 blur-[140px] pointer-events-none animate-pulse" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10 animate-in fade-in duration-500">
          
          {/* Public Beta Campaign Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#090D16] border-2 border-yellow-400/40 text-xs font-bold text-yellow-300 shadow-xl shadow-yellow-500/10 font-mono">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>⚡ Public Beta: Full Pro Features Free for All Early Developers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Code <span className="text-red-400 underline decoration-red-500/50 decoration-wavy">breaks</span>. Fix it without the{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              bloat or noise.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            The featherweight telemetry platform built for developers who want instant Discord and email crash alerts without adding 100KB to their bundles or waking up to 5,000 duplicate emails.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 font-mono">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-sm font-black rounded-xl shadow-xl shadow-yellow-500/25 transition transform hover:-translate-y-0.5"
            >
              Start Tracking in 60s (Free) →
            </Link>
            <Link
              href="/test"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-yellow-300 text-sm font-semibold rounded-xl transition"
            >
              🧪 Try Live Test Playground
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> No credit card required</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Drop-in 3 lines of code</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 100% Free during beta</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Quickstart Terminal */}
      <RevealOnScroll className="max-w-4xl mx-auto px-6 pb-28" delay={100}>
        <div id="quickstart" className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-[#060911] px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 font-mono">Select Stack:</span>
              {(['nextjs', 'js', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveQuickTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition uppercase cursor-pointer font-mono ${
                    activeQuickTab === tab
                      ? 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab === 'nextjs' ? 'Next.js App Router' : tab === 'js' ? 'Vanilla JS' : tab === 'python' ? 'Python' : 'Node.js'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer self-start sm:self-auto font-mono"
            >
              {copiedSnippet ? '✓ Snippet Copied!' : '📋 Copy Code'}
            </button>
          </div>

          <div className="p-6 bg-[#05070E] overflow-x-auto">
            <pre className="font-mono text-xs text-yellow-300 leading-relaxed">
              <code>{snippets[activeQuickTab]}</code>
            </pre>
          </div>
        </div>
      </RevealOnScroll>

      {/* 4. Section: How It Works Technical Architecture */}
      <section id="how-it-works" className="py-24 border-t border-slate-800/80 bg-[#060911]/80">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <RevealOnScroll className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold font-mono uppercase">
              <span>⚙️</span> Technical Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How Telemetry Flows Through SnapTrace</h2>
            <p className="text-sm text-slate-400">From the client browser to your Discord channel in milliseconds.</p>
          </RevealOnScroll>

          <RevealOnScroll className="grid grid-cols-1 md:grid-cols-4 gap-4" delay={150}>
            
            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2 relative">
              <span className="text-[10px] font-mono font-bold text-yellow-400 px-2 py-0.5 rounded bg-yellow-400/10">01 • BROWSER INTERCEPT</span>
              <h3 className="text-sm font-bold text-white">Capture Uncaught Crash</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Global listeners catch sync exceptions and unhandled promise rejections with zero framework overhead.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2 relative">
              <span className="text-[10px] font-mono font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">02 • PII SCRUBBING</span>
              <h3 className="text-sm font-bold text-white">On-Device Sanitization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Regex scans replace passwords, auth tokens, emails, and credit cards with [REDACTED] before network dispatch.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2 relative">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">03 • NOISE DEDUPLICATION</span>
              <h3 className="text-sm font-bold text-white">60s Loop Throttling</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fingerprints group repeat crashes. 500 loop errors collapse into 1 alert tagged with occurrence counts [x500].
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 space-y-2 relative">
              <span className="text-[10px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10">04 • MULTI-CHANNEL ALERT</span>
              <h3 className="text-sm font-bold text-white">Realtime Broadcast</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Telemetry pushes live to Supabase WebSockets, rich Discord embeds, and Gmail SMTP in under 1 second.
              </p>
            </div>

          </RevealOnScroll>
        </div>
      </section>

      {/* 5. Sub-5KB SDK Section */}
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

      {/* 6. BYOK AI Section */}
      <section id="ai-copilot" className="py-24 border-t border-slate-800/80 bg-[#060911]/60 relative">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <RevealOnScroll className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase font-mono">
              <span>🤖</span> BYOK (Bring Your Own Key) AI Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
              Connect your favorite AI to diagnose bugs instantly
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Don’t pay $40/month for locked-in AI features. Add your own OpenAI or Google Gemini key or use our <strong>1-Click Prompt Export</strong> directly into <strong>Cursor</strong>, <strong>Claude Code</strong>, or <strong>ChatGPT</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-mono">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-purple-500/40 shadow-lg shadow-purple-500/10">
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 19.5L12 15.5L22 19.5L12 2Z" />
                </svg>
                <span className="text-xs font-bold text-slate-200">Cursor Ready</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-amber-500/40 shadow-lg shadow-amber-500/10">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-200">Claude Code</span>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#090D16] border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <span className="text-emerald-400 text-xs">⚡</span>
                <span className="text-xs font-bold text-slate-200">Google Gemini & OpenAI</span>
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
{`// Fix: Release client back to pool
const client = await pool.connect();
try {
  await client.query('SELECT * FROM users WHERE id = $1', [userId]);
} finally {
  client.release(); // Releases connection back to pool
}`}
              </pre>
            </div>
          </RevealOnScroll>

        </div>
      </section>

      {/* 7. Comparison Table */}
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
                <td className="p-4 text-slate-500">Complex server setup</td>
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

      {/* 8. Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-12">
        <RevealOnScroll className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase font-mono">
            <span>💎</span> Public Beta Pricing
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
              ★ Public Beta Pass
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

      {/* 9. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-10">
        <RevealOnScroll className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400">Everything you need to know about SnapTrace.</p>
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
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </RevealOnScroll>
      </section>

      {/* 10. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-20 text-center space-y-6 relative overflow-hidden">
        <RevealOnScroll className="max-w-2xl mx-auto px-6 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to catch bugs in a snap?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Join early developers catching crashes in real time with zero noise and instant AI diagnoses.
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