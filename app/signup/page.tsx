'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();

  // Auto-redirect to dashboard if user is already authenticated
  useEffect(() => {
    async function checkExistingAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      }
    }
    checkExistingAuth();
  }, [router]);

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

  const handleGitHubSignUp = async () => {
    try {
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to authenticate with GitHub');
    }
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col justify-between selection:bg-zinc-800 selection:text-zinc-100 animate-in fade-in duration-300">

      {/* Main Split Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 items-center p-6 sm:p-10 gap-12 relative z-10">

        {/* Left Column: Sentry-Inspired Product Value Showcase */}
        <div className="lg:col-span-7 space-y-8 py-6">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <SnapTraceLogo size="lg" showText={true} />
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800 text-[11px] font-medium font-mono text-zinc-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>v1.0 &middot; Telemetry Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 leading-[1.15]">
              Code <span className="text-red-400">breaks</span>. Fix it in a{' '}
              <span className="text-zinc-100 underline decoration-zinc-700 underline-offset-8">
                snap
              </span>
              .
            </h1>

            <p className="text-base text-zinc-400 max-w-xl leading-relaxed">
              Track exceptions with zero Core Web Vitals penalty, deterministic crash deduplication, and direct AI diagnostics.
            </p>
          </div>

          {/* Feature Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-xl pt-2">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1 transition hover:border-zinc-700">
              <div className="text-zinc-200 font-medium text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                  <path d="M7 21h10" />
                  <path d="M12 3v18" />
                  <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
                </svg>
                <span>&lt;5KB Featherweight SDK</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Zero impact on PageSpeed scores and Google Lighthouse Core Web Vitals.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1 transition hover:border-zinc-700">
              <div className="text-zinc-200 font-medium text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H2v6h4l5 4V5Z" />
                  <line x1="22" x2="16" y1="9" y2="15" />
                  <line x1="16" x2="22" y1="9" y2="15" />
                </svg>
                <span>Noise Deduplication</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Repetitive failure loops group into 1 summary alert <code className="text-zinc-300 font-mono">[x500]</code> to eliminate fatigue.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1 transition hover:border-zinc-700">
              <div className="text-zinc-200 font-medium text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4" />
                  <path d="m16.2 7.8 2.9-2.9" />
                  <path d="M18 12h4" />
                  <path d="m16.2 16.2 2.9 2.9" />
                  <path d="M12 18v4" />
                  <path d="m4.9 19.1 2.9-2.9" />
                  <path d="M2 12h4" />
                  <path d="m4.9 4.9 2.9 2.9" />
                </svg>
                <span>BYOK AI Copilot</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Bring your own Gemini or OpenAI API keys with zero platform markups and 1-click Cursor exports.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-1 transition hover:border-zinc-700">
              <div className="text-zinc-200 font-medium text-xs flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Client-Side PII Firewall</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Passwords, credit cards, and authorization tokens are scrubbed in the browser before network transmission.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Auth Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 shadow-2xl backdrop-blur-xl space-y-6">

            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-zinc-100">Create your developer account</h2>
              <p className="text-xs text-zinc-400 font-mono">Telemetry ingest setup &middot; Free tier included</p>
            </div>

            {/* Success Banner */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs space-y-1 font-mono animate-in zoom-in-95">
                <span className="font-semibold block">Confirmation Link Dispatched</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 bg-red-950/40 border border-red-500/40 text-red-300 rounded-lg text-xs font-mono animate-in zoom-in-95">
                {errorMsg}
              </div>
            )}

            {/* OAuth Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleGitHubSignUp}
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-lg font-medium text-xs text-zinc-200 transition-colors cursor-pointer shadow-sm group font-mono"
              >
                <svg className="w-4 h-4 shrink-0 fill-current text-zinc-100" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Continue with GitHub</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 rounded-lg font-medium text-xs text-zinc-200 transition-colors cursor-pointer shadow-sm group font-mono"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-zinc-800 flex-1" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
                or email
              </span>
              <div className="h-px bg-zinc-800 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-4">

              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono block">
                  Developer Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arslan Dev"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 font-mono transition-colors"
                />
              </div>

              {/* Work Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono block">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@company.com"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 font-mono transition-colors"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider font-mono block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 font-mono transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="text-[11px] text-zinc-500 text-center leading-relaxed pt-1">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-zinc-400 underline hover:text-zinc-200">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-zinc-400 underline hover:text-zinc-200">
                  Privacy Policy
                </Link>.
              </p>
            </form>

            <p className="text-center text-xs text-zinc-400 pt-3 border-t border-zinc-800/80">
              Already have an account?{' '}
              <Link href="/login" className="text-zinc-200 hover:text-white font-medium underline underline-offset-4">
                Sign In
              </Link>
            </p>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 p-6 text-xs text-zinc-500 relative z-10 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
        <span>&copy; {new Date().getFullYear()} SnapTrace. All rights reserved.</span>
        <div className="flex items-center space-x-6 text-zinc-400">
          <Link href="/privacy" className="hover:text-zinc-200 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-200 transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>

    </div>
  );
}