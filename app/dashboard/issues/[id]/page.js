'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

export default function IssueDetailPage({ params }) {
  const resolvedParams = use(params)
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const apiKey = 'sk_live_76l597z2mnqu1kpn2ui3'

  useEffect(() => {
    async function fetchIssueDetails() {
      try {
        const res = await fetch(`/api/v1/stats?apiKey=${apiKey}`)
        const data = await res.json()
        const found = data.logs?.find(item => String(item.id) === String(resolvedParams.id))
        setIssue(found || null)
      } catch (err) {
        console.error('Failed to load issue details:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchIssueDetails()
  }, [resolvedParams.id])

  const toggleStatus = async (newStatus) => {
    setUpdating(true)
    try {
      // In production, dispatch update request to DB
      setIssue(prev => prev ? { ...prev, status: newStatus } : null)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-400 p-8 flex items-center justify-center font-sans">
        Loading trace telemetry...
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-[#090D16] text-slate-100 p-8 font-sans">
        <div className="max-w-3xl mx-auto space-y-4">
          <Link href="/dashboard" className="text-xs text-blue-400 hover:underline">← Back to Dashboard</Link>
          <div className="p-6 bg-[#0D1322] border border-slate-800 rounded-xl text-xs text-slate-400">
            Issue record not found or has been purged.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="text-xs text-blue-400 hover:underline font-medium">
            ← Back to Issues Stream
          </Link>
          
          <div className="flex gap-2">
            <button
              onClick={() => toggleStatus('resolved')}
              disabled={updating || issue.status === 'resolved'}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              Mark Resolved
            </button>
            <button
              onClick={() => toggleStatus('unresolved')}
              disabled={updating || issue.status === 'unresolved'}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              Reopen
            </button>
          </div>
        </div>

        {/* Issue Summary Banner */}
        <div className="bg-[#0D1322] border border-slate-800/60 p-6 rounded-xl space-y-3">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${
              issue.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {issue.status || 'Unresolved'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Occurrences: {issue.count || 1}</span>
          </div>

          <h1 className="text-lg font-mono font-semibold text-rose-400 break-all">
            {issue.error_msg}
          </h1>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/60 text-xs">
            <div>
              <span className="text-slate-500 block">Trigger Route</span>
              <span className="text-slate-200 font-mono">{issue.url || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">User Agent</span>
              <span className="text-slate-200 font-mono truncate block">{issue.user_agent || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Stack Trace Terminal View */}
        <div className="bg-[#0D1322] border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="bg-[#090D16] px-4 py-3 border-b border-slate-800/60 flex justify-between items-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Raw Stack Trace</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-[#060910]">
            {issue.stack_trace || 'No stack trace captured.'}
          </pre>
        </div>
      </div>
    </div>
  )
}