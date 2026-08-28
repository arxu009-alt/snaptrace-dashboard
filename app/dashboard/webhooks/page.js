'use client'

export default function WebhooksPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Alert Webhooks</h2>
        <p className="text-xs text-slate-400 mt-1">Configure real-time crash notifications for Discord and Slack.</p>
      </div>

      <div className="bg-[#0D1322] p-6 rounded-xl border border-slate-800/60 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔔</span>
          <div>
            <span className="text-xs font-semibold text-slate-200">Discord Notification Pipeline</span>
            <p className="text-[11px] text-emerald-400 font-medium">Status: Active</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-mono">/api/v1/ingest → Discord</span>
      </div>
    </div>
  )
}