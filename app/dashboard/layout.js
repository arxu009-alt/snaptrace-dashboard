'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  const navItems = [
    { id: 'issues', label: 'Error Stream', icon: '⚡', href: '/dashboard' },
    { id: 'webhooks', label: 'Webhooks', icon: '🔔', href: '/dashboard/webhooks' },
    { id: 'keys', label: 'API Keys', icon: '🔑', href: '/dashboard/api-keys' },
    { id: 'settings', label: 'Project Settings', icon: '⚙️', href: '/dashboard/settings' }
  ]

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex antialiased">
      {/* Shared Sidebar Navigation */}
      <aside className="w-64 bg-[#0D1322] border-r border-slate-800/60 flex flex-col justify-between hidden md:flex h-screen sticky top-0">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              ST
            </div>
            <div>
              <h1 className="font-bold tracking-tight text-white text-base">SnapTrace</h1>
              <span className="text-[10px] text-blue-400 font-medium px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">v1.0 Pro</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800/60 bg-[#0B101D]">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Telemetry Online</span>
          </div>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}