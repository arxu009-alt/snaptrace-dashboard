'use client';

import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function SentryComparisonPage() {
  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 p-6 sm:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <Link href="/">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <Link href="/" className="text-slate-400 hover:text-white transition">← Home</Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black rounded-xl shadow-md"
            >
              Start Free Beta →
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold font-mono uppercase">
            <span>⚡</span> Architectural Comparison
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            SnapTrace vs. Sentry: <br />
            <span className="text-yellow-400">Why Modern Developers Are Switching</span>
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed font-mono">
            Sentry is powerful, but it has evolved into a heavy enterprise suite with 100KB+ SDKs, complex pricing meters, and alert fatigue. Here is how SnapTrace compares.
          </p>
        </div>

        {/* Detailed Comparison Table */}
        <div className="bg-[#090D16] border border-slate-800 rounded-3xl overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-[#060911] text-slate-400 font-semibold uppercase">
                <th className="p-4">Key Criteria</th>
                <th className="p-4 text-yellow-400 font-bold">⚡ SnapTrace</th>
                <th className="p-4 text-slate-300">Sentry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="p-4 font-bold text-white">Client SDK Size</td>
                <td className="p-4 text-emerald-400 font-bold">&lt; 5 KB (0ms main thread delay)</td>
                <td className="p-4 text-red-400">100 KB+ (Minified bundle penalty)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">Infinite Loop Throttling</td>
                <td className="p-4 text-emerald-400 font-bold">✓ 60s noise suppressor [x500]</td>
                <td className="p-4 text-slate-500">Spike protection (often burns quota)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">Cascading Outage Collapse</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Collapses 4 downstream crashes into 1 incident</td>
                <td className="p-4 text-slate-500">Sends multiple separate alerts</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">Client-Side PII Scrubbing</td>
                <td className="p-4 text-emerald-400 font-bold">✓ On-device regex before sending</td>
                <td className="p-4 text-slate-500">Server-side custom rules</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">AI Bug Fixes (BYOK)</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Bring your own Gemini / OpenAI key ($0 cost)</td>
                <td className="p-4 text-slate-500">$$$ Expensive enterprise add-on</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">1-Click Cursor / Claude Prompt Export</td>
                <td className="p-4 text-emerald-400 font-bold">✓ Built-in 1-Click Export</td>
                <td className="p-4 text-slate-500">✕ Manual copy</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">Free Tier Capacity</td>
                <td className="p-4 text-emerald-400 font-bold">10,000 events / month</td>
                <td className="p-4 text-slate-500">5,000 events / month</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-white">Pro Pricing</td>
                <td className="p-4 text-emerald-400 font-bold">$9 / mo flat rate (No surprise overages)</td>
                <td className="p-4 text-slate-500">$29+ / mo + multi-metered overages</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3 Core Differentiator Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#090D16] border border-slate-800 space-y-2">
            <div className="text-2xl">🪶</div>
            <h3 className="text-sm font-bold text-white">Zero Impact on PageSpeed</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              SnapTrace uses `navigator.sendBeacon` to deliver crash reports asynchronously. It never delays React hydration or Google Core Web Vitals.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#090D16] border border-slate-800 space-y-2">
            <div className="text-2xl">🔇</div>
            <h3 className="text-sm font-bold text-white">No More 2 AM Alert Spam</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              When a component gets stuck in a re-render loop 500 times, SnapTrace delivers 1 clean summary alert tagged `[x500]` instead of 500 emails.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#090D16] border border-slate-800 space-y-2">
            <div className="text-2xl">🤖</div>
            <h3 className="text-sm font-bold text-white">AI-Native Diagnostic Workflow</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              One click turns any live production crash into an AI-ready prompt for Cursor, Claude Code, or VS Code Copilot with the exact code fix.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Switch to lightweight, noise-free monitoring in 60 seconds
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto font-mono">
            Public Beta is live. The first 50 developers get a Free Lifetime Starter Pro pass with 150,000 monthly events and full AI diagnostics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono">
            <Link
              href="/signup"
              className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20"
            >
              Claim Free Pro Beta Pass →
            </Link>
            <Link
              href="/test"
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
            >
              🧪 Test Live Sandbox
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}