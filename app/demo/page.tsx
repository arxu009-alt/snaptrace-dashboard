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
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 pb-16">
      
      {/* 1. STICKY DEMO NOTICE TOP BANNER */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#0B101D] via-[#111A2E] to-[#0B101D] border-b border-yellow-400/40 p-3 px-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-ping" />
          <span className="text-xs text-slate-200">
            <strong>Interactive Live Sandbox:</strong> You are exploring a live production mock environment. No login required.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition"
          >
            ← Back Home
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            Claim Your Free Project & Key →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div className="flex items-center space-x-3">
            <SnapTraceLogo size="md" showText={true} />
            <span className="text-slate-700">/</span>
            <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/20">
              Demo Workspace
            </span>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Ingestion: 200 OK</span>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Total Ingested
              </span>
              <span className="w-6 h-6 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs">
                ⚡
              </span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {incidents.length}
            </div>
            <p className="text-[11px] text-slate-500">Live test exceptions</p>
          </div>

          <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Production Issues
                </span>
              </div>
              <span className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xs">
                🚨
              </span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {incidents.filter((i) => i.environment === 'production').length}
            </div>
            <p className="text-[11px] text-slate-500">Critical client crashes</p>
          </div>

          <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Development Logs
              </span>
              <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs">
                💻
              </span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
              {incidents.filter((i) => i.environment === 'development').length}
            </div>
            <p className="text-[11px] text-slate-500">Staging re-renders</p>
          </div>

          <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Noise Firewall
                </span>
              </div>
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                🔇
              </span>
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight text-white">
              Active
            </div>
            <p className="text-[11px] text-slate-500">60s loop throttling active</p>
          </div>
        </div>

        {/* Velocity Pulse Interactive Chart */}
        <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <span>📈</span> Incident Velocity Pulse
              </h2>
              <p className="text-[11px] text-slate-500">Interactive time-window bucketing</p>
            </div>

            <div className="flex items-center bg-[#05070E] p-0.5 rounded-lg border border-slate-800 font-mono text-xs">
              {(['12h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition uppercase cursor-pointer ${
                    timeRange === range
                      ? 'bg-slate-800 text-yellow-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 pb-1">
            <div className="h-24 w-full flex items-end justify-between gap-2 px-1">
              {distributionData.map((item, idx) => {
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const hasErrors = item.count > 0;

                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative">
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl z-20">
                      {item.count} incidents ({item.label})
                    </div>

                    <div className="w-full bg-[#05070E] rounded h-full flex items-end overflow-hidden p-0.5 border border-slate-800/60">
                      <div
                        style={{ height: `${hasErrors ? Math.max(heightPercent, 25) : 6}%` }}
                        className={`w-full rounded-sm transition-all duration-300 ${
                          hasErrors
                            ? 'bg-gradient-to-t from-amber-500 to-yellow-400 shadow-sm shadow-yellow-500/20'
                            : 'bg-slate-800/40'
                        }`}
                      />
                    </div>

                    <span className="text-[9px] font-mono text-slate-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Incidents Table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#0B101D]/80 border border-slate-800 p-3.5 rounded-2xl">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search mock errors, routes, or stack traces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono transition"
              />
            </div>

            <div className="flex items-center space-x-1 bg-[#05070E] border border-slate-800 p-1 rounded-xl self-start sm:self-auto font-mono">
              {(['all', 'production', 'development'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvFilter(env)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    envFilter === env
                      ? 'bg-yellow-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0B101D]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#060911] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Exception Message</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredIncidents.map((err) => {
                  const isResolved = err.status === 'resolved';

                  return (
                    <tr key={err.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(err.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                            isResolved
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-700 hover:border-emerald-400 text-transparent'
                          }`}
                          title="Toggle resolved"
                        >
                          ✓
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(err.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200 truncate max-w-sm">
                        <span className={isResolved ? 'line-through text-slate-500' : ''}>
                          {err.message}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            err.environment === 'production'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {err.environment}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(err)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold rounded-lg border border-slate-700 transition cursor-pointer"
                        >
                          Inspect & Fix
                        </button>
                        <button
                          onClick={() => handleDelete(err.id)}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold rounded-lg border border-red-800/50 transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Call to Action Box */}
        <div className="bg-gradient-to-r from-[#0B101D] via-[#111A2E] to-[#0B101D] border border-yellow-400/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Like this live crash tracking experience?</h3>
            <p className="text-xs text-slate-400">
              Get instant Discord, Slack & email alerts in under 60 seconds with our &lt;5KB drop-in script.
            </p>
          </div>
          <Link
            href="/signup"
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 whitespace-nowrap self-start sm:self-auto"
          >
            Start Free Public Beta →
          </Link>
        </div>

      </div>

      {/* Reusable Full Deep Inspect Modal */}
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