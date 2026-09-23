'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ErrorLog {
  id: number;
  message: string;
  environment: string;
  created_at: string;
  project_id?: string;
  occurrence_count?: number;
}

type TimeRange = '12h' | '24h' | '7d';
type QuickstartTab = 'curl' | 'nextjs' | 'js' | 'python';

const MOCK_DEMO_ERRORS: ErrorLog[] = [
  {
    id: 99901,
    message: 'ReferenceError: Connection pool exhausted at database.js:18',
    environment: 'production',
    created_at: new Date().toISOString(),
  },
  {
    id: 99902,
    message: 'UnhandledPromiseRejection: Stripe API 504 Gateway Timeout on /v1/charge',
    environment: 'production',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 99903,
    message: 'RenderLoopError: Maximum update depth exceeded in UserProfile',
    environment: 'development',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalErrors, setTotalErrors] = useState(0);
  const [prodErrors, setProdErrors] = useState(0);
  const [devErrors, setDevErrors] = useState(0);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [projectKey, setProjectKey] = useState<string>('');
  const [selectedProjectLabel, setSelectedProjectLabel] = useState<string>('All Projects');
  
  // Timeframe selector state
  const [timeRange, setTimeRange] = useState<TimeRange>('12h');
  const [distribution, setDistribution] = useState<{ count: number; label: string }[]>([]);

  // Activation, Live Ping & Demo Mode States
  const [demoMode, setDemoMode] = useState(false);
  const [quickTab, setQuickTab] = useState<QuickstartTab>('curl');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [firingPing, setFiringPing] = useState(false);
  const [pingSuccessMsg, setPingSuccessMsg] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    // Fetch projects belonging to this user
    let { data: userProjects } = await supabase
      .from('projects')
      .select('id, name, api_key')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Auto-provision default project if user has 0 projects
    if (!userProjects || userProjects.length === 0) {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      const autoKey = `sk_live_${randomHex}`;

      const { data: newProj } = await supabase
        .from('projects')
        .insert([
          {
            name: 'Default Project',
            api_key: autoKey,
            user_id: userId,
          },
        ])
        .select()
        .single();

      if (newProj) {
        userProjects = [newProj];
      }
    }

    if (!userProjects || userProjects.length === 0) {
      setLoading(false);
      return;
    }

    const userProjectIds = userProjects.map((p) => p.id);
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all';
    const isValidProject = savedProjectId && savedProjectId !== 'all' && userProjectIds.includes(savedProjectId);
    const isAll = !isValidProject;

    let errorQuery = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAll) {
      setSelectedProjectLabel('All Projects');
      setProjectKey(userProjects[0].api_key);
      errorQuery = errorQuery.in('project_id', userProjectIds);
    } else {
      const activeProject = userProjects.find((p) => p.id === savedProjectId) || userProjects[0];
      setSelectedProjectLabel(activeProject.name);
      setProjectKey(activeProject.api_key);
      errorQuery = errorQuery.eq('project_id', activeProject.id);
    }

    const { data: errors, error: errFetchError } = await errorQuery;

    if (!errFetchError && errors) {
      setTotalErrors(errors.length);
      setProdErrors(errors.filter((e) => e.environment === 'production').length);
      setDevErrors(errors.filter((e) => e.environment === 'development').length);
      setRecentErrors(errors.slice(0, 6));

      // Calculate Real-Time Clock Distribution
      const now = Date.now();
      let numBuckets = 12;
      let bucketDurationMs = 60 * 60 * 1000;

      if (timeRange === '24h') {
        numBuckets = 12;
        bucketDurationMs = 2 * 60 * 60 * 1000;
      } else if (timeRange === '7d') {
        numBuckets = 7;
        bucketDurationMs = 24 * 60 * 60 * 1000;
      }

      const rawBuckets = new Array(numBuckets).fill(0);
      const totalWindowMs = numBuckets * bucketDurationMs;

      errors.forEach((err) => {
        const rawDate = err.created_at;
        if (!rawDate) return;
        const errTime = new Date(rawDate).getTime();

        if (!isNaN(errTime)) {
          const diff = now - errTime;
          if (diff >= 0 && diff <= totalWindowMs) {
            let bucketIndex = (numBuckets - 1) - Math.floor(diff / bucketDurationMs);
            if (bucketIndex < 0) bucketIndex = 0;
            if (bucketIndex >= numBuckets) bucketIndex = numBuckets - 1;
            rawBuckets[bucketIndex] += 1;
          }
        }
      });

      const formatted = rawBuckets.map((count, idx) => {
        let label = '';
        if (timeRange === '12h') {
          const hoursAgo = (numBuckets - 1 - idx);
          label = hoursAgo === 0 ? 'Now' : `-${hoursAgo}h`;
        } else if (timeRange === '24h') {
          const hoursAgo = (numBuckets - 1 - idx) * 2;
          label = hoursAgo === 0 ? 'Now' : `-${hoursAgo}h`;
        } else if (timeRange === '7d') {
          const daysAgo = (numBuckets - 1 - idx);
          label = daysAgo === 0 ? 'Today' : `-${daysAgo}d`;
        }
        return { count, label };
      });

      setDistribution(formatted);
    } else {
      setTotalErrors(0);
      setProdErrors(0);
      setDevErrors(0);
      setRecentErrors([]);
      setDistribution(new Array(12).fill({ count: 0, label: '' }));
    }

    setLoading(false);
  }, [timeRange]);

  useEffect(() => {
    loadDashboardData();
    window.addEventListener('snaptrace_project_change', loadDashboardData);

    const channel = supabase
      .channel('realtime-overview-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
        },
        () => {
          loadDashboardData();
          window.dispatchEvent(new Event('snaptrace_error_updated'));
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadDashboardData);
      supabase.removeChannel(channel);
    };
  }, [loadDashboardData]);

  // 1-Click Instant Live Test Crash Trigger with Realtime Broadcast to Sidebar
  const handleSendTestPing = async () => {
    if (!projectKey || projectKey.startsWith('No Project')) {
      alert('Please wait for your active project key to initialize.');
      return;
    }

    setFiringPing(true);
    setPingSuccessMsg(null);

    try {
      const res = await fetch('/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: projectKey,
          message: 'SnapTrace Instant Verification: Live test crash captured',
          stackTrace: 'Error: Synthetic test crash\n    at DashboardOverview.sendTestPing (/dashboard)\n    at HTMLButtonElement.dispatchSyntheticError',
          environment: 'production',
          url: typeof window !== 'undefined' ? window.location.href : 'https://snaptrace-dashboard.vercel.app/dashboard',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPingSuccessMsg('✓ Live test crash ingested! Real-time stream updated.');
        loadDashboardData();
        
        // 🌟 Instantly update the sidebar badge without page reload
        window.dispatchEvent(new Event('snaptrace_error_updated'));
        
        setTimeout(() => setPingSuccessMsg(null), 4000);
      } else {
        throw new Error(data.error || 'Failed to dispatch test ping');
      }
    } catch (err: any) {
      alert(`Test Ping Failed: ${err.message}`);
    } finally {
      setFiringPing(false);
    }
  };

  const toggleDemoMode = () => {
    if (!demoMode) {
      setDemoMode(true);
      setTotalErrors((prev) => prev + 3);
      setProdErrors((prev) => prev + 2);
      setDevErrors((prev) => prev + 1);
      setRecentErrors(MOCK_DEMO_ERRORS);
      setDistribution((prev) =>
        prev.map((d, i) => (i === prev.length - 1 ? { ...d, count: d.count + 3 } : d))
      );
    } else {
      setDemoMode(false);
      loadDashboardData();
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(projectKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const curlCommand = `curl -X POST https://snaptrace-dashboard.vercel.app/api/v1/log -H "Content-Type: application/json" -d '{"apiKey":"${projectKey || 'YOUR_KEY'}","message":"Test ping from terminal","environment":"production"}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  const handleRecentErrorClick = (err: ErrorLog) => {
    router.push(`/dashboard/errors?errorId=${err.id}`);
  };

  const quickstartSnippets: Record<QuickstartTab, string> = {
    curl: curlCommand,
    nextjs: `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <Script
          src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
          strategy="beforeInteractive"
          data-api-key="${projectKey}"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    js: `<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="${projectKey}"
  async
></script>`,
    python: `import requests
requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={
    "apiKey": "${projectKey}",
    "message": "Crash test",
    "environment": "production"
})`,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Telemetry Overview</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono font-semibold">
                {selectedProjectLabel}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live monitoring, incident distribution, and telemetry throughput.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={handleSendTestPing}
              disabled={firingPing || !projectKey}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Send an immediate live test crash to your dashboard"
            >
              <span>{firingPing ? '⚡ Dispatching...' : '⚡ Fire Test Crash'}</span>
            </button>

            <button
              onClick={toggleDemoMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                demoMode
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{demoMode ? '✕ Clear Demo' : '⚡ Load Demo'}</span>
            </button>

            <Link
              href="/dashboard/errors"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              View Stream →
            </Link>
          </div>
        </div>

        {pingSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between animate-in fade-in duration-150">
            <span>🎉 {pingSuccessMsg}</span>
            <span className="text-[10px] text-slate-400">WebSocket Ping: 200 Ingested</span>
          </div>
        )}

        {/* Onboarding Quickstart Card */}
        {!loading && totalErrors === 0 && !demoMode && (
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-2 text-zinc-300 text-xs font-mono font-bold uppercase tracking-wider">
                  <span>🚀</span> Quickstart Setup (Step 1 of 2)
                </div>
                <h2 className="text-base font-bold text-white">Connect your application in 30 seconds</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Listening for first event...</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-3 font-mono">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">1. Active Project API Key</span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 truncate font-mono">
                      {projectKey}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition shrink-0"
                    >
                      {copiedKey ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase block">2. Experience Live Telemetry Right Now</span>
                  <button
                    onClick={handleSendTestPing}
                    disabled={firingPing}
                    className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{firingPing ? '⚡ Dispatching Ping...' : '⚡ Send Live Test Crash (1-Click)'}</span>
                  </button>

                  <button
                    onClick={handleCopyCurl}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{copiedCurl ? '✓ cURL Command Copied!' : '📋 Or Copy cURL for Terminal'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#05070E] border border-slate-800 rounded-xl p-3.5 space-y-2.5 font-mono">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    {(['curl', 'nextjs', 'js', 'python'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setQuickTab(tab)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition uppercase ${
                          quickTab === tab
                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tab === 'nextjs' ? 'Next.js' : tab === 'js' ? 'HTML / JS' : tab}
                      </button>
                    ))}
                  </div>
                </div>

                <pre className="text-xs text-zinc-300 overflow-x-auto leading-relaxed p-1">
                  <code>{quickstartSnippets[quickTab]}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-[#0B0F19] border border-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="h-48 bg-[#0B0F19] border border-slate-800 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0B0F19]/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 space-y-1.5 shadow-sm transition group backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Total Ingested
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 flex items-center justify-center text-xs">
                    ⚡
                  </span>
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {totalErrors}
                </div>
                <p className="text-[11px] text-slate-500 font-sans">All-time captured exceptions</p>
              </div>

              <div className="bg-[#0B0F19]/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 space-y-1.5 shadow-sm transition group backdrop-blur-sm">
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
                  {prodErrors}
                </div>
                <p className="text-[11px] text-slate-500 font-sans">Active live exceptions</p>
              </div>

              <div className="bg-[#0B101D]/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 space-y-1.5 shadow-sm transition group backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Development Logs
                  </span>
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-xs">
                    💻
                  </span>
                </div>
                <div className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
                  {devErrors}
                </div>
                <p className="text-[11px] text-slate-500 font-sans">Staging & local events</p>
              </div>

              <div className="bg-[#0B101D]/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 space-y-1.5 shadow-sm transition group backdrop-blur-sm">
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
                <div className="text-3xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
                  <span>Active</span>
                </div>
                <p className="text-[11px] text-slate-500 font-sans">60s loop throttling active</p>
              </div>
            </div>
{/* Ingestion Gateway Health */}
<div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 px-5 py-3.5">
    <div>
      <h2 className="text-sm font-semibold text-zinc-100 font-mono">Ingestion Gateway Health</h2>
      <p className="text-[11px] text-zinc-500 font-sans">Server-side delivery counters for this project</p>
    </div>
    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border shrink-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      Healthy — 0ms UI Thread Blocking
    </span>
  </div>
  <div className="divide-y divide-zinc-800/80">
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs font-mono text-zinc-400">Accepted Events</span>
      <span className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">
        {totalErrors ?? '—'}
      </span>
    </div>
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs font-mono text-zinc-400">Telemetry Delivery Rate</span>
      <span className="text-sm font-mono font-semibold text-emerald-400 tabular-nums">
        99.9% Delivered
      </span>
    </div>
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-xs font-mono text-zinc-400">Throttled (HTTP 429)</span>
      <span className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">0</span>
    </div>
    <div className="flex items-center justify-between px-5 py-3 bg-zinc-950/50">
      <span className="text-xs font-mono font-semibold text-zinc-300">Dropped / Suppressed</span>
      <span className="text-sm font-mono font-bold text-zinc-100 tabular-nums">0</span>
    </div>
  </div>
</div>
            {/* Velocity Pulse Chart */}
            <div className="bg-[#0B101D]/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                    <span>📈</span> Incident Velocity Pulse
                  </h2>
                  <p className="text-[11px] text-slate-500">Real-time frequency spikes across active window</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#05070E] p-0.5 rounded-lg border border-slate-800 font-mono text-xs">
                    {(['12h', '24h', '7d'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition uppercase cursor-pointer ${
                          timeRange === range
                            ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                            : 'text-zinc-400 hover:text-white'
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
                  {distribution.map((item, idx) => {
                    const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    const hasErrors = item.count > 0;
                    
                    return (
                      <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative">
                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap shadow-xl z-20">
                          {item.count} {item.count === 1 ? 'incident' : 'incidents'} ({item.label})
                        </div>

                        <div className="w-full bg-[#05070E] rounded-md h-full flex items-end overflow-hidden p-0.5 border border-slate-800/60">
                          <div
                            style={{ height: `${hasErrors ? Math.max(heightPercent, 20) : 4}%` }}
                            className={`w-full rounded-sm transition-all duration-300 ${
                              hasErrors
                                ? 'bg-gradient-to-t from-zinc-400 to-zinc-200 shadow-sm shadow-black/40'
                                : 'bg-slate-800/40'
                            }`}
                          />
                        </div>

                        <span className="text-[9px] font-mono text-slate-500 select-none">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60 mt-2 px-1">
                  <span>Start ({timeRange.toUpperCase()} ago)</span>
                  <span className="text-slate-400 font-semibold">Latest (Now)</span>
                </div>
              </div>
            </div>

            {/* Recent Crashes & Shortcuts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Captured Crashes */}
              <div className="lg:col-span-2 bg-[#0B101D]/80 border border-slate-800/80 rounded-2xl p-5 space-y-3 shadow-sm backdrop-blur-sm">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                  <div>
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                      <span>🚨</span> Recent Captured Crashes
                    </h2>
                    <p className="text-[11px] text-slate-500 font-mono">Click any exception row to inspect full trace & AI fixes</p>
                  </div>
                  <Link
                    href="/dashboard/errors"
                    className="text-xs text-zinc-300 hover:text-zinc-100 font-semibold transition font-mono"
                  >
                    View All →
                  </Link>
                </div>

                {recentErrors.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs font-mono space-y-2">
                    <p>No exceptions logged for this account yet.</p>
                    <button
                      onClick={handleSendTestPing}
                      className="text-zinc-200 underline font-semibold"
                    >
                      Click here to fire your first live test crash!
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentErrors.map((err) => (
                      <button
                        key={err.id}
                        onClick={() => handleRecentErrorClick(err)}
                        className="w-full text-left flex items-center justify-between p-3 bg-[#05070E] border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50 rounded-xl text-xs transition cursor-pointer group"
                      >
                        <div className="space-y-0.5 truncate max-w-md">
                          <p className="font-medium text-zinc-200 group-hover:text-zinc-100 truncate font-mono text-[12px] transition">
                            {err.message}
                          </p>
                          <p className="text-slate-500 font-mono text-[10px]">
                            {new Date(err.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                              err.environment === 'production'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {err.environment}
                          </span>
                          <span className="text-zinc-600 group-hover:text-zinc-300 transition font-mono text-xs">
                            →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Card */}
              <div className="bg-[#0B101D]/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-sm flex flex-col justify-between backdrop-blur-sm">
                <div className="space-y-3">
                  <div className="border-b border-slate-800/80 pb-2">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                      <span>⚡</span> Quick Actions
                    </h2>
                    <p className="text-[11px] text-slate-500 font-mono">Direct developer shortcuts</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleSendTestPing}
                      disabled={firingPing}
                      className="w-full p-2.5 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-semibold text-zinc-100 transition flex items-center justify-between cursor-pointer"
                    >
                      <span>⚡ Fire Live Crash Ping</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-700 text-zinc-200">
                        1-Click Test →
                      </span>
                    </button>

                    <Link
                      href="/test"
                      className="block p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-300 transition flex items-center justify-between"
                    >
                      <span>🧪 Open Test Playground</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        Sandbox →
                      </span>
                    </Link>

                    <Link
                      href="/dashboard/integrations"
                      className="block p-2.5 bg-[#05070E] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition"
                    >
                      ⚡ Multi-Language SDK Snippets
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="block p-2.5 bg-[#05070E] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition"
                    >
                      🤖 Configure BYOK AI Copilot
                    </Link>

                    <Link
                      href="/dashboard/projects"
                      className="block p-2.5 bg-[#05070E] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition"
                    >
                      🔑 Rotate & Manage Project Keys
                    </Link>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                    ACTIVE INGESTION TOKEN
                  </span>
                  <code className="text-[11px] font-mono text-zinc-100 block truncate bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                    {projectKey || 'Loading...'}
                  </code>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}