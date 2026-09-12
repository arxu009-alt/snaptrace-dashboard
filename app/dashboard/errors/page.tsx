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

  const [showBulkResolveModal, setShowBulkResolveModal] = useState<boolean>(false);
  const [bulkResolving, setBulkResolving] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState<'all' | 'production' | 'development'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  // Demo Mode State
  const [demoMode, setDemoMode] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', user.id);

    if (!userProjects || userProjects.length === 0) {
      setLogs([]);
      setLoading(false);
      return;
    }

    const targetProjectId = urlProjectId || (typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : 'all');
    const isAll = !targetProjectId || targetProjectId === 'all';
    const userProjectIds = userProjects.map((p) => p.id);

    setIsUrlFiltered(Boolean(urlProjectId));

    let query = supabase
      .from('errors')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAll) {
      setCurrentProjectName('All Projects (Global)');
      query = query.in('project_id', userProjectIds);
    } else {
      const activeProj = userProjects.find((p) => p.id === targetProjectId);
      setCurrentProjectName(activeProj ? activeProj.name : 'Selected Project');
      query = query.eq('project_id', targetProjectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching logs:', error.message);
    } else if (data) {
      setLogs(data);

      // Auto-open Inspect Modal if errorId was passed from Overview click!
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

    // If it's a client-side mock error, do not send to Supabase
    if (id >= 99900) return;

    try {
      await supabase.from('errors').update({ status: newStatus }).eq('id', id);
    } catch (e) {
      console.error('Failed to update status:', e);
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

    // Only update real non-demo records in database
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
    // If it's a client-side mock error, remove from memory
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

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const logStatus = log.status || 'unresolved';
      
      if (statusFilter !== 'all' && logStatus !== statusFilter) {
        return false;
      }

      if (envFilter !== 'all' && log.environment.toLowerCase() !== envFilter) {
        return false;
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
  }, [logs, statusFilter, envFilter, searchQuery]);

  const unresolvedCount = logs.filter((l) => (l.status || 'unresolved') === 'unresolved').length;
  const resolvedCount = logs.filter((l) => l.status === 'resolved').length;

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Exception Logs Stream</span>

              {isUrlFiltered ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-xs font-mono font-bold animate-in zoom-in-95">
                  <span>📁 {currentProjectName}</span>
                  <button
                    onClick={handleClearUrlFilter}
                    className="ml-1 hover:text-white bg-yellow-400/20 rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer"
                    title="Clear filter and view all projects"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-mono font-bold">
                  {currentProjectName}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Live telemetry feed with issue triage and real-time noise deduplication.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
            {/* ⚡ LOAD DEMO CRASHES TOGGLE */}
            <button
              onClick={toggleDemoMode}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                demoMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-[#090D16] text-slate-300 border-slate-800 hover:border-yellow-400/40'
              }`}
            >
              <span>{demoMode ? '✕ Clear Demo Crashes' : '⚡ Load Demo Crashes'}</span>
            </button>

            <div className="flex items-center gap-2 bg-[#090D16] border border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs text-emerald-400 font-bold tracking-wide uppercase font-mono">
                Live Stream Active
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-4 space-y-4 shadow-xl">
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search error messages, URLs, or file paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#05070E] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition font-mono"
              />
            </div>

            <div className="flex items-center space-x-1 bg-[#05070E] border border-slate-800 p-1 rounded-xl self-start md:self-auto font-mono">
              {(['all', 'production', 'development'] as const).map((env) => (
                <button
                  key={env}
                  onClick={() => setEnvFilter(env)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    envFilter === env
                      ? 'bg-yellow-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Triage Status Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('unresolved')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'unresolved'
                    ? 'bg-red-500/15 text-red-400 border border-red-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>🚨 Unresolved</span>
                <span className="px-1.5 py-0.2 bg-red-950/60 rounded text-[10px] font-mono font-bold">
                  {unresolvedCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'resolved'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>✓ Resolved</span>
                <span className="px-1.5 py-0.2 bg-emerald-950/60 rounded text-[10px] font-mono font-bold">
                  {resolvedCount}
                </span>
              </button>

              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                All Events ({logs.length})
              </button>
            </div>

            {unresolvedCount > 0 && (
              <button
                onClick={() => setShowBulkResolveModal(true)}
                className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-sm"
              >
                <span>✓</span>
                <span>Mark All as Resolved</span>
              </button>
            )}
          </div>
        </div>

        {/* Exception Table */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in">
              <div className="relative animate-pulse">
                <SnapTraceLogo size="lg" showText={false} />
              </div>
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Streaming Exceptions...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-xs font-mono space-y-3">
              <div className="text-3xl">🎉</div>
              <p className="font-semibold text-slate-300 text-sm">
                {logs.length === 0 ? 'No exceptions captured yet.' : 'No matching issues found for this filter.'}
              </p>
              <p className="text-slate-500">Your application runtime is running smoothly.</p>
              {logs.length === 0 && !demoMode && (
                <button
                  onClick={toggleDemoMode}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  ⚡ Load Demo Crashes to Test UI
                </button>
              )}
              {isUrlFiltered && (
                <button
                  onClick={handleClearUrlFilter}
                  className="mt-2 px-4 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  View All Projects Instead →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/90 bg-[#060911] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-4 w-12 text-center">Status</th>
                    <th className="py-4 px-4 w-44">Timestamp</th>
                    <th className="py-4 px-4">Exception Message</th>
                    <th className="py-4 px-4 w-32">Environment</th>
                    <th className="py-4 px-6 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-200">
                  {filteredLogs.map((log) => {
                    const isResolved = log.status === 'resolved';
                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-800/40 transition group ${
                          isResolved ? 'opacity-50 bg-[#05070E]/50' : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(log.id, log.status)}
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                              isResolved
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                                : 'border-slate-700 hover:border-emerald-400 hover:text-emerald-400 text-transparent'
                            }`}
                            title={isResolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                          >
                            ✓
                          </button>
                        </td>

                        <td className="py-4 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-4 px-4 font-mono font-medium truncate max-w-xs md:max-w-sm">
                          <span className={isResolved ? 'line-through text-slate-400' : 'text-slate-100 font-semibold'}>
                            {log.message || log.stack || log.stack_trace || 'Unknown exception'}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                              log.environment === 'production'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {log.environment || 'production'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 text-xs font-semibold rounded-xl transition cursor-pointer"
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

        {/* Deep Inspection Modal (100% PRESERVED) */}
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

        {/* Bulk Resolve Modal (100% PRESERVED) */}
        {showBulkResolveModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
            <div className="bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-yellow-500/10">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Mark All Exceptions as Resolved?
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    This will mark all <strong className="text-yellow-400 font-mono">{unresolvedCount}</strong> active exception(s) in <span className="text-white font-semibold">{currentProjectName}</span> as resolved.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#05070E] rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                💡 You can still access them anytime under the <strong>Resolved</strong> tab.
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkResolveModal(false)}
                  disabled={bulkResolving}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkResolveConfirm}
                  disabled={bulkResolving}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {bulkResolving ? 'Resolving All...' : 'Confirm & Mark Resolved →'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}