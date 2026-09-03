'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans flex flex-col justify-between selection:bg-yellow-400 selection:text-slate-950">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-yellow-500/10 via-purple-500/10 to-emerald-500/10 blur-[130px] pointer-events-none" />

      {/* Main Split Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-10 gap-12 relative z-10">
        
        {/* Left Column: Product Value Showcase */}
        <div className="lg:col-span-7 space-y-8 py-6">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <SnapTraceLogo size="lg" showText={true} />
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D16] border border-slate-800 text-[11px] font-semibold text-yellow-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Crash Telemetry</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Welcome back to{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                SnapTrace.
              </span>
            </h1>

            <p className="text-base text-slate-400 max-w-xl leading-relaxed">
              Your real-time crash monitor, zero-noise alert dispatcher, and BYOK AI diagnostic engine are ready.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 max-w-xl space-y-2">
            <div className="text-xs text-yellow-400 font-bold font-mono">⚡ LIVE METRICS ENGINE</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Seamlessly monitor exceptions across JavaScript, Next.js, Python, Node, PHP, Ruby, and Kotlin with zero performance overhead.
            </p>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-[#090D16]/90 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">Sign In to Dashboard</h2>
              <p className="text-xs text-slate-400">Enter your credentials to manage your telemetry</p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-xs text-white transition cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.6-.7-1-1.5-1-2.3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-800/80 flex-1" />
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                or with email
              </span>
              <div className="h-px bg-slate-800/80 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In →'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Don't have an account?{' '}
              <Link href="/signup" className="text-yellow-400 hover:underline font-semibold">
                Create Account
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 p-6 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.
      </footer>

    </div>
  );
}