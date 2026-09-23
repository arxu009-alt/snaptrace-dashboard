'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import InspectErrorModal from '@/components/InspectErrorModal';
import SnapTraceLogo from '@/components/SnapTraceLogo';

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
  project_id?: string;
  occurrence_count?: number;
}

interface GroupedIssue {
  key: string;
  latestLog: ErrorLog;
  count: number;
  firstSeen: string;
  lastSeen: string;
  allLogs: ErrorLog[];
}

type DateFilter = 'all' | 'today' | '7d' | '30d';

const MOCK_DEMO_ERRORS: ErrorLog[] = [
  {
    id: 99901,
    message: 'ReferenceError: Connection pool exhausted at database.js:18:11',
    stack_trace: 'ReferenceError: Connection pool exhausted\n    at pool.connect (C:\\app\\database.js:18:11)\n    at handleCheckout (C:\\app\\checkout.js:45:9)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    url: 'https://example.com/api/checkout',
    environment: 'production',
    status: 'unresolved',
    created_at: new Date().toISOString(),
  },
  {
    id: 99902,
    message: 'UnhandledPromiseRejection: Stripe API 504 Gateway Timeout on /v1/charge',
    stack_trace: 'Error: Gateway timeout 504\n    at fetchWithRetry (C:\\app\\stripe.js:102:15)\n    at processPayment (C:\\app\\billing.js:28:7)',
    url: 'https://example.com/billing',
    environment: 'production',
    status: 'unresolved',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 99903,
    message: 'RenderLoopError: Maximum update depth exceeded in UserProfile component',
    stack_trace: 'Error: Maximum update depth exceeded\n    at setState (react-dom.js:312:12)\n    at useEffect (UserProfile.jsx:19:5)',
    url: 'http://localhost:3000/profile',
    environment: 'development',
    status: 'unresolved',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
];

export default function ExceptionLogsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get('projectId');
  const urlErrorId = searchParams.get('errorId');

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProjectName, setCurrentProjectName] = useState<string>('All Projects');
  const [isUrlFiltered, setIsUrlFiltered] = useState<boolean>(false);

  // User Tier & Feature Gate State
  const [userPlanTier, setUserPlanTier] = useState<string>('pro');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [showExportLockModal, setShowExportLockModal] = useState<boolean>(false);

  const [showBulkResolveModal, setShowBulkResolveModal] = useState<boolean>(false);
  const [bulkResolving, setBulkResolving] = useState<boolean>(false);

  // Filters and View Mode State
  const [viewMode, setViewMode] = useState<'grouped' | 'raw'>('grouped');
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'development'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [demoMode, setDemoMode] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const email = session.user.email || '';
    const ownerCheck = email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com';
    setIsOwner(ownerCheck);

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name, plan_tier')
      .eq('user_id', session.user.id);

    if (!userProjects || userProjects.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const targetProjectId = urlProjectId || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all');
    const isAll = !targetProjectId || targetProjectId === 'all';
    const userProjectIds = userProjects.map((p) => p.id);

    // Determine tier
    const activeProject = userProjects.find((p) => p.id === targetProjectId) || userProjects[0];
    const tier = ownerCheck ? 'scale' : (activeProject?.plan_tier || 'pro');
    setUserPlanTier(tier);

    setIsUrlFiltered(Boolean(urlProjectId));

    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAll) {
      setCurrentProjectName('All Projects (Global)');
      query = query.in('project_id', userProjectIds);
    } else {
      setCurrentProjectName(activeProject ? activeProject.name : 'Selected Project');
      query = query.eq('project_id', targetProjectId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLogs(data);

      if (urlErrorId) {
        const matched = data.find((l) => String(l.id) === String(urlErrorId));
        if (matched) {
          setSelectedLog(matched);
        }
      }
    }
    setLoading(false);
  }, [urlProjectId, urlErrorId]);

  useEffect(() => {
    loadLogs();
    window.addEventListener('snaptrace_project_change', loadLogs);

    const channel = supabase
      .channel('realtime-errors-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'errors',
        },
        (payload) => {
          const targetProjectId = urlProjectId || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all');
          if (!targetProjectId || targetProjectId === 'all' || payload.new.project_id === targetProjectId) {
            setLogs((prevLogs) => [payload.new as ErrorLog, ...prevLogs]);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('snaptrace_project_change', loadLogs);
      supabase.removeChannel(channel);
    };
  }, [loadLogs, urlProjectId]);

  const toggleDemoMode = () => {
    if (!demoMode) {
      setDemoMode(true);
      setLogs((prev) => [...MOCK_DEMO_ERRORS, ...prev]);
    } else {
      setDemoMode(false);
      setLogs((prev) => prev.filter((log) => log.id < 99900));
    }
  };

  const handleClearUrlFilter = () => {
    router.push('/dashboard/errors');
  };

  const handleToggleStatus = async (id: number, currentStatus?: string) => {
    const newStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
    
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status: newStatus } : log))
    );

    if (id >= 99900) return;

    try {
      await supabase.from('errors').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const handleResolveGroup = async (group: GroupedIssue) => {
    const targetStatus = group.latestLog.status === 'resolved' ? 'unresolved' : 'resolved';
    const ids = group.allLogs.map((l) => l.id);

    setLogs((prev) =>
      prev.map((l) => (ids.includes(l.id) ? { ...l, status: targetStatus } : l))
    );

    const realIds = ids.filter((id) => id < 99900);
    if (realIds.length > 0) {
      await supabase.from('errors').update({ status: targetStatus }).in('id', realIds);
    }
  };

  const handleBulkResolveConfirm = async () => {
    const unresolvedList = logs.filter((l) => (l.status || 'unresolved') === 'unresolved');
    if (unresolvedList.length === 0) {
      setShowBulkResolveModal(false);
      return;
    }

    setBulkResolving(true);
    const unresolvedIds = unresolvedList.map((l) => l.id);

    setLogs((prev) =>
      prev.map((l) => (unresolvedIds.includes(l.id) ? { ...l, status: 'resolved' } : l))
    );

    const realIds = unresolvedIds.filter((id) => id < 99900);
    if (realIds.length > 0) {
      try {
        await supabase
          .from('errors')
          .update({ status: 'resolved' })
          .in('id', realIds);
      } catch (e) {
        console.error('Bulk resolve failed:', e);
      }
    }

    setBulkResolving(false);
    setShowBulkResolveModal(false);
  };

  const handleDeleteLog = async (id: number) => {
    if (id >= 99900) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
      return;
    }

    const { error } = await supabase.from('errors').delete().eq('id', id);
    if (!error) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
    }
  };

  // 🌟 DYNAMIC FILTER LOGIC INCLUDING DATE RANGE
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return logs.filter((log) => {
      const logStatus = log.status || 'unresolved';
      
      if (statusFilter !== 'all' && logStatus !== statusFilter) {
        return false;
      }

      if (envFilter !== 'all' && log.environment.toLowerCase() !== envFilter) {
        return false;
      }

      // Date Range Filter Logic
      if (dateFilter !== 'all') {
        const logTime = new Date(log.created_at).getTime();
        if (dateFilter === 'today' && logTime < startOfToday.getTime()) {
          return false;
        }
        if (dateFilter === '7d' && logTime < (now - 7 * 24 * 60 * 60 * 1000)) {
          return false;
        }
        if (dateFilter === '30d' && logTime < (now - 30 * 24 * 60 * 60 * 1000)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMsg = log.message?.toLowerCase().includes(q);
        const matchUrl = log.url?.toLowerCase().includes(q);
        const matchStack = (log.stack_trace || log.stack || '').toLowerCase().includes(q);
        return matchMsg || matchUrl || matchStack;
      }

      return true;
    });
  }, [logs, statusFilter, envFilter, dateFilter, searchQuery]);

  const groupedIssues = useMemo(() => {
    const groups: Record<string, GroupedIssue> = {};

    filteredLogs.forEach((log) => {
      const cleanMsg = (log.message || 'Unknown Exception').trim();
      const key = cleanMsg + '::' + (log.environment || 'production');

      if (!groups[key]) {
        groups[key] = {
          key,
          latestLog: log,
          count: 1,
          firstSeen: log.created_at,
          lastSeen: log.created_at,
          allLogs: [log],
        };
      } else {
        groups[key].count += 1;
        groups[key].allLogs.push(log);
        if (new Date(log.created_at) > new Date(groups[key].lastSeen)) {
          groups[key].lastSeen = log.created_at;
          groups[key].latestLog = log;
        }
      }
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }, [filteredLogs]);

  // GATED EXPORT HANDLERS (BUSINESS SCALE / OWNER EXCLUSIVE)
  const hasExportAccess = isOwner || userPlanTier === 'scale';

  const exportToCSV = () => {
    if (!hasExportAccess) {
      setShowExportLockModal(true);
      return;
    }

    const data = viewMode === 'grouped'
      ? groupedIssues.map((g) => ({
          issue_id: g.latestLog.id,
          message: g.latestLog.message,
          occurrences: g.count,
          environment: g.latestLog.environment,
          status: g.latestLog.status || 'unresolved',
          last_seen: g.lastSeen,
          first_seen: g.firstSeen,
          url: g.latestLog.url || 'N/A',
        }))
      : filteredLogs.map((l) => ({
          error_id: l.id,
          message: l.message,
          environment: l.environment,
          status: l.status || 'unresolved',
          timestamp: l.created_at,
          url: l.url || 'N/A',
        }));

    if (!data.length) {
      alert('No logs available to export for this filter.');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row: any) =>
      Object.values(row)
        .map((val) => '"' + String(val).replace(/"/g, '""') + '"')
        .join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers, ...rows].join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', 'snaptrace_logs_' + dateStr + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (!hasExportAccess) {
      setShowExportLockModal(true);
      return;
    }

    const data = viewMode === 'grouped' ? groupedIssues : filteredLogs;
    if (!data.length) {
      alert('No logs available to export for this filter.');
      return;
    }

    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', 'snaptrace_logs_' + dateStr + '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const unresolvedCount = logs.filter((l) => (l.status || 'unresolved') === 'unresolved').length;
  const resolvedCount = logs.filter((l) => l.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 flex items-center gap-2.5 flex-wrap">
              <span>Exception Logs</span>

              {isUrlFiltered ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono">
                  <span>{currentProjectName}</span>
                  <button
                    onClick={handleClearUrlFilter}
                    className="ml-1 hover:text-zinc-100 text-zinc-500 w-3.5 h-3.5 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Clear filter"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono uppercase tracking-wider">
                  {currentProjectName}
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500 font-mono">
              Live telemetry feed with issue triage, date filters, fingerprint deduplication, and AI fixes.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              onClick={toggleDemoMode}
              className={
                'px-2.5 py-1.5 rounded-md text-xs font-mono transition flex items-center gap-1.5 cursor-pointer border ' +
                (demoMode
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700')
              }
            >
              <span>{demoMode ? '✕ Clear Demo' : 'Load Demo Crashes'}</span>
            </button>

            <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase font-mono">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar with Search, View Mode, Date Filter, & Environment Pills */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 space-y-3">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            <div className="flex-1 relative">
              <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search error messages, URLs, or file paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition font-mono"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Date Range Selector */}
              <div className="flex items-center bg-zinc-900/40 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs">
                {(['all', 'today', '7d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateFilter(range)}
                    className={
                      'px-2.5 py-1 text-xs rounded-md transition cursor-pointer ' +
                      (dateFilter === range
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200')
                    }
                  >
                    {range === 'all' ? 'All Time' : range === 'today' ? 'Today' : range === '7d' ? '7 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-zinc-900/40 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs">
                <button
                  onClick={() => setViewMode('grouped')}
                  className={
                    'px-2.5 py-1 rounded-md transition cursor-pointer ' +
                    (viewMode === 'grouped'
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200')
                  }
                  title="Group identical crashes by fingerprint"
                >
                  Grouped
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={
                    'px-2.5 py-1 rounded-md transition cursor-pointer ' +
                    (viewMode === 'raw'
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200')
                  }
                  title="Show every individual crash event"
                >
                  Raw
                </button>
              </div>

              {/* Environment Filter */}
              <div className="flex items-center bg-zinc-900/40 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs">
                {(['all', 'production', 'development'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setEnvFilter(env)}
                    className={
                      'px-2.5 py-1 text-xs rounded-md capitalize transition cursor-pointer ' +
                      (envFilter === env
                        ? 'bg-zinc-800 text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200')
                    }
                  >
                    {env}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Triage Status Tabs + Gated Export Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-zinc-800/60 pt-2.5 text-xs">
            <div className="flex items-center gap-1 flex-wrap font-mono">
              <button
                onClick={() => setStatusFilter('unresolved')}
                className={
                  'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ' +
                  (statusFilter === 'unresolved'
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200')
                }
              >
                <span>Unresolved</span>
                <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[10px] font-mono">
                  {unresolvedCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('resolved')}
                className={
                  'px-2.5 py-1 rounded-md transition flex items-center gap-1.5 cursor-pointer ' +
                  (statusFilter === 'resolved'
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200')
                }
              >
                <span>Resolved</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-mono">
                  {resolvedCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('all')}
                className={
                  'px-2.5 py-1 rounded-md transition cursor-pointer ' +
                  (statusFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200')
                }
              >
                All ({logs.length})
              </button>
            </div>

            {/* Gated Export Actions & Bulk Resolve Button */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
              <button
                onClick={exportToCSV}
                disabled={filteredLogs.length === 0}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs font-mono transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                title={hasExportAccess ? 'Download filtered logs as CSV' : 'Business Scale Feature (Click to unlock)'}
              >
                <span>{hasExportAccess ? '↓' : '🔒'}</span>
                <span>CSV</span>
              </button>

              <button
                onClick={exportToJSON}
                disabled={filteredLogs.length === 0}
                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs font-mono transition cursor-pointer disabled:opacity-40 flex items-center gap-1.5"
                title={hasExportAccess ? 'Download filtered logs as JSON' : 'Business Scale Feature (Click to unlock)'}
              >
                <span>{hasExportAccess ? '↓' : '🔒'}</span>
                <span>JSON</span>
              </button>

              {unresolvedCount > 0 && (
                <button
                  onClick={() => setShowBulkResolveModal(true)}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/30 rounded-md text-xs font-mono transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Resolve All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table View Container */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 animate-in fade-in">
              <div className="relative animate-pulse">
                <SnapTraceLogo size="md" showText={false} />
              </div>
              <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">Loading stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 text-xs font-mono space-y-3">
              <p className="font-medium text-zinc-300 text-sm">
                {logs.length === 0 ? 'No exceptions captured yet.' : 'No matching issues found for this timeframe/filter.'}
              </p>
              <p className="text-zinc-500">Your application runtime is running cleanly.</p>
              {logs.length === 0 && !demoMode && (
                <button
                  onClick={toggleDemoMode}
                  className="mt-2 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-md text-xs font-mono cursor-pointer transition"
                >
                  Load Demo Crashes
                </button>
              )}
            </div>
          ) : viewMode === 'grouped' ? (
            /* VIEW 1: DEDUPLICATED GROUPED ISSUES TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 px-4 w-12 text-center">Status</th>
                    <th className="py-2.5 px-4">Issue</th>
                    <th className="py-2.5 px-4 w-24 text-center">Events</th>
                    <th className="py-2.5 px-4 w-40">Last Seen</th>
                    <th className="py-2.5 px-4 w-32">Environment</th>
                    <th className="py-2.5 px-6 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-200 font-mono">
                  {groupedIssues.map((group) => {
                    const isResolved = group.latestLog.status === 'resolved';

                    return (
                      <tr
                        key={group.key}
                        className={
                          'border-b border-zinc-800/40 hover:bg-zinc-900/40 transition ' +
                          (isResolved ? 'opacity-50' : '')
                        }
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleResolveGroup(group)}
                            className={
                              'w-4 h-4 rounded border flex items-center justify-center text-[10px] transition cursor-pointer mx-auto ' +
                              (isResolved
                                ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                                : 'border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-transparent')
                            }
                            title={isResolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                          >
                            ✓
                          </button>
                        </td>

                        <td className="py-3 px-4 max-w-md">
                          <div className="space-y-0.5">
                            <span className={'font-semibold text-xs block truncate font-mono ' + (isResolved ? 'line-through text-zinc-500' : 'text-zinc-200')}>
                              {group.latestLog.message}
                            </span>
                            <span className="text-[11px] text-zinc-500 truncate block font-mono">
                              {group.latestLog.url || 'Universal Background Client'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                            x{group.count}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-zinc-500 text-[11px] whitespace-nowrap font-mono">
                          {new Date(group.lastSeen).toLocaleTimeString()}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={
                              'text-[10px] font-mono px-2 py-0.5 rounded ' +
                              (group.latestLog.environment === 'production'
                                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                : 'text-amber-400 bg-amber-500/10 border border-amber-500/20')
                            }
                          >
                            {group.latestLog.environment || 'production'}
                          </span>
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLog(group.latestLog)}
                            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 text-xs px-2.5 py-1 rounded-md transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW 2: RAW EVENT STREAM TABLE */
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    <th className="py-2.5 px-4 w-12 text-center">Status</th>
                    <th className="py-2.5 px-4 w-44">Timestamp</th>
                    <th className="py-2.5 px-4">Exception</th>
                    <th className="py-2.5 px-4 w-32">Environment</th>
                    <th className="py-2.5 px-6 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-200 font-mono">
                  {filteredLogs.map((log) => {
                    const isResolved = log.status === 'resolved';
                    return (
                      <tr
                        key={log.id}
                        className={
                          'border-b border-zinc-800/40 hover:bg-zinc-900/40 transition ' +
                          (isResolved ? 'opacity-50' : '')
                        }
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(log.id, log.status)}
                            className={
                              'w-4 h-4 rounded border flex items-center justify-center text-[10px] transition cursor-pointer mx-auto ' +
                              (isResolved
                                ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                                : 'border-zinc-700 hover:border-emerald-500 text-transparent')
                            }
                            title={isResolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                          >
                            ✓
                          </button>
                        </td>

                        <td className="py-3 px-4 text-zinc-500 text-[11px] whitespace-nowrap font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 truncate max-w-xs md:max-w-sm">
                          <span className={isResolved ? 'line-through text-zinc-500 font-mono text-xs' : 'text-zinc-200 font-semibold font-mono text-xs'}>
                            {log.message || log.stack || log.stack_trace || 'Unknown exception'}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={
                              'text-[10px] font-mono px-2 py-0.5 rounded ' +
                              (log.environment === 'production'
                                ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                                : 'text-amber-400 bg-amber-500/10 border border-amber-500/20')
                            }
                          >
                            {log.environment || 'production'}
                          </span>
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-zinc-100 text-xs px-2.5 py-1 rounded-md transition cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="px-2.5 py-1 text-red-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/30 text-xs rounded-md transition cursor-pointer"
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
          )}
        </div>

        {/* Deep Inspection Modal */}
        {selectedLog && (
          <InspectErrorModal
            log={selectedLog}
            onClose={() => {
              setSelectedLog(null);
              if (urlErrorId) {
                router.replace('/dashboard/errors');
              }
            }}
            onDelete={handleDeleteLog}
          />
        )}

        {/* Bulk Resolve Modal */}
        {showBulkResolveModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowBulkResolveModal(false);
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
          >
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    Mark All Exceptions as Resolved?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    This will mark all <strong className="text-zinc-200 font-mono">{unresolvedCount}</strong> active exception(s) in <span className="text-zinc-200 font-medium">{currentProjectName}</span> as resolved.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-[11px] text-zinc-400 font-mono">
                You can still access them anytime under the <strong className="text-zinc-300">Resolved</strong> tab.
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkResolveModal(false)}
                  disabled={bulkResolving}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkResolveConfirm}
                  disabled={bulkResolving}
                  className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {bulkResolving ? 'Resolving All...' : 'Confirm & Mark Resolved'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCALE EXPORT FEATURE LOCK MODAL */}
        {showExportLockModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowExportLockModal(false);
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
          >
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setShowExportLockModal(false)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200 text-xs cursor-pointer font-mono"
              >
                ✕
              </button>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-mono uppercase tracking-wider">
                  🔒 Business Scale Feature
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Raw Log Export is Locked
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Exporting filtered telemetry to raw <strong className="text-zinc-200">CSV spreadsheets</strong> and <strong className="text-zinc-200">JSON data payloads</strong> is an exclusive capability of the <strong className="text-emerald-400">Business Scale</strong> tier.
                </p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Your Current Plan:</span>
                  <span className="text-zinc-200 font-medium uppercase">
                    {isOwner ? 'Owner' : userPlanTier.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Required Plan:</span>
                  <span className="text-emerald-400 font-medium uppercase">Business Scale</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <a
                  href="mailto:hello.snaptrace@gmail.com?subject=SnapTrace%20Business%20Scale%20CSV%20Export%20Upgrade"
                  className="w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  Contact to Upgrade to Scale →
                </a>
                <button
                  type="button"
                  onClick={() => setShowExportLockModal(false)}
                  className="w-full py-1.5 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}