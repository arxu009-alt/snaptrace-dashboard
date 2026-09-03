'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setErrorMsg(error.message);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccessMsg(
        'A confirmation link has been sent to your email. Check your inbox to complete your setup.'
      );
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans flex flex-col justify-between selection:bg-yellow-400 selection:text-slate-950">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[350px] bg-gradient-to-tr from-yellow-500/10 via-purple-500/10 to-emerald-500/10 blur-[130px] pointer-events-none" />

      {/* Main Split Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-10 gap-12 relative z-10">
        
        {/* Left Column: Sentry-Inspired Product Value Showcase (7 Cols) */}
        <div className="lg:col-span-7 space-y-8 py-6">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <SnapTraceLogo size="lg" showText={true} />
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D16] border border-slate-800 text-[11px] font-semibold text-yellow-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Next-Gen Application Monitoring</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Code <span className="text-red-400 underline decoration-red-500/50 decoration-wavy">breaks</span>, fix it in a{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                snap.
              </span>
            </h1>

            <p className="text-base text-slate-400 max-w-xl leading-relaxed">
              Join thousands of developers tracking exceptions without bloated SDKs, surprise overage bills, or 10,000 alert flood spam.
            </p>
          </div>

          {/* Core Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-2">
            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1">
              <div className="text-yellow-400 font-bold text-xs flex items-center gap-1.5">
                <span>🪶</span> &lt;5KB Featherweight SDK
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero impact on your Google PageSpeed scores and Lighthouse Core Web Vitals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <span>🔇</span> Noise Deduplication
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Infinite loops group into 1 clean alert tag <code className="text-yellow-300 font-mono">[x500]</code>. Zero alert fatigue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1">
              <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                <span>🤖</span> BYOK AI Root-Cause Copilot
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use your own OpenAI key for instant bug diagnostics and 1-click Cursor prompts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1">
              <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <span>🔒</span> Client-Side PII Firewall
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Passwords and sensitive tokens are scrubbed directly on the user's browser.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Auth Card (5 Cols) */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-[#090D16]/90 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">Create your developer account</h2>
              <p className="text-xs text-slate-400">Start monitoring in 60 seconds • Free forever tier</p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs space-y-1">
                <span className="font-bold block">✓ Verification Email Dispatched</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
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

            {/* Email Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Work Email</label>
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
                {loading ? 'Creating Account...' : 'Create Account →'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-yellow-400 hover:underline font-semibold">
                Sign In
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Auth Footer */}
      <footer className="border-t border-slate-800/60 p-6 text-center text-xs text-slate-500 relative z-10">
        © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.
      </footer>

    </div>
  );
}