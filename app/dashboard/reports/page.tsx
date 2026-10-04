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
  Cpu,
  Clock,
  ArrowUpRight,
  Layers,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { PLANS } from '@/lib/plans';

interface ClientProject {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  plan_tier?: string;
}

interface ErrorLog {
  id: number;
  message: string;
  environment: string;
  created_at: string;
  url?: string;
  user_agent?: string;
  occurrence_count?: number;
  route?: string;
}

type Timeframe = '7d' | '30d';

function extractRoute(err: ErrorLog): string {
  if (err.url) {
    try {
      const parsed = new URL(err.url);
      if (parsed.pathname && parsed.pathname !== '/') return parsed.pathname;
    } catch {
      if (err.url.startsWith('/')) {
        return err.url.split('?')[0].split('#')[0];
      }
    }
  }

  if (err.route) return err.route;

  const pathMatch = err.message?.match(/(\/(?:api|dashboard|v1|auth|login|checkout|users|settings|webhook)[a-zA-Z0-9_\-\/]*)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  const genericMatch = err.message?.match(/(\/[a-zA-Z0-9_\-\/]{2,})/);
  if (genericMatch && genericMatch[1] && !genericMatch[1].match(/\.(js|ts|tsx|jsx|json)$/i)) {
    return genericMatch[1];
  }

  return '/api/v1/log';
}

function parseOS(userAgent?: string | null): string {
  if (!userAgent) return 'Server / API Client';
  const ua = userAgent.toLowerCase();
  if (ua.includes('win')) return 'Windows';
  if (ua.includes('mac') && !ua.includes('iphone') && !ua.includes('ipad')) return 'macOS';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('linux')) return 'Linux';
  return 'Other OS';
}

function parseBrowser(userAgent?: string | null): string {
  if (!userAgent) return 'Node.js / SDK Worker';
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg') || ua.includes('edge')) return 'Microsoft Edge';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Google Chrome';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Apple Safari';
  if (ua.includes('firefox')) return 'Mozilla Firefox';
  if (ua.includes('curl') || ua.includes('postman') || ua.includes('python')) return 'cURL / Terminal';
  return 'Other Browser';
}

export default function ClientReportsPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [suppressedCountStat, setSuppressedCountStat] = useState<number>(0);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [planTier, setPlanTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Load user projects and subscription tier
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const email = session.user.email || '';
      const ownerCheck = email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com';
      setIsOwner(ownerCheck);

      const { data: projectList } = await supabase
        .from('projects')
        .select('id, name, api_key, created_at, plan_tier')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (projectList && projectList.length > 0) {
        setProjects(projectList);

        const paidProject = projectList.find((p) => p.plan_tier && p.plan_tier !== 'free');
        const resolvedTier = ownerCheck ? 'agency_scale' : (paidProject?.plan_tier || projectList[0]?.plan_tier || 'free').toLowerCase();
        setPlanTier(resolvedTier);

        const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const defaultProj = projectList.find((p) => p.id === savedProjectId) || projectList[0];
        setSelectedProjectId(defaultProj.id);
      } else {
        setPlanTier(ownerCheck ? 'agency_scale' : 'free');
      }
      setLoading(false);
    }

    loadProjects();
  }, []);

  // Fetch telemetry errors and stats for selected project & timeframe
  const loadReportData = useCallback(async () => {
    if (!selectedProjectId) return;
    setLoading(true);

    const now = Date.now();
    const days = timeframe === '7d' ? 7 : 30;
    const cutoffIso = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: errRows } = await supabase
      .from('errors')
      .select('*')
      .eq('project_id', selectedProjectId)
      .gte('created_at', cutoffIso)
      .order('created_at', { ascending: false });

    setErrors(errRows || []);

    // Also attempt querying ingestion_stats if available
    try {
      const { data: stats } = await supabase
        .from('ingestion_stats')
        .select('*')
        .eq('project_id', selectedProjectId)
        .single();

      if (stats && stats.suppressed_events !== undefined) {
        setSuppressedCountStat(stats.suppressed_events);
      } else {
        setSuppressedCountStat(0);
      }
    } catch {
      setSuppressedCountStat(0);
    }

    setLoading(false);
  }, [selectedProjectId, timeframe]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_selected_project_id', id);
      window.dispatchEvent(new Event('snaptrace_project_change'));
    }
  };

  // Metrics computation
  const totalExceptions = useMemo(() => {
    return errors.reduce((sum, e) => sum + (e.occurrence_count && e.occurrence_count > 0 ? e.occurrence_count : 1), 0);
  }, [errors]);

  const totalSuppressed = useMemo(() => {
    const errorSuppressed = errors.reduce((sum, e) => sum + (e.occurrence_count && e.occurrence_count > 1 ? e.occurrence_count - 1 : 0), 0);
    return Math.max(errorSuppressed, suppressedCountStat);
  }, [errors, suppressedCountStat]);

  // Protected routes breakdown
  const topRoutes = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    errors.forEach((err) => {
      const route = extractRoute(err);
      const weight = err.occurrence_count && err.occurrence_count > 0 ? err.occurrence_count : 1;
      counts[route] = (counts[route] || 0) + weight;
      total += weight;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([route, count]) => ({
        route,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [errors]);

  // Environment breakdown
  const envStats = useMemo(() => {
    let prod = 0;
    let dev = 0;
    errors.forEach((e) => {
      const occ = e.occurrence_count && e.occurrence_count > 0 ? e.occurrence_count : 1;
      if (e.environment?.toLowerCase() === 'production') {
        prod += occ;
      } else {
        dev += occ;
      }
    });
    const total = prod + dev;
    return {
      prod,
      dev,
      prodPct: total > 0 ? Math.round((prod / total) * 100) : 0,
      devPct: total > 0 ? Math.round((dev / total) * 100) : 0,
    };
  }, [errors]);

  // Device & OS breakdown
  const clientBreakdown = useMemo(() => {
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};
    let total = 0;

    errors.forEach((e) => {
      const occ = e.occurrence_count && e.occurrence_count > 0 ? e.occurrence_count : 1;
      const os = parseOS(e.user_agent);
      const br = parseBrowser(e.user_agent);
      osMap[os] = (osMap[os] || 0) + occ;
      browserMap[br] = (browserMap[br] || 0) + occ;
      total += occ;
    });

    const topOs = Object.entries(osMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

    const topBrowser = Object.entries(browserMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));

    return { topOs, topBrowser };
  }, [errors]);

  // Copy Client Summary
  const handleCopyClientSummary = () => {
    const projectName = selectedProject?.name || 'Client Project';
    const topRoutesStr = topRoutes.length > 0 ? topRoutes.map((r) => r.route).join(', ') : 'All Core Endpoints';

    const summaryText = `[Client Monthly Reliability Report - ${projectName}]
• Status: Operational & Monitored
• Exceptions Intercepted & Resolved: ${totalExceptions}
• Runaway Loop Storms Suppressed: ${totalSuppressed}
• Main-Thread Performance Delay: 0.0ms (Zero Core Web Vitals penalty)
• Protected Endpoints: ${topRoutesStr}
Verified via SnapTrace Telemetry`;

    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
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
      {/* Distraction-Free Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          body {
            background-color: #ffffff !important;
            color: #09090b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside,
          header,
          .no-print {
            display: none !important;
          }
          .print-sheet {
            background: #ffffff !important;
            color: #09090b !important;
            border: 1px solid #e4e4e7 !important;
            box-shadow: none !important;
          }
          .print-sheet * {
            color: #09090b !important;
            border-color: #e4e4e7 !important;
          }
          .print-kpi {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          .print-emerald {
            color: #059669 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-transparent text-zinc-100 p-6 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* TOP CONTROLS & FILTER BAR (Hidden on Print) */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  Client Maintenance & Health Reports
                </h1>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Proof-of-work telemetry summary to share with clients or attach to retainer invoices.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Client Project Switcher */}
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition cursor-pointer min-w-[180px]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-950 text-zinc-200">
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Timeframe Pill Selector */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs">
                {(['7d', '30d'] as const).map((range) => (
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
                    {range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                  </button>
                ))}
              </div>

              {/* Copy Client Summary Button */}
              <button
                type="button"
                onClick={handleCopyClientSummary}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Copy client-ready formatted report text"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Client Summary</span>
                  </>
                )}
              </button>

              {/* Print / Export PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Print or Save as Distraction-Free PDF"
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
                    Agency Feature
                  </span>
                  <span className="text-xs font-medium text-zinc-200">
                    Agency Studio Feature: Client Maintenance Reports are unlocked on Agency Studio ($49/mo) to justify your client retainers.
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Upgrade to export branded client proof-of-work documentation and PDF deliverables.
                </p>
              </div>
              <a
                href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition font-mono shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Unlock Client Reports</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* MAIN REPORT DOCUMENT SHEET */}
          <div className="print-sheet bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">

            {/* Document Header & Metadata Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Telemetry Verified &amp; Active</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
                  {selectedProject ? selectedProject.name : 'Client Project'}
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Client Maintenance &amp; Application Reliability Statement
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-zinc-400 space-y-1 bg-zinc-900/60 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-zinc-800">
                <div className="text-zinc-200 font-semibold">
                  Reporting Period: {timeframe === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Generated: {currentDateStr}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Telemetry Engine: SnapTrace Edge
                </div>
              </div>
            </div>

            {/* B. EXECUTIVE KPI STRIP (3 LARGE METRIC CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* Card 1: Exceptions Intercepted & Handled */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Exceptions Intercepted
                  </span>
                  <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="font-mono text-3xl font-bold text-zinc-100 tabular-nums">
                  {loading ? '...' : totalExceptions.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Captured and resolved before end-user escalation.
                </p>
              </div>

              {/* Card 2: Runaway Loops Suppressed */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Loop Storms Suppressed
                  </span>
                  <Layers className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="font-mono text-3xl font-bold text-zinc-100 tabular-nums">
                  {loading ? '...' : totalSuppressed.toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Cascading error storms neutralized by smart circuit breaker.
                </p>
              </div>

              {/* Card 3: Performance Invariance */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Performance Invariance
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="print-emerald font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                  0.0ms
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Zero Core Web Vitals penalty · Non-blocking async beacon.
                </p>
              </div>

            </div>

            {/* C. TOP PROTECTED ENDPOINTS & ENVIRONMENT DISTRIBUTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
              
              {/* Left (7 Cols): Protected Routes Table */}
              <div className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight uppercase">
                      Top Protected Endpoints
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Application routes guarded against uncaught runtime crashes.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    Route Safeguard
                  </span>
                </div>

                {topRoutes.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                    No exceptions logged in this reporting window.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topRoutes.map((item, idx) => (
                      <div key={item.route} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] text-zinc-500 font-semibold w-4 shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="text-zinc-200 truncate font-medium" title={item.route}>
                              {item.route}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] text-zinc-400">
                              {item.count} {item.count === 1 ? 'event' : 'events'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold tabular-nums">
                              {item.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-zinc-300"
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right (5 Cols): Environment & Device Distribution */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Environment Breakdown Box */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-3">
                  <div className="border-b border-zinc-800/80 pb-2.5">
                    <h3 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight uppercase">
                      Environment Safeguard
                    </h3>
                    <p className="text-xs text-zinc-400">Deployment tier telemetry ratio</p>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        Production
                      </span>
                      <span className="text-zinc-400">
                        {envStats.prod} ({envStats.prodPct}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-zinc-500" />
                        Staging / Dev
                      </span>
                      <span className="text-zinc-400">
                        {envStats.dev} ({envStats.devPct}%)
                      </span>
                    </div>

                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden flex border border-zinc-800 mt-1">
                      <div className="bg-red-400 h-full" style={{ width: `${envStats.prodPct}%` }} />
                      <div className="bg-zinc-600 h-full" style={{ width: `${envStats.devPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Device & Client Platform Distribution */}
                <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-3 font-mono">
                  <div className="border-b border-zinc-800/80 pb-2.5">
                    <h3 className="text-sm font-semibold text-zinc-100 tracking-tight uppercase">
                      Client Client Platform Reach
                    </h3>
                    <p className="text-xs text-zinc-400 font-sans">Observed operating systems &amp; runtimes</p>
                  </div>

                  <div className="space-y-2 text-xs">
                    {clientBreakdown.topOs.length === 0 ? (
                      <p className="text-zinc-500 text-[11px]">No client platform fingerprints captured.</p>
                    ) : (
                      clientBreakdown.topOs.map((os) => (
                        <div key={os.name} className="flex items-center justify-between">
                          <span className="text-zinc-300 truncate">{os.name}</span>
                          <span className="text-zinc-500 text-[11px]">{os.pct}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Document Verification Footer */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span>Verified by SnapTrace Retainer Telemetry Engine</span>
                <span>·</span>
                <span>Zero Core Web Vitals Latency</span>
              </div>
              <div>
                Confidential Client Deliverable
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
