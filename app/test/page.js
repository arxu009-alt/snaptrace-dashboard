'use client'

import { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    // Inject and initialize local SDK
    const script = document.createElement('script')
    script.src = '/snaptrace.js'
    script.async = true
    script.onload = () => {
      if (window.SnapTrace) {
        window.SnapTrace.init({
          apiKey: 'sk_live_76l597z2mnqu1kpn2ui3', // Replace with your active API key
          endpoint: 'http://localhost:3000/api/v1/log'
        })
      }
    }
    document.body.appendChild(script)
  }, [])

  const triggerSyncCrash = () => {
    nonExistentFunctionToBreakApp()
  }

  const triggerAsyncRejection = () => {
    Promise.reject(new Error('Async Promise Rejection Test Failure'))
  }

  return (
    <div className="p-10 font-sans text-white bg-slate-950 min-h-screen">
      <h1 className="text-xl font-bold mb-6">SnapTrace SDK Integration Suite</h1>
      <div className="flex gap-4">
        <button
          onClick={triggerSyncCrash}
          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
        >
          Trigger Sync Crash
        </button>
        <button
          onClick={triggerAsyncRejection}
          className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
        >
          Trigger Promise Rejection
        </button>
      </div>
    </div>
  )
}