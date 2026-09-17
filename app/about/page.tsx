'use client';

import { useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'hello.snaptrace@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 p-6 sm:p-12 relative overflow-x-hidden">
      
      {/* Ambient Gradient Glows */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-yellow-500/10 via-purple-500/10 to-emerald-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-4xl mx-auto space-y-16 relative z-10">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 font-mono">
          <Link href="/" className="transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <div className="flex items-center space-x-4 text-xs">
            <Link href="/" className="text-slate-400 hover:text-yellow-400 transition">
              ← Back to Platform
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold rounded-xl shadow-md transition transform hover:-translate-y-0.5"
            >
              Start Free Beta →
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-5 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#090D16] border border-yellow-400/30 text-yellow-300 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <span>⚡</span> Independent Developer Telemetry
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Built for speed, privacy, and{' '}
            <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              zero alert fatigue.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
            SnapTrace was engineered on a simple conviction: Application telemetry should help software teams solve outages in seconds, not slow down user devices or spam engineering channels with thousands of duplicate alerts.
          </p>
        </div>

        {/* 1. Core Engineering Principles */}
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest font-mono block">
              Architectural Values
            </span>
            <h2 className="text-2xl font-bold text-white">How We Build Software</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#090D16]/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">🪶</span>
              <h3 className="text-base font-bold text-white font-mono">&lt;5KB Featherweight SDK</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Legacy APMs bundle 100KB+ of heavy DOM serializers and profilers that hurt Google Core Web Vitals. SnapTrace relies on native browser event interception and asynchronous beacon transport for a strictly zero-penalty main thread impact.
              </p>
            </div>

            <div className="bg-[#090D16]/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">🔒</span>
              <h3 className="text-base font-bold text-white font-mono">Zero-Trust Client-Side Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Sensitive customer data should never traverse the network. Passwords, authorization tokens, credit cards, and emails are scrubbed with on-device regex on the user machine before crash payloads are ever transmitted.
              </p>
            </div>

            <div className="bg-[#090D16]/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">🔇</span>
              <h3 className="text-base font-bold text-white font-mono">Anti-Fatigue Loop Throttling</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Infinite re-render loops and cascading outages should not wake up developers with 5,000 duplicate emails. Our deterministic SHA-256 fingerprinting collapses cascading failures into single summary incident alerts.
              </p>
            </div>

            <div className="bg-[#090D16]/90 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
              <span className="text-2xl">💎</span>
              <h3 className="text-base font-bold text-white font-mono">Radical Pricing Transparency</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                No complex multi-metered calculators, and no surprise overage invoices. Predictable flat-rate monthly and annual tiers designed for indie developers, software studios, and growing production teams.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Professional Message from the Founder */}
        <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md font-mono">
              MA
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">A Message from the Founder</h3>
              <p className="text-[11px] text-slate-400 font-mono">Muhammad Arslan • Founder & Lead Engineer, SnapTrace</p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            <p>
              When I set out to build SnapTrace, it came from a direct frustration that I believe every modern developer shares: the monitoring tools we rely on have become bloated, noisy, and disconnected from our daily coding workflow.
            </p>
            <p>
              When an application crashes on a Sunday, an engineer does not need twenty duplicate email notifications that all stem from a single database timeout. What they need is immediate root-cause isolation, an AI-ready diagnostic prompt they can drop straight into Cursor or VS Code, and the confidence that their monitoring SDK is not dragging down user experience.
            </p>
            <p>
              SnapTrace is built independently with deep craftsmanship. We are committed to building software that respects developer time, safeguards customer privacy, and stays fast and dependable every single day.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px] font-mono text-slate-500">
            <span>Islamabad, Pakistan</span>
            <span className="text-yellow-400 font-bold">SnapTrace Engineering</span>
          </div>
        </div>

        {/* 3. Studio Location & Headquarters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#090D16]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-bold uppercase tracking-wider">
              <span>📍</span> Headquarters & Location
            </div>
            <h3 className="text-lg font-bold text-white font-mono">Islamabad, Pakistan</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Founded in Islamabad, Pakistan, SnapTrace operates on globally distributed cloud edge infrastructure. Our ingestion endpoints are positioned globally to ensure sub-millisecond telemetry reception worldwide.
            </p>
          </div>

          <div className="md:col-span-5 bg-[#05070E] border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Region:</span>
              <span className="text-slate-200">Islamabad (PKT / UTC+5)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Infrastructure:</span>
              <span className="text-emerald-400 font-bold">Global Edge Cluster</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">Availability:</span>
              <span className="text-emerald-400 font-bold">● 99.9% Uptime</span>
            </div>
          </div>
        </div>

        {/* 4. Direct Founder & Support Line */}
        <div className="bg-[#090D16]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="space-y-2 max-w-md mx-auto">
            <span className="text-2xl">📬</span>
            <h3 className="text-xl font-bold text-white font-mono">Get in Touch with Us</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Have questions about SDK integration, custom enterprise scale, or early beta feedback? Reach out directly to our engineering desk.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-[#05070E] border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner font-mono text-xs">
            <span className="text-yellow-300 font-bold truncate pl-2">
              {supportEmail}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyEmail}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                {copiedEmail ? '✓ Copied' : 'Copy'}
              </button>
              <a
                href={'mailto:' + supportEmail}
                className="px-4 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-sm"
              >
                Send Message →
              </a>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-mono">
            Guaranteed response time from our founder within 24 hours.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <span>© {new Date().getFullYear()} SnapTrace. The Independent Developer Telemetry Platform.</span>
          <div className="flex items-center space-x-5 text-slate-400">
            <Link href="/privacy" className="hover:text-yellow-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-yellow-400 transition">Terms of Service</Link>
            <Link href="/demo" className="hover:text-yellow-400 transition">Live Demo</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}