'use client';

import { useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function WelcomeLandingPage() {
  const [activeQuickTab, setActiveQuickTab] = useState<'nextjs' | 'js' | 'python' | 'node'>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
    js: `<!-- Drop this 3KB script before your app bundles -->
<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="sk_live_your_project_key"
  async
></script>`,
    python: `# Install: pip install requests
import traceback, requests

def log_to_snaptrace(exception):
    requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={
        "apiKey": "sk_live_your_project_key",
        "message": str(exception),
        "stackTrace": traceback.format_exc(),
        "environment": "production"
    }, timeout=2)`,
    node: `// Global Node.js Process Telemetry
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
  });
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
      q: 'How is SnapTrace faster than Sentry?',
      a: 'Sentry’s JavaScript SDK adds over 100KB of minified code with complex distributed tracing logic. SnapTrace is a featherweight <5KB zero-dependency script that intercepts uncaught exceptions and sends telemetry using navigator.sendBeacon, resulting in zero impact on Google Core Web Vitals.'
    },
    {
      q: 'How does BYOK (Bring Your Own Key) AI work?',
      a: 'Instead of forcing you onto expensive enterprise tiers, you can paste your own OpenAI key in Settings. When you click "Analyze with AI" on any error, SnapTrace calls the AI model to explain the bug and generate code patches at $0 platform cost to you.'
    },
    {
      q: 'What does Client-Side PII Scrubbing mean?',
      a: 'Traditional APMs send raw memory dumps to their servers and scrub them later. SnapTrace uses on-device regex to sanitize passwords, credit cards, emails, and auth tokens directly on the user’s browser before the payload is ever transmitted across the network.'
    },
    {
      q: 'Will I get spammed with 10,000 emails if a loop breaks?',
      a: 'No. SnapTrace uses deterministic fingerprint hashing and a 60-second loop throttling engine. If an error throws 500 times in 10 seconds, it sends the 1st crash instantly, silences duplicate alerts, and sends an aggregated summary count tag [x500].'
    },
    {
      q: 'Is SnapTrace free to use?',
      a: 'Yes! SnapTrace offers a generous 100% Free Tier with full access to realtime streaming, multi-project switching, Discord webhooks, and unlimited BYOK AI bug analysis.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden">
      
      {/* 1. Sentry-Style Sticky Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#090D16]/85 backdrop-blur-xl sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo (Smooth Scroll to Top) */}
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition">
            <SnapTraceLogo size="md" showText={true} />
          </Link>

          {/* Sentry-Style Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-yellow-400 transition flex items-center gap-1">
              Features <span className="text-[10px] text-slate-500">▾</span>
            </a>
            <a href="#quickstart" className="hover:text-yellow-400 transition">
              Integrations
            </a>
            <a href="#ai-copilot" className="hover:text-yellow-400 transition flex items-center gap-1.5 text-purple-300 hover:text-purple-200">
              <span>✨</span> AI Copilot
            </a>
            <a href="#comparison" className="hover:text-yellow-400 transition">
              Why SnapTrace
            </a>
            <a href="#pricing" className="hover:text-yellow-400 transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-yellow-400 transition">
              FAQ
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg hover:bg-slate-800/50 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-yellow-500/15 via-purple-500/10 to-emerald-500/15 blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8 relative z-10">
          
          {/* Announcement Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#090D16] border border-slate-800 text-xs font-semibold text-yellow-300 shadow-xl shadow-yellow-500/5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sub-5KB SDK • 1-Click Cursor / Claude AI Export • Zero Alert Flood</span>
          </div>

          {/* Sentry-Grade Punchy Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.1]">
            Code <span className="text-red-400 underline decoration-red-500/50 decoration-wavy">breaks</span>, fix it in a{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              snap.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed">
            The lightweight, noise-free application monitoring platform. Capture live exceptions in real time, silence duplicate alerts, and diagnose root causes with your own favorite AI models.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-sm font-bold rounded-xl shadow-xl shadow-yellow-500/25 transition transform hover:-translate-y-0.5"
            >
              Start Monitoring in 60s (Free) →
            </Link>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-[#090D16] hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition"
            >
              Live Demo / Dashboard
            </Link>
          </div>

          {/* Trust Checklist */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> No credit card required</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> Drop-in 3 lines of code</span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">✓</span> 100% Free forever tier</span>
          </div>
        </div>
      </section>

      {/* 3. Interactive Multi-Stack Quickstart Terminal */}
      <section id="quickstart" className="max-w-4xl mx-auto px-6 pb-28">
        <div className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-[#060911] px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2 font-mono">Quickstart:</span>
              {(['nextjs', 'js', 'python', 'node'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveQuickTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition uppercase cursor-pointer ${
                    activeQuickTab === tab
                      ? 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab === 'nextjs' ? 'Next.js' : tab === 'js' ? 'HTML / JS' : tab === 'python' ? 'Python' : 'Node.js'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer self-start sm:self-auto"
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
      </section>

      {/* 4. Core Features Deep Dive */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-[#060911]/60">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase">
              <span>🪶</span> Performance & Core Web Vitals
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              An error tracker that never slows down your users
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Legacy APMs force your users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores. SnapTrace is a zero-dependency script under <strong>5KB</strong> gzipped.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs">
                <span className="text-slate-300 font-semibold">SnapTrace JS Telemetry SDK</span>
                <span className="text-emerald-400 font-mono font-bold">&lt; 5 KB</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs opacity-70">
                <span className="text-slate-400">Honeybadger Client</span>
                <span className="text-slate-400 font-mono font-bold">~35 KB</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-xs opacity-50">
                <span className="text-slate-500">Sentry Browser SDK</span>
                <span className="text-red-400 font-mono font-bold">100+ KB</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#090D16] border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Google Lighthouse Impact</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
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

            <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-4">
              "We dropped Sentry for SnapTrace and our Next.js frontend load time dropped by 240ms on mobile devices."
            </p>
          </div>

        </div>
      </section>

      {/* 5. BYOK AI Section with Cursor & Claude Badges */}
      <section id="ai-copilot" className="py-24 border-t border-slate-800/80 relative">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase">
              <span>🤖</span> BYOK (Bring Your Own Key) AI Architecture
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
              Connect your favorite AI to diagnose bugs instantly
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Don’t pay $40/month for locked-in AI features. Add your own OpenAI key or use our <strong>1-Click Prompt Export</strong> directly into <strong>Cursor</strong>, <strong>Claude Code</strong>, or <strong>ChatGPT</strong>.
            </p>

            {/* AI Agent Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
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
                <span className="text-xs font-bold text-slate-200">OpenAI GPT-4o</span>
              </div>
            </div>
          </div>

          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <span className="text-xs font-bold text-red-400 font-mono block">CRASH: ReferenceError: Connection pool exhausted</span>
                <span className="text-[11px] text-slate-500 font-mono">Captured at C:\app\database.js:18:11</span>
              </div>
              <button
                onClick={handleCopyCursorDemo}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20 cursor-pointer self-start sm:self-auto"
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
  client.release(); // Releases connection
}`}
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Noise Deduplication Section */}
      <section id="dedup" className="py-24 border-t border-slate-800/80 bg-[#060911]/60">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
          
          <div className="lg:col-span-6 bg-[#090D16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 order-2 lg:order-1">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold font-mono text-slate-400 uppercase">Live Discord Alert Dispatch</span>
              <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Deduplication Active
              </span>
            </div>

            <div className="bg-[#1e1f22] rounded-2xl p-4 border-l-4 border-red-500 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">SnapTrace Engine</span>
                <span className="px-1.5 py-0.5 bg-[#5865f2] text-white text-[9px] font-bold rounded">BOT</span>
              </div>
              <p className="text-red-300 font-bold">
                🚨 CheckoutModuleError: Gateway Timeout <span className="text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/30">(Occurred 542 times)</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-700/60">
                <div>Environment: <strong className="text-white">production</strong></div>
                <div>Occurrences: <strong className="text-yellow-400">542</strong></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              542 cascading errors condensed into <strong>1 notification</strong> over a 60-second window.
            </p>
          </div>

          <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
              <span>🔇</span> Zero Alert Fatigue
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Stop waking up to 10,000 duplicate email alerts
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              When a database drops or a React render loop breaks, legacy tools flood your inbox until you are forced to mute the channel. SnapTrace uses deterministic <strong>SHA-256 fingerprinting</strong> to group identical crashes and send one clean summary ping.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 60-second duplicate suppression window</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Automatic summary occurrence counter tags (<code className="text-yellow-300 font-mono">[x542]</code>)</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Protects Gmail and Discord rate-limit thresholds</li>
            </ul>
          </div>

        </div>
      </section>

      {/* 7. Client-Side PII Firewall */}
      <section id="privacy" className="py-24 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase">
              <span>🔒</span> GDPR & HIPAA Compliance
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Sensitive data never leaves your user's browser
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Accidentally logging passwords, authentication tokens, or credit cards into a third-party server creates serious legal risks. SnapTrace sanitizes sensitive strings <strong>on the client device</strong> before anything is transmitted over HTTP.
            </p>
          </div>

          <div className="lg:col-span-6 bg-[#090D16] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">1. Raw Browser Exception (Before)</span>
              <pre className="p-3 bg-[#05070E] rounded-xl border border-red-500/30 text-red-300 font-mono text-xs overflow-x-auto">
{`Failed auth for user@company.com with token=secret_token_12345`}
              </pre>
            </div>

            <div className="text-center text-xs text-slate-500 font-mono">⬇️ SnapTrace Client-Side Regex Firewall ⬇️</div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">2. Ingested Safe Telemetry (After)</span>
              <pre className="p-3 bg-[#05070E] rounded-xl border border-emerald-500/30 text-emerald-300 font-mono text-xs overflow-x-auto">
{`Failed auth for [REDACTED_EMAIL] with token=[REDACTED]`}
              </pre>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Comparison Table */}
      <section id="comparison" className="max-w-5xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Why Developers Choose SnapTrace</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Built to replace bloated, expensive legacy APMs.
          </p>
        </div>

        <div className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#060911] text-slate-400 font-semibold uppercase">
                <th className="p-4">Feature</th>
                <th className="p-4 text-yellow-400 font-bold">⚡ SnapTrace</th>
                <th className="p-4">Sentry</th>
                <th className="p-4">Honeybadger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-4 font-semibold text-white">SDK Weight</td>
                <td className="p-4 text-emerald-400 font-bold font-mono">&lt; 5 KB (Featherweight)</td>
                <td className="p-4 text-slate-500 font-mono">~100 KB+</td>
                <td className="p-4 text-slate-500 font-mono">~35 KB</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">Client-Side PII Scrubbing</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Native on-device</td>
                <td className="p-4 text-slate-500">Complex server setup</td>
                <td className="p-4 text-slate-500">Manual regex</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">AI Bug Fixes (BYOK)</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Free (Bring Your Own Key)</td>
                <td className="p-4 text-slate-500">$$$ Expensive addon</td>
                <td className="p-4 text-slate-500">✕ None</td>
              </tr>
              <tr>
                <td className="p-4 font-semibold text-white">1-Click Prompt Export for Cursor</td>
                <td className="p-4 text-emerald-400 font-bold">✓ 1-Click Ready</td>
                <td className="p-4 text-slate-500">✕ Manual copy</td>
                <td className="p-4 text-slate-500">✕ Manual copy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 9. Sentry-Style Dedicated Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase">
            <span>💎</span> Transparent & Predictable
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Simple, developer-first pricing</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            No surprise overage bills. No multi-metered category traps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Free Forever Plan */}
          <div className="bg-[#090D16] border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl relative">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Developer Free</span>
              <div className="text-4xl font-black text-white">$0 <span className="text-xs text-slate-500 font-normal">/ month forever</span></div>
              <p className="text-xs text-slate-400">Perfect for side projects, indie hackers, and hobby apps.</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-6">
              <li className="flex items-center gap-2.5"><span className="text-emerald-400 font-bold">✓</span> Sub-5KB Featherweight SDK</li>
              <li className="flex items-center gap-2.5"><span className="text-emerald-400 font-bold">✓</span> Real-Time WebSocket Telemetry</li>
              <li className="flex items-center gap-2.5"><span className="text-emerald-400 font-bold">✓</span> Discord & Gmail Alert Channels</li>
              <li className="flex items-center gap-2.5"><span className="text-emerald-400 font-bold">✓</span> Unlimited BYOK AI Bug Diagnostics</li>
              <li className="flex items-center gap-2.5"><span className="text-emerald-400 font-bold">✓</span> Multi-Project Switching</li>
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition"
            >
              Get Started Free →
            </Link>
          </div>

          {/* Pro Flat-Rate Plan */}
          <div className="bg-[#090D16] border border-yellow-400/40 rounded-3xl p-8 space-y-6 shadow-2xl relative">
            <span className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
              Most Popular
            </span>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">Pro Team Flat</span>
              <div className="text-4xl font-black text-white">$19 <span className="text-xs text-slate-500 font-normal">/ month flat rate</span></div>
              <p className="text-xs text-slate-400">Generous capacity for high-traffic production apps.</p>
            </div>

            <ul className="space-y-3 text-xs text-slate-300 border-t border-slate-800 pt-6">
              <li className="flex items-center gap-2.5"><span className="text-yellow-400 font-bold">✓</span> Everything in Developer Free</li>
              <li className="flex items-center gap-2.5"><span className="text-yellow-400 font-bold">✓</span> 500,000 Events / Month Included</li>
              <li className="flex items-center gap-2.5"><span className="text-yellow-400 font-bold">✓</span> 90-Day Telemetry Retention</li>
              <li className="flex items-center gap-2.5"><span className="text-yellow-400 font-bold">✓</span> Zero Surprise Overage Charges</li>
              <li className="flex items-center gap-2.5"><span className="text-yellow-400 font-bold">✓</span> Priority Support Channels</li>
            </ul>

            <Link
              href="/signup"
              className="block w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-center text-xs rounded-xl transition shadow-lg shadow-yellow-500/20"
            >
              Start 14-Day Pro Trial →
            </Link>
          </div>

        </div>
      </section>

      {/* 10. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-slate-800/80 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400">Everything you need to know about SnapTrace.</p>
        </div>

        <div className="space-y-3">
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
        </div>
      </section>

      {/* 11. Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-20 text-center space-y-6 relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-6 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Ready to catch bugs in a snap?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Join developers catching crashes in real time with zero noise and instant AI diagnoses.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-block px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
            >
              Start Tracking for Free in 60s →
            </Link>
          </div>
          
          <div className="pt-10 text-xs text-slate-500 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.</span>
            <div className="flex items-center space-x-6 text-slate-400">
              <Link href="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-yellow-400 transition">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}