'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  AlertCircle,
  BarChart3,
  KeyRound,
  Code2,
  Bell,
  Cpu,
  CreditCard,
  Settings,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  LogOut,
  RotateCcw,
  FileText,
} from 'lucide-react';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import SnapTraceLoading from '@/components/SnapTraceLoading';
import FeedbackModal from '@/components/FeedbackModal';
import DashboardOnboardingTour from '@/components/DashboardOnboardingTour';
import { ensureDefaultProject } from '@/lib/projects';

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  hasBadge?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [activeErrorCount, setActiveErrorCount] = useState<number>(0);
  const [userTier, setUserTier] = useState<string>('FREE');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Real-time Badge Count Fetcher
  const fetchBadgeCount = useCallback(async () => {
    if (!supabaseUrl || !supabaseAnonKey) return;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: userProjects } = await supabase
      .from('projects')
      .select('id, plan_tier')
      .eq('user_id', session.user.id);

    if (userProjects && userProjects.length > 0) {
      const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
      const selectedProj = savedProjectId && savedProjectId !== 'all' ? userProjects.find((p) => p.id === savedProjectId) : null;
      const activeProj = selectedProj || userProjects.find((p) => p.plan_tier && p.plan_tier !== 'free') || userProjects[0];
      const tier = (activeProj?.plan_tier || 'free').toUpperCase();
      setUserTier(tier);

      const projectIds = userProjects.map((p) => p.id);
      const { count } = await supabase
        .from('errors')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      setActiveErrorCount(count || 0);
    } else {
      setUserTier('FREE');
    }
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      router.replace('/login');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function verifySession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
      } else {
        const meta = session.user?.user_metadata;
        const name = meta?.full_name || meta?.name || meta?.user_name || meta?.preferred_username;
        const avatar = meta?.avatar_url || meta?.picture;
        const email = session.user?.email || '';
        setUserDisplayName(name || email.split('@')[0] || 'Developer');
        setUserEmail(email);
        if (avatar) {
          setUserAvatarUrl(avatar);
        }

        if (email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com') {
          setIsOwner(true);
        }

        // Auto-initialize default project if new user has 0 projects
        await ensureDefaultProject(session.user.id);

        setAuthChecking(false);
        fetchBadgeCount();
      }
    }

    verifySession();

    // 1. Listen to Realtime WebSocket for live error count updates
    const channel = supabase
      .channel('realtime-sidebar-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'errors',
        },
        () => {
          fetchBadgeCount();
        }
      )
      .subscribe();

    // 2. Listen to custom window events from page actions
    window.addEventListener('snaptrace_error_updated', fetchBadgeCount);
    window.addEventListener('snaptrace_project_change', fetchBadgeCount);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      } else if (session?.user) {
        const meta = session.user.user_metadata;
        const name = meta?.full_name || meta?.name || meta?.user_name || meta?.preferred_username;
        const avatar = meta?.avatar_url || meta?.picture;
        const email = session.user.email || '';
        setUserDisplayName(name || email.split('@')[0] || 'Developer');
        setUserEmail(email);
        if (avatar) {
          setUserAvatarUrl(avatar);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('snaptrace_error_updated', fetchBadgeCount);
      window.removeEventListener('snaptrace_project_change', fetchBadgeCount);
      supabase.removeChannel(channel);
    };
  }, [router, supabaseUrl, supabaseAnonKey, fetchBadgeCount]);

  const handleSignOut = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleTriggerTour = () => {
    setProfileDropdownOpen(false);
    window.dispatchEvent(new Event('snaptrace_replay_tour'));
  };

  type NavGroup = {
    label: string;
    items: NavItem[];
  };

  const navGroups: NavGroup[] = [
    {
      label: 'OBSERVABILITY',
      items: [
        { id: 'tour-nav-overview',  name: 'Overview',        href: '/dashboard',           icon: LayoutDashboard },
        { id: 'tour-nav-errors',    name: 'Exception Logs',  href: '/dashboard/errors',    icon: AlertCircle, hasBadge: true },
        { id: 'tour-nav-analytics', name: 'Crash Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { id: 'tour-nav-reports',   name: 'Client Reports',  href: '/dashboard/reports',   icon: FileText },
      ],
    },
    {
      label: 'CONFIG & TELEMETRY',
      items: [
        { id: 'tour-nav-projects',     name: 'Projects & API Keys', href: '/dashboard/projects',     icon: KeyRound },
        { id: 'tour-nav-integrations', name: 'SDK Integrations',    href: '/dashboard/integrations', icon: Code2 },
        { id: 'tour-nav-alerts',       name: 'Alert Destinations',  href: '/dashboard/alerts',       icon: Bell },
        { id: 'tour-nav-ai',           name: 'AI Copilot (BYOK)',   href: '/dashboard/ai',           icon: Cpu },
      ],
    },
    {
      label: 'WORKSPACE & ACCOUNT',
      items: [
        { id: 'tour-nav-billing',  name: 'Billing & Usage',  href: '/dashboard/billing',  icon: CreditCard },
        { id: 'tour-nav-settings', name: 'Account Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  const getPageTitle = () => {
    if (pathname === '/dashboard')             return 'System Overview';
    if (pathname === '/dashboard/errors')      return 'Exception Logs Stream';
    if (pathname === '/dashboard/analytics')   return 'Crash & Endpoint Analytics';
    if (pathname === '/dashboard/reports')     return 'Client Reports';
    if (pathname === '/dashboard/projects')    return 'Projects & API Keys';
    if (pathname === '/dashboard/integrations') return 'SDK Integrations';
    if (pathname === '/dashboard/alerts')      return 'Alert Destinations';
    if (pathname === '/dashboard/ai')          return 'AI Copilot (BYOK)';
    if (pathname === '/dashboard/billing')     return 'Billing & Usage';
    if (pathname === '/dashboard/settings')    return 'Account Settings';
    return 'Dashboard';
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">
        <SnapTraceLoading size="lg" text="Loading Dashboard..." />
      </div>
    );
  }

  const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'M';

  return (
    <div className="min-h-screen bg-[#07090e] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.06),rgba(0,0,0,0))] text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-zinc-100">
      
      {/* 1. Left Sidebar Navigation */}
      <aside
        className={`bg-zinc-950/70 backdrop-blur-xl border-r border-white/[0.06] flex-shrink-0 flex flex-col transition-all duration-200 print:hidden ${
          sidebarCollapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-full md:w-64'
        }`}
      >
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between min-w-[240px]">
          <Link href="/dashboard" className="transition hover:opacity-90 active:scale-95">
            <SnapTraceLogo size="md" showText={!sidebarCollapsed} />
          </Link>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono text-zinc-400 border border-white/[0.08] bg-zinc-900/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
              v1.0
            </span>
          )}
        </div>

        {!sidebarCollapsed && (
          <div id="tour-project-switcher" className="px-3.5 py-3 border-b border-white/[0.06] bg-transparent min-w-[240px]">
            <ProjectSwitcher />
          </div>
        )}

        <nav className="flex-1 py-2 min-w-[240px] overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-3 pt-4 pb-1 block">
                  {group.label}
                </span>
              )}
              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      id={item.id}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors duration-150 ${
                        isActive
                          ? 'bg-zinc-900 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                        {!sidebarCollapsed && <span>{item.name}</span>}
                      </div>
                      {!sidebarCollapsed && item.hasBadge && activeErrorCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          {activeErrorCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3.5 border-t border-white/[0.06] text-[11px] text-zinc-400 flex items-center justify-between min-w-[240px] font-mono">
            <span>Featherweight APM</span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        )}
      </aside>

      {/* 2. Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        
        {/* Top Header */}
        <header className="h-14 border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl px-5 flex items-center justify-between z-40 print:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-zinc-500">SnapTrace</span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-200 font-medium">{getPageTitle()}</span>
            </div>
          </div>

          <div id="tour-header-actions" className="flex items-center space-x-3">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 text-xs font-medium rounded-md transition flex items-center gap-1.5 cursor-pointer shadow-sm font-sans"
            >
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Feedback</span>
            </button>

            <div className="hidden md:flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider font-mono">
                Ingestion Active
              </span>
            </div>

            <div className="relative font-sans">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition cursor-pointer shadow-sm"
              >
                <div className="h-6 w-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center overflow-hidden shrink-0">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userDisplayName}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    userInitial
                  )}
                </div>
                
                <span className="hidden lg:inline text-xs text-zinc-300 font-medium max-w-[120px] truncate">
                  {userDisplayName}
                </span>

                <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-2 py-0.5 rounded">
                  {isOwner ? 'OWNER' : userTier}
                </span>

                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="flex items-center gap-2.5 px-3 py-2 border-b border-zinc-800/80 mb-1">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center overflow-hidden shrink-0">
                      {userAvatarUrl ? (
                        <img
                          src={userAvatarUrl}
                          alt={userDisplayName}
                          className="h-full w-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-xs text-zinc-100 font-medium truncate">{userDisplayName}</p>
                      <p className="text-[10px] text-zinc-400 font-mono truncate">{userEmail}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerTour}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition cursor-pointer text-left font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Replay Setup Tour</span>
                  </button>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition font-medium"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Account & Alert Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/projects"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Manage Projects & Keys</span>
                  </Link>

                  <div className="border-t border-zinc-800/80 my-1" />

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 transition cursor-pointer text-left font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-y-auto p-0">
          {children}
        </main>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userEmail={userEmail}
      />

      <DashboardOnboardingTour />
    </div>
  );
}
