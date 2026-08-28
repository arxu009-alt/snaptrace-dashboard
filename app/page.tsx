'use client'

export default function Home() {
  const triggerCrash = () => {
    // This will throw inside the app context and trigger window.onerror
    throw new Error(`SDK Live Pipeline Test #${Date.now()}`)
  }

  return (
    <main className="min-h-screen bg-[#090D16] text-white flex flex-col items-center justify-center p-8 gap-4 font-sans">
      <h1 className="text-2xl font-bold">SnapTrace SDK Test Environment</h1>
      <p className="text-slate-400 text-sm">Click the button below to simulate an uncaught browser crash.</p>
      
      <button
        onClick={triggerCrash}
        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 font-semibold rounded-lg text-sm transition shadow-lg shadow-rose-600/20"
      >
        Trigger Test Crash 💥
      </button>
    </main>
  )
}