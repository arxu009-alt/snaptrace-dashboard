'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
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
        data: {
          full_name: fullName.trim() || 'Developer',
        },
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
      setFullName('');
    }
  };

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans flex flex-col justify-between selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-300">
      
      {/* Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-tr from-yellow-500/10 via-purple-500/10 to-emerald-500/10 blur-[140px] pointer-events-none" />

      {/* Main Split Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-10 gap-12 relative z-10">
        
        {/* Left Column: Sentry-Inspired Product Value Showcase */}
        <div className="lg:col-span-7 space-y-8 py-6">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <SnapTraceLogo size="lg" showText={true} />
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#090D16] border border-slate-800 text-[11px] font-semibold text-yellow-300">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>v1.0 Public Beta • Next-Gen Telemetry</span>
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

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-2">
            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1 hover:border-yellow-400/30 transition">
              <div className="text-yellow-400 font-bold text-xs flex items-center gap-1.5">
                <span>🪶</span> &lt;5KB Featherweight SDK
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Zero impact on your Google PageSpeed scores and Lighthouse Core Web Vitals.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1 hover:border-emerald-400/30 transition">
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <span>🔇</span> Noise Deduplication
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Infinite loops group into 1 clean alert tag <code className="text-yellow-300 font-mono">[x500]</code>. Zero alert fatigue.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1 hover:border-purple-400/30 transition">
              <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                <span>🤖</span> BYOK AI Root-Cause Copilot
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Use your own OpenAI key for instant bug diagnostics and 1-click Cursor prompts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090D16]/80 border border-slate-800/80 space-y-1 hover:border-blue-400/30 transition">
              <div className="text-blue-400 font-bold text-xs flex items-center gap-1.5">
                <span>🔒</span> Client-Side PII Firewall
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Passwords and sensitive tokens are scrubbed directly on the user's browser.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Auth Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-[#090D16]/95 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">Create your developer account</h2>
              <p className="text-xs text-slate-400">Start monitoring in 60 seconds • Free forever tier</p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs space-y-1 animate-in zoom-in-95">
                <span className="font-bold block">✓ Verification Email Dispatched</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-2xl text-xs animate-in zoom-in-95">
                {errorMsg}
              </div>
            )}

            {/* Authentic Vector Google Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 py-3 bg-[#05070E] hover:bg-slate-800 border border-slate-800 rounded-xl font-semibold text-xs text-white transition cursor-pointer shadow-md group"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-800/80 flex-1" />
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-semibold">
                or with email
              </span>
              <div className="h-px bg-slate-800/80 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-3.5">
              
              {/* Full Name Input */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Developer Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arslan Dev"
                  className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              {/* Work Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Password
                </label>
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
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Developer Account →'}
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-1">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-slate-400 underline hover:text-yellow-400">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-slate-400 underline hover:text-yellow-400">
                  Privacy Policy
                </Link>.
              </p>
            </form>

            <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              Already have an account?{' '}
              <Link href="/login" className="text-yellow-400 hover:underline font-bold">
                Sign In
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 p-6 text-xs text-slate-500 relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform.</span>
        <div className="flex items-center space-x-6 text-slate-400">
          <Link href="/privacy" className="hover:text-yellow-400 transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-yellow-400 transition">
            Terms of Service
          </Link>
        </div>
      </footer>

    </div>
  );
}