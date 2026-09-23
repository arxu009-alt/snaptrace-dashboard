'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import InspectErrorModal from '@/components/InspectErrorModal';

interface ErrorLog {
  id: number;
  message: string;
  stack_trace?: string;
  stack?: string;
  environment: string;
  url?: string;
  user_agent?: string;
  created_at: string;
  status?: string;
}

type TimeRange = '12h' | '24h' | '7d';

const MOCK_INCIDENTS: ErrorLog[] = [
  {
    id: 1041,
    message: 'ReferenceError: Connection pool exhausted at database.js:18:11',
    stack_trace: 'ReferenceError: Connection pool exhausted\n    at pool.connect (database.js:18:11)\n    at handleCheckout (checkout.js:45:9)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async routeHandler (app/api/charge/route.ts:24:5)',
    environment: 'production',
    url: 'https://demo-ecommerce.com/api/v1/checkout',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    status: 'unresolved',
  },
  {
    id: 1042,
    message: 'UnhandledPromiseRejection: Stripe API 504 Gateway Timeout on /v1/charge',
    stack_trace: 'Error: Gateway timeout 504\n    at fetchWithRetry (stripe-client.js:102:15)\n    at processPayment (billing.js:28:7)\n    at handleWebhookEvent (webhooks.js:52:11)',
    environment: 'production',
    url: 'https://demo-ecommerce.com/billing',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'unresolved',
  },
  {
    id: 1043,
    message: 'RenderLoopError: Maximum update depth exceeded in CheckoutComponent',
    stack_trace: 'Error: Maximum update depth exceeded in CheckoutComponent\n    at setState (react-dom.js:312:12)\n    at useEffect (CheckoutComponent.tsx:19:5)\n    at commitHookEffectListMount (react-dom.development.js:23150:26)',
    environment: 'development',
    url: 'http://localhost:3000/cart',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    status: 'unresolved',
  },
  {
    id: 1044,
    message: 'AuthTokenExpiredError: JWT signature verification failed on /api/v1/user/session',
    stack_trace: 'AuthTokenExpiredError: jwt expired\n    at verifyToken (auth.js:84:12)\n    at authMiddleware (middleware.js:19:9)\n    at next (node_modules/express/lib/router/route.js:144:13)',
    environment: 'production',
    url: 'https://demo-ecommerce.com/api/v1/user/session',
    user_agent: 'SnapTrace <5KB Ingestion Daemon',
    created_at: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    status: 'unresolved',
  },
];

export default function DemoSandboxPage() {
  const [incidents, setIncidents] = useState<ErrorLog[]>(MOCK_INCIDENTS);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('12h');
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'development'>('all');

  // Realistic mock distribution chart
  const distributionData = useMemo(() => {
    if (timeRange === '12h') {
      return [
        { label: '-11h', count: 0 },
        { label: '-9h', count: 0 },
        { label: '-7h', count: 1 },
        { label: '-5h', count: 0 },
        { label: '-3h', count: 0 },
        { label: '-2h', count: 1 },
        { label: '-1h', count: 1 },
        { label: 'Now', count: 2 },
      ];
    }
    if (timeRange === '24h') {
      return [
        { label: '-22h', count: 0 },
        { label: '-18h', count: 1 },
        { label: '-14h', count: 0 },
        { label: '-10h', count: 0 },
        { label: '-6h', count: 1 },
        { label: '-2h', count: 2 },
        { label: 'Now', count: 3 },
      ];
    }
    return [
      { label: '-6d', count: 4 },
      { label: '-5d', count: 2 },
      { label: '-4d', count: 1 },
      { label: '-3d', count: 6 },
      { label: '-2d', count: 0 },
      { label: '-1d', count: 3 },
      { label: 'Today', count: 4 },
    ];
  }, [timeRange]);

  const maxCount = Math.max(...distributionData.map((d) => d.count), 1);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((item) => {
      const matchEnv = envFilter === 'all' ? true : item.environment === envFilter;
      const matchSearch =
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.url && item.url.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchEnv && matchSearch;
    });
  }, [incidents, envFilter, searchQuery]);

  const handleDelete = (id: number) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    if (selectedLog?.id === id) setSelectedLog(null);
  };

  const handleToggleStatus = (id: number) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: i.status === 'resolved' ? 'unresolved' : 'resolved' }
          : i
      )
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100 pb-16">
      
      {/* 1. STICKY DEMO NOTICE TOP BAR - Styled to match Dashboard layout */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 border-b border-zinc-800/80 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-300">
              <strong className="text-zinc-100">Interactive Sandbox:</strong> Live production mock workspace. Zero configuration required.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition font-sans"
            >
              ← Back Home
            </Link>
            <Link
              href="/signup"
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap"
            >
              Claim Free Project & Key →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
        
        {/* Navigation & Header matching Dashboard Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <SnapTraceLogo size="md" showText={true} />
            <span className="text-zinc-700">/</span>
            <span className="text-xs font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-md">
              Demo Workspace
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ingestion Gateway: 200 OK (0ms overhead)</span>
          </div>
        </div>

        {/* Stat Cards Grid matching Dashboard Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 space-y-1.5 transition">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Total Ingested
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 tabular-nums">
              {incidents.length}
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">Live simulated exceptions</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 space-y-1.5 transition">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Production Issues
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 tabular-nums">
              {incidents.filter((i) => i.environment === 'production').length}
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">Critical client crashes</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 space-y-1.5 transition">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Development Logs
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 tabular-nums">
              {incidents.filter((i) => i.environment === 'development').length}
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">Staging & test traces</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 space-y-1.5 transition">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Noise Firewall
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
              Active
            </div>
            <p className="text-[11px] text-zinc-500 font-sans">60s loop throttling active</p>
          </div>
        </div>

        {/* Velocity Pulse Interactive Chart matching Dashboard Overview */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 font-mono flex items-center gap-2">
                <span>Incident Velocity Pulse</span>
              </h2>
              <p className="text-[11px] text-zinc-500 font-sans">Interactive time-window bucketing</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 font-mono text-xs">
                {(['12h', '24h', '7d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition uppercase cursor-pointer ${
                      timeRange === range
                        ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-mono text-emerald-400 hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          <div className="pt-2 pb-1">
            <div className="h-28 w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1">
              {distributionData.map((item, idx) => {
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const hasErrors = item.count > 0;

                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-200 whitespace-nowrap shadow-xl z-20">
                      {item.count} {item.count === 1 ? 'incident' : 'incidents'} ({item.label})
                    </div>

                    <div className="w-full bg-zinc-950 rounded-sm h-full flex items-end overflow-hidden p-0.5 border border-zinc-800/60">
                      <div
                        style={{ height: `${hasErrors ? Math.max(heightPercent, 22) : 6}%` }}
                        className={`w-full rounded-[2px] transition-all duration-300 ${
                          hasErrors
                            ? 'bg-gradient-to-t from-red-500/80 to-red-400 shadow-sm shadow-red-500/10'
                            : 'bg-zinc-800/40'
                        }`}
                      />
                    </div>

                    <span className="text-[9px] font-mono text-zinc-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Incidents Stream & Triage Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 border border-zinc-800 p-3 rounded-xl">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search mock errors, routes, or stack traces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-lg px-3.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono transition"
              />
            </div>

            <div className="flex items-center space-x-1 bg-zinc-950 border border-zinc-800/80 p-0.5 rounded-lg self-start sm:self-auto font-mono text-xs">
              {(['all', 'production', 'development'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvFilter(env)}
                  className={`px-2.5 py-1 text-xs rounded-md capitalize transition cursor-pointer ${
                    envFilter === env
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-950/70 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Status</th>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Exception Message</th>
                    <th className="py-2.5 px-4">Environment</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No incidents match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((err) => {
                      const isResolved = err.status === 'resolved';

                      return (
                        <tr key={err.id} className="hover:bg-zinc-900/50 transition">
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(err.id)}
                              className={`w-5 h-5 rounded border flex items-center justify-center text-[10px] font-bold transition cursor-pointer mx-auto ${
                                isResolved
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                  : 'border-zinc-700 hover:border-zinc-500 text-transparent'
                              }`}
                              title={isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
                            >
                              ✓
                            </button>
                          </td>
                          <td className="py-3 px-4 text-zinc-500 whitespace-nowrap text-[11px]">
                            {new Date(err.created_at).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4 font-sans text-xs text-zinc-200">
                            <div className="truncate max-w-sm sm:max-w-md">
                              <span className={isResolved ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'}>
                                {err.message}
                              </span>
                            </div>
                            {err.url && (
                              <div className="text-[10px] text-zinc-500 font-mono truncate max-w-xs mt-0.5">
                                {err.url}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                                err.environment === 'production'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {err.environment}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(err)}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md border border-zinc-700 transition cursor-pointer text-xs"
                            >
                              Inspect & Fix
                            </button>
                            <button
                              onClick={() => handleDelete(err.id)}
                              className="px-2 py-1 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 font-medium rounded-md border border-transparent hover:border-red-500/20 transition cursor-pointer text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action Box matching dashboard style */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 font-sans">Ready to monitor your actual application?</h3>
            <p className="text-xs text-zinc-400 font-sans">
              Drop our lightweight &lt;5KB script into Next.js, Node, React, or Python in under 60 seconds.
            </p>
          </div>
          <Link
            href="/signup"
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg shadow-sm transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
          >
            Start Free Beta →
          </Link>
        </div>

      </main>

      {/* Deep Inspect Modal */}
      {selectedLog && (
        <InspectErrorModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onDelete={handleDelete}
        />
      )}

    </div>
  );
}