'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import FeedbackModal from '@/components/FeedbackModal';
import DashboardOnboardingTour from '@/components/DashboardOnboardingTour';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
        setUserEmail(session.user?.email || 'Developer');
        setAuthChecking(false);
      }
    }

    verifySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      } else if (session?.user?.email) {
        setUserEmail(session.user.email);
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
    { name: 'Overview', href: '/dashboard', icon: '📊' },
    { name: 'Exception Logs', href: '/dashboard/errors', icon: '🚨' },
    { name: 'API Keys & Projects', href: '/dashboard/projects', icon: '🔑' },
    { name: 'Language Integrations', href: '/dashboard/integrations', icon: '⚡' },
    { name: 'Alert & AI Settings', href: '/dashboard/settings', icon: '⚙️' },
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
        <div className="flex flex-col items-center space-y-4 animate-in fade-in">
          <div className="relative animate-pulse">
            <SnapTraceLogo size="lg" showText={false} />
          </div>
          <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
            Verifying Session Authorization...
          </p>
        </div>
      </div>
    );
  }

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* 1. Left Sidebar Navigation (Collapsible) */}
      <aside
        className={`bg-[#090D16] border-r border-slate-800/80 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-full md:w-64'
        }`}
      >
        {/* Brand Header with BETA Badge */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between min-w-[240px]">
          <Link href="/dashboard" className="transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={!sidebarCollapsed} />
          </Link>
          {!sidebarCollapsed && (
            <span className="text-[10px] font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              BETA
            </span>
          )}
        </div>

        {/* Global Project Switcher */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-[#060911] min-w-[240px]">
            <ProjectSwitcher />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 min-w-[240px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 shadow-sm shadow-yellow-400/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <span className="text-base">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between min-w-[240px]">
            <span>Featherweight APM</span>
            <span className="text-emerald-400 font-mono text-[10px]">● Live</span>
          </div>
        )}
      </aside>

      {/* 2. Main Content View with Top Bar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#05070E]">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#090D16]/80 backdrop-blur-md px-6 flex items-center justify-between z-40">
          
          {/* Left Area: Sidebar Collapse Toggle + Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-yellow-400 hover:border-yellow-400/40 transition cursor-pointer"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">SnapTrace</span>
              <span className="text-slate-700">/</span>
              <span className="text-slate-200 font-bold">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Area: Feedback Button + Live Badge + User Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* Feedback Button */}
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-3 py-1.5 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Give beta feedback or feature requests"
            >
              <span>💡</span>
              <span className="hidden sm:inline">Feedback</span>
            </button>

            {/* Live Ingestion Indicator */}
            <div className="hidden md:flex items-center gap-2 bg-[#05070E] border border-slate-800 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider font-mono">
                Ingestion Active
              </span>
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-800/50 transition cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md shadow-yellow-500/20 border border-yellow-400/40">
                  {userInitial}
                </div>
                <span className="hidden lg:inline text-xs text-slate-300 font-medium max-w-[120px] truncate">
                  {userEmail.split('@')[0]}
                </span>
                <span className="text-slate-500 text-[10px]">▾</span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-[#090D16] border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Signed in as</p>
                    <p className="text-xs text-slate-200 font-mono truncate">{userEmail}</p>
                  </div>

                  {/* Replay Onboarding Tour Trigger */}
                  <button
                    onClick={handleTriggerTour}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-yellow-300 hover:bg-yellow-400/10 transition cursor-pointer text-left"
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
                    <span>Account & AI Settings</span>
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
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/30 transition cursor-pointer text-left"
                  >
                    <span>🚪</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Main Route Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Global Modals: Feedback & Onboarding Tour */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userEmail={userEmail}
      />

      <DashboardOnboardingTour />

    </div>
  );
}