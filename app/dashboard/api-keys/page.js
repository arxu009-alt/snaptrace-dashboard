'use client'

export default function ApiKeysPage() {
  const apiKey = 'sk_live_76l597z2mnqu1kpn2ui3'

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">API Keys & Ingestion Tokens</h2>
        <p className="text-xs text-slate-400 mt-1">Use these keys to authenticate telemetry payloads from client applications.</p>
      </div>

      <div className="bg-[#0D1322] p-6 rounded-xl border border-slate-800/60 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold text-slate-200">Default Project Key</span>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{apiKey}</p>
          </div>
          <button 
            onClick={() => navigator.clipboard.writeText(apiKey)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white rounded-lg transition"
          >
            Copy Key
          </button>
        </div>
      </div>
    </div>
  )
}