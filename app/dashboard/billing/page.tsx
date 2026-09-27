'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CreditCard, ExternalLink, BarChart3, ArrowUpRight } from 'lucide-react';

const PLANS: Record<string, { label: string; events: number; retention: number; price: string }> = {
  free:    { label: 'Developer Free',  events: 2000,   retention: 7,  price: '$0/mo' },
  pro:     { label: 'Pro Builder',     events: 75000,  retention: 30, price: '$19/mo' },
  agency:  { label: 'Agency Studio',  events: 500000, retention: 90, price: '$49/mo' },
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [planTier, setPlanTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState(false);
  const [monthlyUsed, setMonthlyUsed] = useState(0);

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
        .select('id, plan_tier')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (userProjects && userProjects.length > 0) {
        const p = userProjects.find((proj) => proj.id === savedProjectId) || userProjects[0];
        const tier = ownerCheck ? 'agency' : (p.plan_tier || 'free');
        setPlanTier(tier);

        // Count this month's events
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from('errors')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', p.id)
          .gte('created_at', startOfMonth.toISOString());

        setMonthlyUsed(count || 0);
      }
      setLoading(false);
    }
    loadBilling();
  }, []);

  const plan = PLANS[planTier] || PLANS.free;
  const usagePct = Math.min(100, Math.round((monthlyUsed / plan.events) * 100));

  const usageColor =
    usagePct >= 90 ? 'bg-red-500' :
    usagePct >= 70 ? 'bg-yellow-400' :
    'bg-emerald-500';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex items-center gap-2.5 mb-1">
            <CreditCard className="w-4 h-4 text-zinc-400" />
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100">Billing &amp; Usage</h1>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            Monitor your monthly event quota, active plan, and upgrade to unlock higher limits.
          </p>
        </div>

        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase animate-pulse">Loading billing data...</span>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Active Plan Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800/80 gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm font-semibold text-zinc-100">Active Subscription Plan</h2>
                    {isOwner ? (
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium rounded text-[10px] font-mono uppercase tracking-wider">
                        Owner — Unlimited
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-800/70 text-zinc-300 border border-zinc-700/80 rounded text-[10px] font-medium font-mono uppercase tracking-wider">
                        {plan.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {isOwner
                      ? 'Owner account with full unlimited access to all features and event ingestion.'
                      : `${plan.label} — ${plan.events.toLocaleString()} events/mo, ${plan.retention}-day log retention.`}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded font-medium self-start sm:self-auto whitespace-nowrap">
                  {isOwner ? 'Unlimited' : plan.price} — Active
                </span>
              </div>

              {/* Quota Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Monthly Event Cap</span>
                  <span className="text-zinc-200 font-semibold">{isOwner ? 'Unlimited' : plan.events.toLocaleString() + ' events'}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">Log Retention</span>
                  <span className="text-zinc-200 font-semibold">{isOwner ? '90 Days' : plan.retention + ' Days'}</span>
                </div>
                <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-medium">In-Dashboard AI</span>
                  <span className="text-emerald-400 font-semibold">{planTier === 'free' ? 'Prompt Export Only' : 'BYOK Copilot Unlocked'}</span>
                </div>
              </div>
            </div>

            {/* Usage Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Monthly Event Usage</h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Events used this month</span>
                  <span className="text-zinc-200 font-medium">
                    {monthlyUsed.toLocaleString()} / {isOwner ? '∞' : plan.events.toLocaleString()}
                  </span>
                </div>
                {!isOwner && (
                  <>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${usageColor}`}
                        style={{ width: `${usagePct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{usagePct}% of monthly quota consumed</span>
                      <span>{(plan.events - monthlyUsed).toLocaleString()} events remaining</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Upgrade Section — only shown if not on agency/owner */}
            {!isOwner && planTier !== 'agency' && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="pb-3 border-b border-zinc-800/80">
                  <h2 className="text-sm font-semibold text-zinc-100">Upgrade Plan</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Unlock higher event caps, longer retention, and full BYOK AI diagnostics.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Pro Builder */}
                  {planTier !== 'pro' && (
                    <div className="p-4 border border-yellow-400/25 bg-yellow-400/[0.03] rounded-xl space-y-3">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-black text-white tracking-tight">$19</span>
                          <span className="text-xs font-mono text-zinc-500">/month</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-wider block">Pro Builder</span>
                      </div>
                      <ul className="space-y-1 text-[11px] font-mono text-zinc-400">
                        <li>75,000 events / month</li>
                        <li>30-day log retention</li>
                        <li>5 active projects</li>
                        <li>Discord &amp; Slack alerts</li>
                        <li>BYOK AI diagnostics</li>
                      </ul>
                      <a
                        href="https://buy.polar.sh/polar_cl_AyVTujI4KmZOysk4v2mQhTfmQ7RPyvrJEFZbL2aN3iq"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 text-xs font-bold rounded-lg transition font-mono"
                      >
                        Upgrade to Pro
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Agency Studio */}
                  <div className="p-4 border border-purple-400/25 bg-purple-500/[0.03] rounded-xl space-y-3">
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-white tracking-tight">$49</span>
                        <span className="text-xs font-mono text-zinc-500">/month</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider block">Agency Studio</span>
                    </div>
                    <ul className="space-y-1 text-[11px] font-mono text-zinc-400">
                      <li>500,000 events / month</li>
                      <li>90-day log retention</li>
                      <li>Unlimited projects &amp; API keys</li>
                      <li>Multi-seat client invites</li>
                      <li>Priority edge ingestion</li>
                    </ul>
                    <a
                      href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition font-mono"
                    >
                      Start Agency Studio
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
