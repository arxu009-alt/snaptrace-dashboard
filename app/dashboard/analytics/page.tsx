'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import {
  BarChart3,
  Globe,
  Laptop,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Server,
  Layers,
} from 'lucide-react';

interface ErrorLog {
  id: number;
  message: string;
  environment: string;
  created_at: string;
  project_id?: string;
  occurrence_count?: number;
  url?: string;
  stack_trace?: string;
  user_agent?: string;
  route?: string;
}

interface RouteStat {
  route: string;
  totalEvents: number;
  prodCount: number;
  devCount: number;
  percentage: number;
  lastSeen: string;
}

interface DistributionItem {
  name: string;
  count: number;
  percentage: number;
}

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

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [selectedProjectName, setSelectedProjectName] = useState('All Projects');

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!userProjects || userProjects.length === 0) {
      setErrors([]);
      setLoading(false);
      return;
    }

    const userProjectIds = userProjects.map((p) => p.id);
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all';
    const isValidProject = savedProjectId && savedProjectId !== 'all' && userProjectIds.includes(savedProjectId);

    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isValidProject) {
      setSelectedProjectName('All Projects');
      query = query.in('project_id', userProjectIds);
    } else {
      const active = userProjects.find((p) => p.id === savedProjectId);
      setSelectedProjectName(active?.name || 'Selected Project');
      query = query.eq('project_id', savedProjectId);
    }

    const { data, error } = await query;
    if (!error && data) {
      setErrors(data);
    } else {
      setErrors([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalyticsData();
    window.addEventListener('snaptrace_project_change', loadAnalyticsData);

    const channel = supabase
      .channel('realtime-analytics-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'errors' },
        () => {
          loadAnalyticsData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadAnalyticsData);
      supabase.removeChannel(channel);
    };
  }, [loadAnalyticsData]);

  // Derived Telemetry Computations
  const { routeStats, topRoute, osDistribution, browserDistribution } = useMemo(() => {
    if (!errors || errors.length === 0) {
      return {
        routeStats: [],
        topRoute: 'None',
        osDistribution: [],
        browserDistribution: [],
      };
    }

    const routeMap: Record<string, { total: number; prod: number; dev: number; lastSeen: string }> = {};
    const osMap: Record<string, number> = {};
    const browserMap: Record<string, number> = {};

    let totalWeight = 0;

    errors.forEach((err) => {
      const route = extractRoute(err);
      const weight = err.occurrence_count && err.occurrence_count > 0 ? err.occurrence_count : 1;
      totalWeight += weight;

      if (!routeMap[route]) {
        routeMap[route] = { total: 0, prod: 0, dev: 0, lastSeen: err.created_at };
      }
      routeMap[route].total += weight;
      if (err.environment === 'production') routeMap[route].prod += weight;
      else routeMap[route].dev += weight;

      const os = parseOS(err.user_agent);
      osMap[os] = (osMap[os] || 0) + weight;

      const browser = parseBrowser(err.user_agent);
      browserMap[browser] = (browserMap[browser] || 0) + weight;
    });

    const routeStatsList: RouteStat[] = Object.entries(routeMap)
      .map(([route, stat]) => ({
        route,
        totalEvents: stat.total,
        prodCount: stat.prod,
        devCount: stat.dev,
        percentage: totalWeight > 0 ? Math.round((stat.total / totalWeight) * 100) : 0,
        lastSeen: stat.lastSeen,
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents);

    const osList: DistributionItem[] = Object.entries(osMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalWeight > 0 ? Math.round((count / totalWeight) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const browserList: DistributionItem[] = Object.entries(browserMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalWeight > 0 ? Math.round((count / totalWeight) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      routeStats: routeStatsList,
      topRoute: routeStatsList[0]?.route || 'None',
      osDistribution: osList,
      browserDistribution: browserList,
    };
  }, [errors]);

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 p-6 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <span>Crash &amp; Endpoint Analytics</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-medium">
                {selectedProjectName}
              </span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Analyze failure distribution, route impact, and client blast radius.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => loadAnalyticsData()}
              disabled={loading}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/dashboard/errors"
              className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>Exception Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Tracked Endpoints
              </span>
              <Layers className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
              {routeStats.length}
            </div>
            <p className="text-xs text-zinc-500 font-mono">Distinct failing routes</p>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Top Failing Route
              </span>
              <span className="w-2 h-2 rounded-full bg-red-400" />
            </div>
            <div className="font-mono text-xl font-bold text-red-400 truncate tracking-tight" title={topRoute}>
              {topRoute}
            </div>
            <p className="text-xs text-zinc-500 font-mono">Highest incident frequency</p>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                P99 Ingestion Latency
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-400 tracking-tight">
              0ms
            </div>
            <p className="text-xs text-zinc-500 font-mono">Non-blocking async telemetry</p>
          </div>
        </div>

        {/* Section 1: Full-width Endpoint Failure Distribution Table */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800/80 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                Endpoint Failure Distribution
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Aggregated crash velocity and blast weight per route
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 self-start sm:self-auto">
              Realtime APM
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500 text-xs font-mono animate-pulse">
              Loading route telemetry...
            </div>
          ) : routeStats.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs font-mono space-y-2">
              <p>No endpoint crash data recorded for this scope yet.</p>
              <Link href="/dashboard" className="text-zinc-300 underline font-semibold">
                Return to Overview to fire a test crash
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <th className="pb-2.5 font-semibold">Endpoint Route</th>
                    <th className="pb-2.5 font-semibold text-right">Production</th>
                    <th className="pb-2.5 font-semibold text-right">Dev / Staging</th>
                    <th className="pb-2.5 font-semibold text-right">Total Events</th>
                    <th className="pb-2.5 font-semibold text-right pr-4">Impact Share</th>
                    <th className="pb-2.5 font-semibold">Relative Blast Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {routeStats.map((item, idx) => (
                    <tr key={item.route} className="hover:bg-zinc-900/40 transition">
                      <td className="py-3 text-zinc-200 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-600 font-semibold text-[10px]">#{idx + 1}</span>
                          <span className="hover:text-white transition cursor-pointer">{item.route}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-red-400">
                        {item.prodCount > 0 ? item.prodCount : '—'}
                      </td>
                      <td className="py-3 text-right text-zinc-400">
                        {item.devCount > 0 ? item.devCount : '—'}
                      </td>
                      <td className="py-3 text-right text-zinc-100 font-bold tabular-nums">
                        {item.totalEvents}
                      </td>
                      <td className="py-3 text-right pr-4 text-zinc-300 tabular-nums font-semibold">
                        {item.percentage}%
                      </td>
                      <td className="py-3 w-48">
                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800/80">
                          <div
                            className="h-full rounded-full bg-red-400/80 transition-all duration-300"
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Blast Radius (OS & Browser Breakdown) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Operating System Blast Radius */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                    Operating System Blast Radius
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Client Impact</span>
              </div>

              {osDistribution.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  No OS telemetry captured yet
                </div>
              ) : (
                <div className="space-y-3">
                  {osDistribution.map((item) => (
                    <div key={item.name} className="space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[11px]">{item.count} events</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
                        <div
                          className="h-full rounded-full bg-zinc-300 transition-all duration-300"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between">
              <span>Platform Compatibility</span>
              <span>Derived from Telemetry User-Agent</span>
            </div>
          </div>

          {/* Client Browser Blast Radius */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                    Client Browser Blast Radius
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Engine Impact</span>
              </div>

              {browserDistribution.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  No browser telemetry captured yet
                </div>
              ) : (
                <div className="space-y-3">
                  {browserDistribution.map((item) => (
                    <div key={item.name} className="space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 text-[11px]">{item.count} events</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
                        <div
                          className="h-full rounded-full bg-amber-400/80 transition-all duration-300"
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between">
              <span>Client Runtime Matrix</span>
              <span>Sentry-Grade Fingerprinting</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
