'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ProjectSwitcher from '@/components/ProjectSwitcher';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      router.replace('/login');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    async function verifySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login');
      } else {
        setAuthChecking(false);
      }
    }

    verifySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: '📊' },
    { name: 'Exception Logs', href: '/dashboard/errors', icon: '🚨' },
    { name: 'API Keys & Snippets', href: '/dashboard/projects', icon: '🔑' },
    { name: 'Language Integrations', href: '/dashboard/integrations', icon: '⚡' },
    { name: 'Alert Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying Session Authorization...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-white">
              Snap<span className="text-purple-500">Trace</span>
            </span>
          </Link>
          <span className="text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
            v1.0
          </span>
        </div>

        {/* Global Project Selector */}
        <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <ProjectSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">
          <p>Real-time Telemetry & Monitoring</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}