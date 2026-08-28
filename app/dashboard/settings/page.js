'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const apiKey = 'sk_live_76l597z2mnqu1kpn2ui3'

  const handlePurge = async (action, confirmText) => {
    if (!confirm(`Are you sure you want to ${confirmText}?`)) return
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/v1/settings?apiKey=${apiKey}&action=${action}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete action')
      setMessage({ type: 'success', text: 'Telemetry data purged successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Project Settings</h1>
            <p className="text-slate-400 text-xs mt-1">Manage project metadata and maintenance operations.</p>
          </div>
          <Link href="/dashboard" className="text-xs text-blue-400 hover:underline font-medium">
            ← Back to Dashboard
          </Link>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs font-medium ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Data Retention & Storage Purge */}
        <div className="bg-[#0D1322] border border-slate-800/60 p-6 rounded-xl space-y-4 shadow-sm">
          <h2 className="text-sm font-semibold text-white">Data Maintenance & Retention</h2>
          <p className="text-slate-400 text-xs">Purge obsolete error records to keep database storage within quota limits.</p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handlePurge('purge_resolved', 'delete all RESOLVED crashes')}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold rounded-lg transition"
            >
              Purge Resolved Issues
            </button>
            <button
              onClick={() => handlePurge('purge_all', 'permanently delete ALL telemetry logs')}
              disabled={loading}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg transition"
            >
              Purge All Telemetry Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}