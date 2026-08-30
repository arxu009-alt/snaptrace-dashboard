'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertCircle, Key, Settings } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Projects & Keys', href: '/dashboard', icon: Key },
    { name: 'Error Stream', href: '/dashboard/errors', icon: AlertCircle },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Primary Navigation Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800/60">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg shadow-indigo-600/30">
              ST
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight tracking-tight">SnapTrace</h1>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                v1.0 Pro
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live System Indicator */}
        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-300">Telemetry Online</span>
        </div>
      </aside>

      {/* Workspace Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}