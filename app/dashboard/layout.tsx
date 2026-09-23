'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  AlertTriangle,
  KeyRound,
  Blocks,
  Settings,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import FeedbackModal from '@/components/FeedbackModal';
import DashboardOnboardingTour from '@/components/DashboardOnboardingTour';

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
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [activeErrorCount, setActiveErrorCount] = useState<number>(0);

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
      .select('id')
      .eq('user_id', session.user.id);

    if (userProjects && userProjects.length > 0) {
      const projectIds = userProjects.map((p) => p.id);
      const { count } = await supabase
        .from('errors')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds);

      setActiveErrorCount(count || 0);
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
        const name = session.user?.user_metadata?.full_name;
        const email = session.user?.email || '';
        setUserDisplayName(name || email.split('@')[0] || 'Developer');
        setUserEmail(email);

        if (email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com') {
          setIsOwner(true);
        }

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

  const navItems: NavItem[] = [
    { id: 'tour-nav-overview', name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { id: 'tour-nav-errors', name: 'Exception Logs', href: '/dashboard/errors', icon: AlertTriangle, hasBadge: true },
    { id: 'tour-nav-projects', name: 'API Keys & Projects', href: '/dashboard/projects', icon: KeyRound },
    { id: 'tour-nav-integrations', name: 'Language Integrations', href: '/dashboard/integrations', icon: Blocks },
    { id: 'tour-nav-settings', name: 'Alert & AI Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'System Overview';
    if (pathname === '/dashboard/errors') return 'Exception Logs Stream';
    if (pathname === '/dashboard/projects') return 'API Keys & Projects';
    if (pathname === '/dashboard/integrations') return 'Language & SDK Integrations';
    if (pathname === '/dashboard/settings') return 'Settings & AI Copilot';
    return 'Dashboard';
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-200">
          <div className="relative animate-pulse">
            <SnapTraceLogo size="lg" showText={false} />
          </div>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'M';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-zinc-800 selection:text-zinc-100">
      
      {/* 1. Left Sidebar Navigation */}
      <aside
        className={`bg-zinc-950 border-r border-zinc-800/80 flex-shrink-0 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-full md:w-64'
        }`}
      >
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between min-w-[240px]">
          <Link href="/dashboard" className="transition hover:opacity-90 active:scale-95">
            <SnapTraceLogo size="md" showText={!sidebarCollapsed} />
          </Link>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-mono text-zinc-400 border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 rounded uppercase tracking-wider">
              BETA
            </span>
          )}
        </div>

        {!sidebarCollapsed && (
          <div id="tour-project-switcher" className="px-3.5 py-3 border-b border-zinc-800/80 bg-zinc-950 min-w-[240px]">
            <ProjectSwitcher />
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1 min-w-[240px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                id={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors duration-150 ${
                  isActive
                    ? 'bg-zinc-900 text-zinc-100 font-medium border-l-2 border-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </div>

                {/* Live Realtime Error Count Badge */}
                {!sidebarCollapsed && item.hasBadge && activeErrorCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    {activeErrorCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-3.5 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-between min-w-[240px] font-mono">
            <span>Featherweight APM</span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        )}
      </aside>

      {/* 2. Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-5 flex items-center justify-between z-40">
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
                <div className="h-6 w-6 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center">
                  {userInitial}
                </div>
                
                <span className="hidden lg:inline text-xs text-zinc-300 font-medium max-w-[120px] truncate">
                  {userDisplayName}
                </span>

                <span className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs px-2 py-0.5 rounded">
                  {isOwner ? 'OWNER' : 'BETA PRO'}
                </span>

                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-zinc-800/80 mb-1 space-y-0.5">
                    <p className="text-xs text-zinc-100 font-medium truncate">{userDisplayName}</p>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">{userEmail}</p>
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
