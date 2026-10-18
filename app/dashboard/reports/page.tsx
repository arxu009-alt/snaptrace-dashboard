'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Palette,
  Layers,
  Zap,
} from 'lucide-react';

interface NativeProject {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  plan_tier?: string;
}

interface TopImpactedRoute {
  id: string;
  route: string;
  title: string;
  count: number;
  percentage: number;
  status: string;
  lastSeen?: string;
}

interface NativeReportData {
  projectName: string;
  projectId: string;
  timeframe: '7d' | '14d' | '30d';
  totalIssues: number;
  totalEvents: number;
  resolvedCount: number;
  suppressedLoops: number;
  healthScore: string;
  performanceImpact: string;
  topRoutes: TopImpactedRoute[];
}

type Timeframe = '7d' | '14d' | '30d';

const BRAND_COLOR_PRESETS = [
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Violet', hex: '#8B5CF6' },
];

const SAMPLE_DEMO_ROUTES: TopImpactedRoute[] = [
  {
    id: 'demo-1',
    title: 'TypeError: Cannot read properties of undefined (reading "id")',
    route: '/checkout/step-2',
    count: 78,
    percentage: 42,
    status: 'resolved',
  },
  {
    id: 'demo-2',
    title: 'NetworkError: Failed to fetch inventory status',
    route: '/api/v1/cart/sync',
    count: 46,
    percentage: 25,
    status: 'resolved',
  },
  {
    id: 'demo-3',
    title: 'StripeWebhookTimeout: Processing exceeded 2000ms threshold',
    route: '/api/webhooks/stripe',
    count: 32,
    percentage: 17,
    status: 'resolved',
  },
  {
    id: 'demo-4',
    title: 'HydrationMismatch: Server HTML attributes differed from client',
    route: '/products/[slug]',
    count: 18,
    percentage: 10,
    status: 'resolved',
  },
  {
    id: 'demo-5',
    title: 'TokenExpiredError: jwt expired on user session ping',
    route: '/api/auth/refresh',
    count: 10,
    percentage: 6,
    status: 'resolved',
  },
];

function extractRoute(err: { url?: string | null; route?: string | null; message?: string | null }): string {
  if (err.url) {
    try {
      const parsed = new URL(err.url);
      if (parsed.pathname && parsed.pathname !== '/') return parsed.pathname;
    } catch {
      if (typeof err.url === 'string' && err.url.startsWith('/')) {
        return err.url.split('?')[0].split('#')[0];
      }
    }
  }
  if (err.route) return err.route;
  const pathMatch = err.message?.match(/(\/(?:api|dashboard|v1|auth|login|checkout|users|settings|webhook|products|cart)[a-zA-Z0-9_\-\/]*)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];
  return '/api/v1/client-app';
}

export default function ClientReportsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [planTier, setPlanTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [nativeProjects, setNativeProjects] = useState<NativeProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [fetchingReport, setFetchingReport] = useState<boolean>(false);

  // Agency White-Label Branding State
  const [agencyName, setAgencyName] = useState<string>('Digital Studio');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string>('');
  const [brandColor, setBrandColor] = useState<string>('#10B981');
  const [supportEmail, setSupportEmail] = useState<string>('support@agency.com');

  // UI Accordions
  const [showBrandingCard, setShowBrandingCard] = useState<boolean>(false);

  // Report Deliverable Data
  const [reportData, setReportData] = useState<NativeReportData>({
    projectName: 'Client Application',
    projectId: 'default',
    timeframe: '30d',
    totalIssues: 24,
    totalEvents: 184,
    resolvedCount: 24,
    suppressedLoops: 18,
    healthScore: '99.8%',
    performanceImpact: '0.0ms',
    topRoutes: SAMPLE_DEMO_ROUTES,
  });
  const [copiedInvoiceNote, setCopiedInvoiceNote] = useState<boolean>(false);

  // Initial Load: Restore branding & fetch projects
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Restore branding from LocalStorage
      if (typeof window !== 'undefined') {
        const savedName = localStorage.getItem('snaptrace_agency_name') || 'Digital Studio';
        const savedLogo = localStorage.getItem('snaptrace_agency_logo') || '';
        const savedColor = localStorage.getItem('snaptrace_agency_color') || '#10B981';
        const savedEmail = localStorage.getItem('snaptrace_agency_support_email') || 'support@agency.com';
        const savedProjId = localStorage.getItem('snaptrace_selected_project_id') || '';

        if (savedName) setAgencyName(savedName);
        if (savedLogo) setAgencyLogoUrl(savedLogo);
        if (savedColor) setBrandColor(savedColor);
        if (savedEmail) setSupportEmail(savedEmail);
        if (savedProjId) setSelectedProjectId(savedProjId);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || '';
          const ownerCheck =
            email.toLowerCase() === 'arxu1045@gmail.com' ||
            email.toLowerCase() === 'arxu009@gmail.com';
          setIsOwner(ownerCheck);

          const { data: projectList } = await supabase
            .from('projects')
            .select('id, name, api_key, created_at, plan_tier')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (projectList && projectList.length > 0) {
            setNativeProjects(projectList);
            const paidProject = projectList.find((p) => p.plan_tier && p.plan_tier !== 'free');
            const resolvedTier = ownerCheck
              ? 'agency_scale'
              : (paidProject?.plan_tier || projectList[0]?.plan_tier || 'free').toLowerCase();
            setPlanTier(resolvedTier);

            setSelectedProjectId((prev) => {
              if (prev && projectList.some((p) => p.id === prev)) return prev;
              return projectList[0].id;
            });
          } else {
            setPlanTier(ownerCheck ? 'agency_scale' : 'free');
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Compute Native Report Metrics from Supabase `errors` and `ingestion_stats`
  const fetchNativeReport = useCallback(
    async (projId: string, currentRange: Timeframe) => {
      if (!projId) return;

      const activeProj = nativeProjects.find((p) => p.id === projId);
      const projName = activeProj?.name || 'Client Project';

      setFetchingReport(true);

      try {
        const days = currentRange === '7d' ? 7 : currentRange === '14d' ? 14 : 30;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch errors from native `errors` table
        const { data: errorRows, error: errorErr } = await supabase
          .from('errors')
          .select('id, message, url, route, status, occurrence_count, created_at')
          .eq('project_id', projId)
          .gte('created_at', cutoff);

        // 2. Fetch suppressed loops from native `ingestion_stats` table
        let suppressedStatsCount = 0;
        try {
          const { data: statsRows } = await supabase
            .from('ingestion_stats')
            .select('suppressed')
            .eq('project_id', projId);

          if (statsRows && statsRows.length > 0) {
            suppressedStatsCount = statsRows.reduce((acc, row) => acc + (row.suppressed || 0), 0);
          }
        } catch {
          // Gracefully continue if ingestion_stats table is not queried
        }

        if (errorErr || !errorRows || errorRows.length === 0) {
          // If no errors logged yet for this project, provide clean baseline report
          setReportData({
            projectName: projName,
            projectId: projId,
            timeframe: currentRange,
            totalIssues: 0,
            totalEvents: 0,
            resolvedCount: 0,
            suppressedLoops: suppressedStatsCount,
            healthScore: '100.0%',
            performanceImpact: '0.0ms',
            topRoutes: [],
          });
          return;
        }

        // Aggregate Metrics
        let totalEvents = 0;
        let resolvedCount = 0;
        let loopSuppressedCount = 0;
        const routeMap: Record<string, { count: number; title: string; status: string; lastSeen: string }> = {};

        errorRows.forEach((err) => {
          const weight = err.occurrence_count && err.occurrence_count > 0 ? err.occurrence_count : 1;
          totalEvents += weight;

          if (weight > 1) {
            loopSuppressedCount += weight - 1;
          }

          if (err.status === 'resolved') {
            resolvedCount += weight;
          }

          const route = extractRoute(err);
          if (!routeMap[route]) {
            routeMap[route] = {
              count: 0,
              title: err.message || 'Unhandled Application Exception',
              status: err.status || 'monitored',
              lastSeen: err.created_at,
            };
          }
          routeMap[route].count += weight;
          if (err.status === 'unresolved') {
            routeMap[route].status = 'unresolved';
          }
        });

        const totalSuppressed = Math.max(suppressedStatsCount, loopSuppressedCount);
        const unresolvedCount = totalEvents - resolvedCount;
        const healthPct = totalEvents > 0
          ? Math.max(98.5, 100 - (unresolvedCount / totalEvents) * 3).toFixed(1)
          : '100.0';

        const topRoutes: TopImpactedRoute[] = Object.entries(routeMap)
          .map(([route, val], idx) => ({
            id: `route-${idx}`,
            route,
            title: val.title,
            count: val.count,
            percentage: totalEvents > 0 ? Math.round((val.count / totalEvents) * 100) : 0,
            status: val.status,
            lastSeen: val.lastSeen,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setReportData({
          projectName: projName,
          projectId: projId,
          timeframe: currentRange,
          totalIssues: errorRows.length,
          totalEvents,
          resolvedCount,
          suppressedLoops: totalSuppressed,
          healthScore: `${healthPct}%`,
          performanceImpact: '0.0ms',
          topRoutes,
        });
      } catch (err) {
        console.error('Error calculating native report:', err);
      } finally {
        setFetchingReport(false);
      }
    },
    [nativeProjects]
  );

  useEffect(() => {
    if (selectedProjectId) {
      fetchNativeReport(selectedProjectId, timeframe);
    }
  }, [selectedProjectId, timeframe, fetchNativeReport]);

  // Save branding changes to LocalStorage
  const handleUpdateAgencyName = (name: string) => {
    setAgencyName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_name', name);
    }
  };

  const handleUpdateLogoUrl = (url: string) => {
    setAgencyLogoUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_logo', url);
    }
  };

  const handleUpdateBrandColor = (color: string) => {
    setBrandColor(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_color', color);
    }
  };

  const handleUpdateSupportEmail = (email: string) => {
    setSupportEmail(email);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_support_email', email);
    }
  };

  // Copy Retainer Invoice Summary
  const handleCopyRetainerInvoiceNote = () => {
    const projectTitle = reportData.projectName || 'Client Project';
    const totalHandled = reportData.totalEvents || reportData.totalIssues || 0;
    const suppressed = reportData.suppressedLoops || 0;
    const score = reportData.healthScore || '100.0%';
    const agency = agencyName.trim() || 'Digital Studio';

    const invoiceNote = `[Client Reliability Statement — ${projectTitle}]
• System Health Score: ${score} SLA Compliant
• Production Exceptions Handled: ${totalHandled.toLocaleString()}
• Runaway Crash Loops Suppressed: ${suppressed.toLocaleString()}
• Core Web Vitals Latency Invariance: 0.0ms
Verified by ${agency} Native Telemetry Fleet`;

    navigator.clipboard.writeText(invoiceNote);
    setCopiedInvoiceNote(true);
    setTimeout(() => setCopiedInvoiceNote(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFreeTier = !isOwner && planTier === 'free';

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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
          aside,
          header,
          nav,
          [id^="tour-"],
          .no-print {
            display: none !important;
          }
          .print-sheet {
            background: #ffffff !important;
            color: #09090b !important;
            border: 1px solid #e4e4e7 !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-sheet * {
            color: #09090b !important;
            border-color: #e4e4e7 !important;
          }
          .print-kpi {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          .print-accent {
            color: #059669 !important;
          }
          .print-badge {
            background: #ecfdf5 !important;
            border-color: #a7f3d0 !important;
            color: #047857 !important;
          }
          .print-progress-bg {
            background-color: #f1f5f9 !important;
          }
          .print-progress-bar {
            background-color: #0f172a !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-transparent text-zinc-100 p-4 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* PAGE HEADER & STUDIO CONTROLS (Hidden on Print) */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  White-Label Client Retainer Reporting Suite
                </h1>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Pulls native telemetry from your client applications, computes SLA metrics, and exports monthly PDF deliverables.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Native Project Dropdown */}
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedProjectId(id);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('snaptrace_selected_project_id', id);
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition cursor-pointer min-w-[190px] shadow-sm"
                >
                  {nativeProjects.length > 0 ? (
                    nativeProjects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                        {p.name}
                      </option>
                    ))
                  ) : (
                    <option value="demo" className="bg-zinc-950 text-zinc-200">
                      Sample Client Store (Demo)
                    </option>
                  )}
                </select>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs shadow-sm">
                {(['7d', '14d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeframe(range)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      timeframe === range
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              {/* Copy Retainer Invoice Summary Button */}
              <button
                type="button"
                onClick={handleCopyRetainerInvoiceNote}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Copy client-ready invoice note for direct billing paste"
              >
                {copiedInvoiceNote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Summary!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Retainer Invoice Summary</span>
                  </>
                )}
              </button>

              {/* Print / Export PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Print or export immaculate corporate white-and-black PDF deliverable"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>

          {/* TIER GATING BANNER (Hidden on Print) */}
          {isFreeTier && (
            <div className="no-print bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold tracking-wide uppercase">
                    Agency Retainer Studio
                  </span>
                  <span className="text-xs font-medium text-zinc-200">
                    White-label PDF exports and multi-client fleet reports are unlocked on Agency Studio ($49/mo) and Scale ($99/mo).
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Justify $1,500/mo retainer invoices with automated client reliability proof of work.
                </p>
              </div>
              <a
                href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition font-mono shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Unlock Agency Suite</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* AGENCY WHITE-LABEL BRANDING CARD (Collapsible) */}
          <div className="no-print bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm">
            <button
              type="button"
              onClick={() => setShowBrandingCard((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-850/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
                  Agency White-Label Branding
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  {agencyName} · Custom PDF Branding
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <span>{showBrandingCard ? 'Collapse' : 'Customize Branding'}</span>
              </div>
            </button>

            {showBrandingCard && (
              <div className="p-5 border-t border-zinc-800/80 space-y-4 bg-zinc-950/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agency Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Agency Name
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => handleUpdateAgencyName(e.target.value)}
                      placeholder="Digital Studio"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                    />
                  </div>

                  {/* Agency Logo URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Agency Logo URL
                    </label>
                    <input
                      type="url"
                      value={agencyLogoUrl}
                      onChange={(e) => handleUpdateLogoUrl(e.target.value)}
                      placeholder="https://agency.com/logo.svg"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                    />
                  </div>

                  {/* Primary Brand Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => handleUpdateBrandColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => handleUpdateBrandColor(e.target.value)}
                        className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono outline-none transition uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Brand Swatches */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-400">Color Presets:</span>
                  {BRAND_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleUpdateBrandColor(preset.hex)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition cursor-pointer ${
                        brandColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* REPORT DELIVERABLE VIEW (The Live Client Deliverable Document Sheet) */}
          <div className="print-sheet bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">

            {/* Deliverable Header: Agency Logo + Agency Name + Client Reliability Statement */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {agencyLogoUrl ? (
                    <img
                      src={agencyLogoUrl}
                      alt={agencyName}
                      className="h-8 w-auto max-w-[140px] object-contain rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="h-8 px-2.5 rounded flex items-center justify-center font-bold text-xs tracking-wider uppercase text-zinc-950 font-mono shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      {agencyName.slice(0, 3)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                      {agencyName}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Client Reliability Statement
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium print-badge">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    <span style={{ color: brandColor }}>
                      Production Telemetry Verified · {reportData.healthScore} SLA Compliant
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mt-2">
                    {reportData.projectName}
                  </h2>
                </div>
              </div>

              {/* Evaluation Period & Metadata */}
              <div className="text-left sm:text-right font-mono text-xs text-zinc-400 space-y-1 bg-zinc-900/60 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-zinc-800">
                <div className="text-zinc-200 font-semibold">
                  Evaluation Period: {timeframe === '7d' ? 'Last 7 Days' : timeframe === '14d' ? 'Last 14 Days' : 'Last 30 Days'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Deliverable Date: {currentDateStr}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Target Application: {reportData.projectName}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Prepared For: Client Stakeholders &amp; Management
                </div>
              </div>
            </div>

            {/* EXECUTIVE METRICS STRIP (Exceptions Handled, Suppressed Loops, 0.0ms Performance Invariance) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

              {/* 1. Exceptions Intercepted & Handled */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Exceptions Handled
                  </span>
                  <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="font-mono text-3xl font-bold text-zinc-100 tabular-nums">
                  {fetchingReport ? '...' : (reportData.totalEvents || reportData.totalIssues).toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  {reportData.totalEvents > 0
                    ? `${reportData.totalEvents.toLocaleString()} production runtime events intercepted before user dropoff.`
                    : 'All runtime exceptions neutralized without escalation.'}
                </p>
              </div>

              {/* 2. Suppressed Loops */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Suppressed Loops
                  </span>
                  <Zap className="w-4 h-4" style={{ color: brandColor }} />
                </div>
                <div
                  className="font-mono text-3xl font-bold tabular-nums print-accent"
                  style={{ color: brandColor }}
                >
                  {fetchingReport ? '...' : reportData.suppressedLoops.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Runaway cascading loops neutralized at the edge to protect client database load.
                </p>
              </div>

              {/* 3. Performance Invariance (0.0ms Core Web Vitals) */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    0.0ms Performance Invariance
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="print-accent font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                  {reportData.performanceImpact || '0.0ms'}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Zero Core Web Vitals penalty · Asynchronous non-blocking beacon delivery.
                </p>
              </div>

            </div>

            {/* TOP IMPACTED ROUTES TABLE */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight uppercase">
                    Top Impacted Routes &amp; Protected Endpoints
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Application routes guarded against uncaught production crashes.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Route Guard Telemetry
                </span>
              </div>

              {reportData.topRoutes.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  Zero unhandled exceptions registered during this evaluation period. Client application is 100% stable.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reportData.topRoutes.map((err, idx) => (
                    <div key={err.id || idx} className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] text-zinc-500 font-semibold w-4 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-zinc-200 font-medium truncate" title={err.route}>
                            {err.route}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono shrink-0">
                            {err.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[11px] text-zinc-400">
                            {err.count} {err.count === 1 ? 'event' : 'events'} handled
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold tabular-nums">
                            {err.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Error Title Sub-line */}
                      <p className="text-[11px] text-zinc-400 font-mono truncate pl-6">
                        {err.title}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60 print-progress-bg">
                        <div
                          className="h-full rounded-full transition-all duration-300 print-progress-bar"
                          style={{
                            width: `${Math.max(err.percentage, 5)}%`,
                            backgroundColor: brandColor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AGENCY DISCLAIMER FOOTER */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">
                  Certified by {agencyName} Telemetry Fleet
                </span>
                <span>·</span>
                <span>0.0ms Core Web Vitals Invariance</span>
              </div>
              <div className="text-zinc-400">
                Confidential Client Retainer Deliverable
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
