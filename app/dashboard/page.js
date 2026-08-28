'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('unresolved')
  const [updating, setUpdating] = useState(false)

  const apiKey = 'sk_live_76l597z2mnqu1kpn2ui3'

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/v1/stats?apiKey=${apiKey}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch metrics')
      setStats(data.stats)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      setUpdating(true)
      const res = await fetch(`/api/v1/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, apiKey })
      })
      if (!res.ok) throw new Error('Failed to update status')
      
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue({ ...selectedIssue, status: newStatus })
      }
      
      await fetchStats()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const filteredIssues = (stats?.top_issues || []).filter(issue => {
    const matchesTab = activeTab === 'all' || issue.status === activeTab
    const matchesSearch = issue.error_msg.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          issue.url.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  if (loading && !stats) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        Connecting to SnapTrace Telemetry...
      </div>
    </div>
  )

  return (
    <>
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/60 bg-[#0D1322]/50 backdrop-blur-md px-8 flex justify-between items-center sticky top-0 z-40">
        <h2 className="text-sm font-semibold text-slate-200 capitalize">Error Stream Overview</h2>
        <button 
          onClick={fetchStats}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium rounded-lg text-slate-200 transition flex items-center gap-2 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </header>

      <main className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0D1322] p-5 rounded-xl border border-slate-800/60 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Unique Issues</span>
            <p className="text-2xl font-bold text-white mt-2 tracking-tight">{stats?.total_unique_issues || 0}</p>
          </div>
          <div className="bg-[#0D1322] p-5 rounded-xl border border-slate-800/60 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Total Occurrences</span>
            <p className="text-2xl font-bold text-blue-400 mt-2 tracking-tight">{stats?.total_occurrences || 0}</p>
          </div>
          <div className="bg-[#0D1322] p-5 rounded-xl border border-slate-800/60 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Unresolved Crashes</span>
            <p className="text-2xl font-bold text-rose-500 mt-2 tracking-tight">{stats?.unresolved_count || 0}</p>
          </div>
          <div className="bg-[#0D1322] p-5 rounded-xl border border-slate-800/60 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Resolved Crashes</span>
            <p className="text-2xl font-bold text-emerald-400 mt-2 tracking-tight">{stats?.resolved_count || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0D1322] p-3 rounded-xl border border-slate-800/60">
          <div className="flex bg-[#090D16] p-1 rounded-lg border border-slate-800/60 text-xs w-full sm:w-auto">
            {['unresolved', 'resolved', 'ignored', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md capitalize transition font-medium ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search telemetry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#090D16] border border-slate-800/60 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-lg w-full focus:outline-none focus:border-blue-500/50 transition"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0D1322] rounded-xl border border-slate-800/60 overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-800/60 text-xs text-left">
            <thead className="bg-[#0B101D] text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Error Message</th>
                <th className="px-6 py-3.5">Occurrences</th>
                <th className="px-6 py-3.5">Route</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue) => (
                  <tr 
                    key={issue.id} 
                    onClick={() => setSelectedIssue(issue)}
                    className="hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="px-6 py-4 font-mono font-medium text-rose-400 max-w-sm truncate">
                      <Link 
                        href={`/dashboard/issues/${issue.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline hover:text-rose-300"
                      >
                        {issue.error_msg}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-200">
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/40">
                        {issue.count || 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400 max-w-xs truncate">
                      {issue.url}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                        issue.status === 'resolved' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        issue.status === 'ignored' 
                          ? 'bg-slate-800 text-slate-400' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          issue.status === 'resolved' ? 'bg-emerald-400' :
                          issue.status === 'ignored' ? 'bg-slate-400' : 'bg-rose-400'
                        }`} />
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(issue.updated_at || issue.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No telemetry records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Inspection Drawer */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-[#0D1322] border-l border-slate-800 w-full max-w-2xl h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Crash Report
                </span>
                <h3 className="text-base font-mono font-bold text-white mt-2 leading-snug">{selectedIssue.error_msg}</h3>
              </div>
              <button 
                onClick={() => setSelectedIssue(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2">
              <button
                disabled={updating}
                onClick={() => handleStatusChange(selectedIssue.id, 'resolved')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-600/20"
              >
                Resolve
              </button>
              <button
                disabled={updating}
                onClick={() => handleStatusChange(selectedIssue.id, 'ignored')}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/60"
              >
                Ignore
              </button>
              <button
                disabled={updating}
                onClick={() => handleStatusChange(selectedIssue.id, 'unresolved')}
                className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/60"
              >
                Reopen
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#090D16] p-4 rounded-xl border border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px]">Route URL</span>
                <p className="font-mono text-slate-200 mt-1 break-all">{selectedIssue.url}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px]">User Agent</span>
                <p className="font-mono text-slate-200 mt-1">{selectedIssue.user_agent || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px]">Fingerprint Hash</span>
                <p className="font-mono text-slate-400 mt-1 truncate">{selectedIssue.error_hash}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium uppercase text-[10px]">Occurrences</span>
                <p className="font-bold text-slate-200 mt-1">{selectedIssue.count || 1}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stack Trace</span>
              <pre className="bg-[#05080F] p-4 rounded-xl border border-slate-800/80 text-xs font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {selectedIssue.stack_trace || 'No stack trace available.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  )
}