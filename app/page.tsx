'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import TelemetryBeamBackground from '@/components/TelemetryBeamBackground';

export const dynamic = 'force-dynamic';

type StackKey = 'nextjs' | 'js' | 'python' | 'node' | 'go' | 'rust' | 'csharp' | 'php' | 'ruby' | 'kotlin' | 'flutter' | 'cloudflare';
type BillingInterval = 'monthly' | 'annual';
type IconProps = { className?: string };

const SUPPORT_EMAIL = 'hello.snaptrace@gmail.com';

/* ============================================================================
   GLOBAL STYLE LAYER
   - Fluid type scale (clamp): text stays legible and correctly sized at any
     zoom level, viewport width, or device pixel ratio without extra media
     queries per breakpoint.
   - content-visibility on below-the-fold sections so the browser skips
     layout/paint work for offscreen content — real perf win on low-power
     phones and long pages.
   - touch-action: manipulation removes the ~300ms tap delay on mobile browsers.
   - prefers-reduced-motion fully respected.
============================================================================ */

const GLOBAL_CSS = `
/* ---------- fluid type: scales with viewport, never overflows a small screen ---------- */
.st-display  { font-size: clamp(2.35rem, 1.1rem + 5.2vw, 4.75rem); line-height: 1.03; letter-spacing: -0.035em; font-weight: 600; }
.st-h2       { font-size: clamp(1.625rem, 1.05rem + 1.9vw, 2.375rem); line-height: 1.14; letter-spacing: -0.025em; font-weight: 600; }
.st-h3       { font-size: clamp(1.0625rem, 0.95rem + 0.4vw, 1.1875rem); line-height: 1.3; letter-spacing: -0.01em; font-weight: 600; }
.st-lead     { font-size: clamp(0.9375rem, 0.85rem + 0.25vw, 1rem); line-height: 1.65; }

/* ---------- consistent vertical rhythm so heading→body spacing never drifts ---------- */
.st-section  { padding-top: clamp(3.25rem, 2.6rem + 2.2vw, 5.5rem); padding-bottom: clamp(3.25rem, 2.6rem + 2.2vw, 5.5rem); }
.st-intro > * + * { margin-top: 0.85rem; }
.st-intro .st-eyebrow-row + .st-h2 { margin-top: 1rem; }

button, a { touch-action: manipulation; }

.st-grain { position: relative; }
.st-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
}
@media (max-width: 640px) { .st-grain::after { display: none; } }

.st-grid {
  background-image:
    linear-gradient(to right, rgba(148,163,184,0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148,163,184,0.045) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%);
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 30%, transparent 78%);
}

.st-cv { content-visibility: auto; contain-intrinsic-size: 1px 780px; }

.st-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0) 60%), #0B101D;
  border: 1px solid rgba(148,163,184,0.10);
  box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.035), 0 24px 48px -32px rgba(0,0,0,0.9);
}
.st-card-hover { transition: border-color .22s ease, transform .22s ease; }
@media (hover: hover) {
  .st-card-hover:hover { border-color: rgba(148,163,184,0.20); transform: translateY(-2px); }
}

.st-glow-amber { box-shadow: 0 0 0 1px rgba(250,204,21,0.20), 0 34px 74px -44px rgba(250,204,21,0.45); }

.st-marquee-track { display: flex; width: max-content; animation: st-marquee 46s linear infinite; }
@keyframes st-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

.st-fade-x {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
}

.st-tape-track { display: flex; flex-direction: column; animation: st-tape 16s linear infinite; }
@keyframes st-tape { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
.st-fade-y {
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(to bottom, transparent, #000 12%, #000 88%, transparent);
}

.st-ring { position: relative; }
.st-ring::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 1px solid rgba(239,68,68,0.55);
  animation: st-ring 2.4s cubic-bezier(0.2,0.7,0.3,1) infinite;
}
@keyframes st-ring { 0% { transform: scale(0.85); opacity: 0.9; } 70%, 100% { transform: scale(1.7); opacity: 0; } }

.st-accordion { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(0.4,0,0.2,1); }
.st-accordion[data-open='true'] { grid-template-rows: 1fr; }
.st-accordion > div { overflow: hidden; }

.st-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.st-scroll::-webkit-scrollbar-track { background: transparent; }
.st-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.18); border-radius: 999px; }
.st-scroll::-webkit-scrollbar-thumb:hover { background: rgba(250,204,21,0.35); }

.st-beta {
  font: 700 9.5px/1 ui-monospace, monospace;
  letter-spacing: 0.09em;
  padding: 2.5px 5.5px;
  border-radius: 5px;
  color: #FDE68A;
  border: 1px solid rgba(250,204,21,0.35);
  background: rgba(250,204,21,0.08);
  transform: translateY(-1px);
}

.st-mobile-nav {
  transition: opacity .22s ease, visibility .22s ease;
}
.st-mobile-nav[data-open='false'] { opacity: 0; visibility: hidden; pointer-events: none; }
.st-mobile-nav[data-open='true'] { opacity: 1; visibility: visible; }
.st-mobile-nav .st-mobile-nav-panel { transition: transform .28s cubic-bezier(0.16,1,0.3,1); }
.st-mobile-nav[data-open='false'] .st-mobile-nav-panel { transform: translateY(-8px); }
.st-mobile-nav[data-open='true'] .st-mobile-nav-panel { transform: translateY(0); }

.st-safe-b { padding-bottom: max(0.85rem, env(safe-area-inset-bottom)); }
.st-safe-t { padding-top: env(safe-area-inset-top); }

@media (prefers-reduced-motion: reduce) {
  .st-marquee-track, .st-tape-track { animation: none; }
  .st-ring::before { animation: none; opacity: 0; }
  .st-mobile-nav, .st-mobile-nav .st-mobile-nav-panel { transition: none; }
}
`;

/* ============================================================================
   ICON SET — inline line icons (zero emoji, zero icon-font dependency)
============================================================================ */

const stroke = (className: string) => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

const IconFeather = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M20.2 4.1a5.5 5.5 0 0 0-7.8 0L4 12.6V20h7.4l8.5-8.4a5.5 5.5 0 0 0 .3-7.5Z" /><path d="M16.5 7.5 6 18" /><path d="M14 10H9.5" /></svg>
);
const IconTarget = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /></svg>
);
const IconShield = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M12 3 5 5.8v5.4c0 4.2 2.8 7.9 7 9.8 4.2-1.9 7-5.6 7-9.8V5.8L12 3Z" /><path d="m9.2 12 2 2 3.6-3.8" /></svg>
);
const IconBolt = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M13.2 2.5 4.8 13.2h5.6l-.6 8.3 8.4-10.7h-5.6l.6-8.3Z" /></svg>
);
const IconSparkle = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M12 3.2c.9 4.2 1.8 5.1 6 6-4.2.9-5.1 1.8-6 6-.9-4.2-1.8-5.1-6-6 4.2-.9 5.1-1.8 6-6Z" /><path d="M18.8 3v3M20.3 4.5h-3" /></svg>
);
const IconCheck = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="m4.5 12.5 4.8 4.8L19.5 7" /></svg>
);
const IconCross = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="m6.5 6.5 11 11M17.5 6.5l-11 11" /></svg>
);
const IconCopy = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><rect x="9" y="9" width="11" height="11" rx="2.2" /><path d="M5.5 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v.5" /></svg>
);
const IconChevron = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="m6 9.5 6 6 6-6" /></svg>
);
const IconArrow = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></svg>
);
const IconTerminal = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><rect x="3" y="4.5" width="18" height="15" rx="2.4" /><path d="m7.5 10 2.5 2.5-2.5 2.5" /><path d="M13 15h3.5" /></svg>
);
const IconLock = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></svg>
);
const IconUnlocked = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" /><path d="M8 10.5V7.8a4 4 0 0 1 7.6-1.7" /></svg>
);
const IconMute = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M10.5 5.5 6.5 9H3.5v6h3l4 3.5v-13Z" /><path d="m15.5 9.5 5 5M20.5 9.5l-5 5" /></svg>
);
const IconLayers = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="m12 3.5 8.5 4.3L12 12 3.5 7.8 12 3.5Z" /><path d="m3.5 12.2 8.5 4.3 8.5-4.3" /><path d="m3.5 16.4 8.5 4.3 8.5-4.3" /></svg>
);
const IconCode = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="m8.5 8-4.5 4 4.5 4" /><path d="m15.5 8 4.5 4-4.5 4" /></svg>
);
const IconPlug = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M9 3.5v5M15 3.5v5" /><path d="M6.5 8.5h11v3a5.5 5.5 0 0 1-11 0v-3Z" /><path d="M12 17v3.5" /></svg>
);
const IconMenu = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M4 7.5h16M4 12h16M4 16.5h16" /></svg>
);
const IconMessage = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><path d="M4 5.5h16v10.5H9.5L5 20v-4H4V5.5Z" /></svg>
);
const IconMail = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg {...stroke(className)}><rect x="3.5" y="5.5" width="17" height="13" rx="2.2" /><path d="m4.5 7 7.5 5.8L19.5 7" /></svg>
);

/* ============================================================================
   BRAND MARKS — geometric marks drawn in-house (24x24 box, swap-in ready
   for official vendor SVGs later without touching layout JSX)
============================================================================ */

const MarkGemini = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="st-gemini" x1="3" y1="20" x2="21" y2="4" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4C86F9" />
        <stop offset="52%" stopColor="#9277F6" />
        <stop offset="100%" stopColor="#E96C8E" />
      </linearGradient>
    </defs>
    <path d="M12 1.6c0 5.74 4.66 10.4 10.4 10.4-5.74 0-10.4 4.66-10.4 10.4C12 16.66 7.34 12 1.6 12 7.34 12 12 7.34 12 1.6Z" fill="url(#st-gemini)" />
  </svg>
);

const MarkOpenAI = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" strokeLinecap="round">
      <path d="M12 3.1 18.1 6.6v6.9L12 17.1 5.9 13.5V6.6L12 3.1Z" opacity="0.9" />
      <path d="M12 6.9 18.1 10.4v6.9L12 20.9 5.9 17.3v-6.9L12 6.9Z" opacity="0.5" />
      <path d="M12 6.9v10.2M5.9 10.4l6.1 3.5 6.1-3.5" opacity="0.4" />
    </g>
  </svg>
);

const MarkClaude = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g fill="#D97757">
      <path d="M11.2 2.6h1.6l1.5 8.6h-4.6l1.5-8.6Z" />
      <path d="M21.4 11.2v1.6l-8.6 1.5V9.7l8.6 1.5Z" />
      <path d="M12.8 21.4h-1.6l-1.5-8.6h4.6l-1.5 8.6Z" />
      <path d="M2.6 12.8v-1.6l8.6-1.5v4.6l-8.6-1.5Z" />
    </g>
  </svg>
);

const MarkDeepSeek = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 14.2c3.4.5 5.9-.6 7.6-3.2 1.3-2 1-4.2-.6-5.6.9 2.2.3 3.7-1.2 4.6" stroke="#4D6BFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 14.2c.6 3.5 3.4 5.8 7.2 5.8 4.6 0 7.8-3 8.3-7.2.2-1.6.8-2.6 2.5-3.3-1.9-.9-3.6-.6-4.9.8" stroke="#4D6BFE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="14.6" cy="12.4" r="0.9" fill="#4D6BFE" />
  </svg>
);

const MarkOllama = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.4 9.2c-.9-2-.7-4.3.5-5.3 1.2-1 2.4.2 2.6 2.3" />
      <path d="M16.6 9.2c.9-2 .7-4.3-.5-5.3-1.2-1-2.4.2-2.6 2.3" />
      <path d="M12 8c3 0 5.2 2 5.2 5.1 0 1.3-.4 2.2-.4 3.2 0 1.1.7 1.7.7 2.6 0 .8-.7 1.4-1.7 1.4H8.2c-1 0-1.7-.6-1.7-1.4 0-.9.7-1.5.7-2.6 0-1-.4-1.9-.4-3.2C6.8 10 9 8 12 8Z" />
      <path d="M10.4 13.3h.01M13.6 13.3h.01" />
    </g>
  </svg>
);

const MarkCursor = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.6 21 7.8v8.4L12 21.4 3 16.2V7.8L12 2.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M12 12.1 21 7.8M12 12.1v9.3M12 12.1 3 7.8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" opacity="0.55" />
  </svg>
);

const MarkVSCode = ({ className = 'w-4 h-4' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M17.6 2.6 8.4 11.3 4.4 8.2 2.6 9.2l3.3 2.8-3.3 2.8 1.8 1 4-3.1 9.2 8.7 3.8-1.8V4.4l-3.8-1.8Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
    <path d="M17.6 6.6v10.8L10.9 12l6.7-5.4Z" fill="currentColor" opacity="0.26" />
  </svg>
);

/* ============================================================================
   DESIGN TOKENS
============================================================================ */

const BTN_PRIMARY =
  'group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-slate-950 ' +
  'bg-[linear-gradient(180deg,#FDE68A_0%,#FACC15_46%,#EAB308_100%)] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_-12px_rgba(250,204,21,0.75)] ' +
  'transition-[transform,box-shadow,filter] duration-200 active:translate-y-0 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070E] ' +
  '[@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:brightness-[1.06]';

const BTN_SECONDARY =
  'group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-slate-100 ' +
  'border border-white/10 bg-white/[0.04] backdrop-blur-sm ' +
  'transition-[transform,background-color,border-color] duration-200 active:translate-y-0 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ' +
  '[@media(hover:hover)]:hover:-translate-y-px [@media(hover:hover)]:hover:bg-white/[0.07] [@media(hover:hover)]:hover:border-white/20';

const BTN_GHOST_SM =
  'inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 ' +
  'transition hover:bg-white/[0.08] hover:text-white active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30';

/* ============================================================================
   SCROLL REVEAL — one calm entrance
============================================================================ */

function SmoothReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) observer.unobserve(domRef.current);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    const currentTarget = domRef.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: String(delay) + 'ms' }}
      className={
        'transform-gpu transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] ' +
        (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  );
}

function Eyebrow({
  icon,
  children,
  tone = 'amber',
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: 'amber' | 'purple' | 'emerald';
}) {
  const tones = {
    amber: 'text-yellow-300/90 border-yellow-400/20 bg-yellow-400/[0.07]',
    purple: 'text-purple-300/90 border-purple-400/20 bg-purple-500/[0.08]',
    emerald: 'text-emerald-300/90 border-emerald-400/20 bg-emerald-500/[0.07]',
  };
  return (
    <span className={'st-eyebrow-row inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-medium ' + tones[tone]}>
      {icon}
      {children}
    </span>
  );
}

/** One consistent heading block so eyebrow → heading → lead spacing never drifts between sections. */
function SectionIntro({
  eyebrowIcon,
  eyebrowLabel,
  eyebrowTone = 'amber',
  heading,
  lead,
  center = false,
  className = '',
}: {
  eyebrowIcon: React.ReactNode;
  eyebrowLabel: React.ReactNode;
  eyebrowTone?: 'amber' | 'purple' | 'emerald';
  heading: React.ReactNode;
  lead?: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={'st-intro ' + (center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl') + (className ? ' ' + className : '')}>
      <Eyebrow icon={eyebrowIcon} tone={eyebrowTone}>{eyebrowLabel}</Eyebrow>
      <h2 className="st-h2 text-white">{heading}</h2>
      {lead && <p className="st-lead text-slate-400">{lead}</p>}
    </div>
  );
}

/* ============================================================================
   MODULE-SCOPE CONSTANTS — never recreated on render
============================================================================ */

const DEV_KNOWLEDGE_BASE: Record<string, string> = {
  collapse: 'When an outage happens (like a DB pool drop), legacy loggers spam 5 separate alerts for downstream errors. SnapTrace hashes the error origin via deterministic SHA-256 fingerprints, collapses the entire cascade into 1 consolidated thread tagged [xN], and points directly to the failing line (database.js:18) with an AI fix.',
  bundle: 'SnapTrace is strictly <3.4KB gzipped (Sentry is ~100KB+). We use native browser listeners and dispatch asynchronously via navigator.sendBeacon. Zero blocking time on page hydration; 100/100 Google Core Web Vitals score.',
  pii: 'Zero-Trust On-Device Sanitization. Passwords, bearer tokens, emails, and credit cards are scrubbed with regex AST directly in the browser before payloads touch the network. Sensitive credentials never hit third-party servers.',
  cursor: 'When an exception occurs, 1 click exports an AI-optimized prompt pre-formatted with the runtime environment, error message, and stack frames ready to paste into Cursor, Claude Code, or VS Code Copilot for an instant 2-line patch.',
};

function getDevBotAnswer(query: string): string {
  const q = query.toLowerCase().trim();

  if (q.includes('ai') || q.includes('model') || q.includes('gemini') || q.includes('openai') || q.includes('gpt') || q.includes('claude') || q.includes('cursor') || q.includes('copilot') || q.includes('llm')) {
    return 'SnapTrace features a dual AI architecture:\n\n1. In-Dashboard BYOK Diagnostics:\nConnect your Google Gemini (100% Free via Gemini 2.5 Flash Lite) or OpenAI (GPT-4o) key in Settings for automated root-cause analysis and code patch diffs.\n\n2. 1-Click IDE Coding Agent Export:\nClicking "Copy for Cursor" generates an AI-optimized prompt pre-formatted with the environment, error message, and stack frames-ready for Cursor, Claude Code, or VS Code Copilot.';
  }

  if (q.includes('collapse') || q.includes('cascade') || q.includes('sunday') || q.includes('outage') || q.includes('root cause') || q.includes('group')) {
    return DEV_KNOWLEDGE_BASE.collapse;
  }

  if (q.includes('bundle') || q.includes('size') || q.includes('speed') || q.includes('fast') || q.includes('lightweight') || q.includes('5kb') || q.includes('performance') || q.includes('beacon') || q.includes('sendbeacon') || q.includes('lighthouse') || q.includes('vitals')) {
    return DEV_KNOWLEDGE_BASE.bundle;
  }

  if (q.includes('pii') || q.includes('privacy') || q.includes('password') || q.includes('mask') || q.includes('credit card') || q.includes('card') || q.includes('token') || q.includes('gdpr') || q.includes('sanitize')) {
    return DEV_KNOWLEDGE_BASE.pii;
  }

  if (q.includes('price') || q.includes('cost') || q.includes('beta') || q.includes('free') || q.includes('tier') || q.includes('pay') || q.includes('subscription')) {
    return 'Public Beta is currently active. Early developers claim grandfathered Lifetime Starter Pro with high-capacity monitoring and full in-dashboard AI diagnostics for $0 forever. No credit card required.';
  }

  if (q.includes('language') || q.includes('stack') || q.includes('framework') || q.includes('python') || q.includes('node') || q.includes('rust') || q.includes('go') || q.includes('golang') || q.includes('php') || q.includes('csharp') || q.includes('ruby') || q.includes('flutter') || q.includes('kotlin') || q.includes('cloudflare') || q.includes('curl') || q.includes('support')) {
    return 'We support 100% of languages through our open REST ingestion protocol. Pre-configured drop-in snippets are ready in the dashboard for:\n- Frontend: Next.js (App & Pages Router), React, Vue, Svelte, Vite, Vanilla JS\n- Backend: Node.js (Express/Nest), Python (FastAPI/Django), Go (Golang), Rust (Axum/Actix), PHP (Laravel/WordPress), C# (.NET), Ruby on Rails\n- Mobile & Edge: Flutter (Dart), Kotlin/Android, Cloudflare Workers, and raw cURL/Bash.';
  }

  if (q.includes('setup') || q.includes('install') || q.includes('how to') || q.includes('start') || q.includes('quickstart')) {
    return '30-second setup:\n1. Place this 1-line script inside your HTML head or Next.js app/layout.tsx:\n<script src="https://snaptrace-dashboard.vercel.app/snaptrace.js" data-api-key="YOUR_KEY" async></script>\n2. When any uncaught exception occurs, SnapTrace automatically intercepts it, scrubs PII, throttles repeat loops, and pings your Discord/Slack/Email in milliseconds.';
  }

  if (q.includes('slack') || q.includes('discord') || q.includes('alert') || q.includes('notification') || q.includes('email') || q.includes('webhook')) {
    return 'Instant real-time alert dispatch in <1 second to your Discord channels (rich embeds), Slack incoming webhooks, and Gmail inbox with occurrence counters ([x500]). Configure your webhook URLs under Settings in 10 seconds.';
  }

  if (q.includes('loop') || q.includes('throttle') || q.includes('spam') || q.includes('storm') || q.includes('flood') || q.includes('duplicate') || q.includes('2 am') || q.includes('x500')) {
    return '60-Second Loop Throttling Engine.\n\nIf an infinite re-render loop or failing API poll throws 500 times in 10 seconds, SnapTrace sends the 1st crash immediately, silences duplicate alerts over a 60-second window, and delivers 1 clean summary alert tagged [x500].';
  }

  if (q.includes('sentry') || q.includes('datadog') || q.includes('glitchtip') || q.includes('honeybadger') || q.includes('why snaptrace') || q.includes('versus') || q.includes('vs')) {
    return 'Why developers switch to SnapTrace:\n1. Featherweight SDK: <3.4KB vs Sentry\'s 100KB+ bundle penalty.\n2. Zero Alert Fatigue: 60s noise throttling groups cascade crashes into 1 alert tagged [xN].\n3. On-Device PII Masking: Passwords and cards scrubbed before transmission.\n4. Free BYOK AI: In-dashboard Gemini & OpenAI diagnostics without expensive enterprise add-ons.';
  }

  return 'SnapTrace is a featherweight (<5KB) error monitoring platform built to eliminate alert fatigue and 100KB SDK bloat. Try asking about:\n- "which ai models does this support?"\n- "how does cascading error collapse work?"\n- "why is the SDK under 5KB?"\n- "which languages are supported?"\n- "how does client PII masking work?"';
}

const STACK_TABS: Array<{ id: StackKey; label: string }> = [
  { id: 'nextjs', label: 'Next.js' },
  { id: 'js', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'node', label: 'Node.js' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'csharp', label: 'C# .NET' },
  { id: 'php', label: 'PHP' },
  { id: 'ruby', label: 'Ruby' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'flutter', label: 'Flutter' },
  { id: 'cloudflare', label: 'Cloudflare' },
];

const MARQUEE_ITEMS = [
  'Next.js', 'React', 'Vue', 'Svelte', 'Vite', 'Node.js', 'Express', 'NestJS',
  'Python', 'FastAPI', 'Django', 'Go', 'Rust', 'Axum', 'PHP', 'Laravel',
  'WordPress', 'C# .NET', 'Ruby on Rails', 'Kotlin', 'Flutter', 'Cloudflare Workers', 'cURL',
];

const TAPE_EVENTS = [
  { label: 'ReferenceError · database.js:18', tone: 'crash' },
  { label: 'Cascade collapsed → 1 incident [x4]', tone: 'fix' },
  { label: 'PII scrubbed before transmission', tone: 'ok' },
  { label: 'Discord alert dispatched · 0.4s', tone: 'ok' },
  { label: 'TypeError · checkout.tsx:92', tone: 'crash' },
  { label: 'AI patch ready · client.release()', tone: 'fix' },
];

const FAQS = [
  {
    q: 'How does SnapTrace collapse cascading multi-error outages?',
    a: 'During an outage, a single database connection drop often triggers 4 or 5 different downstream errors (auth fails, queries fail, UI renders fail). Instead of sending 5 separate noisy alerts that you have to piece together manually on a Sunday, SnapTrace groups cascading failures and isolates the single root cause with an instant AI fix.',
  },
  {
    q: 'Do I need to keep the SnapTrace website open to receive alerts?',
    a: 'No. The SnapTrace SDK runs silently inside your live application. When an unhandled crash happens in production, SnapTrace automatically pings your configured Discord channel, Slack room, and Gmail inbox in milliseconds.',
  },
  {
    q: 'How does SnapTrace integrate with VS Code, Cursor, and AI IDEs?',
    a: 'When an exception occurs, SnapTrace provides a 1-click "Copy for Cursor" button inside the Inspect modal. It generates an AI-optimized prompt containing the runtime environment, error message, and stack frames, ready to paste into Cursor, VS Code Copilot, or Claude Code for instant local code fixes.',
  },
  {
    q: 'What languages and frameworks does SnapTrace support?',
    a: 'SnapTrace uses a universal REST telemetry endpoint. We provide drop-in snippets for Next.js, JavaScript, React, Vue, Node.js, Python, Go, Rust, C# (.NET), PHP, Ruby, Kotlin, Flutter, Cloudflare Workers, and cURL.',
  },
  {
    q: 'How does SnapTrace maintain a <5KB bundle size with 0ms delay?',
    a: 'Unlike legacy APMs that bundle 100KB+ of heavy performance profilers and session serializers, SnapTrace is focused strictly on crash telemetry, client-side PII regex scrubbing, and asynchronous beacon delivery via navigator.sendBeacon. It never delays page hydration or blocks Google Core Web Vitals.',
  },
  {
    q: 'How does the limited-time Beta promotion work?',
    a: 'Early developers claim grandfathered Lifetime Starter Pro with 75,000 monthly events, 30-day retention, and full in-dashboard AI diagnostics for $0 forever. No credit card required.',
  },
];

const COMPARISON_ROWS = [
  { f: 'SDK weight', st: 'under 5 KB', sentry: '~100 KB+', glitch: '~100 KB+' },
  { f: 'Cascading root-cause collapse', st: 'Unified incident', sentry: 'Separate alerts', glitch: 'Not available' },
  { f: 'Free tier events', st: '2,000 / month', sentry: '5,000 / month', glitch: '1,000 / month' },
  { f: 'Client-side PII scrubbing', st: 'Native, on-device', sentry: 'Server-side rules', glitch: 'Not available' },
  { f: 'In-dashboard AI diagnosis (BYOK)', st: 'Included in Pro', sentry: 'Paid add-on', glitch: 'Not available' },
  { f: '1-click prompt export for Cursor', st: 'Free forever', sentry: 'Manual copy', glitch: 'Manual copy' },
];

const SNIPPETS: Record<StackKey, string> = {
  nextjs: '// app/layout.tsx (Next.js App Router)\nimport Script from \'next/script\';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <head>\n        <Script\n          src="https://snaptrace-dashboard.vercel.app/snaptrace.js"\n          strategy="beforeInteractive"\n          data-api-key="sk_live_your_project_key"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}',
  js: '<!-- React, Vue, Svelte, or Vanilla JavaScript -->\n<script \n  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"\n  data-api-key="sk_live_your_project_key"\n  async\n></script>',
  python: '# Python / Django / FastAPI / Flask\nimport traceback, requests\n\ndef log_to_snaptrace(exception, url="https://api.mycompany.com"):\n    try:\n        requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={\n            "apiKey": "sk_live_your_project_key",\n            "message": str(exception),\n            "stackTrace": traceback.format_exc(),\n            "url": url,\n            "environment": "production"\n        }, timeout=2)\n    except Exception:\n        pass',
  node: '// Node.js / Express / NestJS\nprocess.on(\'uncaughtException\', (err) => {\n  fetch(\'https://snaptrace-dashboard.vercel.app/api/v1/log\', {\n    method: \'POST\',\n    headers: { \'Content-Type\': \'application/json\' },\n    body: JSON.stringify({ apiKey: \'sk_live_your_project_key\', message: err.message, stackTrace: err.stack, environment: process.env.NODE_ENV || \'production\' })\n  }).catch(() => {});\n});',
  go: '// Go (Golang) Crash Reporter\npackage main\n\nimport (\n  "bytes"\n  "encoding/json"\n  "net/http"\n)\n\nfunc SendSnapTrace(err error, route string) {\n  payload, _ := json.Marshal(map[string]string{ "apiKey": "sk_live_your_project_key", "message": err.Error(), "environment": "production", "url": route })\n  http.Post("https://snaptrace-dashboard.vercel.app/api/v1/log", "application/json", bytes.NewBuffer(payload))\n}',
  rust: '// Rust / Axum / Actix-web\nasync fn capture_snaptrace(err: &str, route: &str) {\n    let payload = serde_json::json!({ "apiKey": "sk_live_your_project_key", "message": err, "url": route, "environment": "production" });\n    let _ = reqwest::Client::new().post("https://snaptrace-dashboard.vercel.app/api/v1/log").json(&payload).send().await;\n}',
  csharp: '// C# / ASP.NET Core\npublic static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {\n    var payload = new { apiKey = "sk_live_your_project_key", message = ex.Message, stackTrace = ex.StackTrace, url = url, environment = "production" };\n    await new HttpClient().PostAsJsonAsync("https://snaptrace-dashboard.vercel.app/api/v1/log", payload);\n}',
  php: '<?php\n// PHP / Laravel / WordPress\nset_exception_handler(function ($e) {\n    $ch = curl_init(\'https://snaptrace-dashboard.vercel.app/api/v1/log\');\n    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\'apiKey\' => \'sk_live_your_project_key\', \'message\' => $e->getMessage(), \'stackTrace\' => $e->getTraceAsString(), \'environment\' => \'production\']));\n    curl_setopt($ch, CURLOPT_HTTPHEADER, [\'Content-Type: application/json\']);\n    curl_exec($ch);\n});\n?>',
  ruby: '# Ruby on Rails / Sinatra\ndef send_snaptrace_alert(exception)\n  uri = URI(\'https://snaptrace-dashboard.vercel.app/api/v1/log\')\n  Net::HTTP.post(uri, { apiKey: \'sk_live_your_project_key\', message: exception.message, stackTrace: exception.backtrace&.join("\\n"), environment: \'production\' }.to_json, "Content-Type" => "application/json") rescue nil\nend',
  kotlin: '// Kotlin / Android / Java (OkHttp)\nfun sendSnapTrace(e: Throwable, context: String = "Android App") {\n    val json = JSONObject().apply {\n        put("apiKey", "sk_live_your_project_key")\n        put("message", e.localizedMessage ?: "Unknown Error")\n        put("environment", "production")\n        put("url", context)\n    }\n}',
  flutter: '// Flutter / Dart Crash Handler\nvoid captureSnapTrace(Object error, StackTrace stack) {\n  http.post(Uri.parse(\'https://snaptrace-dashboard.vercel.app/api/v1/log\'), headers: {\'Content-Type\': \'application/json\'}, body: jsonEncode({\'apiKey\': \'sk_live_your_project_key\', \'message\': error.toString(), \'stackTrace\': stack.toString(), \'environment\': \'production\'}));\n}',
  cloudflare: '// Cloudflare Workers / Serverless Edge\nexport default {\n  async fetch(req: Request, env: any, ctx: any) {\n    try {\n      return await handleRequest(req);\n    } catch (err: any) {\n      ctx.waitUntil(fetch(\'https://snaptrace-dashboard.vercel.app/api/v1/log\', {\n        method: \'POST\',\n        headers: { \'Content-Type\': \'application/json\' },\n        body: JSON.stringify({ apiKey: \'sk_live_your_project_key\', message: err.message, stackTrace: err.stack, environment: \'production\' })\n      }));\n      return new Response(\'Edge Execution Error\', { status: 500 });\n    }\n  }\n};'
};

/* ============================================================================
   PAGE
============================================================================ */

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<StackKey>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [copiedHeroScript, setCopiedHeroScript] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Dual mode, billing & navigation
  const [marketingMode, setMarketingMode] = useState(true);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeIdeTab, setActiveIdeTab] = useState<'cursor' | 'claude' | 'vscode'>('cursor');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Agency contact modal
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Feedback widget — opens the visitor's Gmail compose window addressed to
  // hello.snaptrace@gmail.com, with a clipboard-copy fallback for anyone
  // whose default mail app isn't Gmail. No new backend call is involved.
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const feedbackGmailUrl = () => {
    const subject = encodeURIComponent('SnapTrace feedback');
    const bodyLines = [feedbackMessage.trim(), '', feedbackName.trim() ? '- ' + feedbackName.trim() : ''].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + SUPPORT_EMAIL + '&su=' + subject + '&body=' + body;
  };

  const handleSendFeedback = () => {
    if (!feedbackMessage.trim()) return;
    window.open(feedbackGmailUrl(), '_blank', 'noopener,noreferrer');
    setFeedbackSent(true);
  };

  const handleCopyFeedback = () => {
    if (!feedbackMessage.trim()) return;
    navigator.clipboard.writeText(feedbackMessage.trim() + (feedbackName.trim() ? '\n\n- ' + feedbackName.trim() : ''));
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2200);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setTimeout(() => {
      setFeedbackMessage('');
      setFeedbackName('');
      setFeedbackSent(false);
    }, 200);
  };

  const [cliInput, setCliInput] = useState('');
  const [cliMessages, setCliMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Dev Mode active. Ask any technical question about our <5KB SDK, AI model support, cascading error collapse, or client PII masking.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marketingMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliMessages, marketingMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAgencyModal(false);
        setMobileNavOpen(false);
        setShowFeedbackModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const toggleMarketingMode = () => {
    setMarketingMode((prev) => !prev);
    setMobileNavOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Auth error:', err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkUserSession();
  }, [router]);

  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const heroScriptSnippet = '<script src="https://snaptrace-dashboard.vercel.app/snaptrace.js" data-api-key="sk_live_your_project_key" async></script>';

  const handleCopyHeroScript = () => {
    navigator.clipboard.writeText(heroScriptSnippet);
    setCopiedHeroScript(true);
    setTimeout(() => setCopiedHeroScript(false), 2000);
  };

  const handleAskCli = (question: string) => {
    if (!question.trim()) return;
    const answer = getDevBotAnswer(question);

    setCliMessages((prev) => [
      ...prev,
      { role: 'user', text: question },
      { role: 'assistant', text: answer },
    ]);
    setCliInput('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(SNIPPETS[activeQuickTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyCursorDemo = () => {
    const promptText = 'Act as an expert software engineer. Fix this runtime exception captured by SnapTrace:\nError: ReferenceError: Connection pool exhausted at 10:00:00 PM\nFile: database.js:18:11\nProvide a plain English diagnosis and the exact corrected code patch.';
    navigator.clipboard.writeText(promptText);
    setCopiedCursorPrompt(true);
    setTimeout(() => setCopiedCursorPrompt(false), 2500);
  };

  /* ------------------------------ Loading gate ------------------------------ */

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full border border-slate-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400 animate-spin" />
          </div>
          <p className="font-mono text-[11px] text-slate-500">Verifying session</p>
        </div>
      </div>
    );
  }

  /* --------------------------------- Page --------------------------------- */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05070E] font-sans text-slate-100 antialiased selection:bg-yellow-400 selection:text-slate-950">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* ========================= ANNOUNCEMENT BAR ========================= */}
      <div
        className={
          'relative z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b px-4 py-2 text-center font-mono text-[11px] transition-colors ' +
          (marketingMode
            ? 'border-yellow-400/20 bg-[linear-gradient(90deg,rgba(250,204,21,0.09),rgba(245,158,11,0.15),rgba(250,204,21,0.09))] text-yellow-100'
            : 'border-slate-800/80 bg-[#080C15] text-slate-300')
        }
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-yellow-300">
          <IconBolt className="h-3.5 w-3.5" />
          {marketingMode ? 'Early adopter launch' : 'Architecture spec'}
        </span>
        <span className="hidden text-slate-600 sm:inline">/</span>
        <span className="text-slate-300">
          {marketingMode
            ? 'Lifetime Pro access is open while beta seats last. No credit card required.'
            : 'RFC-9110 asynchronous ingestion engine active - 0ms hydration penalty - under 3.4KB gzipped'}
        </span>
        {marketingMode && (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 font-semibold text-yellow-300 underline decoration-yellow-400/40 underline-offset-4 transition hover:text-yellow-200"
          >
            Claim a seat
            <IconArrow className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* ============================== HEADER ============================== */}
      <header
        className={
          'sticky top-0 z-40 border-b transition-all duration-300 ' +
          (scrolled
            ? 'border-slate-800/90 bg-[#070B13]/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_-30px_rgba(0,0,0,1)] backdrop-blur-xl'
            : 'border-transparent bg-[#05070E]/60 backdrop-blur-md')
        }
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-6">
          <Link href="/" onClick={scrollToTop} className="flex shrink-0 items-center gap-2 rounded-md transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
            <span className="st-beta">BETA</span>
          </Link>

          <nav className="hidden items-center gap-0.5 text-[13px] font-medium text-slate-300 lg:flex">
            <div className="relative" onMouseEnter={() => setOpenDropdown('platform')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">
                Platform
                <IconChevron className={'h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ' + (openDropdown === 'platform' ? 'rotate-180' : '')} />
              </button>

              {openDropdown === 'platform' && (
                <div className="absolute left-0 top-full z-50 pt-3">
                  <div className="st-card w-[340px] rounded-xl p-2 backdrop-blur-xl">
                    <div className="px-3 pb-2 pt-2 font-mono text-[10px] tracking-[0.12em] text-slate-500">CORE CAPABILITIES</div>
                    <a href="#features" className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/[0.05]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-400/15 bg-yellow-400/10 text-yellow-300"><IconFeather /></span>
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Sub-5KB telemetry SDK</span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-400">No Core Web Vitals penalty</span>
                      </span>
                    </a>
                    <a href="#grouping" className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/[0.05]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-400/15 bg-yellow-400/10 text-yellow-300"><IconTarget /></span>
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Root-cause collapse</span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-400">Multi-crash incident grouping</span>
                      </span>
                    </a>
                    <a href="#features" className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/[0.05]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-400/15 bg-yellow-400/10 text-yellow-300"><IconLock /></span>
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Client-side PII firewall</span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-400">On-device password and card masking</span>
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" onMouseEnter={() => setOpenDropdown('ai')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-purple-200 transition hover:bg-white/[0.05] hover:text-white">
                <IconSparkle className="h-3.5 w-3.5 text-purple-300" />
                AI Copilot
                <IconChevron className={'h-3.5 w-3.5 text-purple-400/70 transition-transform duration-200 ' + (openDropdown === 'ai' ? 'rotate-180' : '')} />
              </button>

              {openDropdown === 'ai' && (
                <div className="absolute left-0 top-full z-50 pt-3">
                  <div className="st-card w-[360px] rounded-xl p-2 backdrop-blur-xl">
                    <div className="px-3 pb-2 pt-2 font-mono text-[10px] tracking-[0.12em] text-slate-500">AI CAPABILITIES</div>
                    <a href="#ai-agent" className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/[0.05]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-400/15 bg-purple-500/10 text-purple-300"><MarkCursor /></span>
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Cursor and Claude 1-click export</span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-400">Pre-formatted fix prompts for your IDE</span>
                      </span>
                    </a>
                    <a href="#byok" className="flex items-start gap-3 rounded-lg p-3 transition hover:bg-white/[0.05]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-400/15 bg-purple-500/10 text-purple-300"><IconBolt /></span>
                      <span>
                        <span className="block text-[13px] font-semibold text-white">Bring your own key diagnosis</span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-slate-400">Analyse bugs live with Gemini and OpenAI</span>
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#quickstart" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">SDK setup</a>
            <a href="#comparison" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">Why SnapTrace</a>
            <a href="#pricing" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">Pricing</a>
            <Link href="/about" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">About</Link>
            <a href="#faq" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.05] hover:text-white">FAQ</a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={toggleMarketingMode}
              title="Switch between the marketing site and the developer terminal"
              className="hidden cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-white/20 hover:text-white sm:inline-flex"
            >
              <IconTerminal className={'h-3.5 w-3.5 ' + (marketingMode ? 'text-slate-500' : 'text-emerald-400')} />
              <span className="hidden md:inline">{marketingMode ? 'Dev mode' : 'Marketing'}</span>
              <span className={'relative h-4 w-7 rounded-full transition-colors ' + (marketingMode ? 'bg-slate-700' : 'bg-emerald-500/80')}>
                <span className={'absolute top-0.5 h-3 w-3 rounded-full bg-[#05070E] transition-all ' + (marketingMode ? 'left-0.5' : 'left-3.5')} />
              </span>
            </button>

            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-[13px] font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white sm:inline-flex">
              Sign in
            </Link>

            <Link href="/demo" className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/[0.08] md:inline-flex">
              Live demo
            </Link>

            <Link
              href="/signup"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] px-4 py-2 text-[13px] font-semibold text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_22px_-12px_rgba(250,204,21,0.8)] transition hover:brightness-[1.06]"
            >
              Get started
            </Link>

            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="ml-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white lg:hidden"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {/* --------------------- Mobile full-screen navigation --------------------- */}
      <div
        data-open={mobileNavOpen ? 'true' : 'false'}
        className="st-mobile-nav fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileNavOpen}
      >
        <div className="absolute inset-0 bg-[#05070E]/97 backdrop-blur-xl" onClick={() => setMobileNavOpen(false)} />
        <div className="st-mobile-nav-panel st-safe-t relative flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-5">
            <span className="flex items-center gap-2">
              <SnapTraceLogo size="md" showText={true} />
              <span className="st-beta">BETA</span>
            </span>
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300"
            >
              <IconCross />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6">
            {[
              { href: '#features', label: 'Platform' },
              { href: '#ai-agent', label: 'AI Copilot' },
              { href: '#quickstart', label: 'SDK setup' },
              { href: '#comparison', label: 'Why SnapTrace' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
            ].map((item) => (
              <a key={item.label} href={item.href} onClick={() => setMobileNavOpen(false)} className="st-h3 border-b border-slate-800/60 py-4 text-slate-200 transition active:text-yellow-300">
                {item.label}
              </a>
            ))}
            <Link href="/about" onClick={() => setMobileNavOpen(false)} className="st-h3 border-b border-slate-800/60 py-4 text-slate-200">About</Link>
            <Link href="/demo" onClick={() => setMobileNavOpen(false)} className="st-h3 py-4 text-slate-200">Live demo</Link>
          </nav>

          <div className="st-safe-b space-y-3 border-t border-slate-800/70 px-6 pt-5">
            <button onClick={toggleMarketingMode} className={BTN_SECONDARY + ' w-full cursor-pointer'}>
              <IconTerminal className={'h-4 w-4 ' + (marketingMode ? 'text-slate-400' : 'text-emerald-400')} />
              {marketingMode ? 'Open developer terminal' : 'Back to marketing site'}
            </button>
            <div className="flex gap-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className={BTN_SECONDARY + ' flex-1'}>Sign in</Link>
              <Link href="/signup" onClick={() => setMobileNavOpen(false)} className={BTN_PRIMARY + ' flex-1'}>Get started</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================= VIEW 1: DEV TERMINAL ========================= */}
      {!marketingMode ? (
        <section className="st-grain relative min-h-[calc(100vh-6.5rem)]">
          <div className="st-grid pointer-events-none absolute inset-0" />
          <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 px-5 py-12 sm:px-6 lg:grid-cols-12 lg:py-16">
            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  marketing.js terminated - 0.0ms main thread blocking
                </span>

                <h1 className="st-display font-mono text-white">
                  No 100KB bundles.<br />
                  No 2 AM spam alerts.<br />
                  <span className="text-yellow-400">No Sunday log hunting.</span>
                </h1>
              </div>

              <div className="max-w-[54ch] space-y-3 text-[13px] leading-relaxed text-slate-400">
                <p>
                  <span className="font-semibold text-slate-200">Why we built this.</span> Legacy APMs became bloated and noisy. A single
                  database pool timeout triggers four downstream HTTP crashes, and traditional trackers spam your inbox with four separate
                  alerts you have to piece together by hand on a Sunday.
                </p>
                <p className="text-yellow-200/90">
                  SnapTrace collapses the entire outage cascade into one root cause, with a two-line AI fix ready in seconds.
                </p>
              </div>

              <div className="st-card rounded-xl p-5">
                <div className="mb-4 font-mono text-[10px] tracking-[0.12em] text-slate-500">PRODUCTION BENCHMARKS</div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-[12px]">
                  <div>
                    <dt className="text-slate-500">SDK size</dt>
                    <dd className="mt-0.5 font-semibold text-emerald-400">under 3.4KB gzipped</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Transport</dt>
                    <dd className="mt-0.5 font-semibold text-slate-200">sendBeacon (0ms)</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">PII masking</dt>
                    <dd className="mt-0.5 font-semibold text-emerald-400">Client-side regex</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">AI workflow</dt>
                    <dd className="mt-0.5 font-semibold text-purple-300">1-click Cursor / Claude</dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className={BTN_PRIMARY}>
                  Get a free beta key
                  <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link href="/demo" className={BTN_SECONDARY}>
                  <IconTerminal className="h-4 w-4 text-yellow-300" />
                  Open demo workspace
                </Link>
              </div>
            </div>

            <div className="w-full lg:col-span-7">
              <div className="overflow-hidden rounded-xl border border-emerald-500/25 bg-[#070B13] shadow-[0_0_0_1px_rgba(16,185,129,0.06),0_40px_80px_-40px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#090D16] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-3 font-mono text-[12px] text-slate-300">/snappy-cli</span>
                    <span className="font-mono text-[10px] text-slate-600">v1.0-beta</span>
                  </div>
                  <span className="hidden font-mono text-[10px] text-slate-600 sm:inline">local knowledge base</span>
                </div>

                <div className="st-scroll max-h-[340px] min-h-[240px] space-y-3 overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed">
                  {cliMessages.map((msg, idx) => (
                    <div key={idx} className={msg.role === 'user' ? 'pl-4 sm:pl-10' : ''}>
                      <div className="mb-1 text-[10px] tracking-[0.1em] text-slate-600">{msg.role === 'user' ? 'YOU' : 'SNAPPY'}</div>
                      <div
                        className={
                          'whitespace-pre-wrap rounded-lg border px-3.5 py-3 ' +
                          (msg.role === 'user'
                            ? 'border-yellow-400/20 bg-yellow-400/[0.05] text-yellow-100'
                            : 'border-slate-800 bg-[#0B101D] text-slate-300')
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="space-y-3 border-t border-slate-800/80 bg-[#090D16] px-4 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => handleAskCli('which ai models does this support?')} className={BTN_GHOST_SM + ' cursor-pointer'}>Which AI models?</button>
                    <button onClick={() => handleAskCli('which languages does this support?')} className={BTN_GHOST_SM + ' cursor-pointer'}>Supported languages?</button>
                    <button onClick={() => handleAskCli('how does cascading error collapse work?')} className={BTN_GHOST_SM + ' cursor-pointer'}>Cascading collapse?</button>
                    <button onClick={() => handleAskCli('why is the SDK under 5KB?')} className={BTN_GHOST_SM + ' cursor-pointer'}>Why under 5KB?</button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (cliInput.trim()) handleAskCli(cliInput.trim());
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-[#05070E] px-3 transition focus-within:border-emerald-500/50">
                      <span className="select-none font-mono text-[12px] text-emerald-400">$</span>
                      <input
                        type="text"
                        placeholder="Ask any technical question"
                        value={cliInput}
                        onChange={(e) => setCliInput(e.target.value)}
                        className="w-full flex-1 bg-transparent py-2.5 font-mono text-base text-slate-200 placeholder-slate-600 focus:outline-none sm:text-[12.5px]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="shrink-0 cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 font-mono text-[12px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ======================== VIEW 2: MARKETING SITE ======================== */
        <>
          {/* ------------------------------ HERO (bento) ------------------------------ */}
          <section className="st-grain relative overflow-hidden pb-14 pt-14 sm:pb-20 sm:pt-16">
            <TelemetryBeamBackground />
            <div className="st-grid pointer-events-none absolute inset-0" />
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[860px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(250,204,21,0.10),rgba(147,51,234,0.07),transparent)] blur-[90px]" />

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
              <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <a
                    href="#ai-agent"
                    className="group inline-flex items-center gap-2.5 rounded-full border border-purple-400/25 bg-purple-500/[0.08] py-1.5 pl-2 pr-4 text-[12px] text-purple-200 backdrop-blur-sm transition hover:border-purple-400/50 hover:bg-purple-500/[0.14]"
                  >
                    <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-200">New</span>
                    <span>Fix production crashes inside Cursor and Claude Code</span>
                    <IconArrow className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
                  </a>

                  <h1 className="st-display mt-6 text-white">
                    Code breaks.
                    <br />
                    <span className="bg-[linear-gradient(95deg,#FEF3C7_0%,#FACC15_40%,#F59E0B_100%)] bg-clip-text text-transparent">
                      Fix it in a snap.
                    </span>
                  </h1>

                  <p className="st-lead mt-4 max-w-[54ch] text-slate-400">
                    SnapTrace collapses cascading multi-error outages into a single root-cause incident, in under 5KB, with on-device PII
                    masking and one-click AI code fixes — so Sunday-night log hunting stops being part of your job.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/signup" className={BTN_PRIMARY}>
                      Claim lifetime Pro access
                      <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                    <Link href="/demo" className={BTN_SECONDARY}>
                      <IconTerminal className="h-4 w-4 text-yellow-300" />
                      Open demo, no signup
                    </Link>
                  </div>

                  <div className="st-card mt-8 flex items-center gap-3 rounded-xl p-2 pl-4">
                    <IconCode className="hidden h-4 w-4 shrink-0 text-yellow-400/80 sm:block" />
                    <code className="flex-1 truncate text-left font-mono text-[12px] text-slate-400">
                      &lt;script src=&quot;.../snaptrace.js&quot; data-api-key=&quot;<span className="text-yellow-300">YOUR_KEY</span>&quot; async&gt;&lt;/script&gt;
                    </code>
                    <button onClick={handleCopyHeroScript} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer'}>
                      {copiedHeroScript ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                      {copiedHeroScript ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-500" />Drop into your HTML head</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-500" />0ms main-thread delay</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-500" />Under 5KB</span>
                  </div>
                </div>

                {/* Live incident tape — decorative, illustrates the collapse engine already described below */}
                <div className="hidden lg:col-span-5 lg:block">
                  <div className="st-card overflow-hidden rounded-2xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#070B13] px-4 py-3">
                      <span className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Live incident tape
                      </span>
                      <span className="font-mono text-[10px] text-slate-600">illustrative</span>
                    </div>
                    <div className="st-fade-y h-[300px] overflow-hidden px-4 py-4">
                      <div className="st-tape-track space-y-2.5">
                        {[...TAPE_EVENTS, ...TAPE_EVENTS].map((e, i) => (
                          <div
                            key={i}
                            className={
                              'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 font-mono text-[11.5px] ' +
                              (e.tone === 'crash'
                                ? 'border-red-500/25 bg-red-950/20 text-red-200'
                                : e.tone === 'fix'
                                ? 'border-yellow-400/20 bg-yellow-400/[0.05] text-yellow-100'
                                : 'border-slate-800 bg-[#0B101D] text-slate-400')
                            }
                          >
                            <span
                              className={
                                'h-1.5 w-1.5 shrink-0 rounded-full ' +
                                (e.tone === 'crash' ? 'bg-red-400' : e.tone === 'fix' ? 'bg-yellow-400' : 'bg-emerald-400')
                              }
                            />
                            <span className="truncate">{e.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --------------------------- STACK MARQUEE --------------------------- */}
          <div className="border-y border-slate-800/70 bg-[#070B13]/60 py-5">
            <p className="mb-4 text-center font-mono text-[10px] tracking-[0.14em] text-slate-600">
              ONE REST ENDPOINT, EVERY RUNTIME YOU SHIP
            </p>
            <div className="st-fade-x overflow-hidden">
              <div className="st-marquee-track">
                {[0, 1].map((dup) => (
                  <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
                    {MARQUEE_ITEMS.map((item) => (
                      <span key={String(dup) + item} className="whitespace-nowrap font-mono text-[13px] text-slate-500 transition-colors hover:text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --------------------- ROOT-CAUSE SCANNER (#grouping) --------------------- */}
          <section id="grouping" className="st-section st-cv mx-auto max-w-6xl px-5 sm:px-6">
            <SmoothReveal className="mb-10">
              <SectionIntro
                eyebrowIcon={<IconTarget className="h-3.5 w-3.5" />}
                eyebrowLabel="Incident grouping"
                heading="Four alerts, one actual bug"
                lead="SnapTrace traces a request end to end, finds the frame that actually failed, and files everything downstream underneath it."
              />
            </SmoothReveal>

            <SmoothReveal delay={80}>
              <div className="st-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#070B13] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-3 font-mono text-[12px] text-slate-300">Live production incident scanner</span>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Tracing
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-12">
                  <ol className="relative lg:col-span-7">
                    <span className="absolute bottom-3 left-[11px] top-3 w-px bg-slate-800" aria-hidden="true" />
                    {[
                      { step: 'User submits checkout form', crash: false },
                      { step: 'Frontend dispatches POST /v1/order', crash: false },
                      { step: 'Next.js server action executes', crash: false },
                      { step: 'database.js:18 pool.connect()', crash: true },
                    ].map((row) => (
                      <li key={row.step} className="relative flex items-center gap-4 py-2">
                        <span
                          className={
                            'relative z-10 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border ' +
                            (row.crash
                              ? 'st-ring border-red-500/60 bg-red-500/15 text-red-400'
                              : 'border-slate-700 bg-[#0B101D] text-emerald-400')
                          }
                        >
                          {row.crash ? <IconCross className="h-3 w-3" /> : <IconCheck className="h-3 w-3" />}
                        </span>
                        <div
                          className={
                            'flex flex-1 items-center justify-between gap-3 rounded-lg border px-3.5 py-3 font-mono text-[12.5px] ' +
                            (row.crash ? 'border-red-500/35 bg-red-950/25 text-red-200' : 'border-slate-800 bg-[#070B13] text-slate-400')
                          }
                        >
                          <span className="truncate">{row.step}</span>
                          <span className={'shrink-0 text-[11px] font-semibold ' + (row.crash ? 'text-red-400' : 'text-emerald-500/80')}>
                            {row.crash ? 'crash origin' : '200 OK'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="lg:col-span-5">
                    <div className="h-full rounded-xl border border-yellow-400/25 bg-[linear-gradient(180deg,rgba(250,204,21,0.07),rgba(250,204,21,0))] p-5">
                      <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-yellow-300/90">
                        <IconBolt className="h-3.5 w-3.5" />
                        COLLAPSE ENGINE
                      </div>
                      <h3 className="mt-3 text-[17px] font-semibold tracking-[-0.01em] text-white">
                        Root cause: connection pool exhaustion
                      </h3>
                      <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">
                        Four downstream HTTP 500 crashes collapsed under{' '}
                        <code className="rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300">database.js</code>. The
                        client connection was never released.
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-3.5 font-mono text-[12px]">
                        <span className="text-slate-500">Patch ready</span>
                        <span className="text-emerald-400">client.release()</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SmoothReveal>
          </section>

          {/* ----------------------- FEATHERWEIGHT SDK (#features) ----------------------- */}
          <section id="features" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <SectionIntro
                    eyebrowIcon={<IconFeather className="h-3.5 w-3.5" />}
                    eyebrowLabel="Performance"
                    heading="An error tracker your users never feel"
                    lead="Legacy APMs make every visitor download 100KB+ before the page settles, delaying First Contentful Paint and dragging Lighthouse down. SnapTrace is a zero-dependency script under 5KB gzipped."
                  />

                  <div className="mt-8 space-y-2.5">
                    {[
                      { name: 'SnapTrace JS telemetry SDK', size: 'under 5 KB', width: '6%', tone: 'emerald' },
                      { name: 'Honeybadger client', size: '~35 KB', width: '34%', tone: 'slate' },
                      { name: 'Sentry browser SDK', size: '100+ KB', width: '100%', tone: 'red' },
                    ].map((row) => (
                      <div key={row.name} className="rounded-lg border border-slate-800 bg-[#0B101D] px-4 py-3">
                        <div className="flex items-center justify-between font-mono text-[12.5px]">
                          <span className={row.tone === 'emerald' ? 'text-slate-200' : 'text-slate-500'}>{row.name}</span>
                          <span
                            className={
                              'font-semibold ' +
                              (row.tone === 'emerald' ? 'text-emerald-400' : row.tone === 'red' ? 'text-red-400' : 'text-slate-400')
                            }
                          >
                            {row.size}
                          </span>
                        </div>
                        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-800/80">
                          <div
                            style={{ width: row.width }}
                            className={
                              'h-full rounded-full ' +
                              (row.tone === 'emerald' ? 'bg-emerald-400' : row.tone === 'red' ? 'bg-red-500/70' : 'bg-slate-600')
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="st-card rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-slate-500">GOOGLE LIGHTHOUSE IMPACT</span>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-emerald-400">
                        100 / 100
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-800 bg-[#070B13] p-5 text-center">
                        <div className="font-mono text-[30px] font-semibold tracking-[-0.02em] text-emerald-400">0.0ms</div>
                        <p className="mt-1 text-[11px] text-slate-500">Main thread delay</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-[#070B13] p-5 text-center">
                        <div className="font-mono text-[30px] font-semibold tracking-[-0.02em] text-emerald-400">3.4KB</div>
                        <p className="mt-1 text-[11px] text-slate-500">Total gzipped size</p>
                      </div>
                    </div>

                    <blockquote className="mt-6 border-t border-slate-800/80 pt-5 text-[13px] leading-relaxed text-slate-400">
                      We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly.
                    </blockquote>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* ------------------------ AI AGENT EXPORT (#ai-agent) ------------------------ */}
          <section id="ai-agent" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconSparkle className="h-3.5 w-3.5" />}
                  eyebrowTone="purple"
                  eyebrowLabel="AI workflow native"
                  heading="Turn a stack trace into a patch"
                  lead="Export a pre-formatted crash diagnostic straight into Cursor, Claude Code, or VS Code Copilot and let your agent write the fix locally."
                />

                <div className="mt-7 flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0B101D] p-1">
                    {([
                      { id: 'cursor', label: 'Cursor', mark: <MarkCursor className="h-3.5 w-3.5" /> },
                      { id: 'claude', label: 'Claude Code', mark: <MarkClaude className="h-3.5 w-3.5" /> },
                      { id: 'vscode', label: 'VS Code Copilot', mark: <MarkVSCode className="h-3.5 w-3.5" /> },
                    ] as const).map((ide) => (
                      <button
                        key={ide.id}
                        onClick={() => setActiveIdeTab(ide.id)}
                        className={
                          'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-medium transition ' +
                          (activeIdeTab === ide.id
                            ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'text-slate-400 hover:text-slate-200')
                        }
                      >
                        {ide.mark}
                        <span className="hidden sm:inline">{ide.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </SmoothReveal>

              <SmoothReveal delay={100} className="mx-auto mt-10 max-w-4xl">
                <div className="st-card rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-mono text-[12.5px] font-semibold text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span className="truncate">ReferenceError: Connection pool exhausted</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500">Captured at database.js:18:11</div>
                    </div>
                    <button
                      onClick={handleCopyCursorDemo}
                      className="group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-purple-400/25 bg-[linear-gradient(180deg,rgba(147,51,234,0.28),rgba(79,70,229,0.28))] px-4 py-2.5 text-[12.5px] font-semibold text-purple-100 transition hover:border-purple-400/50 hover:brightness-110 sm:self-auto"
                    >
                      {copiedCursorPrompt ? <IconCheck className="h-4 w-4 text-emerald-400" /> : <IconCopy className="h-4 w-4" />}
                      {copiedCursorPrompt
                        ? 'Prompt copied'
                        : activeIdeTab === 'cursor'
                        ? 'Copy prompt for Cursor'
                        : activeIdeTab === 'claude'
                        ? 'Copy prompt for Claude Code'
                        : 'Copy prompt for VS Code'}
                    </button>
                  </div>

                  <div className="mt-5 rounded-xl border border-purple-400/20 bg-[#070B13] p-5">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-purple-300">
                      <IconSparkle className="h-3.5 w-3.5" />
                      ROOT-CAUSE DIAGNOSIS
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
                      The PostgreSQL client in{' '}
                      <code className="rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300">database.js</code> opens
                      connections inside a tight loop without releasing them back to the pool.
                    </p>
                    <pre className="st-scroll mt-4 overflow-x-auto rounded-lg border border-slate-800 bg-[#0B101D] p-4 font-mono text-[12px] leading-relaxed text-emerald-300">
{'// Fix in database.js: release the connection back to the pool\nconst client = await pool.connect();\ntry {\n  await client.query(\'SELECT * FROM users WHERE id = $1\', [userId]);\n} finally {\n  client.release();\n}'}
                    </pre>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* ------------------------------ BYOK (#byok) ------------------------------ */}
          <section id="byok" className="st-section st-cv border-t border-slate-800/70 bg-[linear-gradient(180deg,rgba(11,16,29,0.7),rgba(5,7,14,1))]">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconUnlocked className="h-3.5 w-3.5" />}
                  eyebrowLabel="Zero platform markup"
                  heading="Bring your own key"
                  lead="Diagnose and fix runtime crashes inside your dashboard with the model you already pay for. No enterprise add-on, no vendor lock-in."
                />
              </SmoothReveal>

              <SmoothReveal delay={90} className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="st-card st-card-hover rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                      <MarkGemini className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      Free tier
                    </span>
                  </div>
                  <h3 className="st-h3 mt-5 text-white">Google Gemini</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    Runs on <span className="text-slate-200">Gemini 2.5 Flash Lite</span>. Fast root-cause explanations and copy-paste code
                    patches inside the Inspect modal, at zero cost.
                  </p>
                </div>

                <div className="st-card st-card-hover rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100">
                      <MarkOpenAI className="h-6 w-6" />
                    </span>
                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-yellow-300">
                      GPT-4o ready
                    </span>
                  </div>
                  <h3 className="st-h3 mt-5 text-white">OpenAI models</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    Paste a standard <code className="rounded bg-slate-800/70 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300">sk-...</code>{' '}
                    key to analyse deep stack traces with frontier reasoning. Stored on your device.
                  </p>
                </div>

                <div className="st-card st-card-hover rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex -space-x-2">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0B101D]">
                        <MarkClaude className="h-5 w-5" />
                      </span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0B101D]">
                        <MarkDeepSeek className="h-5 w-5" />
                      </span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0B101D] text-slate-200">
                        <MarkOllama className="h-5 w-5" />
                      </span>
                    </div>
                    <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-purple-300">
                      In pipeline
                    </span>
                  </div>
                  <h3 className="st-h3 mt-5 text-white">More models coming</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    Direct API support for <span className="text-slate-200">Claude 3.5 Sonnet</span>,{' '}
                    <span className="text-slate-200">DeepSeek R1</span>, and <span className="text-slate-200">Ollama</span> for fully private
                    local diagnostics.
                  </p>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* --------------------------- QUICKSTART (#quickstart) --------------------------- */}
          <section id="quickstart" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="mb-10">
                <SectionIntro
                  eyebrowIcon={<IconPlug className="h-3.5 w-3.5" />}
                  eyebrowLabel="Quickstart"
                  heading="Pick your stack, paste one snippet"
                  lead="Twelve drop-in integrations over one universal REST endpoint. Nothing to compile, nothing to configure."
                />
              </SmoothReveal>

              <SmoothReveal delay={80}>
                <div className="st-card overflow-hidden rounded-2xl">
                  <div className="flex flex-col gap-3 border-b border-slate-800/80 bg-[#070B13] px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="st-scroll -mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 md:pb-0">
                      {STACK_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveQuickTab(tab.id)}
                          className={
                            'cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[12px] transition ' +
                            (activeQuickTab === tab.id
                              ? 'bg-yellow-400/10 text-yellow-300 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.25)]'
                              : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200')
                          }
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleCopyCode} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer self-start md:self-auto'}>
                      {copiedSnippet ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                      {copiedSnippet ? 'Copied' : 'Copy snippet'}
                    </button>
                  </div>

                  <div className="st-scroll overflow-x-auto bg-[#070B13] p-5 sm:p-6">
                    <pre className="select-text font-mono text-[12.5px] leading-[1.7] text-slate-300">
                      <code>{SNIPPETS[activeQuickTab]}</code>
                    </pre>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* --------------------------- COMPARISON (#comparison) --------------------------- */}
          <section id="comparison" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="mb-10">
                <SectionIntro
                  center
                  eyebrowIcon={<IconLayers className="h-3.5 w-3.5" />}
                  eyebrowLabel="Comparison"
                  heading="Why developers switch"
                  lead="Built to replace bloated, noisy enterprise APMs."
                />
              </SmoothReveal>

              {/* Desktop / tablet: full comparison table */}
              <SmoothReveal delay={90} className="hidden md:block">
                <div className="st-card st-scroll overflow-x-auto rounded-2xl">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#070B13]">
                        <th className="px-5 py-4 font-mono text-[11px] font-medium tracking-[0.1em] text-slate-500">FEATURE</th>
                        <th className="px-5 py-4 text-[13px] font-semibold text-yellow-300">
                          <span className="inline-flex items-center gap-1.5">
                            <IconBolt className="h-3.5 w-3.5" />
                            SnapTrace
                          </span>
                        </th>
                        <th className="px-5 py-4 text-[13px] font-medium text-slate-400">Sentry</th>
                        <th className="px-5 py-4 text-[13px] font-medium text-slate-400">GlitchTip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {COMPARISON_ROWS.map((row) => (
                        <tr key={row.f} className="transition-colors hover:bg-white/[0.015]">
                          <td className="px-5 py-4 text-[13px] font-medium text-white">{row.f}</td>
                          <td className="bg-yellow-400/[0.03] px-5 py-4 font-mono text-[12.5px] font-semibold text-emerald-400">
                            <span className="inline-flex items-center gap-2">
                              <IconCheck className="h-3.5 w-3.5 shrink-0" />
                              {row.st}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[12.5px] text-slate-500">{row.sentry}</td>
                          <td className="px-5 py-4 font-mono text-[12.5px] text-slate-500">{row.glitch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SmoothReveal>

              {/* Mobile: comparison as stacked cards — a real mobile layout, not a shrunk table */}
              <SmoothReveal delay={90} className="space-y-3 md:hidden">
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.f} className="st-card rounded-xl p-4">
                    <div className="text-[13px] font-medium text-white">{row.f}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                      <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/[0.06] px-2 py-2">
                        <div className="text-[9px] uppercase tracking-wide text-yellow-400/80">SnapTrace</div>
                        <div className="mt-1 font-semibold text-emerald-400">{row.st}</div>
                      </div>
                      <div className="rounded-lg border border-slate-800 px-2 py-2">
                        <div className="text-[9px] uppercase tracking-wide text-slate-600">Sentry</div>
                        <div className="mt-1 text-slate-400">{row.sentry}</div>
                      </div>
                      <div className="rounded-lg border border-slate-800 px-2 py-2">
                        <div className="text-[9px] uppercase tracking-wide text-slate-600">GlitchTip</div>
                        <div className="mt-1 text-slate-400">{row.glitch}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </SmoothReveal>
            </div>
          </section>

          {/* ------------------------ SOCIAL PROOF (#social-proof) ------------------------ */}
          <section id="social-proof" className="st-section st-cv border-t border-slate-800/70">
            <SmoothReveal className="mx-auto max-w-3xl px-5 sm:px-6">
              <figure>
                <svg viewBox="0 0 24 24" className="mb-6 h-8 w-8 text-yellow-400/25" fill="currentColor" aria-hidden="true">
                  <path d="M9.6 5.2C6.3 6.8 4.4 9.6 4.4 13v5.8h6.5V13H8.2c0-2.3.9-3.9 2.9-4.9l-1.5-2.9Zm9.5 0c-3.3 1.6-5.2 4.4-5.2 7.8v5.8h6.5V13h-2.7c0-2.3.9-3.9 2.9-4.9l-1.5-2.9Z" />
                </svg>
                <blockquote className="text-[18px] leading-[1.6] tracking-[-0.01em] text-slate-200 sm:text-[21px]">
                  5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at
                  all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If
                  SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.
                </blockquote>
                <figcaption className="mt-7 flex items-center gap-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-400/25 bg-yellow-400/10 font-mono text-[13px] font-semibold text-yellow-300">
                    EB
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-white">Eusebiu Balan</span>
                    <span className="block font-mono text-[11.5px] text-slate-500">Senior full-stack engineer, via Dev.to</span>
                  </span>
                </figcaption>
              </figure>
            </SmoothReveal>
          </section>

          {/* ------------------------------ PRICING (#pricing) ------------------------------ */}
          <section id="pricing" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconLayers className="h-3.5 w-3.5" />}
                  eyebrowLabel="Pricing"
                  heading="Simple, developer-first plans"
                  lead="No surprise overage bills. Generous headroom for solo builders and client studios."
                />

                <div className="mt-7 flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0B101D] p-1">
                    <button
                      onClick={() => setBillingInterval('monthly')}
                      className={
                        'cursor-pointer rounded-lg px-4 py-2 text-[12.5px] font-semibold transition ' +
                        (billingInterval === 'monthly'
                          ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                          : 'text-slate-400 hover:text-slate-200')
                      }
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('annual')}
                      className={
                        'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition ' +
                        (billingInterval === 'annual'
                          ? 'bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] text-slate-950'
                          : 'text-slate-400 hover:text-yellow-300')
                      }
                    >
                      Annual
                      <span
                        className={
                          'rounded-md px-1.5 py-0.5 font-mono text-[10px] ' +
                          (billingInterval === 'annual' ? 'bg-slate-950/80 text-yellow-300' : 'bg-slate-800 text-slate-400')
                        }
                      >
                        Save 20%
                      </span>
                    </button>
                  </div>
                </div>

                {billingInterval === 'annual' && (
                  <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11.5px] text-emerald-400">
                    <IconCheck className="h-3.5 w-3.5" />
                    Billed annually, two months free
                  </p>
                )}
              </SmoothReveal>

              <SmoothReveal delay={100} className="mt-12 grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
                <div className="st-card st-card-hover flex flex-col justify-between rounded-2xl p-7">
                  <div>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-slate-500">DEVELOPER FREE</span>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-[38px] font-semibold tracking-[-0.03em] text-white">$0</span>
                      <span className="font-mono text-[12px] text-slate-500">/ month</span>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-400">For side projects and personal experiments.</p>

                    <ul className="mt-7 space-y-3 border-t border-slate-800/80 pt-6 text-[13px] text-slate-300">
                      {[
                        '2,000 events / month',
                        '7-day data retention',
                        '1 active project',
                        'Sub-5KB SDK, 0ms main-thread delay',
                        'In-dashboard error inspection',
                        'Client-side regex PII firewall',
                        'Email and in-app alerts (no webhooks)',
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/signup" className={BTN_SECONDARY + ' mt-8 w-full'}>
                    Start free forever
                  </Link>
                </div>

                <div className="st-glow-amber relative flex flex-col justify-between rounded-2xl border border-yellow-400/40 bg-[linear-gradient(180deg,rgba(250,204,21,0.055),rgba(11,16,29,1)_45%)] p-7 lg:-translate-y-3">
                  <span className="absolute -top-3 left-7 rounded-full bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] px-3 py-1 font-mono text-[10px] font-bold tracking-[0.06em] text-slate-950">
                    POPULAR FOR SOLO DEVS
                  </span>

                  <div>
                    <span className="font-mono text-[11px] tracking-[0.1em] text-yellow-400">PRO BUILDER</span>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-[38px] font-semibold tracking-[-0.03em] text-white">
                        {billingInterval === 'annual' ? '$15' : '$19'}
                      </span>
                      <span className="font-mono text-[12px] text-slate-400">/ month</span>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-400">
                      {billingInterval === 'annual' ? 'Billed annually at $180/yr.' : 'For solo developers, freelancers and micro-SaaS.'}
                    </p>

                    <ul className="mt-7 space-y-3 border-t border-slate-800/80 pt-6 text-[13px] text-slate-200">
                      {[
                        '75,000 events / month',
                        '30-day telemetry retention',
                        'Up to 5 active projects',
                        'Instant Discord, Slack and Telegram alerts',
                        '1-click Cursor and Claude fix prompts',
                        '60s loop deduplication ([x50] noise throttling)',
                        'In-dashboard BYOK AI copilot',
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/signup" className={BTN_PRIMARY + ' mt-8 w-full'}>
                    Claim Pro beta pass
                    <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="st-card st-card-hover flex flex-col justify-between rounded-2xl p-7">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-purple-300">AGENCY STUDIO</span>
                      <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-purple-300">
                        Built for agencies
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-[38px] font-semibold tracking-[-0.03em] text-white">
                        {billingInterval === 'annual' ? '$39' : '$49'}
                      </span>
                      <span className="font-mono text-[12px] text-slate-500">/ month</span>
                    </div>
                    <p className="mt-2 text-[13px] text-slate-400">
                      {billingInterval === 'annual' ? 'Billed annually at $468/yr.' : 'For studios and agencies running multiple client sites.'}
                    </p>

                    <ul className="mt-7 space-y-3 border-t border-slate-800/80 pt-6 text-[13px] text-slate-300">
                      {[
                        '500,000 events / month',
                        '90-day telemetry retention',
                        'Unlimited client projects and keys',
                        'Multi-seat team and client invites',
                        'Cascading multi-error outage collapse',
                        'Priority edge ingestion gateways',
                        'Raw log CSV / JSON export',
                      ].map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button type="button" onClick={() => setShowAgencyModal(true)} className={BTN_SECONDARY + ' mt-8 w-full cursor-pointer'}>
                    Request agency access
                  </button>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* ----------------------------- SECURITY BADGES ----------------------------- */}
          <section className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="mx-auto max-w-2xl text-center">
                <h2 className="st-h2 text-white">Built for developer privacy and performance</h2>
              </SmoothReveal>

              <SmoothReveal delay={80} className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  { icon: <IconShield />, title: 'GDPR ready', sub: 'On-device PII masking' },
                  { icon: <IconFeather />, title: 'Under 5KB', sub: '100/100 Core Web Vitals' },
                  { icon: <IconMute />, title: 'Anti-noise guard', sub: 'SHA-256 loop throttling' },
                  { icon: <IconUnlocked />, title: 'No vendor lock-in', sub: 'Universal REST protocol' },
                ].map((b) => (
                  <div key={b.title} className="st-card st-card-hover rounded-xl p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-400/15 bg-yellow-400/[0.07] text-yellow-300">
                      {b.icon}
                    </span>
                    <div className="mt-4 text-[13.5px] font-semibold text-white">{b.title}</div>
                    <div className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{b.sub}</div>
                  </div>
                ))}
              </SmoothReveal>
            </div>
          </section>

          {/* --------------------------------- FAQ (#faq) --------------------------------- */}
          <section id="faq" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-3xl px-5 sm:px-6">
              <SmoothReveal className="mb-10">
                <h2 className="st-h2 text-white">Frequently asked questions</h2>
                <p className="st-lead mt-3 text-slate-400">Real technical answers for developers evaluating SnapTrace.</p>
              </SmoothReveal>

              <SmoothReveal delay={80} className="divide-y divide-slate-800/80 border-y border-slate-800/80">
                {FAQS.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="group flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left transition"
                      >
                        <span className={'text-[15px] font-medium leading-snug transition-colors ' + (isOpen ? 'text-yellow-300' : 'text-white group-hover:text-yellow-200')}>
                          {faq.q}
                        </span>
                        <span className={'mt-0.5 shrink-0 text-slate-500 transition-transform duration-300 ' + (isOpen ? 'rotate-180 text-yellow-400' : '')}>
                          <IconChevron className="h-4 w-4" />
                        </span>
                      </button>
                      <div className="st-accordion" data-open={isOpen ? 'true' : 'false'}>
                        <div>
                          <p className="pb-6 pr-10 text-[14px] leading-relaxed text-slate-400">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </SmoothReveal>
            </div>
          </section>

          {/* ---------------------------------- FOOTER ---------------------------------- */}
          <footer className="relative overflow-hidden border-t border-slate-800/70 bg-[#060911] pb-28 pt-16 sm:pb-10 sm:pt-20">
            <div className="pointer-events-none absolute -bottom-52 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(250,204,21,0.08),transparent)] blur-[90px]" />

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
              <div className="mx-auto max-w-xl text-center">
                <h2 className="st-h2 text-white">Ready to catch bugs in a snap?</h2>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-400">
                  Join developers catching crashes in real time, with zero noise and instant AI diagnoses.
                </p>
                <div className="mt-7">
                  <Link href="/signup" className={BTN_PRIMARY}>
                    Claim your free beta pass
                    <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-slate-800/80 pt-12 md:grid-cols-4">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500">COMPANY</span>
                  <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
                    <li><Link href="/about" className="transition hover:text-white">About SnapTrace</Link></li>
                    <li><a href="#features" className="transition hover:text-white">Engineering blog</a></li>
                    <li><a href="#ai-agent" className="transition hover:text-white">Careers</a></li>
                    <li><a href={'mailto:' + SUPPORT_EMAIL} className="text-yellow-300 transition hover:text-yellow-200">Contact support</a></li>
                    <li><Link href="/privacy" className="transition hover:text-white">Trust and security</Link></li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500">PLATFORM</span>
                  <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
                    <li><a href="#features" className="transition hover:text-white">Telemetry ingestion</a></li>
                    <li><a href="#features" className="transition hover:text-white">Sub-5KB client SDK</a></li>
                    <li><a href="#ai-agent" className="transition hover:text-white">AI root-cause engine</a></li>
                    <li><a href="#features" className="transition hover:text-white">Client-side PII firewall</a></li>
                    <li><a href="#features" className="transition hover:text-white">60s loop throttling</a></li>
                    <li><Link href="/dashboard" className="transition hover:text-white">Realtime WebSockets</Link></li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500">SOLUTIONS</span>
                  <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
                    <li><a href="#quickstart" className="transition hover:text-white">Next.js App Router</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Python and FastAPI</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Node.js / Express</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Go, Rust and PHP</a></li>
                    <li><a href="#pricing" className="transition hover:text-white">Micro-SaaS and startups</a></li>
                    <li><a href="#pricing" className="transition hover:text-white">Agencies and studios</a></li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-slate-500">GET HELP</span>
                  <ul className="mt-4 space-y-2.5 text-[13px] text-slate-400">
                    <li>
                      <a href={'mailto:' + SUPPORT_EMAIL} className="block truncate font-medium text-yellow-300 transition hover:text-yellow-200">
                        {SUPPORT_EMAIL}
                      </a>
                    </li>
                    <li>
                      <button type="button" onClick={() => setShowFeedbackModal(true)} className="cursor-pointer text-left transition hover:text-white">
                        Send feedback
                      </button>
                    </li>
                    <li><a href="#quickstart" className="transition hover:text-white">SDK documentation</a></li>
                    <li><Link href="/demo" className="transition hover:text-white">Public demo</Link></li>
                    <li><Link href="/test" className="transition hover:text-white">Live test sandbox</Link></li>
                    <li>
                      <span className="inline-flex items-center gap-2 text-emerald-400">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        </span>
                        Systems operational
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-14 overflow-hidden text-slate-800">
                <svg className="h-3 w-full" viewBox="0 0 1200 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M0 6 Q 30 0, 60 6 T 120 6 T 180 6 T 240 6 T 300 6 T 360 6 T 420 6 T 480 6 T 540 6 T 600 6 T 660 6 T 720 6 T 780 6 T 840 6 T 900 6 T 960 6 T 1020 6 T 1080 6 T 1140 6 T 1200 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="mt-8 flex flex-col items-center justify-between gap-5 text-[12px] text-slate-500 md:flex-row">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <Link href="/terms" className="transition hover:text-yellow-300">Terms</Link>
                  <Link href="/privacy" className="transition hover:text-yellow-300">Security and compliance</Link>
                  <Link href="/privacy" className="transition hover:text-yellow-300">Privacy</Link>
                  <Link href="/about" className="transition hover:text-yellow-300">About</Link>
                </div>

                <div className="flex items-center gap-1">
                  {[
                    { href: 'https://x.com', label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                    { href: 'https://github.com', label: 'GitHub', path: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z' },
                    { href: 'https://linkedin.com', label: 'LinkedIn', path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z' },
                    { href: 'https://discord.com', label: 'Discord', path: 'M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.path} /></svg>
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-slate-900 pt-6 text-center font-mono text-[11px] text-slate-600">
                © {new Date().getFullYear()} SnapTrace, the modern developer telemetry platform.
              </div>
            </div>
          </footer>

          {/* --------- Mobile-only sticky bottom CTA — a real mobile app affordance --------- */}
          <div className="st-safe-b fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/80 bg-[#070B13]/95 px-4 pt-3 backdrop-blur-xl sm:hidden">
            <Link href="/signup" className={BTN_PRIMARY + ' w-full'}>
              Get started free
              <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        </>
      )}

      {/* ========================== FEEDBACK FAB + MODAL ========================== */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        aria-label="Send feedback"
        className={
          'fixed right-5 z-40 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#0B101D]/95 text-yellow-300 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.9)] backdrop-blur-xl transition hover:border-yellow-400/40 hover:text-yellow-200 ' +
          (marketingMode ? 'bottom-24 sm:bottom-6' : 'bottom-6')
        }
      >
        <IconMessage className="h-5 w-5" />
      </button>

      {showFeedbackModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) closeFeedbackModal();
          }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-4"
        >
          <div className="st-card st-safe-b w-full max-w-md rounded-t-2xl border-yellow-400/20 p-6 sm:rounded-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 font-mono text-[10px] font-semibold text-yellow-300">
                <IconMessage className="h-3 w-3" />
                Feedback
              </span>
              <button
                onClick={closeFeedbackModal}
                aria-label="Close"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <IconCross className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.015em] text-white">What's on your mind?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              Bug, feature idea, or just a thought — it goes straight to {SUPPORT_EMAIL}.
            </p>

            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Tell us what happened, or what you'd like to see..."
              rows={4}
              className="mt-5 w-full resize-none rounded-xl border border-slate-800 bg-[#05070E] p-3.5 text-base text-slate-200 placeholder-slate-600 transition focus:border-yellow-400/40 focus:outline-none sm:text-[13px]"
            />
            <input
              type="text"
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
              placeholder="Name or email (optional)"
              className="mt-2.5 w-full rounded-xl border border-slate-800 bg-[#05070E] p-3.5 text-base text-slate-200 placeholder-slate-600 transition focus:border-yellow-400/40 focus:outline-none sm:text-[13px]"
            />

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={!feedbackMessage.trim()}
                className={BTN_PRIMARY + ' w-full disabled:cursor-not-allowed disabled:opacity-40'}
              >
                <IconMail className="h-4 w-4" />
                {feedbackSent ? 'Opened in Gmail — send when ready' : 'Send via Gmail'}
              </button>
              <button
                type="button"
                onClick={handleCopyFeedback}
                disabled={!feedbackMessage.trim()}
                className={BTN_GHOST_SM + ' w-full cursor-pointer py-2.5 disabled:cursor-not-allowed disabled:opacity-40'}
              >
                {copiedFeedback ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                {copiedFeedback ? 'Copied' : 'Copy message instead'}
              </button>
            </div>

            <p className="mt-4 text-center font-mono text-[10.5px] text-slate-600">
              Opens a pre-filled Gmail compose window addressed to {SUPPORT_EMAIL}.
            </p>
          </div>
        </div>
      )}

      {/* ========================== AGENCY STUDIO MODAL ========================== */}
      {showAgencyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAgencyModal(false);
          }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        >
          <div className="st-card relative w-full max-w-md rounded-2xl border-purple-400/25 p-7">
            <button
              onClick={() => setShowAgencyModal(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
            >
              <IconCross className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-semibold text-purple-300">
              <IconBolt className="h-3 w-3" />
              Agency Studio, $49/mo
            </span>

            <h3 className="mt-4 text-[19px] font-semibold tracking-[-0.015em] text-white">Request Agency Studio access</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">
              For studios and software agencies running multiple client projects (
              <span className="text-slate-200">500,000 events/mo and unlimited projects</span>), contact our engineering desk for immediate
              activation.
            </p>

            <div className="mt-6 rounded-xl border border-slate-800 bg-[#05070E] p-4">
              <span className="font-mono text-[10px] tracking-[0.12em] text-slate-500">FOUNDER AND ENGINEERING DESK</span>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="truncate font-mono text-[13.5px] font-semibold text-yellow-300">{SUPPORT_EMAIL}</span>
                <button type="button" onClick={handleCopyEmail} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer'}>
                  {copiedEmail ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                  {copiedEmail ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <a
                href={'https://mail.google.com/mail/?view=cm&fs=1&to=' + SUPPORT_EMAIL + '&su=SnapTrace%20Agency%20Studio%20Plan%20Inquiry'}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN_PRIMARY + ' w-full'}
              >
                Compose in Gmail
                <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-full cursor-pointer rounded-lg px-5 py-2.5 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="mt-5 text-center font-mono text-[11px] text-slate-500">
              Direct activation from our lead engineer within 24 hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}