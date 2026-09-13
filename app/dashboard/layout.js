'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import FeedbackModal from '@/components/FeedbackModal';
import DashboardOnboardingTour from '@/components/DashboardOnboardingTour';
import SnappyAssistant from '@/components/SnappyAssistant';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPlanTier, setUserPlanTier] = useState('free');
  const [isOwner, setIsOwner] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [activeErrorCount, setActiveErrorCount] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      router.replace('/login');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fast local session verification (0ms network delay)
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
          setUserPlanTier('team_scale');
        }

        setAuthChecking(false);

        // Fetch count in background without blocking UI render
        supabase
          .from('projects')
          .select('id')
          .eq('user_id', session.user.id)
          .then(({ data: userProjects }) => {
            if (userProjects && userProjects.length > 0) {
              const projectIds = userProjects.map((p) => p.id);
              supabase
                .from('errors')
                .select('*', { count: 'exact', head: true })
                .in('project_id', projectIds)
                .then(({ count }) => {
                  setActiveErrorCount(count || 0);
                });
            }
          });
      }
    }

    verifySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabaseUrl, supabaseAnonKey]);

  const handleSignOut = async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleTriggerTour = () => {
    setProfileDropdownOpen(false);
    window.dispatchEvent(new Event('snaptrace_replay_tour'));
  };

  const navItems = [
    { id: 'tour-nav-overview', name: 'Overview', href: '/dashboard', icon: '📊' },
    { id: 'tour-nav-errors', name: 'Exception Logs', href: '/dashboard/errors', icon: '🚨', hasBadge: true },
    { id: 'tour-nav-projects', name: 'API Keys & Projects', href: '/dashboard/projects', icon: '🔑' },
    { id: 'tour-nav-integrations', name: 'Language Integrations', href: '/dashboard/integrations', icon: '⚡' },
    { id: 'tour-nav-settings', name: 'Alert & AI Settings', href: '/dashboard/settings', icon: '⚙️' },
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
      <div className="min-h-screen bg-[#05070E] text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-200">
          <div className="relative animate-pulse">
            <SnapTraceLogo size="lg" showText={false} />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : 'M';

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-yellow-400 selection:text-slate-950">
      
      {/* 1. Left Sidebar Navigation */}
      <aside
        className={`bg-[#090D16]/95 border-r border-slate-800/80 flex-shrink-0 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-full md:w-64'
        }`}
      >
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between min-w-[240px]">
          <Link href="/dashboard" className="transition hover:opacity-90 active:scale-95">
            <SnapTraceLogo size="md" showText={!sidebarCollapsed} />
          </Link>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm font-mono">
              BETA
            </span>
          )}
        </div>

        {!sidebarCollapsed && (
          <div id="tour-project-switcher" className="px-4 py-3 border-b border-slate-800/60 bg-[#060911]/80 min-w-[240px]">
            <ProjectSwitcher />
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1.5 min-w-[240px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                id={item.id}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-400/15 via-yellow-400/5 to-transparent text-yellow-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-base">{item.icon}</span>
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </div>

                {!sidebarCollapsed && item.hasBadge && activeErrorCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    {activeErrorCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between min-w-[240px] font-mono">
            <span>Featherweight APM</span>
            <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
        )}
      </aside>

      {/* 2. Main Content View (Clean container without transform-gpu trap) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#05070E]">
        
        <header className="h-16 border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-md px-6 flex items-center justify-between z-40">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-yellow-400 hover:border-yellow-400/40 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-500">SnapTrace</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-200 font-bold">{getPageTitle()}</span>
            </div>
          </div>

          <div id="tour-header-actions" className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-3.5 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm font-mono"
            >
              <span>💡</span>
              <span className="hidden sm:inline">Feedback</span>
            </button>

            <div className="hidden md:flex items-center gap-2 bg-[#05070E] border border-slate-800 px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider font-mono">
                Ingestion Active
              </span>
            </div>

            <div className="relative font-sans">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-yellow-400/40 transition cursor-pointer shadow-sm"
              >
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  {userInitial}
                </div>
                
                <span className="hidden lg:inline text-xs text-slate-200 font-bold max-w-[120px] truncate">
                  {userDisplayName}
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 uppercase tracking-wider">
                  {isOwner ? '👑 OWNER' : '⚡ BETA PRO'}
                </span>

                <span className="text-slate-500 text-[10px]">▾</span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-[#090D16] border border-slate-800 rounded-3xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2.5 border-b border-slate-800/80 mb-1 space-y-1">
                    <p className="text-xs text-white font-bold truncate">{userDisplayName}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                  </div>

                  <button
                    onClick={handleTriggerTour}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-yellow-300 hover:bg-yellow-400/10 transition cursor-pointer text-left font-semibold"
                  >
                    <span>🎓</span>
                    <span>Replay Setup Tour</span>
                  </button>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <span>⚙️</span>
                    <span>Account & Alert Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/projects"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                  >
                    <span>🔑</span>
                    <span>Manage Projects & Keys</span>
                  </Link>

                  <div className="border-t border-slate-800/80 my-1" />

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/30 transition cursor-pointer text-left font-semibold"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Clean Viewport Content (No transform traps) */}
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
      <SnappyAssistant />
    </div>
  );
}