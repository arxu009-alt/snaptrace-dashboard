import Link from 'next/link';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>
        </div>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed bg-[#090D16] border border-slate-800 p-8 rounded-2xl">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-xs text-slate-400">
              By accessing or using SnapTrace, you agree to be bound by these Terms of Service. SnapTrace provides application telemetry and error tracking software.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Developer Account Responsibilities</h2>
            <p className="text-xs text-slate-400">
              You are responsible for maintaining the security of your API keys and account credentials. Any telemetry dispatched using your API keys is your responsibility.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Acceptable Use</h2>
            <p className="text-xs text-slate-400">
              You agree not to use SnapTrace for unlawful activities or attempt to disrupt the telemetry ingestion pipeline with malicious traffic floods.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}