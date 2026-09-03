import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans p-6 sm:p-12 selection:bg-yellow-400 selection:text-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <Link href="/">
            <SnapTraceLogo size="md" showText={true} />
          </Link>
          <Link href="/" className="text-xs text-yellow-400 hover:underline">
            ← Back to Home
          </Link>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-[#090D16] border border-slate-800 p-8 rounded-2xl">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Information We Collect</h2>
            <p className="text-xs text-slate-400">
              SnapTrace collects account information (email address) when you sign in via Google OAuth or email. For telemetry monitoring, our client SDK captures runtime exception messages, stack traces, and environment metadata.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Client-Side Zero-Trust PII Scrubbing</h2>
            <p className="text-xs text-slate-400">
              SnapTrace is engineered with client-side privacy. Passwords, authorization tokens, credit card numbers, and email addresses are masked and sanitized directly on the user's browser before telemetry payloads are transmitted to our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. How We Use Data</h2>
            <p className="text-xs text-slate-400">
              Data is used solely to provide real-time crash alerting, exception aggregation, and diagnostic reporting on your developer dashboard. We do not sell or monetize developer telemetry.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Third-Party Services</h2>
            <p className="text-xs text-slate-400">
              We utilize Supabase for authentication and database management, Vercel for hosting, and optional user-configured Discord webhooks and Gmail SMTP for dispatching crash alerts.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}