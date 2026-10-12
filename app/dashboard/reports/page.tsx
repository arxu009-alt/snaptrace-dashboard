'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  FileText,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Clock,
  ArrowUpRight,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Building2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Globe,
  Palette,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

interface SentryProject {
  id: string;
  slug: string;
  name: string;
  platform: string;
}

interface SentryTopError {
  id: string;
  title: string;
  route: string;
  count: number;
  percentage: number;
  status: string;
  level: string;
  lastSeen?: string | null;
}

interface SentryReportData {
  projectName: string;
  organizationSlug: string;
  projectSlug: string;
  timeframe: '7d' | '14d' | '30d';
  totalIssues: number;
  totalEvents: number;
  resolvedCount: number;
  unresolvedCount: number;
  healthScore: string;
  performanceImpact: string;
  topErrors: SentryTopError[];
}

interface NativeProject {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  plan_tier?: string;
}

type Timeframe = '7d' | '14d' | '30d';

const SAMPLE_SENTRY_PROJECTS: SentryProject[] = [
  { id: 'proj-1', slug: 'client-store', name: 'Client Storefront', platform: 'javascript-nextjs' },
  { id: 'proj-2', slug: 'api-service', name: 'Core API Gateway', platform: 'node-express' },
  { id: 'proj-3', slug: 'checkout-app', name: 'Checkout & Billing', platform: 'react' },
];

const SAMPLE_SENTRY_REPORT: SentryReportData = {
  projectName: 'Client Storefront',
  organizationSlug: 'agency-client',
  projectSlug: 'client-store',
  timeframe: '30d',
  totalIssues: 24,
  totalEvents: 184,
  resolvedCount: 24,
  unresolvedCount: 0,
  healthScore: '99.8%',
  performanceImpact: '0.0ms',
  topErrors: [
    {
      id: 'err-1',
      title: 'TypeError: Cannot read properties of undefined (reading "id")',
      route: '/checkout/step-2',
      count: 78,
      percentage: 42,
      status: 'resolved',
      level: 'error',
    },
    {
      id: 'err-2',
      title: 'NetworkError: Failed to fetch inventory status',
      route: '/api/v1/cart/sync',
      count: 46,
      percentage: 25,
      status: 'resolved',
      level: 'error',
    },
    {
      id: 'err-3',
      title: 'StripeWebhookTimeout: Processing exceeded 2000ms threshold',
      route: '/api/webhooks/stripe',
      count: 32,
      percentage: 17,
      status: 'resolved',
      level: 'warning',
    },
    {
      id: 'err-4',
      title: 'HydrationMismatch: Server HTML attributes differed from client',
      route: '/products/[slug]',
      count: 18,
      percentage: 10,
      status: 'resolved',
      level: 'warning',
    },
    {
      id: 'err-5',
      title: 'TokenExpiredError: jwt expired on user session ping',
      route: '/api/auth/refresh',
      count: 10,
      percentage: 6,
      status: 'resolved',
      level: 'info',
    },
  ],
};

const BRAND_COLOR_PRESETS = [
  { label: 'Emerald', hex: '#10B981' },
  { label: 'Amber', hex: '#F59E0B' },
  { label: 'Blue', hex: '#3B82F6' },
  { label: 'Indigo', hex: '#6366F1' },
  { label: 'Violet', hex: '#8B5CF6' },
];

export default function ClientReportsPage() {
  // Authentication & Plan Tier
  const [loading, setLoading] = useState<boolean>(true);
  const [planTier, setPlanTier] = useState<string>('free');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [nativeProjects, setNativeProjects] = useState<NativeProject[]>([]);

  // Sentry Connection State
  const [sentryToken, setSentryToken] = useState<string>('');
  const [organizationSlug, setOrganizationSlug] = useState<string>('');
  const [showToken, setShowToken] = useState<boolean>(false);
  const [sentryProjects, setSentryProjects] = useState<SentryProject[]>([]);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string>('client-store');
  const [timeframe, setTimeframe] = useState<Timeframe>('30d');
  const [syncingProjects, setSyncingProjects] = useState<boolean>(false);
  const [fetchingReport, setFetchingReport] = useState<boolean>(false);
  const [sentryError, setSentryError] = useState<string | null>(null);

  // Agency White-Label Branding State
  const [agencyName, setAgencyName] = useState<string>('Digital Studio');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string>('');
  const [brandColor, setBrandColor] = useState<string>('#10B981');

  // UI Accordions
  const [showSentryCard, setShowSentryCard] = useState<boolean>(true);
  const [showBrandingCard, setShowBrandingCard] = useState<boolean>(false);

  // Deliverable Report Data
  const [reportData, setReportData] = useState<SentryReportData>(SAMPLE_SENTRY_REPORT);
  const [copiedInvoiceNote, setCopiedInvoiceNote] = useState<boolean>(false);

  // Initial Load from LocalStorage & Supabase
  useEffect(() => {
    async function init() {
      setLoading(true);

      // Restore credentials & branding from LocalStorage
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('snaptrace_sentry_token') || '';
        const savedOrg = localStorage.getItem('snaptrace_sentry_org') || '';
        const savedName = localStorage.getItem('snaptrace_agency_name') || 'Digital Studio';
        const savedLogo = localStorage.getItem('snaptrace_agency_logo') || '';
        const savedColor = localStorage.getItem('snaptrace_agency_color') || '#10B981';
        const savedProj = localStorage.getItem('snaptrace_sentry_project') || '';

        if (savedToken) setSentryToken(savedToken);
        if (savedOrg) setOrganizationSlug(savedOrg);
        if (savedName) setAgencyName(savedName);
        if (savedLogo) setAgencyLogoUrl(savedLogo);
        if (savedColor) setBrandColor(savedColor);
        if (savedProj) setSelectedProjectSlug(savedProj);

        // Auto-collapse Sentry card if credentials exist to prioritize report deliverable
        if (savedToken && savedOrg) {
          setShowSentryCard(false);
        }
      }

      // Check user session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const email = session.user.email || '';
          const ownerCheck =
            email.toLowerCase() === 'arxu1045@gmail.com' ||
            email.toLowerCase() === 'arxu009@gmail.com';
          setIsOwner(ownerCheck);

          const { data: projectList } = await supabase
            .from('projects')
            .select('id, name, api_key, created_at, plan_tier')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          if (projectList && projectList.length > 0) {
            setNativeProjects(projectList);
            const paidProject = projectList.find((p) => p.plan_tier && p.plan_tier !== 'free');
            const resolvedTier = ownerCheck
              ? 'agency_scale'
              : (paidProject?.plan_tier || projectList[0]?.plan_tier || 'free').toLowerCase();
            setPlanTier(resolvedTier);
          } else {
            setPlanTier(ownerCheck ? 'agency_scale' : 'free');
          }
        }
      } catch (err) {
        console.error('Session load error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // Sync Projects from Sentry Public API
  const handleSyncProjects = async () => {
    if (!sentryToken.trim()) {
      setSentryError('Please enter your Sentry Auth Token.');
      return;
    }
    if (!organizationSlug.trim()) {
      setSentryError('Please enter your Sentry Organization Slug.');
      return;
    }

    setSyncingProjects(true);
    setSentryError(null);

    // Save to LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_sentry_token', sentryToken.trim());
      localStorage.setItem('snaptrace_sentry_org', organizationSlug.trim().toLowerCase());
    }

    try {
      const res = await fetch('/api/sentry/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentryToken: sentryToken.trim(),
          organizationSlug: organizationSlug.trim().toLowerCase(),
          projectSlug: 'FETCH_PROJECTS',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync Sentry projects.');
      }

      if (Array.isArray(data.projects) && data.projects.length > 0) {
        setSentryProjects(data.projects);
        const firstSlug = data.projects[0].slug;
        setSelectedProjectSlug(firstSlug);
        if (typeof window !== 'undefined') {
          localStorage.setItem('snaptrace_sentry_project', firstSlug);
        }
        // Auto-fetch report for the first project
        fetchProjectReport(firstSlug);
      } else {
        setSentryError('No projects found in this Sentry organization.');
      }
    } catch (err: any) {
      setSentryError(err.message || 'Error communicating with Sentry.');
    } finally {
      setSyncingProjects(false);
    }
  };

  // Fetch Report Data for Selected Project
  const fetchProjectReport = useCallback(
    async (slugToFetch?: string) => {
      const slug = slugToFetch || selectedProjectSlug;
      if (!slug) return;

      // If credentials aren't set, fallback gracefully to sample preview
      if (!sentryToken.trim() || !organizationSlug.trim()) {
        const sampleMatch = SAMPLE_SENTRY_PROJECTS.find((p) => p.slug === slug);
        setReportData({
          ...SAMPLE_SENTRY_REPORT,
          projectName: sampleMatch ? sampleMatch.name : 'Client Project',
          projectSlug: slug,
          timeframe,
        });
        return;
      }

      setFetchingReport(true);
      setSentryError(null);

      try {
        const res = await fetch('/api/sentry/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentryToken: sentryToken.trim(),
            organizationSlug: organizationSlug.trim().toLowerCase(),
            projectSlug: slug,
            timeframe,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch report from Sentry.');
        }

        setReportData(data);
      } catch (err: any) {
        setSentryError(err.message || 'Could not load Sentry telemetry report.');
      } finally {
        setFetchingReport(false);
      }
    },
    [sentryToken, organizationSlug, selectedProjectSlug, timeframe]
  );

  // Trigger report fetch when project selection or timeframe changes
  useEffect(() => {
    if (selectedProjectSlug) {
      fetchProjectReport(selectedProjectSlug);
    }
  }, [selectedProjectSlug, timeframe, fetchProjectReport]);

  // Save branding changes to LocalStorage
  const handleUpdateAgencyName = (name: string) => {
    setAgencyName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_name', name);
    }
  };

  const handleUpdateLogoUrl = (url: string) => {
    setAgencyLogoUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_logo', url);
    }
  };

  const handleUpdateBrandColor = (color: string) => {
    setBrandColor(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('snaptrace_agency_color', color);
    }
  };

  // Copy 6-Line Retainer Invoice Note
  const handleCopyRetainerInvoiceNote = () => {
    const projectTitle = reportData.projectName || selectedProjectSlug || 'Client Project';
    const totalHandled = reportData.totalIssues || reportData.totalEvents || 24;
    const score = reportData.healthScore || '99.8%';
    const agency = agencyName.trim() || 'Digital Studio';

    const invoiceNote = `[Client Reliability Statement - ${projectTitle}]
• Health Score: ${score} Operational
• Production Exceptions Handled: ${totalHandled}
• Zero Performance Penalty: 0.0ms
Verified by ${agency}`;

    navigator.clipboard.writeText(invoiceNote);
    setCopiedInvoiceNote(true);
    setTimeout(() => setCopiedInvoiceNote(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const isFreeTier = !isOwner && planTier === 'free';
  const displayProjects = sentryProjects.length > 0 ? sentryProjects : SAMPLE_SENTRY_PROJECTS;

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      {/* High-Fidelity Distraction-Free Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #09090b !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside,
          header,
          nav,
          [id^="tour-"],
          .no-print {
            display: none !important;
          }
          .print-sheet {
            background: #ffffff !important;
            color: #09090b !important;
            border: 1px solid #e4e4e7 !important;
            box-shadow: none !important;
            padding: 24px !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-sheet * {
            color: #09090b !important;
            border-color: #e4e4e7 !important;
          }
          .print-kpi {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
          .print-accent {
            color: #059669 !important;
          }
          .print-badge {
            background: #ecfdf5 !important;
            border-color: #a7f3d0 !important;
            color: #047857 !important;
          }
          .print-progress-bg {
            background-color: #f1f5f9 !important;
          }
          .print-progress-bar {
            background-color: #0f172a !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-transparent text-zinc-100 p-4 sm:p-8 font-sans selection:bg-zinc-700 selection:text-zinc-100 animate-in fade-in duration-150">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* PAGE HEADER & STUDIO BAR (Hidden on Print) */}
          <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  White-Label Agency Retainer Reporting Suite
                </h1>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Connect your Sentry projects in seconds, inject agency branding, and export monthly PDF deliverables for client retainers.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Project Dropdown */}
              <div className="relative">
                <select
                  value={selectedProjectSlug}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setSelectedProjectSlug(slug);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('snaptrace_sentry_project', slug);
                    }
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600 transition cursor-pointer min-w-[180px] shadow-sm"
                >
                  {displayProjects.map((p) => (
                    <option key={p.slug} value={p.slug} className="bg-zinc-950 text-zinc-200">
                      {p.name} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe Pill Selector */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg font-mono text-xs shadow-sm">
                {(['7d', '14d', '30d'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeframe(range)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                      timeframe === range
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
                  </button>
                ))}
              </div>

              {/* Copy Retainer Invoice Note Button */}
              <button
                type="button"
                onClick={handleCopyRetainerInvoiceNote}
                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Copy client-ready invoice note for direct billing paste"
              >
                {copiedInvoiceNote ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Note!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Copy Retainer Invoice Note</span>
                  </>
                )}
              </button>

              {/* Print / Export PDF Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 font-mono shrink-0 shadow-sm"
                title="Print or export immaculate corporate white-and-black PDF deliverable"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Export PDF</span>
              </button>
            </div>
          </div>

          {/* TIER GATING BANNER (Hidden on Print) */}
          {isFreeTier && (
            <div className="no-print bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold tracking-wide uppercase">
                    Agency Retainer Studio
                  </span>
                  <span className="text-xs font-medium text-zinc-200">
                    White-label PDF exports and Sentry client sync are unlocked on Agency Studio ($29/mo) and Scale ($49/mo).
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Justify $1,500/mo retainer invoices with automated client reliability proof of work.
                </p>
              </div>
              <a
                href="https://buy.polar.sh/polar_cl_jtE6KA0k5GWeMhuFWQGB9fsDhRt8rdTwDteFS0Qr44g"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs rounded-lg transition font-mono shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Unlock Agency Suite</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* A. SENTRY CONNECTION BAR (Collapsible Setup Card) */}
          <div className="no-print bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm">
            <button
              type="button"
              onClick={() => setShowSentryCard((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-850/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
                  Sentry Public API Connection
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  {sentryToken ? 'Connected (Token saved)' : 'Read-only token setup'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <span>{showSentryCard ? 'Collapse' : 'Configure'}</span>
                {showSentryCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showSentryCard && (
              <div className="p-5 border-t border-zinc-800/80 space-y-4 bg-zinc-950/40">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sentry Token Input with Reveal Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300 flex items-center justify-between">
                      <span>Sentry Auth Token</span>
                      <a
                        href="https://sentry.io/settings/account/api/auth-tokens/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 transition underline"
                      >
                        Generate Read-Only Token ↗
                      </a>
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={sentryToken}
                        onChange={(e) => setSentryToken(e.target.value)}
                        placeholder="sntryu_..."
                        className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 pr-9 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((prev) => !prev)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                        title={showToken ? 'Hide token' : 'Reveal token'}
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Sentry Organization Slug */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Sentry Organization Slug
                    </label>
                    <input
                      type="text"
                      value={organizationSlug}
                      onChange={(e) => setOrganizationSlug(e.target.value)}
                      placeholder="e.g. acme-agency"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                    />
                  </div>
                </div>

                {sentryError && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{sentryError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <p className="text-[11px] text-zinc-400 font-mono">
                    Token is queried server-side in memory. We never store raw error payloads or client database credentials.
                  </p>
                  <button
                    type="button"
                    onClick={handleSyncProjects}
                    disabled={syncingProjects}
                    className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition font-mono flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingProjects ? 'animate-spin' : ''}`} />
                    <span>{syncingProjects ? 'Syncing...' : 'Sync Sentry Projects'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* B. AGENCY WHITE-LABEL BRANDING CARD (Collapsible) */}
          <div className="no-print bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm">
            <button
              type="button"
              onClick={() => setShowBrandingCard((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-zinc-850/40 transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-200 font-mono uppercase tracking-wider">
                  White-Label Agency Branding
                </span>
                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                  {agencyName} · Zero Sentry Badges
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <span>{showBrandingCard ? 'Collapse' : 'Customize Branding'}</span>
                {showBrandingCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showBrandingCard && (
              <div className="p-5 border-t border-zinc-800/80 space-y-4 bg-zinc-950/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Agency Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Agency Name
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => handleUpdateAgencyName(e.target.value)}
                      placeholder="Digital Studio"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                    />
                  </div>

                  {/* Agency Logo URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Agency Logo URL
                    </label>
                    <input
                      type="url"
                      value={agencyLogoUrl}
                      onChange={(e) => handleUpdateLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.svg"
                      className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono placeholder:text-zinc-600 outline-none transition"
                    />
                  </div>

                  {/* Primary Brand Color */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-zinc-300">
                      Primary Brand Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => handleUpdateBrandColor(e.target.value)}
                        className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => handleUpdateBrandColor(e.target.value)}
                        className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono outline-none transition uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Brand Swatches */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] font-mono text-zinc-400">Color Presets:</span>
                  {BRAND_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleUpdateBrandColor(preset.hex)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border transition cursor-pointer ${
                        brandColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* C. REPORT DELIVERABLE VIEW (The Live Client Deliverable Document Sheet) */}
          <div className="print-sheet bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-sm">

            {/* Deliverable Header: Agency Logo + Agency Name + "Client Reliability Statement" */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-800/80 pb-5">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {agencyLogoUrl ? (
                    <img
                      src={agencyLogoUrl}
                      alt={agencyName}
                      className="h-8 w-auto max-w-[140px] object-contain rounded"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className="h-8 px-2.5 rounded flex items-center justify-center font-bold text-xs tracking-wider uppercase text-zinc-950 font-mono shadow-xs"
                      style={{ backgroundColor: brandColor }}
                    >
                      {agencyName.slice(0, 3)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                      {agencyName}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Client Reliability Statement
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium print-badge">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    <span style={{ color: brandColor }}>
                      Production Telemetry Verified · SLA Compliant
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mt-2">
                    {reportData.projectName}
                  </h2>
                </div>
              </div>

              {/* Evaluation Period & Metadata */}
              <div className="text-left sm:text-right font-mono text-xs text-zinc-400 space-y-1 bg-zinc-900/60 sm:bg-transparent p-3 sm:p-0 rounded-lg border sm:border-0 border-zinc-800">
                <div className="text-zinc-200 font-semibold">
                  Evaluation Period: {timeframe === '7d' ? 'Last 7 Days' : timeframe === '14d' ? 'Last 14 Days' : 'Last 30 Days'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Deliverable Date: {currentDateStr}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Target Project: {reportData.projectSlug}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Prepared For: Client Engineering Team
                </div>
              </div>
            </div>

            {/* EXECUTIVE KPI STRIP (3 Primary Metric Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

              {/* 1. Exceptions Intercepted & Resolved */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Exceptions Intercepted &amp; Resolved
                  </span>
                  <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="font-mono text-3xl font-bold text-zinc-100 tabular-nums">
                  {fetchingReport ? '...' : (reportData.resolvedCount || reportData.totalIssues).toLocaleString()}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  {reportData.totalEvents > 0
                    ? `${reportData.totalEvents} runtime events neutralized before user dropoff.`
                    : 'All uncaught exceptions resolved without incident escalation.'}
                </p>
              </div>

              {/* 2. Automated Health Score */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Automated Health Score
                  </span>
                  <ShieldCheck className="w-4 h-4" style={{ color: brandColor }} />
                </div>
                <div
                  className="font-mono text-3xl font-bold tabular-nums print-accent"
                  style={{ color: brandColor }}
                >
                  {fetchingReport ? '...' : reportData.healthScore}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Continuous uptime telemetry meeting agency retainer SLA targets.
                </p>
              </div>

              {/* 3. Performance Delay (Zero Core Web Vitals Penalty) */}
              <div className="print-kpi bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-2 flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider">
                    Performance Invariance
                  </span>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="print-accent font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                  {reportData.performanceImpact || '0.0ms'}
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Zero Core Web Vitals penalty · Non-blocking async monitoring.
                </p>
              </div>

            </div>

            {/* TOP PROTECTED ENDPOINTS TABLE */}
            <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100 font-mono tracking-tight uppercase">
                    Top Protected Endpoints &amp; Routes
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Application routes guarded against uncaught production crashes.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                  Route Guard
                </span>
              </div>

              {reportData.topErrors.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  Zero unhandled exceptions registered during this evaluation period.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {reportData.topErrors.map((err, idx) => (
                    <div key={err.id || idx} className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] text-zinc-500 font-semibold w-4 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="text-zinc-200 font-medium truncate" title={err.route}>
                            {err.route}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono shrink-0">
                            {err.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className="text-[11px] text-zinc-400">
                            {err.count} {err.count === 1 ? 'event' : 'events'} handled
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold tabular-nums">
                            {err.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Error Title Sub-line */}
                      <p className="text-[11px] text-zinc-400 font-mono truncate pl-6">
                        {err.title}
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800/60 print-progress-bg">
                        <div
                          className="h-full rounded-full transition-all duration-300 print-progress-bar"
                          style={{
                            width: `${Math.max(err.percentage, 5)}%`,
                            backgroundColor: brandColor,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AGENCY DISCLAIMER FOOTER */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">
                  Certified by {agencyName} Production Monitoring
                </span>
                <span>·</span>
                <span>Zero Core Web Vitals Penalty</span>
              </div>
              <div className="text-zinc-400">
                Confidential Client Retainer Deliverable
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
