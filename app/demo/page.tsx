'use client';

import { useState } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import {
  ShieldCheck,
  Activity,
  Clock,
  Printer,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

type ProjectOption = 'Shopify E-Commerce Store (Acme Corp)' | 'Next.js SaaS Platform (PulseHQ)';

interface ProjectData {
  clientName: string;
  projectName: string;
  endpoints: Array<{
    route: string;
    incidents: number;
    description: string;
    status: string;
  }>;
}

const PROJECTS_DATA: Record<ProjectOption, ProjectData> = {
  'Shopify E-Commerce Store (Acme Corp)': {
    clientName: 'Acme Corp',
    projectName: 'Shopify E-Commerce Store (Acme Corp)',
    endpoints: [
      {
        route: '/api/checkout',
        incidents: 18,
        description: 'Payment gateway timeout and inventory concurrency lock',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/cart/sync',
        incidents: 14,
        description: 'Redis cart cache deserialization mismatch',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/auth/callback',
        incidents: 6,
        description: 'Customer OAuth state nonce expiration',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/dashboard',
        incidents: 4,
        description: 'Hydration payload boundary reconciliation',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
    ],
  },
  'Next.js SaaS Platform (PulseHQ)': {
    clientName: 'PulseHQ',
    projectName: 'Next.js SaaS Platform (PulseHQ)',
    endpoints: [
      {
        route: '/api/checkout',
        incidents: 21,
        description: 'Stripe subscription webhook idempotency collision',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/auth/callback',
        incidents: 11,
        description: 'Enterprise SSO SAML clock-skew tolerance adjustment',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/dashboard',
        incidents: 7,
        description: 'Edge SSR streaming chunk termination error',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
      {
        route: '/cart/sync',
        incidents: 3,
        description: 'KV store rate-limit exponential backoff retry',
        status: 'Intercepted & Resolved by Agency Engineering',
      },
    ],
  },
};

const COLOR_PRESETS = [
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Amber', hex: '#F59E0B' },
];

export default function DemoSandboxPage() {
  const [agencyName, setAgencyName] = useState<string>('Apex Digital Agency');
  const [selectedProject, setSelectedProject] = useState<ProjectOption>(
    'Shopify E-Commerce Store (Acme Corp)'
  );
  const [accentColor, setAccentColor] = useState<string>('#10B981');
  const [copiedInvoiceNote, setCopiedInvoiceNote] = useState<boolean>(false);

  const activeProject = PROJECTS_DATA[selectedProject];
  const displayAgency = agencyName.trim() || 'Apex Digital Agency';

  const handleCopyInvoiceNote = () => {
    const note = `[Monthly Maintenance Statement - ${activeProject.clientName}]
• Reliability Index: 99.94%
• Production Exceptions Neutralized: 42
• Core Web Vitals Status: 100/100 (0.0ms delay)
Maintained & Monitored by ${displayAgency}`;

    navigator.clipboard.writeText(note);
    setCopiedInvoiceNote(true);
    setTimeout(() => setCopiedInvoiceNote(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* High-Fidelity Distraction-Free Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #09090b !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav,
          header,
          .no-print {
            display: none !important;
          }
          .print-canvas {
            background: #ffffff !important;
            color: #09090b !important;
            border: 1px solid #e4e4e7 !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-canvas * {
            color: #09090b !important;
            border-color: #e4e4e7 !important;
          }
          .print-kpi-box {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          .print-accent-text {
            color: #059669 !important;
          }
          .print-badge-box {
            background: #ecfdf5 !important;
            border: 1px solid #a7f3d0 !important;
            color: #047857 !important;
          }
          .print-table-bg {
            background: #ffffff !important;
          }
          .print-invoice-note {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-700 selection:text-zinc-100 antialiased flex flex-col">

        {/* TOP BRAND BAR (Hidden on Print) */}
        <header className="no-print border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
              <SnapTraceLogo size="sm" showText={true} />
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-xs font-mono text-zinc-400">
              Interactive Agency Report Sandbox
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition hidden sm:inline"
            >
              Start Free Agency Trial
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition hidden sm:inline"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* A. INTERACTIVE CUSTOMIZER BAR (Sticky Top of Screen) */}
        <div className="no-print sticky top-0 z-20 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Customization Inputs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
              
              {/* Agency Name Input */}
              <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 focus-within:border-zinc-600 transition min-w-[220px]">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Agency:
                </span>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Apex Digital Agency"
                  className="bg-transparent text-xs text-zinc-100 font-medium placeholder:text-zinc-600 outline-none w-full font-sans"
                />
              </div>

              {/* Client Project Selector */}
              <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5">
                {(['Shopify E-Commerce Store (Acme Corp)', 'Next.js SaaS Platform (PulseHQ)'] as const).map(
                  (project) => (
                    <button
                      key={project}
                      type="button"
                      onClick={() => setSelectedProject(project)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                        selectedProject === project
                          ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {project === 'Shopify E-Commerce Store (Acme Corp)' ? 'Shopify Store' : 'Next.js SaaS'}
                    </button>
                  )
                )}
              </div>

              {/* Brand Accent Color Pills */}
              <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5">
                <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">
                  Accent:
                </span>
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setAccentColor(color.hex)}
                    title={color.name}
                    className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                      accentColor === color.hex ? 'scale-125 ring-2 ring-white/40' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Action Button 1: Print / Download Sample PDF */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition cursor-pointer flex items-center gap-2 font-mono shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-400" />
                <span>Print / Download Sample PDF</span>
              </button>

              {/* Action Button 2 (Conversion CTA) */}
              <Link
                href="/signup"
                className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition flex items-center gap-1.5 font-mono shadow-sm"
              >
                <span>Connect Your Sentry Account (14-Day Free Trial)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>

        {/* B. THE SAMPLE DELIVERABLE CANVAS (Center) */}
        <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">

          <div className="print-canvas bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-9 space-y-7 shadow-2xl transition-all">

            {/* Canvas Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 border-b border-zinc-800/80 pb-6">
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Agency Monogram Badge */}
                  <div
                    className="h-9 px-3 rounded-lg flex items-center justify-center font-bold text-xs tracking-wider uppercase text-zinc-950 font-mono shadow-xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {displayAgency.slice(0, 3)}
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
                      {displayAgency}
                    </h1>
                    <p className="text-xs text-zinc-400 font-mono">
                      Client Reliability Statement
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium print-badge-box">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    <span style={{ color: accentColor }}>
                      Certified 24/7 Production Observability · SLA Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Project & Period Metadata */}
              <div className="text-left sm:text-right font-mono text-xs text-zinc-400 space-y-1 bg-zinc-950/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-zinc-800">
                <div className="text-zinc-200 font-semibold">
                  Client Application: {activeProject.projectName}
                </div>
                <div className="text-zinc-400">
                  Period: September 2026
                </div>
                <div className="text-[11px] text-zinc-500">
                  Evaluation Scope: Production Cloud Fleet
                </div>
                <div className="text-[11px] text-zinc-500">
                  Target Account: {activeProject.clientName}
                </div>
              </div>

            </div>

            {/* THE 3 CORE RETAINER METRICS (Executive KPI Strip) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* Metric 1: System Health Score */}
              <div className="print-kpi-box bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    System Health Score
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Live</span>
                  </div>
                </div>
                <div
                  className="font-mono text-3xl sm:text-4xl font-bold tabular-nums print-accent-text"
                  style={{ color: accentColor }}
                >
                  99.94%
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Operational uptime meeting and exceeding retainer SLA threshold.
                </p>
              </div>

              {/* Metric 2: Silent Exceptions Intercepted */}
              <div className="print-kpi-box bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Silent Exceptions Intercepted
                  </span>
                  <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-bold text-zinc-100 tabular-nums">
                  42
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Production outages neutralized before client customers noticed.
                </p>
              </div>

              {/* Metric 3: Google Core Web Vitals Impact */}
              <div className="print-kpi-box bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Core Web Vitals Impact
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-bold text-emerald-400 tabular-nums print-accent-text">
                  0.0ms
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Guaranteed zero client performance delay · 100/100 Lighthouse audit score.
                </p>
              </div>

            </div>

            {/* PROTECTED ENDPOINTS TABLE */}
            <div className="print-table-bg bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight uppercase">
                    Protected Endpoints &amp; Subsystems
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Mission-critical routes monitored by {displayAgency} engineering.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Telemetry Active
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {activeProject.endpoints.map((ep, idx) => (
                  <div
                    key={ep.route}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700/60 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-semibold w-4 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-zinc-200 font-bold">
                          {ep.route}
                        </span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                          style={{
                            borderColor: `${accentColor}40`,
                            backgroundColor: `${accentColor}15`,
                            color: accentColor,
                          }}
                        >
                          {ep.incidents} Intercepted
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans pl-6">
                        {ep.description}
                      </p>
                    </div>

                    <div className="text-left sm:text-right text-[11px] font-medium text-emerald-400 shrink-0 pl-6 sm:pl-0">
                      {ep.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EXECUTIVE SUMMARY NOTE (For Invoices) */}
            <div className="print-invoice-note bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
                    Executive Summary Note (For Monthly Retainer Invoices)
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Pre-formatted 4-line snippet ready to paste directly into QuickBooks, Stripe, or Xero invoices.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyInvoiceNote}
                  className="no-print px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shadow-xs"
                  title="Copy retainer invoice note"
                >
                  {copiedInvoiceNote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy Invoice Note</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-300 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
{`[Monthly Maintenance Statement - ${activeProject.clientName}]
• Reliability Index: 99.94%
• Production Exceptions Neutralized: 42
• Core Web Vitals Status: 100/100 (0.0ms delay)
Maintained & Monitored by ${displayAgency}`}
              </pre>
            </div>

            {/* AGENCY SIGNATURE FOOTER */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">
                  Verified by {displayAgency} 24/7 Production Observability
                </span>
                <span>·</span>
                <span>Automated Retainer Certification</span>
              </div>

              <div>
                Confidential Client Retainer Deliverable
              </div>
            </div>

          </div>

          {/* CONVERSION CALLOUT BELOW CANVAS (Hidden on Print) */}
          <div className="no-print bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold tracking-wide uppercase">
                Zero Code Migration
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                Ready to turn Sentry into $1,500/mo retainer deliverables?
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                Connect your existing Sentry read-only tokens in 30 seconds. Your clients receive white-label branded PDF statements certifying the bugs you stopped before they noticed.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/signup"
                className="px-5 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition font-mono shadow-sm"
              >
                Start Free Agency Trial →
              </Link>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}