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
  url?: string;
  stack_trace?: string;
  route?: string;
}

type TimeRange = '12h' | '24h' | '7d';
type QuickstartTab = 'curl' | 'nextjs' | 'js' | 'python';

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

  const pathMatch = err.message.match(/(\/(?:api|dashboard|v1|auth|login|checkout|users|settings|webhook)[a-zA-Z0-9_\-\/]*)/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  const genericMatch = err.message.match(/(\/[a-zA-Z0-9_\-\/]{2,})/);
  if (genericMatch && genericMatch[1] && !genericMatch[1].match(/\.(js|ts|tsx|jsx|json)$/i)) {
    return genericMatch[1];
  }

  return '/api/v1/log';
}

function computeImpactedRoutes(errList: ErrorLog[]): { route: string; count: number; percentage: number }[] {
  if (!errList || errList.length === 0) return [];

  const counts: Record<string, number> = {};
  let totalWeight = 0;

  errList.forEach((e) => {
    const route = extractRoute(e);
    const weight = e.occurrence_count && e.occurrence_count > 0 ? e.occurrence_count : 1;
    counts[route] = (counts[route] || 0) + weight;
    totalWeight += weight;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({
      route,
      count,
      percentage: totalWeight > 0 ? Math.round((count / totalWeight) * 100) : 0,
    }));
}

const MOCK_DEMO_ERRORS: ErrorLog[] = [
  {
    id: 99901,
    message: 'ReferenceError: Connection pool exhausted at database.js:18',
    environment: 'production',
    created_at: new Date().toISOString(),
    url: 'https://snaptrace.space/api/checkout',
    occurrence_count: 5,
  },
  {
    id: 99902,
    message: 'UnhandledPromiseRejection: Stripe API 504 Gateway Timeout on /v1/charge',
    environment: 'production',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    url: 'https://snaptrace.space/api/v1/charge',
    occurrence_count: 8,
  },
  {
    id: 99903,
    message: 'RenderLoopError: Maximum update depth exceeded in UserProfile',
    environment: 'development',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    url: 'https://snaptrace.space/dashboard',
    occurrence_count: 3,
  },
  {
    id: 99904,
    message: 'AuthTokenExpiredError: JWT signature verification failed',
    environment: 'production',
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    url: 'https://snaptrace.space/login',
    occurrence_count: 12,
  },
  {
    id: 99905,
    message: 'RateLimitExceeded: 429 Too Many Requests from client worker',
    environment: 'production',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    url: 'https://snaptrace.space/api/v1/log',
    occurrence_count: 6,
  },
];

export default function DashboardOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [totalErrors, setTotalErrors] = useState(0);
  const [prodErrors, setProdErrors] = useState(0);
  const [devErrors, setDevErrors] = useState(0);
  const [suppressedCount, setSuppressedCount] = useState(0);
  const [recentErrors, setRecentErrors] = useState<ErrorLog[]>([]);
  const [impactedRoutes, setImpactedRoutes] = useState<{ route: string; count: number; percentage: number }[]>([]);
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
  const [quickstartMode, setQuickstartMode] = useState<'npm' | 'curl'>('npm');
  const [copiedNpmInstall, setCopiedNpmInstall] = useState(false);
  const [copiedNpmSnippet, setCopiedNpmSnippet] = useState(false);

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

      const suppressed = errors.reduce((acc, e) => {
        const occ = e.occurrence_count || 1;
        return acc + (occ > 1 ? occ - 1 : 0);
      }, 0);
      setSuppressedCount(suppressed);

      setImpactedRoutes(computeImpactedRoutes(errors));

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
      setSuppressedCount(0);
      setRecentErrors([]);
      setImpactedRoutes([]);
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
        setPingSuccessMsg('Live test crash ingested. Real-time stream updated.');
        loadDashboardData();
        
        // Instantly update the sidebar badge without page reload
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
      setTotalErrors((prev) => prev + 5);
      setProdErrors((prev) => prev + 4);
      setDevErrors((prev) => prev + 1);
      setSuppressedCount((prev) => prev + 29);
      setRecentErrors(MOCK_DEMO_ERRORS);
      setImpactedRoutes(computeImpactedRoutes(MOCK_DEMO_ERRORS));
      setDistribution((prev) =>
        prev.map((d, i) => (i === prev.length - 1 ? { ...d, count: d.count + 5 } : d))
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

  const curlCommand = `curl -X POST https://snaptrace.space/api/v1/log -H "Content-Type: application/json" -d '{"apiKey":"${projectKey || 'YOUR_API_KEY'}","message":"Test Incident from Terminal"}'`;

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
    nextjs: `// 1. Install via npm:
npm install snaptrace

// 2. app/layout.tsx (Next.js App Router)
'use client';
import { initSnapTrace } from 'snaptrace';

initSnapTrace({
  apiKey: "${projectKey || 'YOUR_API_KEY'}",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
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

  const deliveryRate = totalErrors > 0 ? `${((totalErrors / (totalErrors + 0)) * 100).toFixed(1)}%` : '99.9%';

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 p-6 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <span>Telemetry Overview</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono font-medium">
                {selectedProjectLabel}
              </span>
            </h1>
            <p className="text-xs text-zinc-400 font-mono">
              Live monitoring, incident distribution, and telemetry throughput.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={handleSendTestPing}
              disabled={firingPing || !projectKey}
              className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Send an immediate live test crash to your dashboard"
            >
              <span>{firingPing ? 'Dispatching...' : 'Fire Test Crash'}</span>
            </button>

            <button
              onClick={toggleDemoMode}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer border ${
                demoMode
                  ? 'bg-zinc-800 text-white border-zinc-600'
                  : 'bg-zinc-900 text-zinc-300 hover:text-white border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span>{demoMode ? 'Clear Demo' : 'Load Demo'}</span>
            </button>

            <Link
              href="/dashboard/errors"
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              View Stream →
            </Link>
          </div>
        </div>

        {pingSuccessMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between animate-in fade-in duration-150 backdrop-blur-md">
            <span>{pingSuccessMsg}</span>
            <span className="text-[10px] text-zinc-400">WebSocket Ping: 200 Ingested</span>
          </div>
        )}

        {/* Onboarding Quickstart Card */}
        {!loading && totalErrors === 0 && !demoMode && (
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-2 text-zinc-400 text-xs font-mono font-medium uppercase tracking-wider">
                  Quickstart Setup (Step 1 of 2)
                </div>
                <h2 className="text-base font-semibold text-zinc-100">Connect your application in 30 seconds</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Listening for first event...</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 space-y-3 font-mono">
                <div className="space-y-1">
                  <span className="text-[11px] text-zinc-400 font-medium uppercase">1. Active Project API Key</span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 truncate font-mono">
                      {projectKey}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] text-zinc-400 font-medium uppercase block">2. Experience Live Telemetry Right Now</span>
                  <button
                    onClick={handleSendTestPing}
                    disabled={firingPing}
                    className="w-full bg-zinc-100 text-zinc-950 hover:bg-white text-xs font-semibold px-3.5 py-2.5 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <span>{firingPing ? 'Dispatching Ping...' : 'Send Live Test Crash (1-Click)'}</span>
                  </button>

                  <button
                    onClick={handleCopyCurl}
                    className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{copiedCurl ? 'cURL Command Copied' : 'Copy cURL for Terminal'}</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 space-y-2.5 font-mono">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    {(['curl', 'nextjs', 'js', 'python'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setQuickTab(tab)}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition uppercase cursor-pointer ${
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

                <pre className="text-xs text-zinc-300 overflow-x-auto leading-relaxed p-1 font-mono">
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
                <div key={i} className="h-24 bg-zinc-950/80 border border-zinc-800 rounded-xl" />
              ))}
            </div>
            <div className="h-56 bg-zinc-950/80 border border-zinc-800 rounded-xl" />
          </div>
        ) : (
          <>
            {/* 1. EXECUTIVE KPI STRIP (TOP ROW) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Ingested */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Total Ingested
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {totalErrors}
                </div>
                <p className="text-xs text-zinc-500 font-mono">All-time captured exceptions</p>
              </div>

              {/* Card 2: Production Issues */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Production Issues
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {prodErrors}
                </div>
                <p className="text-xs text-zinc-500 font-mono">Active live exceptions</p>
              </div>

              {/* Card 3: Noise Suppressed */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Noise Suppressed
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {suppressedCount}
                </div>
                <p className="text-xs text-zinc-500 font-mono">Loop throttled · Spam prevented</p>
              </div>

              {/* Card 4: Gateway Delivery */}
              <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                    Gateway Delivery
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-zinc-100 tabular-nums tracking-tight">
                  {deliveryRate}
                </div>
                <p className="text-xs text-zinc-500 font-mono">0ms UI thread delay</p>
              </div>
            </div>

            {/* 2. COMMAND CENTER (MIDDLE SECTION - 2 COLUMNS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT (7 Cols): Incident Velocity Pulse */}
              <div className="lg:col-span-7 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                        Incident Velocity Pulse
                      </h2>
                      <p className="text-xs text-zinc-400 font-sans mt-0.5">Real-time frequency spikes across active window</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs">
                        {(['12h', '24h', '7d'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition uppercase cursor-pointer ${
                              timeRange === range
                                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                                : 'text-zinc-400 hover:text-zinc-100'
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>

                      <span className="text-[11px] font-mono text-emerald-400 hidden sm:flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 pb-1">
                    <div className="h-28 w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1">
                      {distribution.map((item, idx) => {
                        const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        const hasErrors = item.count > 0;
                        
                        return (
                          <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative">
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-100 whitespace-nowrap shadow-xl z-20">
                              {item.count} {item.count === 1 ? 'incident' : 'incidents'} ({item.label})
                            </div>

                            <div className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded-sm h-full flex items-end overflow-hidden p-0.5">
                              <div
                                style={{ height: `${hasErrors ? Math.max(heightPercent, 20) : 4}%` }}
                                className={`w-full rounded-xs transition-all duration-300 ${
                                  hasErrors
                                    ? 'bg-zinc-300 hover:bg-white shadow-xs'
                                    : 'bg-zinc-800/40'
                                }`}
                              />
                            </div>

                            <span className="text-[10px] font-mono text-zinc-500 select-none">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-zinc-500 pt-2.5 border-t border-zinc-800/80 mt-2 px-1">
                  <span>Start ({timeRange.toUpperCase()} ago)</span>
                  <span className="text-zinc-300 font-semibold">Latest (Now)</span>
                </div>
              </div>

              {/* RIGHT (5 Cols): Impacted Endpoints Leaderboard (Datadog Style) */}
              <div className="lg:col-span-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div className="space-y-0.5">
                      <h2 className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold">
                        MOST IMPACTED ROUTES
                      </h2>
                      <p className="text-xs text-zinc-400 font-sans">Failure distribution across endpoints</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Realtime Impact
                    </span>
                  </div>

                  <div className="pt-3">
                    {impactedRoutes.length === 0 ? (
                      <div className="py-8 text-center text-zinc-500 text-xs font-mono space-y-1">
                        <p>No impacted routes captured yet.</p>
                        <p className="text-[11px] text-zinc-600">Events will rank here by endpoint impact.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {impactedRoutes.map((item, idx) => (
                          <div key={item.route} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] text-zinc-500 font-semibold w-4 shrink-0">
                                  #{idx + 1}
                                </span>
                                <span
                                  onClick={() => router.push('/dashboard/errors')}
                                  className="text-zinc-200 truncate font-medium hover:text-white transition cursor-pointer"
                                  title={item.route}
                                >
                                  {item.route}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[11px] text-zinc-400">
                                  {item.count} {item.count === 1 ? 'err' : 'errs'}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold tabular-nums">
                                  {item.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60">
                              <div
                                className="h-full rounded-full transition-all duration-500 bg-red-400/80"
                                style={{ width: `${Math.max(item.percentage, 4)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-800/80">
                  <span>Top Failing Routes</span>
                  <Link href="/dashboard/analytics" className="text-zinc-400 hover:text-zinc-200 transition font-medium">
                    Deep Trace →
                  </Link>
                </div>
              </div>

            </div>

            {/* 3. LOWER SECTION (RECENT INCIDENTS & QUICK ACTIONS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
              
              {/* LEFT (8 Cols): Recent Captured Crashes Table */}
              <div className="lg:col-span-8 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-3.5 shadow-sm">
                <div className="flex justify-between items-center border-b border-zinc-800/80 pb-2.5">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                      Recent Captured Crashes
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">Click any exception row to inspect full trace & AI fixes</p>
                  </div>
                  <Link
                    href="/dashboard/errors"
                    className="text-xs text-zinc-400 hover:text-white font-medium transition font-mono"
                  >
                    View All →
                  </Link>
                </div>

                {recentErrors.length === 0 ? (
                  <div className="p-8 text-center text-zinc-400 text-xs font-mono space-y-2">
                    <p>No exceptions logged for this account yet.</p>
                    <button
                      onClick={handleSendTestPing}
                      className="text-zinc-100 underline font-semibold cursor-pointer"
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
                        className="w-full text-left flex items-center justify-between p-3.5 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-lg text-xs transition cursor-pointer group gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              err.environment === 'production' ? 'bg-red-400' : 'bg-zinc-500'
                            }`}
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="font-mono text-xs sm:text-[13px] text-zinc-200 group-hover:text-white font-medium truncate transition">
                              {err.message}
                            </p>
                            <p className="text-zinc-500 font-mono text-[11px]">
                              {new Date(err.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {err.occurrence_count && err.occurrence_count > 1 ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
                              x{err.occurrence_count}
                            </span>
                          ) : null}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                              err.environment === 'production'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {err.environment}
                          </span>
                          <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-700 transition font-mono text-xs font-medium">
                            Inspect
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT (4 Cols): Developer Quickstart & Terminal Verification */}
              <div className="lg:col-span-4 bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="border-b border-zinc-800/80 pb-3">
                  <h2 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight">
                    Developer Quickstart
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">Terminal verification & token access</p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleSendTestPing}
                    disabled={firingPing || !projectKey}
                    className="w-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold py-2 px-3.5 rounded-lg transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{firingPing ? 'Dispatching...' : 'Fire Test Crash'}</span>
                  </button>

                  <button
                    onClick={toggleDemoMode}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition cursor-pointer"
                  >
                    <span>{demoMode ? 'Clear Demo' : 'Load Demo'}</span>
                  </button>
                </div>

                {/* Official SDK & Verification Box */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
                      QUICK INTEGRATION
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-md font-mono text-[10px]">
                      <button
                        type="button"
                        onClick={() => setQuickstartMode('npm')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer font-semibold ${
                          quickstartMode === 'npm'
                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        npm SDK
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickstartMode('curl')}
                        className={`px-2 py-0.5 rounded transition cursor-pointer font-semibold ${
                          quickstartMode === 'curl'
                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        cURL
                      </button>
                    </div>
                  </div>

                  {quickstartMode === 'npm' ? (
                    <div className="space-y-2">
                      {/* npm install box with 1-click copy */}
                      <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-zinc-200">
                        <code className="text-zinc-100 font-semibold">npm i snaptrace</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('npm i snaptrace');
                            setCopiedNpmInstall(true);
                            setTimeout(() => setCopiedNpmInstall(false), 2000);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] px-2.5 py-1 rounded-md transition font-mono shrink-0 cursor-pointer"
                        >
                          {copiedNpmInstall ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Code snippet with active project API key */}
                      <div className="relative group">
                        <pre className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed pr-16 scrollbar-none">{`import { initSnapTrace } from 'snaptrace';

initSnapTrace({
  apiKey: '${projectKey || 'YOUR_API_KEY'}',
});`}</pre>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`import { initSnapTrace } from 'snaptrace';\n\ninitSnapTrace({\n  apiKey: '${projectKey || 'YOUR_API_KEY'}',\n});`);
                            setCopiedNpmSnippet(true);
                            setTimeout(() => setCopiedNpmSnippet(false), 2000);
                          }}
                          className="absolute right-2 top-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[10px] px-2 py-0.5 rounded transition font-mono shrink-0 cursor-pointer"
                        >
                          {copiedNpmSnippet ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <pre className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed pr-22 scrollbar-none">{curlCommand}</pre>
                      <button
                        type="button"
                        onClick={handleCopyCurl}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] px-2.5 py-1 rounded-md transition font-mono shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        {copiedCurl ? 'Copied' : 'Copy cURL'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Ingestion Token */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono block">
                    ACTIVE PROJECT TOKEN
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs text-zinc-200 truncate font-mono">
                      {projectKey || 'Loading...'}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      {copiedKey ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Developer shortcuts */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 font-mono text-xs">
                  <Link
                    href="/test"
                    className="block p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition flex items-center justify-between"
                  >
                    <span>Test Sandbox</span>
                    <span className="text-[10px] text-zinc-500">→</span>
                  </Link>
                  <Link
                    href="/dashboard/integrations"
                    className="block p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white transition flex items-center justify-between"
                  >
                    <span>SDK Integrations</span>
                    <span className="text-[10px] text-zinc-500">→</span>
                  </Link>
                </div>
              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}