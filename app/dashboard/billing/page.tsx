'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CreditCard, ExternalLink, BarChart3, Check, ShieldCheck, Zap, Layers, Sparkles, Building2 } from 'lucide-react';
import { PLANS, PlanTier } from '@/lib/plans';

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({ accepted_count: 0 });

  useEffect(() => {
    async function loadBilling() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }

      const email = session.user.email || '';
      const ownerCheck = email.toLowerCase() === 'arxu1045@gmail.com' || email.toLowerCase() === 'arxu009@gmail.com';
      setIsOwner(ownerCheck);

      const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;

      const { data: userProjects } = await supabase
        .from('projects')
        .select('id, name, plan_tier, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const projList = userProjects || [];
      setProjects(projList);

      if (projList.length > 0) {
        const p = projList.find((proj) => proj.id === savedProjectId) || projList[0];
        const tier = ownerCheck ? 'agency_scale' : (p.plan_tier || 'free');
        setCurrentTier(tier);

        // Count this month's events across all fleet projects
        const projectIds = projList.map((pr) => pr.id);
        const now = new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();

        const { data: monthErrors } = await supabase
          .from('errors')
          .select('occurrence_count')
          .in('project_id', projectIds)
          .gte('created_at', startOfMonth);

        let total = 0;
        if (monthErrors) {
          monthErrors.forEach((err) => {
            total += (err.occurrence_count && err.occurrence_count > 0 ? err.occurrence_count : 1);
          });
        }
        setStats({ accepted_count: total });
      } else {
        setCurrentTier(ownerCheck ? 'agency_scale' : 'free');
        setStats({ accepted_count: 0 });
      }
      setLoading(false);
    }
    loadBilling();
  }, []);

  const plan = PLANS[currentTier] || PLANS.free;
  const isUnlimitedEvents = isOwner;
  const isUnlimitedProjects = isOwner || plan.projectLimit >= 999999;
  const projectLimitDisplay = isUnlimitedProjects ? 'Unlimited' : plan.projectLimit;

  const usagePct = isUnlimitedEvents ? 0 : Math.min(100, Math.round((stats.accepted_count / plan.monthlyEventCap) * 100));

  const usageColor =
    usagePct >= 90 ? 'bg-red-500' :
    usagePct >= 70 ? 'bg-yellow-400' :
    'bg-emerald-500';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Agency Billing &amp; Usage</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Manage your agency fleet quotas, client project allocations, and subscription tier.
          </p>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase animate-pulse">Loading billing telemetry...</span>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Current Workspace Tier Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">Active Plan</span>
                    <h2 className="text-base font-bold text-zinc-100">{PLANS[currentTier]?.name || plan.name}</h2>
                    {isOwner ? (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium rounded text-[10px] font-mono uppercase tracking-wider">
                        Agency Owner — Unlimited
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-800/70 text-zinc-300 border border-zinc-700/80 rounded text-[10px] font-medium font-mono uppercase tracking-wider">
                        {PLANS[currentTier]?.name || plan.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {isOwner
                      ? 'Full enterprise access across all client applications and edge telemetry pipelines.'
                      : `${PLANS[currentTier]?.name || plan.name} tier with ${plan.monthlyEventCap.toLocaleString()} monthly events and ${plan.retentionDays}-day retention.`}
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-medium self-start sm:self-auto whitespace-nowrap">
                  {isOwner ? 'Unlimited Tier' : (plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}/mo`)} — Active
                </span>
              </div>

              {/* Monthly Event Quota Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    Monthly Event Quota
                  </span>
                  <span className="text-zinc-200 font-semibold">
                    {stats.accepted_count.toLocaleString()} / {isOwner ? 'Unlimited' : `${plan.monthlyEventCap.toLocaleString()} events`}
                  </span>
                </div>
                {!isOwner && (
                  <>
                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <span>{usagePct}% of monthly quota consumed</span>
                      <span>{Math.max(0, plan.monthlyEventCap - stats.accepted_count).toLocaleString()} events remaining</span>
                    </div>
                  </>
                )}
              </div>

              {/* Key Usage & Quota Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
                <div className="p-3.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Client Fleet Usage</span>
                  <span className="text-zinc-200 font-semibold">
                    {projects.length} / {projectLimitDisplay} projects
                  </span>
                </div>
                <div className="p-3.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Log Retention</span>
                  <span className="text-zinc-200 font-semibold">{isOwner ? '90 Days' : `${plan.retentionDays} Days`}</span>
                </div>
                <div className="p-3.5 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Agency Team Seats</span>
                  <span className="text-emerald-400 font-semibold">{plan.unlimitedSeats || isOwner ? 'Unlimited (No Fee)' : 'Single Seat'}</span>
                </div>
              </div>
            </div>

            {/* Subtle Early Adopter Note */}
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 text-xs font-mono text-zinc-400 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span>Beta Founder Pass users receive 10,000 free monthly events and 2 client projects.</span>
              </span>
              <span className="text-[11px] text-zinc-500 font-semibold">Grandfathered Quota</span>
            </div>

            {/* Agency Upgrade Options */}
            <div className="space-y-4">
              <div className="border-b border-zinc-800/80 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">Agency Upgrade Options</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Scale your client fleet with flat agency pricing, unlimited team seats, and zero per-seat fees.</p>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  14-Day Free Trial
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Agency Studio Card */}
                <div className={`p-5 sm:p-6 border rounded-xl flex flex-col justify-between space-y-5 transition ${
                  currentTier === 'agency_studio'
                    ? 'border-purple-400/40 bg-purple-950/10'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                }`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">Agency Studio</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
                        Boutique Fleets
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white tracking-tight">$49</span>
                        <span className="text-xs font-mono text-zinc-400">/month</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        For boutique web agencies and dev studios managing up to 15 client apps.
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs font-mono text-zinc-300 border-t border-zinc-800/80 pt-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>100,000 error events / month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>Up to 15 active client projects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>UNLIMITED team seats (no per-seat fees)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>Dedicated Discord, Slack &amp; Email alerts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>Monthly Client Retainer Value Reports (PDF)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                        <span>30-day telemetry retention</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition font-mono active:scale-[0.98] shadow-sm"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* 2. Agency Scale Card */}
                <div className={`p-5 sm:p-6 border rounded-xl flex flex-col justify-between space-y-5 relative transition ${
                  currentTier === 'agency_scale'
                    ? 'border-yellow-400/50 bg-yellow-400/[0.04]'
                    : 'border-yellow-400/30 bg-zinc-950 hover:border-yellow-400/60'
                }`}>
                  <span className="absolute -top-2.5 right-4 rounded-full bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] px-2.5 py-0.5 font-mono text-[9px] font-black tracking-wider text-slate-950 shadow-md">
                    POPULAR AGENCY FLEET
                  </span>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider">Agency Scale</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 font-medium">
                        High Volume
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white tracking-tight">$99</span>
                        <span className="text-xs font-mono text-zinc-400">/month</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        For high-volume digital agencies managing large client fleets.
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs font-mono text-zinc-200 border-t border-zinc-800/80 pt-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>500,000 error events / month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>UNLIMITED client projects &amp; API keys</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>UNLIMITED team seats</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>Priority edge ingestion pipeline</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>90-day telemetry retention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
                        <span>Dedicated Slack channel support</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://buy.polar.sh/polar_cl_AyVTujI4KmZOysk4v2mQhTfmQ7RPyvrJEFZbL2aN3iq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold rounded-lg transition font-mono active:scale-[0.98] shadow-md shadow-yellow-400/10"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
