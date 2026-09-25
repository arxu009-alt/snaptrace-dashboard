'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';
import TelemetryBeamBackground from '@/components/TelemetryBeamBackground';

export const dynamic = 'force-dynamic';

type StackKey = 'nextjs' | 'js' | 'python' | 'node' | 'go' | 'rust' | 'csharp' | 'php' | 'ruby' | 'kotlin' | 'flutter' | 'cloudflare';
type BillingInterval = 'monthly' | 'annual';
type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'general';
type TriageTab = 'stack' | 'timeline' | 'pii' | 'aifix';
type IconProps = { className?: string };

const SUPPORT_EMAIL = 'hello.snaptrace@gmail.com';

const GLOBAL_CSS = `
html {
  overflow-x: hidden;
  max-width: 100%;
  width: 100%;
  scroll-behavior: smooth;
  scroll-padding-top: 100px;
  box-sizing: border-box;
}
body {
  overflow-x: hidden;
  max-width: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
}
section[id] {
  scroll-margin-top: 100px;
}
.st-display { font-size: clamp(2.35rem, 1.15rem + 5vw, 4.75rem); line-height: 1.04; letter-spacing: -0.035em; font-weight: 700; }
.st-h2 { font-size: clamp(1.65rem, 1.1rem + 2vw, 2.5rem); line-height: 1.14; letter-spacing: -0.025em; font-weight: 700; }
.st-h3 { font-size: clamp(1.08rem, 0.96rem + 0.45vw, 1.25rem); line-height: 1.3; letter-spacing: -0.015em; font-weight: 600; }
.st-lead { font-size: clamp(0.95rem, 0.88rem + 0.25vw, 1.05rem); line-height: 1.65; }
.st-section { padding-top: clamp(2.75rem, 2rem + 2vw, 4.5rem); padding-bottom: clamp(2.75rem, 2rem + 2vw, 4.5rem); }
.st-intro > * + * { margin-top: 0.75rem; }
.st-intro .st-eyebrow-row + .st-h2 { margin-top: 0.9rem; }
button, a { touch-action: manipulation; }
.st-grain { position: relative; }
.st-grid {
  background-image:
    linear-gradient(to right, rgba(148,163,184,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148,163,184,0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 35%, transparent 80%);
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 35%, transparent 80%);
}
.st-cv { } { content-visibility: auto; contain-intrinsic-size: 1px 780px; }
.st-card {
  background: linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.005) 100%), #0A0E1A;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 1px 0 rgba(255,255,255,0.06), 0 24px 50px -20px rgba(0,0,0,0.85);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
@media (hover: hover) {
  .st-card-hover:hover {
    border-color: rgba(113,113,122,0.6);
    box-shadow: inset 0 1px 1px 0 rgba(255,255,255,0.08), 0 24px 55px -20px rgba(0,0,0,0.9);
    transform: translateY(-2px);
  }
}
.st-glow-amber {
  box-shadow: 0 0 0 1px rgba(250,204,21,0.3), 0 30px 70px -30px rgba(250,204,21,0.35), inset 0 1px 1px rgba(255,255,255,0.15);
}
.st-window-topbar {
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%), #080C16;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.st-marquee-track { display: flex; width: max-content; animation: st-marquee 42s linear infinite; }
@keyframes st-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.st-fade-x {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent);
}
.st-ring { position: relative; }
.st-ring::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 1px solid rgba(239,68,68,0.65);
  animation: st-ring 2.2s cubic-bezier(0.2,0.7,0.3,1) infinite;
}
@keyframes st-ring { 0% { transform: scale(0.85); opacity: 0.9; } 70%, 100% { transform: scale(1.7); opacity: 0; } }
.st-accordion { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(0.4,0,0.2,1); }
.st-accordion[data-open='true'] { grid-template-rows: 1fr; }
.st-accordion > div { overflow: hidden; }
.st-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.st-scroll::-webkit-scrollbar-track { background: transparent; }
.st-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.2); border-radius: 999px; }
.st-beta-pill {
  font: 700 9.5px/1 ui-monospace, monospace;
  letter-spacing: 0.08em;
  padding: 3px 6px;
  border-radius: 6px;
  color: #FDE68A;
  border: 1px solid rgba(250,204,21,0.4);
  background: rgba(250,204,21,0.1);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 0 12px rgba(250,204,21,0.2);
}
.st-mobile-nav { transition: opacity .22s ease, visibility .22s ease; }
.st-mobile-nav[data-open='false'] { opacity: 0; visibility: hidden; pointer-events: none; }
.st-mobile-nav[data-open='true'] { opacity: 1; visibility: visible; }
.st-safe-b { padding-bottom: max(0.85rem, env(safe-area-inset-bottom)); }
.st-safe-t { padding-top: env(safe-area-inset-top); }
@media (prefers-reduced-motion: reduce) {
  .st-marquee-track { animation: none; }
  .st-ring::before { animation: none; opacity: 0; }
}
`;

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

const MarkGemini = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="st-gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1A73E8" />
        <stop offset="35%" stopColor="#6C5CE7" />
        <stop offset="70%" stopColor="#E056FD" />
        <stop offset="100%" stopColor="#F9CA24" />
      </linearGradient>
    </defs>
    <path d="M12 2C12 2 12.8 7.5 16.5 10.5C19.5 12.8 22 12 22 12C22 12 19.5 13.2 16.5 15.5C12.8 18.5 12 22 12 22C12 22 11.2 18.5 7.5 15.5C4.5 13.2 2 12 2 12C2 12 4.5 10.8 7.5 10.5C11.2 7.5 12 2 12 2Z" fill="url(#st-gemini-grad)" />
  </svg>
);

const MarkOpenAI = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const MarkClaude = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 19L12 5L19 19M8.5 14.5H15.5M12 5V19" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1.3" fill="#FBBF24" />
  </svg>
);

const MarkDeepSeek = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="st-deepseek-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0D6EFD" />
        <stop offset="50%" stopColor="#0099FF" />
        <stop offset="100%" stopColor="#00F0FF" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="#051329" stroke="#0D6EFD" strokeWidth="1.5" strokeOpacity="0.45" />
    <path d="M7.5 21C9 16 12 11 17.5 10C21.5 9.5 24 11.5 24 14.5C24 17.5 21 20 17 20.5C13 21 10 22.5 7.5 24.5" stroke="url(#st-deepseek-grad)" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="20" cy="14" r="1.8" fill="#00F0FF" />
  </svg>
);

const MarkOllama = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="12.5" rx="5.5" ry="7" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="10" cy="10.5" r="1" fill="currentColor" />
    <circle cx="14" cy="10.5" r="1" fill="currentColor" />
    <path d="M10 16C10 16 11 17 12 17C13 17 14 16 14 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M8 5.5L9.5 8.5M16 5.5L14.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

const BTN_PRIMARY =
  'group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-bold tracking-[-0.01em] text-slate-950 ' +
  'bg-[linear-gradient(180deg,#FDE68A_0%,#FACC15_46%,#EAB308_100%)] ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_12px_30px_-10px_rgba(250,204,21,0.85)] ' +
  'transition-all duration-200 active:scale-[0.98] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070E] ' +
  'hover:-translate-y-0.5 hover:brightness-[1.05]';

const BTN_SECONDARY =
  'group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold tracking-[-0.01em] text-slate-100 ' +
  'border border-white/10 bg-white/[0.04] backdrop-blur-md ' +
  'transition-all duration-200 active:scale-[0.98] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ' +
  'hover:-translate-y-0.5 hover:bg-white/[0.08] hover:border-white/20';

const BTN_GHOST_SM =
  'inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-slate-300 ' +
  'transition hover:bg-white/[0.08] hover:text-white active:scale-[0.98] focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30';

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
        'transform-gpu transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ' +
        (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  );
}

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
  const tones = {
    amber: 'text-yellow-300/95 border-yellow-400/30 bg-yellow-400/[0.08]',
    purple: 'text-purple-300/95 border-purple-400/30 bg-purple-500/[0.1]',
    emerald: 'text-emerald-300/95 border-emerald-400/30 bg-emerald-500/[0.08]',
  };
  return (
    <div className={'st-intro ' + (center ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl') + (className ? ' ' + className : '')}>
      <span className={'st-eyebrow-row inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-[11px] font-semibold ' + tones[eyebrowTone]}>
        {eyebrowIcon}
        {eyebrowLabel}
      </span>
      <h2 className="st-h2 text-white">{heading}</h2>
      {lead && <p className="st-lead text-slate-400">{lead}</p>}
    </div>
  );
}

/* ============================================================================
   TOP-LEVEL CONSTANTS & AI BOT ENGINE
============================================================================ */

function getDevBotAnswer(prompt: string): string {
  const p = (prompt || '').toLowerCase();
  if (p.includes('ai') || p.includes('model') || p.includes('gemini') || p.includes('gpt')) {
    return 'SnapTrace natively integrates with Google Gemini 2.5 Flash Lite and OpenAI (gpt-4o, gpt-4o-mini) via BYOK, with Claude 3.5 Sonnet, DeepSeek V3/R1, and local Ollama in active development. Keys are stored encrypted in client memory.';
  }
  if (p.includes('lang') || p.includes('stack') || p.includes('framework') || p.includes('support')) {
    return 'SnapTrace supports 12+ environments over a universal REST endpoint: Next.js App Router, React, Vue, Node.js, Python, FastAPI, Django, Go, Rust, C# (.NET), PHP, Ruby, Kotlin, Flutter, and Cloudflare Workers.';
  }
  if (p.includes('cascade') || p.includes('group') || p.includes('outage') || p.includes('collapse')) {
    return 'SnapTrace uses deterministic SHA-256 fingerprinting to isolate single root causes from downstream symptom cascades, collapsing hundreds of duplicate alerts into one clean incident with an instant AI fix prompt.';
  }
  if (p.includes('5kb') || p.includes('size') || p.includes('weight') || p.includes('bundle') || p.includes('3.4kb')) {
    return 'The client SDK is strictly under 3.4KB gzipped with zero dependencies. It dispatches telemetry asynchronously using native navigator.sendBeacon, guaranteeing 0.0ms main thread delay and zero impact on Google Core Web Vitals.';
  }
  if (p.includes('pii') || p.includes('privacy') || p.includes('security') || p.includes('gdpr')) {
    return 'Our on-device regex AST engine automatically scrubs emails, credit cards, passwords, bearer tokens, and secrets in the browser before the payload touches the network. Raw secrets never reach our servers.';
  }
  if (p.includes('price') || p.includes('cost') || p.includes('plan') || p.includes('tier')) {
    return 'We offer Developer Free (2,000 events/mo, 1 project), Pro Builder ($19/mo, 75k events, 5 projects, Discord/Slack alerts, Cursor AI fixes), and Agency Studio ($49/mo, 500k events, unlimited projects). Early beta passes are currently available.';
  }
  return 'SnapTrace is a featherweight, noise-free crash telemetry platform. It runs asynchronously on navigator.sendBeacon (<3.4KB gzipped) and exports 1-click AI prompts for Cursor, Claude Code, and Copilot.';
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

const MARQUEE_ITEMS: string[] = [
  'Next.js', 'React', 'Vue', 'Svelte', 'Vite', 'Node.js', 'Express', 'NestJS',
  'Python', 'FastAPI', 'Django', 'Go', 'Rust', 'Axum', 'PHP', 'Laravel',
  'WordPress', 'C# .NET', 'Ruby on Rails', 'Kotlin', 'Flutter', 'Cloudflare Workers', 'cURL',
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How does SnapTrace collapse cascading multi-error outages?',
    a: 'During an outage, a single database connection drop often triggers 4 or 5 different downstream errors (auth fails, queries fail, UI renders fail). Instead of sending 5 separate noisy alerts that you have to piece together manually on a Sunday, SnapTrace groups cascading failures using deterministic SHA-256 fingerprinting and isolates the single root cause with an instant AI fix.',
  },
  {
    q: 'Do I need to keep the SnapTrace website open to receive alerts?',
    a: 'No! The SnapTrace SDK runs silently inside your live application. When an unhandled crash happens in production, SnapTrace automatically pings your configured Discord channel, Slack room, and Gmail inbox in milliseconds.',
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

const COMPARISON_ROWS: Array<{ f: string; st: string; sentry: string; glitch: string }> = [
  { f: 'SDK bundle weight', st: '<3.4 KB (Featherweight)', sentry: '~100 KB+', glitch: '~100 KB+' },
  { f: 'Cascading outage collapse', st: '✓ 1 unified root incident', sentry: '5 separate alert storms', glitch: '✕ None' },
  { f: 'Free tier events', st: '2,000 / month', sentry: '5,000 / month', glitch: '1,000 / month' },
  { f: 'Client-side PII scrubbing', st: '✓ Native regex AST on-device', sentry: 'Complex server rules', glitch: '✕ None' },
  { f: 'In-dashboard BYOK AI diagnostics', st: '✓ Free in Pro ($0 markup)', sentry: '$$$ Expensive add-on', glitch: '✕ None' },
  { f: '1-click prompt export for Cursor', st: '✓ Free forever', sentry: '✕ Manual copy', glitch: '✕ Manual copy' },
];

const SNIPPETS: Record<StackKey, string> = {
  nextjs: '// app/layout.tsx (Next.js App Router)\nimport Script from \'next/script\';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <head>\n        <Script\n          src="https://snaptrace.space/snaptrace.js"\n          strategy="beforeInteractive"\n          data-api-key="sk_live_your_project_key"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}',
  js: '<!-- React, Vue, Svelte, or Vanilla JavaScript -->\n<script \n  src="https://snaptrace.space/snaptrace.js"\n  data-api-key="sk_live_your_project_key"\n  async\n></script>',
  python: '# Python / Django / FastAPI / Flask\nimport traceback, requests\n\ndef log_to_snaptrace(exception, url="https://api.mycompany.com"):\n    try:\n        requests.post("https://snaptrace.space/api/v1/log", json={\n            "apiKey": "sk_live_your_project_key",\n            "message": str(exception),\n            "stackTrace": traceback.format_exc(),\n            "url": url,\n            "environment": "production"\n        }, timeout=2)\n    except Exception:\n        pass',
  node: '// Node.js / Express / NestJS\nprocess.on(\'uncaughtException\', (err) => {\n  fetch(\'https://snaptrace.space/api/v1/log\', {\n    method: \'POST\',\n    headers: { \'Content-Type\': \'application/json\' },\n    body: JSON.stringify({ apiKey: \'sk_live_your_project_key\', message: err.message, stackTrace: err.stack, environment: process.env.NODE_ENV || \'production\' })\n  }).catch(() => {});\n});',
  go: '// Go (Golang) Crash Reporter\npackage main\n\nimport (\n  "bytes"\n  "encoding/json"\n  "net/http"\n)\n\nfunc SendSnapTrace(err error, route string) {\n  payload, _ := json.Marshal(map[string]string{ "apiKey": "sk_live_your_project_key", "message": err.Error(), "environment": "production", "url": route })\n  http.Post("https://snaptrace.space/api/v1/log", "application/json", bytes.NewBuffer(payload))\n}',
  rust: '// Rust / Axum / Actix-web\nasync fn capture_snaptrace(err: &str, route: &str) {\n    let payload = serde_json::json!({ "apiKey": "sk_live_your_project_key", "message": err, "url": route, "environment": "production" });\n    let _ = reqwest::Client::new().post("https://snaptrace.space/api/v1/log").json(&payload).send().await;\n}',
  csharp: '// C# / ASP.NET Core\npublic static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {\n    var payload = new { apiKey = "sk_live_your_project_key", message = ex.Message, stackTrace = ex.StackTrace, url = url, environment = "production" };\n    await new HttpClient().PostAsJsonAsync("https://snaptrace.space/api/v1/log", payload);\n}',
  php: '<?php\n// PHP / Laravel / WordPress\nset_exception_handler(function ($e) {\n    $ch = curl_init(\'https://snaptrace.space/api/v1/log\');\n    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([\'apiKey\' => \'sk_live_your_project_key\', \'message\' => $e->getMessage(), \'stackTrace\' => $e->getTraceAsString(), \'environment\' => \'production\']));\n    curl_setopt($ch, CURLOPT_HTTPHEADER, [\'Content-Type: application/json\']);\n    curl_exec($ch);\n});\n?>',
  ruby: '# Ruby on Rails / Sinatra\ndef send_snaptrace_alert(exception)\n  uri = URI(\'https://snaptrace.space/api/v1/log\')\n  Net::HTTP.post(uri, { apiKey: \'sk_live_your_project_key\', message: exception.message, stackTrace: exception.backtrace&.join("\\n"), environment: \'production\' }.to_json, "Content-Type" => "application/json") rescue nil\nend',
  kotlin: '// Kotlin / Android / Java (OkHttp)\nfun sendSnapTrace(e: Throwable, context: String = "Android App") {\n    val json = JSONObject().apply {\n        put("apiKey", "sk_live_your_project_key")\n        put("message", e.localizedMessage ?: "Unknown Error")\n        put("environment", "production")\n        put("url", context)\n    }\n}',
  flutter: '// Flutter / Dart Crash Handler\nvoid captureSnapTrace(Object error, StackTrace stack) {\n  http.post(Uri.parse(\'https://snaptrace.space/api/v1/log\'), headers: {\'Content-Type\': \'application/json\'}, body: jsonEncode({\'apiKey\': \'sk_live_your_project_key\', \'message\': error.toString(), \'stackTrace\': stack.toString(), \'environment\': \'production\'}));\n}',
  cloudflare: '// Cloudflare Workers / Serverless Edge\nexport default {\n  async fetch(req: Request, env: any, ctx: any) {\n    try {\n      return await handleRequest(req);\n    } catch (err: any) {\n      ctx.waitUntil(fetch(\'https://snaptrace.space/api/v1/log\', {\n        method: \'POST\',\n        headers: { \'Content-Type\': \'application/json\' },\n        body: JSON.stringify({ apiKey: \'sk_live_your_project_key\', message: err.message, stackTrace: err.stack, environment: \'production\' })\n      }));\n      return new Response(\'Edge Execution Error\', { status: 500 });\n    }\n  }\n};'
};

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<StackKey>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [copiedHeroScript, setCopiedHeroScript] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [marketingMode, setMarketingMode] = useState(true);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeIdeTab, setActiveIdeTab] = useState<'cursor' | 'claude' | 'vscode'>('cursor');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroMouse, setHeroMouse] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      setHeroMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const [activeTriageTab, setActiveTriageTab] = useState<TriageTab>('stack');
  const [simulatedResolved, setSimulatedResolved] = useState(false);
  const [maskedPiiView, setMaskedPiiView] = useState(true);

  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('feature');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const feedbackGmailUrl = () => {
    const subject = encodeURIComponent('[SnapTrace Feedback] ' + feedbackCategory.toUpperCase());
    const bodyLines = [
      'Category: ' + feedbackCategory.toUpperCase(),
      feedbackName.trim() ? 'User: ' + feedbackName.trim() : '',
      'Timestamp: ' + new Date().toISOString(),
      '',
      'Feedback:',
      '---------------------------------------------',
      feedbackMessage.trim(),
      '---------------------------------------------',
    ].filter(Boolean);
    const body = encodeURIComponent(bodyLines.join('\n'));
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + SUPPORT_EMAIL + '&su=' + subject + '&body=' + body;
  };

  const handleSendFeedback = () => {
    if (!feedbackMessage.trim()) return;
    window.open(feedbackGmailUrl(), '_blank', 'noopener,noreferrer');
    setFeedbackSent(true);
    setTimeout(() => {
      closeFeedbackModal();
    }, 2500);
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

  const heroScriptSnippet = '<script src="https://snaptrace.space/snaptrace.js" data-api-key="YOUR_KEY" async></script>';

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

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-clip bg-[#05050A] font-sans text-slate-100 antialiased selection:bg-yellow-400 selection:text-slate-950">
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* ANNOUNCEMENT BAR */}
      <div
        className={
          'relative z-50 flex w-full max-w-full overflow-hidden flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1 border-b px-2 sm:px-4 py-2 text-center font-mono text-[10.5px] sm:text-[11px] transition-colors ' +
          (marketingMode
            ? 'border-yellow-400/25 bg-[linear-gradient(90deg,rgba(250,204,21,0.08),rgba(245,158,11,0.14),rgba(250,204,21,0.08))] text-yellow-100'
            : 'border-slate-800/80 bg-[#080C15] text-slate-300')
        }
      >
        <span className="inline-flex items-center gap-1.5 font-semibold text-yellow-300 shrink-0">
          <IconBolt className="h-3.5 w-3.5" />
          {marketingMode ? 'Public Beta Live' : 'Architecture Spec'}
        </span>
        <span className="hidden sm:inline text-slate-500">·</span>
        <span className="hidden sm:inline text-slate-300">
          {marketingMode ? 'Sub-5KB Telemetry' : 'RFC-9110 asynchronous ingestion engine active'}
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-300">
          {marketingMode ? 'Zero Hydration Delay' : 'Zero hydration penalty'}
        </span>
        <span className="text-slate-500">·</span>
        {marketingMode ? (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 font-semibold text-yellow-300 underline decoration-yellow-400/40 underline-offset-4 transition hover:text-yellow-200 shrink-0"
          >
            Free Beta Pass Open
            <IconArrow className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-slate-400 shrink-0">under 3.4KB gzipped</span>
        )}
      </div>

     {/* HEADER */}
      <header
        className={
          'sticky top-0 z-40 border-b transition-all duration-300 w-full ' +
          (scrolled
            ? 'border-zinc-800/90 bg-zinc-950/95 shadow-[inset_0_-1px_0_rgba(255,255,255,0.04),0_8px_32px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl'
            : 'border-transparent bg-zinc-950/80 backdrop-blur-md')
        }
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" onClick={scrollToTop} className="flex shrink-0 items-center gap-2.5 rounded-md transition hover:opacity-90">
            <SnapTraceLogo size="md" showText={true} />
            <span className="st-beta-pill">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              BETA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 text-[12.5px] font-medium text-zinc-400 lg:flex" aria-label="Main navigation">
            {/* Platform Dropdown */}
            <div className="relative" onMouseEnter={() => setOpenDropdown('platform')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">
                Platform
                <IconChevron className={'h-3.5 w-3.5 text-zinc-600 transition-transform duration-200 ' + (openDropdown === 'platform' ? 'rotate-180' : '')} />
              </button>

              {openDropdown === 'platform' && (
                <div className="absolute left-0 top-full z-50 pt-2">
                  <div className="st-card w-[340px] max-w-[calc(100vw-2rem)] rounded-xl p-2 backdrop-blur-xl">
                    <div className="px-3 pb-1.5 pt-2 font-mono text-[10px] tracking-[0.12em] text-zinc-500 font-semibold uppercase">Engine</div>
                    <a href="#features" className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-zinc-800/50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"><IconFeather className="h-3.5 w-3.5" /></span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-zinc-100">&lt;3.4KB Telemetry SDK</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">Zero CWV delay & async beacon transport.</span>
                      </span>
                    </a>
                    <a href="#grouping" className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-zinc-800/50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/10 text-yellow-300"><IconTarget className="h-3.5 w-3.5" /></span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-zinc-100">Outage Collapse Engine</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">Collapses 500 cascade crashes into 1 root thread.</span>
                      </span>
                    </a>
                    <a href="#pii" className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-zinc-800/50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300"><IconLock className="h-3.5 w-3.5" /></span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-zinc-100">Client-Side PII Firewall</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">On-device regex AST before transmission.</span>
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* AI Copilot Dropdown */}
            <div className="relative" onMouseEnter={() => setOpenDropdown('ai')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">
                <IconSparkle className="h-3.5 w-3.5 text-purple-400" />
                AI Copilot
                <IconChevron className={'h-3.5 w-3.5 text-zinc-600 transition-transform duration-200 ' + (openDropdown === 'ai' ? 'rotate-180' : '')} />
              </button>

              {openDropdown === 'ai' && (
                <div className="absolute left-0 top-full z-50 pt-2">
                  <div className="st-card w-[340px] max-w-[calc(100vw-2rem)] rounded-xl p-2 backdrop-blur-xl">
                    <div className="px-3 pb-1.5 pt-2 font-mono text-[10px] tracking-[0.12em] text-zinc-500 font-semibold uppercase">Diagnostics</div>
                    <a href="#byok" className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-zinc-800/50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10"><MarkGemini className="h-4 w-4" /></span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-zinc-100">BYOK AI Hub</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">Gemini & OpenAI, $0 markup, on-device privacy.</span>
                      </span>
                    </a>
                    <a href="#ai-agent" className="flex items-start gap-3 rounded-lg p-2.5 transition hover:bg-zinc-800/50">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-500/10 text-purple-300"><MarkCursor className="h-3.5 w-3.5" /></span>
                      <span>
                        <span className="block text-[12.5px] font-semibold text-zinc-100">1-Click Cursor & Claude Export</span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">Formatted stack trace prompt for local agent fixes.</span>
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#quickstart" className="rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">Docs / SDK</a>
            <a href="#comparison" className="rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">Why SnapTrace</a>
            <a href="#pricing" className="rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">Pricing</a>
            <a href="#faq" className="rounded-md px-2.5 py-1.5 transition hover:bg-zinc-800/60 hover:text-zinc-100">FAQ</a>
          </nav>

          {/* Dev / UI Mode segmented pill — clean, inline, not floating */}
          <div className="hidden xl:flex items-center border border-zinc-800 bg-zinc-900/80 rounded-lg p-0.5 font-mono text-[11px] shrink-0 ml-1">
            <button
              onClick={() => { if (!marketingMode) toggleMarketingMode(); }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                marketingMode ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Marketing Site"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-3 w-3" aria-hidden="true"><path d="M2 3.5h12M2 8h12M2 12.5h7" strokeLinecap="round" /></svg>
              UI
            </button>
            <button
              onClick={() => { if (marketingMode) toggleMarketingMode(); }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 transition-all ${
                !marketingMode ? 'bg-zinc-800 text-emerald-300 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Dev Spec Mode"
            >
              <IconTerminal className="h-3 w-3" />
              Dev
            </button>
          </div>

          {/* Right Action Group */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[12.5px] font-medium text-zinc-400 transition hover:text-zinc-100 px-2.5 py-1.5 rounded-md"
            >
              Sign In
            </Link>

            <Link
              href="/demo"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60 text-zinc-200 px-3 py-1.5 text-[12px] font-medium transition shrink-0 whitespace-nowrap"
            >
              Live Demo
            </Link>

            <Link
              href="/signup"
              className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 px-3.5 py-1.5 text-[12px] font-semibold transition"
            >
              <span>Claim Beta Pass</span>
              <span aria-hidden="true">→</span>
            </Link>

            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="ml-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:text-zinc-100 lg:hidden"
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>
      {/* Marketing Mode pill now lives inside the header — no floating card */}
      {/* Mobile Drawer */}
      <div
        data-open={mobileNavOpen ? 'true' : 'false'}
        className="st-mobile-nav fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileNavOpen}
      >
        <div className="absolute inset-0 bg-[#05070E]/97 backdrop-blur-2xl" onClick={() => setMobileNavOpen(false)} />
        <div className="st-safe-t relative flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80">
            <span className="flex items-center gap-2">
              <SnapTraceLogo size="md" showText={true} />
              <span className="st-beta-pill">BETA</span>
            </span>
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300"
            >
              <IconCross />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6 font-mono">
            {[
              { href: '#features', label: 'Platform Architecture' },
              { href: '#ai-agent', label: 'AI Copilot' },
              { href: '#byok', label: 'BYOK AI Hub' },
              { href: '#quickstart', label: 'SDK Setup' },
              { href: '#comparison', label: 'Why SnapTrace' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
            ].map((item: { href: string; label: string }) => (
              <a key={item.label} href={item.href} onClick={() => setMobileNavOpen(false)} className="st-h3 border-b border-slate-800/60 py-3.5 text-slate-200 transition active:text-yellow-300">
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setMobileNavOpen(false); setShowFeedbackModal(true); }}
              className="st-h3 border-b border-slate-800/60 py-3.5 text-left text-yellow-300 flex items-center justify-between"
            >
              <span>Give Feedback</span>
              <span className="text-xs font-mono">hello.snaptrace@gmail.com</span>
            </button>
            <Link href="/demo" onClick={() => setMobileNavOpen(false)} className="st-h3 py-3.5 text-slate-200">Live Demo</Link>
          </nav>

          <div className="st-safe-b space-y-3 border-t border-zinc-800/70 px-6 pt-5">
            <div className="flex gap-3">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className={BTN_SECONDARY + ' flex-1'}>Sign In</Link>
              <Link href="/signup" onClick={() => setMobileNavOpen(false)} className={BTN_PRIMARY + ' flex-1'}>Get Started</Link>
            </div>
            <button onClick={() => { setMobileNavOpen(false); toggleMarketingMode(); }} className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-800/70 bg-zinc-900/60 text-zinc-500 py-2 text-[11px] font-mono transition hover:text-zinc-300 cursor-pointer">
              <IconTerminal className="h-3.5 w-3.5" />
              {marketingMode ? 'Dev Spec Mode' : 'Marketing Site'}
            </button>
          </div>
        </div>
      </div>

     {/* VIEW 1: RAW DEV TERMINAL */}
      {!marketingMode ? (
        <section className="st-grain relative min-h-[calc(100vh-7rem)] w-full max-w-full overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="st-grid pointer-events-none absolute inset-0" />
          <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 lg:gap-12 px-5 sm:px-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5 pt-2">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 font-mono text-[11px] text-emerald-400 font-semibold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  architecture.spec · 0.0ms main thread blocking
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-mono font-bold tracking-tight text-white leading-[1.25]">
                  No 100KB bundles.<br />
                  No 2 AM alert floods.<br />
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
                    <dd className="mt-0.5 font-semibold text-emerald-400">&lt;3.4KB gzipped</dd>
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
                  <span className="hidden font-mono text-[10px] text-slate-600 sm:inline">autonomous diagnostics</span>
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
                        placeholder="Ask any technical question..."
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
          {/* 3. HERO SECTION */}
          <section
              ref={heroRef}
              onMouseMove={handleHeroMouseMove}
              className="st-grain relative overflow-hidden pb-14 pt-12 sm:pb-20 sm:pt-16"
            >
            <TelemetryBeamBackground />
            <div className="st-grid pointer-events-none absolute inset-0" />
            {/* Vercel-style mouse-follow spotlight */}
            <div
              className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
              style={{
                background: `radial-gradient(650px circle at ${heroMouse.x}px ${heroMouse.y}px, rgba(250,204,21,0.08), rgba(139,92,246,0.03), transparent 70%)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden w-full max-w-full">
              <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(250,204,21,0.10),rgba(147,51,234,0.06),transparent)] blur-[110px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
              <div className="text-center max-w-4xl mx-auto space-y-4">
                <a
                  href="#ai-agent"
                  className="group inline-flex max-w-full items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/[0.08] py-1.5 pl-2.5 pr-3.5 text-[11.5px] sm:text-[12px] text-purple-200 backdrop-blur-sm transition hover:border-purple-400/50 hover:bg-purple-500/[0.14]"
                >
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-200 shrink-0">NEW</span>
                  <span className="truncate">Autonomous AI patches ready for Cursor, Claude Code, & Copilot</span>
                  <IconArrow className="h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </a>

                <h1 className="st-display text-white">
                  Code breaks.{' '}
                  <span className="bg-[linear-gradient(95deg,#FEF3C7_0%,#FACC15_40%,#F59E0B_100%)] bg-clip-text text-transparent">
                    Fix it in a snap.
                  </span>
                </h1>

                <p className="st-lead text-zinc-300 max-w-2xl mx-auto">
                  SnapTrace collapses cascading multi-error outages into a single root-cause incident in under 3.4KB, with on-device PII masking and instant BYOK AI code fixes.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/signup"
                    className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-[13px] font-semibold bg-zinc-100 hover:bg-white text-zinc-950 transition-all duration-200 active:scale-[0.98] w-full sm:w-auto"
                  >
                    <span>Start Free (2,000 Events/mo)</span>
                    <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/demo"
                    className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-200 px-5 py-3 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] w-full sm:w-auto"
                  >
                    <IconTerminal className="h-4 w-4 text-zinc-400" />
                    Open Live Demo (No Signup)
                  </Link>
                </div>

                <div className="pt-4 max-w-xl mx-auto w-full">
                  <div className="flex items-center gap-2 sm:gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 pl-3 sm:pl-3.5 w-full min-w-0 max-w-full">
                    <IconCode className="h-4 w-4 shrink-0 text-zinc-600 hidden sm:block" />
                    <code className="flex-1 min-w-0 truncate text-left font-mono text-[11px] sm:text-[11.5px] text-zinc-400">
                      &lt;script src=&quot;https://snaptrace.space/snaptrace.js&quot; data-api-key=&quot;<span className="text-yellow-300 font-bold">YOUR_KEY</span>&quot; async&gt;&lt;/script&gt;
                    </code>
                    <button onClick={handleCopyHeroScript} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer font-mono'}>
                      {copiedHeroScript ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                      {copiedHeroScript ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-mono text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-400" />Drop into HTML head</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-400" />0.0ms hydration penalty</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="h-3 w-3 text-emerald-400" />&lt;3.4KB gzipped</span>
                  </div>
                </div>
              </div>

              {/* MACOS INTERACTIVE PREVIEW WINDOW */}
              <div className="mt-12 max-w-5xl mx-auto">
                <div className="st-card rounded-2xl overflow-hidden shadow-2xl border-slate-700/70">
                  <div className="st-window-topbar px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                        <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                        <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                      </div>
                      <span className="text-slate-300 font-bold text-xs ml-1 flex items-center gap-1.5">
                        <span>snaptrace-incident-triage</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-[11px] text-slate-400">checkout/route.ts</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={
                        'px-2.5 py-0.5 rounded-md border text-[10px] font-black tracking-wide flex items-center gap-1.5 ' +
                        (simulatedResolved
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse')
                      }>
                        <span className={'w-1.5 h-1.5 rounded-full ' + (simulatedResolved ? 'bg-emerald-400' : 'bg-red-400')} />
                        {simulatedResolved ? 'RESOLVED (0.18s)' : 'UNRESOLVED [x500]'}
                      </span>
                      <button
                        onClick={() => setSimulatedResolved(!simulatedResolved)}
                        className={
                          'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 border ' +
                          (simulatedResolved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30 hover:bg-yellow-400/25')
                        }
                      >
                        {simulatedResolved
                          ? <><IconCheck className="h-3.5 w-3.5" /> Resolved</>
                          : <><IconBolt className="h-3.5 w-3.5" /> Simulate AI Resolution</>}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 sm:p-7 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded font-bold text-[11px]">
                            FATAL EXCEPTION
                          </span>
                          <span className="text-white font-semibold">PostgreSQL Client Pool Timeout</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-yellow-300 font-bold">database.js:18:11</span>
                        </div>

                        <div className="flex items-center gap-1.5 pt-1 font-mono text-xs overflow-x-auto">
                          <button
                            onClick={() => setActiveTriageTab('stack')}
                            className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ' + (activeTriageTab === 'stack' ? 'bg-slate-800 text-yellow-300 border border-yellow-400/30' : 'text-slate-400 hover:text-white')}
                          >
                            Stack Trace (AST)
                          </button>
                          <button
                            onClick={() => setActiveTriageTab('timeline')}
                            className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ' + (activeTriageTab === 'timeline' ? 'bg-slate-800 text-yellow-300 border border-yellow-400/30' : 'text-slate-400 hover:text-white')}
                          >
                            Telemetry Spans
                          </button>
                          <button
                            onClick={() => setActiveTriageTab('pii')}
                            className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ' + (activeTriageTab === 'pii' ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-white')}
                          >
                            <IconLock className="h-3 w-3" />
                            PII Scrubbing
                          </button>
                          <button
                            onClick={() => setActiveTriageTab('aifix')}
                            className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ' + (activeTriageTab === 'aifix' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40' : 'text-purple-400 hover:text-purple-200')}
                          >
                            <IconSparkle className="h-3 w-3" />
                            BYOK AI Patch
                          </button>
                        </div>

                        <div className="bg-[#05070E] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                          {activeTriageTab === 'stack' && (
                            <div className="space-y-1.5 text-slate-300 leading-relaxed text-[11.5px]">
                              <div className="text-red-400 font-bold">ReferenceError: pool.connect() timed out after 5000ms</div>
                              <div className="p-2 rounded bg-yellow-400/5 border border-yellow-400/20 text-yellow-200">
                                → at queryUserOrders (<span className="text-yellow-300 font-bold underline">database.js:18:11</span>) [BLAME: pool leak]
                              </div>
                              <div className="text-slate-400 pl-3">at async handleCheckoutAction (app/api/checkout/route.ts:42:5)</div>
                              <div className="text-slate-500 pl-3">at async NextNodeServer.handleRequest (node_modules/next/...)</div>
                            </div>
                          )}

                          {activeTriageTab === 'timeline' && (
                            <div className="space-y-2 text-[11px]">
                              <div className="flex items-center justify-between pb-1 text-slate-500 font-mono text-[10px]">
                                <span>SPAN LIFECYCLE</span>
                                <span>DURATION</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                                  <span>1. DOM Click: checkout-submit-btn</span>
                                  <span className="text-slate-400">0.8ms</span>
                                </div>
                                <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                                  <span>2. POST /api/v1/checkout (Next.js App Router)</span>
                                  <span className="text-emerald-400">12.4ms</span>
                                </div>
                                <div className="p-2 rounded bg-red-950/40 border border-red-500/40 text-red-300 font-bold flex items-center justify-between">
                                  <span>3. pool.connect() — PostgreSQL connection exhaustion</span>
                                  <span className="text-red-400">5000.2ms [TIMEOUT]</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTriageTab === 'pii' && (
                            <div className="space-y-2.5 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-400 font-bold">Client-Side Regex AST Sanitization Engine</span>
                                <button
                                  onClick={() => setMaskedPiiView(!maskedPiiView)}
                                  className="text-[10px] text-yellow-300 underline cursor-pointer"
                                >
                                  {maskedPiiView ? 'Show Raw Stream' : 'Show Sanitized Wire'}
                                </button>
                              </div>
                              <pre className="p-3 bg-[#0A0E1A] rounded-xl border border-slate-800 text-slate-300 overflow-x-auto leading-relaxed">
                                {maskedPiiView
                                  ? `// Transmitted Wire Payload (Scrubbed on device)\n{\n  "event": "checkout_error",\n  "user_email": "u***@domain.com",\n  "card_number": "[REDACTED_PCI_CARD]",\n  "authorization": "Bearer [REDACTED_SECRET]",\n  "file": "database.js:18"\n}`
                                  : `// Original Raw Browser State (Never leaves client)\n{\n  "event": "checkout_error",\n  "user_email": "john.doe@company.com",\n  "card_number": "4111-2222-3333-4444",\n  "authorization": "Bearer eyJhbGciOi...",\n  "file": "database.js:18"\n}`}
                              </pre>
                            </div>
                          )}

                          {activeTriageTab === 'aifix' && (
                            <div className="space-y-2 text-[11px]">
                              <div className="text-purple-300 font-bold flex items-center gap-1.5">
                                <MarkGemini className="w-4 h-4" />
                                <span>Generated by Google Gemini 2.5 Flash Lite (0.18s)</span>
                              </div>
                              <pre className="text-emerald-400 leading-relaxed bg-[#0A0E1A] p-3 rounded-lg border border-slate-800 overflow-x-auto font-mono">
                                {`// Proposed Patch for database.js:18\n- const client = await pool.connect();\n- return await client.query(sql, params);\n+ const client = await pool.connect();\n+ try {\n+   return await client.query(sql, params);\n+ } finally {\n+   client.release(); // Releases connection back to pool\n+ }`}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-4 p-4.5 bg-[#080C16] rounded-2xl border border-yellow-400/30 space-y-3.5 font-mono text-xs">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 flex items-center gap-1.5">
                          <IconBolt className="h-3.5 w-3.5" />
                          <span>CASCADE COLLAPSE STATS</span>
                        </div>
                        <div className="space-y-2 text-slate-300 text-[11.5px]">
                          <div className="flex justify-between pb-1.5 border-b border-slate-800">
                            <span className="text-slate-500">Occurrences:</span>
                            <strong className="text-yellow-300 font-bold">500 crashes</strong>
                          </div>
                          <div className="flex justify-between pb-1.5 border-b border-slate-800">
                            <span className="text-slate-500">Alerts Dispatched:</span>
                            <strong className="text-emerald-400 font-bold">1 Unified Thread</strong>
                          </div>
                          <div className="flex justify-between pb-1.5 border-b border-slate-800">
                            <span className="text-slate-500">Fingerprint:</span>
                            <code className="text-slate-400 text-[10px]">sha256(db:18)</code>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">AI Fix Status:</span>
                            <strong className="text-purple-400 font-bold">Verified Diff</strong>
                          </div>
                        </div>

                        <Link
                          href="/signup"
                          className="block w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-center text-xs rounded-xl shadow-md transition"
                        >
                          Explore Live Dashboard →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. STACK MARQUEE */}
          <div className="border-y border-slate-800/70 bg-[#070B13]/60 py-5 overflow-hidden w-full max-w-full">
            <p className="mb-4 text-center font-mono text-[10px] tracking-[0.14em] text-slate-500 uppercase font-bold">
              ONE UNIVERSAL REST INGESTION PROTOCOL · ZERO DEPENDENCY CONFLICTS
            </p>
            <div className="st-fade-x overflow-hidden">
              <div className="st-marquee-track">
                {[0, 1].map((dup: number) => (
                  <div key={dup} className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={dup === 1}>
                    {MARQUEE_ITEMS.map((item: string) => (
                      <span key={String(dup) + item} className="whitespace-nowrap font-mono text-[13px] text-slate-500 transition-colors hover:text-slate-200">
                        {item}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. SUNDAY 2 AM OUTAGE COLLAPSE (#grouping) */}
          <section id="grouping" className="st-section st-cv mx-auto max-w-6xl px-5 sm:px-6">
            <SmoothReveal className="mb-8">
              <SectionIntro
                eyebrowIcon={<IconTarget className="h-3.5 w-3.5" />}
                eyebrowLabel="Incident grouping"
                heading="One Outage Shouldn’t Trigger 500 Panic Alerts"
                lead="When a backend connection pool dies, your auth breaks, your cart breaks, your checkout breaks, and your webhook breaks. Traditional APMs treat each as an independent emergency. SnapTrace connects the dots."
              />
            </SmoothReveal>

            <SmoothReveal delay={80}>
              <div className="st-card overflow-hidden rounded-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-[#070B13] px-5 py-3.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
                    <span className="ml-3 text-slate-300 font-bold">Live Outage Cascade Tracing</span>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] text-emerald-300 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Cascade Engine Active
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-12">
                  <ol className="relative lg:col-span-7">
                    <span className="absolute bottom-3 left-[11px] top-3 w-px bg-slate-800" aria-hidden="true" />
                    {[
                      { step: 'User submits checkout form', crash: false },
                      { step: 'Frontend dispatches POST /v1/order', crash: false },
                      { step: 'Next.js server action executes', crash: false },
                      { step: 'database.js:18 pool.connect() timeout', crash: true },
                    ].map((row: { step: string; crash: boolean }) => (
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
                          <span className={'shrink-0 text-[11px] font-semibold ' + (row.crash ? 'text-red-400 font-bold' : 'text-emerald-400')}>
                            {row.crash ? 'CRASH ORIGIN' : '200 OK'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="lg:col-span-5">
                    <div className="h-full rounded-xl border border-yellow-400/30 bg-[linear-gradient(180deg,rgba(250,204,21,0.08),rgba(250,204,21,0))] p-5 space-y-3">
                      <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-yellow-300 font-bold">
                        <IconBolt className="h-3.5 w-3.5" />
                        ROOT CAUSE COLLAPSED
                      </div>
                      <h3 className="text-[17px] font-bold tracking-tight text-white">
                        Root Cause: Connection Pool Exhaustion
                      </h3>
                      <p className="text-[13px] leading-relaxed text-slate-300 font-sans">
                        Four downstream HTTP 500 crashes collapsed under{' '}
                        <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300 font-bold">database.js:18</code>. The
                        PostgreSQL client connection was never released back to the pool.
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-800 pt-3 font-mono text-[12px]">
                        <span className="text-slate-400">AI Patch:</span>
                        <span className="text-emerald-400 font-bold">client.release()</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SmoothReveal>
          </section>

          {/* 6. FEATHERWEIGHT SDK (#features) */}
          <section id="features" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <SectionIntro
                    eyebrowIcon={<IconFeather className="h-3.5 w-3.5" />}
                    eyebrowLabel="Performance & Core Web Vitals"
                    heading="An error tracker that never slows down your users"
                    lead="Legacy APMs force users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores. SnapTrace is a zero-dependency script under 3.4KB gzipped."
                  />

                  <div className="mt-7 space-y-2.5">
                    {[
                      { name: 'SnapTrace JS telemetry SDK', size: '<3.4 KB', width: '5%', tone: 'emerald' },
                      { name: 'Honeybadger client', size: '~35 KB', width: '35%', tone: 'slate' },
                      { name: 'Sentry browser SDK', size: '100+ KB', width: '100%', tone: 'red' },
                    ].map((row: { name: string; size: string; width: string; tone: string }) => (
                      <div key={row.name} className="rounded-xl border border-slate-800 bg-[#0B101D] px-4 py-3">
                        <div className="flex items-center justify-between font-mono text-[12.5px]">
                          <span className={row.tone === 'emerald' ? 'text-slate-200 font-bold' : 'text-slate-400'}>{row.name}</span>
                          <span
                            className={
                              'font-bold ' +
                              (row.tone === 'emerald' ? 'text-emerald-400' : row.tone === 'red' ? 'text-red-400' : 'text-slate-400')
                            }
                          >
                            {row.size}
                          </span>
                        </div>
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                          <div
                            style={{ width: row.width }}
                            className={
                              'h-full rounded-full ' +
                              (row.tone === 'emerald' ? 'bg-emerald-400' : row.tone === 'red' ? 'bg-red-500' : 'bg-slate-600')
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <div className="st-card rounded-2xl p-6 sm:p-8 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-slate-500 font-bold">GOOGLE LIGHTHOUSE AUDIT</span>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-400">
                        Score: 100 / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-800 bg-[#070B13] p-5 text-center">
                        <div className="font-mono text-[32px] font-black tracking-tight text-emerald-400">0.0ms</div>
                        <p className="mt-1 text-[11px] text-slate-400 font-mono">Main thread delay</p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-[#070B13] p-5 text-center">
                        <div className="font-mono text-[32px] font-black tracking-tight text-emerald-400">3.4KB</div>
                        <p className="mt-1 text-[11px] text-slate-400 font-mono">Total gzipped size</p>
                      </div>
                    </div>

                    <blockquote className="border-t border-slate-800/80 pt-4 text-[13px] leading-relaxed text-slate-300 italic font-sans">
                      &quot;We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly. Zero hydration lag.&quot;
                    </blockquote>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* 7. AI AGENT EXPORT (#ai-agent) */}
          <section id="ai-agent" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 space-y-8">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconSparkle className="h-3.5 w-3.5" />}
                  eyebrowTone="purple"
                  eyebrowLabel="AI workflow native"
                  heading="Turn a stack trace into an instant code patch"
                  lead="Export a pre-formatted crash diagnostic straight into Cursor, Claude Code, or VS Code Copilot to let your AI agent generate a verified fix locally."
                />

                <div className="mt-6 flex justify-center">
                  <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0B101D] p-1 font-mono">
                    {([
                      { id: 'cursor', label: 'Cursor IDE', mark: <MarkCursor className="h-3.5 w-3.5" /> },
                      { id: 'claude', label: 'Claude Code', mark: <MarkClaude className="h-3.5 w-3.5" /> },
                      { id: 'vscode', label: 'VS Code Copilot', mark: <MarkVSCode className="h-3.5 w-3.5" /> },
                    ] as const).map((ide) => (
                      <button
                        key={ide.id}
                        onClick={() => setActiveIdeTab(ide.id)}
                        className={
                          'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition ' +
                          (activeIdeTab === ide.id
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200')
                        }
                      >
                        {ide.mark}
                        <span>{ide.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </SmoothReveal>

              <SmoothReveal delay={100} className="mx-auto max-w-4xl">
                <div className="st-card rounded-2xl p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2 font-mono text-[12.5px] font-bold text-red-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span>CRASH: ReferenceError: Connection pool exhausted</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500">Captured at database.js:18:11</div>
                    </div>
                    <button
                      onClick={handleCopyCursorDemo}
                      className="group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-purple-400/30 bg-[linear-gradient(180deg,rgba(147,51,234,0.35),rgba(79,70,229,0.35))] px-4 py-2.5 text-[12.5px] font-bold text-purple-100 transition hover:border-purple-400 hover:brightness-110 sm:self-auto font-mono"
                    >
                      {copiedCursorPrompt ? <IconCheck className="h-4 w-4 text-emerald-400" /> : <IconCopy className="h-4 w-4" />}
                      {copiedCursorPrompt
                        ? 'Prompt copied!'
                        : activeIdeTab === 'cursor'
                          ? 'Copy prompt for Cursor'
                          : activeIdeTab === 'claude'
                            ? 'Copy prompt for Claude Code'
                            : 'Copy prompt for VS Code'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-purple-400/20 bg-[#070B13] p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-purple-300 font-bold">
                      <IconSparkle className="h-3.5 w-3.5" />
                      INSTANT AI ROOT-CAUSE DIAGNOSIS
                    </div>
                    <p className="text-[13px] leading-relaxed text-slate-300 font-sans">
                      The PostgreSQL client in <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300 font-bold">database.js</code> opens connections inside a tight loop without releasing them back to the pool.
                    </p>
                    <pre className="st-scroll overflow-x-auto rounded-lg border border-slate-800 bg-[#0B101D] p-3.5 font-mono text-[12px] leading-relaxed text-emerald-300">
                      {'// Fix in database.js: release the connection back to the pool\nconst client = await pool.connect();\ntry {\n  await client.query(\'SELECT * FROM users WHERE id = $1\', [userId]);\n} finally {\n  client.release(); // Releases connection\n}'}
                    </pre>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* 8. BRING YOUR OWN KEY (BYOK) (#byok) */}
          <section id="byok" className="st-section st-cv border-t border-slate-800/70 bg-[linear-gradient(180deg,rgba(11,16,29,0.7),rgba(5,7,14,1))]">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 space-y-10">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconUnlocked className="h-3.5 w-3.5" />}
                  eyebrowLabel="Zero AI Markups · Client-Side Encryption"
                  heading="Bring Your Own Key (BYOK) AI Hub"
                  lead="Unlike legacy APMs that charge exorbitant monthly per-seat add-ons for AI summaries, SnapTrace connects directly to your own API keys. Your keys are encrypted on-device and never stored on our servers."
                />
              </SmoothReveal>

              <div className="space-y-3.5">
                <div className="flex items-center gap-2 font-mono text-xs text-yellow-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Currently Live & Supported in Dashboard</span>
                </div>

                <SmoothReveal delay={80} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="st-card st-card-hover rounded-2xl p-6 border-2 border-emerald-500/50 space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                        <MarkGemini className="h-6 w-6" />
                      </span>
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                        ACTIVE LIVE · FREE TIER
                      </span>
                    </div>
                    <div>
                      <h3 className="st-h3 text-white">Google Gemini</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300 font-sans">
                        Runs on <strong className="text-white">Gemini 2.5 Flash Lite</strong>. Ultra-fast root-cause explanations and copy-paste code patches inside the Inspect modal in under 200ms. <strong>$0 cost on Google&apos;s free API tier.</strong>
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#05070E] rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Model: <strong className="text-white">gemini-2.5-flash-lite</strong></span>
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold"><IconBolt className="h-3 w-3" /> ~180ms</span>
                    </div>
                  </div>

                  <div className="st-card st-card-hover rounded-2xl p-6 border-2 border-yellow-400/50 space-y-4">
                    <div className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-100">
                        <MarkOpenAI className="h-6 w-6" />
                      </span>
                      <span className="rounded-full border border-yellow-400/25 bg-yellow-400/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-yellow-300">
                        ACTIVE LIVE
                      </span>
                    </div>
                    <div>
                      <h3 className="st-h3 text-white">OpenAI Models</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300 font-sans">
                        Paste your standard <code className="rounded bg-yellow-400/10 border border-yellow-400/25 px-1.5 py-0.5 font-mono text-[12px] text-yellow-300">sk-...</code> key in Settings. SnapTrace runs deep AST reasoning across stack frames and breadcrumbs to pinpoint race conditions.
                      </p>
                    </div>
                    <div className="p-2.5 bg-[#05070E] rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Supported: <strong className="text-white">gpt-4o & gpt-4o-mini</strong></span>
                      <span className="text-yellow-300 font-bold">⚡ Deep AST</span>
                    </div>
                  </div>
                </SmoothReveal>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>In Active Pipeline (Upcoming In-Dashboard Support)</span>
                  </span>
                  <span className="text-[11px] text-purple-400 hidden sm:inline">Coming to Settings</span>
                </div>

                <SmoothReveal delay={100} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="st-card rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MarkDeepSeek className="h-6 w-6" />
                        <h4 className="font-bold text-white text-sm font-mono">DeepSeek V3 / R1</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono font-bold">UPCOMING</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Leading open-weights reasoning for high-throughput, cost-efficient stack trace troubleshooting.
                    </p>
                  </div>

                  <div className="st-card rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MarkClaude className="h-6 w-6" />
                        <h4 className="font-bold text-white text-sm font-mono">Claude 3.5 Sonnet</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold">UPCOMING</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Direct integration with Anthropic&apos;s leading coding model for complex multi-file architectural fixes.
                    </p>
                  </div>

                  <div className="st-card rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MarkOllama className="h-6 w-6 text-slate-300" />
                        <h4 className="font-bold text-white text-sm font-mono">Ollama (100% Local)</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">AIR-GAPPED</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Connect your localhost Ollama endpoint (<code className="text-slate-300">localhost:11434</code>) for completely private inference.
                    </p>
                  </div>
                </SmoothReveal>
              </div>

              <div className="p-4 rounded-2xl bg-[#0B101D] border border-yellow-400/20 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/[0.08] text-yellow-300">
                    <IconShield className="h-4 w-4" />
                  </span>
                  <div>
                    <strong className="text-white">Zero-Trust Local Key Storage Guarantee:</strong>
                    <span className="text-slate-400 block sm:inline sm:ml-1">
                      SnapTrace never stores your AI API keys on server databases. Keys reside in encrypted client memory.
                    </span>
                  </div>
                </div>
                <Link
                  href="/privacy"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 font-bold shrink-0 transition"
                >
                  Read Security Spec →
                </Link>
              </div>
            </div>
          </section>

          {/* 9. QUICKSTART CODE STUDIO (#quickstart) */}
          <section id="quickstart" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6 space-y-8">
              <SmoothReveal>
                <SectionIntro
                  eyebrowIcon={<IconPlug className="h-3.5 w-3.5" />}
                  eyebrowLabel="Quickstart"
                  heading="Pick your stack, paste one snippet"
                  lead="Twelve drop-in integrations over one universal REST endpoint. Nothing to compile, nothing to configure."
                />
              </SmoothReveal>

              <SmoothReveal delay={80}>
                <div className="st-card overflow-hidden rounded-2xl shadow-2xl">
                  <div className="st-window-topbar flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="st-scroll flex w-full min-w-0 max-w-full items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                      {STACK_TABS.map((tab: { id: StackKey; label: string }) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveQuickTab(tab.id)}
                          className={
                            'cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[12px] font-semibold transition ' +
                            (activeQuickTab === tab.id
                              ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/35 shadow-sm'
                              : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200')
                          }
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleCopyCode} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer self-start md:self-auto font-mono'}>
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

          {/* 10. COMPARISON MATRIX (#comparison) */}
          <section id="comparison" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconLayers className="h-3.5 w-3.5" />}
                  eyebrowLabel="Comparison"
                  heading="Why Developers Switch from Sentry"
                  lead="Built to eliminate 100KB+ client SDK bloat, Sunday 2 AM alert noise, and expensive enterprise seats."
                />
              </SmoothReveal>

              <SmoothReveal delay={80} className="hidden md:block">
                <div className="st-card st-scroll overflow-x-auto rounded-2xl shadow-xl w-full max-w-full">
                  <table className="w-full min-w-[660px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#070B13]">
                        <th className="px-5 py-4 font-mono text-[11px] font-bold tracking-[0.1em] text-slate-500">FEATURE MATRIX</th>
                        <th className="px-5 py-4 text-[13px] font-bold text-yellow-300 bg-yellow-400/[0.04]">
                          <span className="inline-flex items-center gap-1.5">
                            <IconBolt className="h-3.5 w-3.5" />
                            SnapTrace
                          </span>
                        </th>
                        <th className="px-5 py-4 text-[13px] font-medium text-slate-400">Sentry</th>
                        <th className="px-5 py-4 text-[13px] font-medium text-slate-400">GlitchTip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {COMPARISON_ROWS.map((row: { f: string; st: string; sentry: string; glitch: string }) => (
                        <tr key={row.f} className="transition-colors hover:bg-white/[0.02]">
                          <td className="px-5 py-4 text-[13px] font-semibold text-white font-sans">{row.f}</td>
                          <td className="bg-yellow-400/[0.04] px-5 py-4 text-[12.5px] font-bold text-emerald-400">
                            <span className="inline-flex items-center gap-2">
                              <IconCheck className="h-3.5 w-3.5 shrink-0" />
                              {row.st}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[12.5px] text-slate-500">{row.sentry}</td>
                          <td className="px-5 py-4 text-[12.5px] text-slate-500">{row.glitch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SmoothReveal>

              <SmoothReveal delay={80} className="space-y-3 md:hidden">
                {COMPARISON_ROWS.map((row: { f: string; st: string; sentry: string; glitch: string }) => (
                  <div key={row.f} className="st-card rounded-xl p-4">
                    <div className="text-[13px] font-bold text-white">{row.f}</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                      <div className="rounded-lg border border-yellow-400/25 bg-yellow-400/[0.06] px-2 py-2">
                        <div className="text-[9px] uppercase tracking-wide text-yellow-400/80 font-bold">SnapTrace</div>
                        <div className="mt-1 font-bold text-emerald-400">{row.st}</div>
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

          {/* 11. SOCIAL PROOF (#social-proof) */}
          <section id="social-proof" className="st-section st-cv border-t border-slate-800/70">
            <SmoothReveal className="mx-auto max-w-3xl px-5 sm:px-6">
              <figure className="st-card p-7 sm:p-8 rounded-2xl relative">
                <blockquote className="text-[17px] sm:text-[20px] leading-[1.6] tracking-[-0.01em] text-slate-200 italic font-sans">
                  &quot;5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.&quot;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3.5 border-t border-slate-800/80 pt-4 font-mono">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 text-[13px] font-bold text-yellow-300">
                    EB
                  </span>
                  <div>
                    <span className="block text-[14px] font-bold text-white">Eusebiu Balan</span>
                    <span className="block text-[11.5px] text-slate-400">Senior Full-Stack Engineer, via Dev.to Community</span>
                  </div>
                </figcaption>
              </figure>
            </SmoothReveal>
          </section>

          {/* 12. PRICING (#pricing) */}
          <section id="pricing" className="st-section st-cv border-t border-slate-800/70 bg-[#060911]/70">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-6">
              <SmoothReveal>
                <SectionIntro
                  center
                  eyebrowIcon={<IconLayers className="h-3.5 w-3.5" />}
                  eyebrowLabel="Pricing"
                  heading="Simple, developer-first plans"
                  lead="No surprise overage bills. Generous headroom for solo builders, micro-SaaS, and client studios."
                />

                <div className="mt-6 flex justify-center px-2">
                  <div className="inline-flex max-w-full items-center gap-1 rounded-xl border border-slate-800 bg-[#0B101D] p-1 font-mono text-xs">
                    <button
                      onClick={() => setBillingInterval('monthly')}
                      className={
                        'cursor-pointer rounded-lg px-3.5 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-bold transition ' +
                        (billingInterval === 'monthly'
                          ? 'bg-white/[0.08] text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200')
                      }
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('annual')}
                      className={
                        'inline-flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg px-3.5 sm:px-4 py-2 text-[12px] sm:text-[12.5px] font-bold transition ' +
                        (billingInterval === 'annual'
                          ? 'bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] text-slate-950 font-black'
                          : 'text-slate-400 hover:text-yellow-300')
                      }
                    >
                      <span>Annual</span>
                      <span
                        className={
                          'rounded-md px-1.5 py-0.5 font-mono text-[9.5px] sm:text-[10px] whitespace-nowrap ' +
                          (billingInterval === 'annual' ? 'bg-slate-950/80 text-yellow-300' : 'bg-slate-800 text-slate-400')
                        }
                      >
                        <span className="inline sm:hidden">Save 20%</span>
                        <span className="hidden sm:inline">Save 20% + 2 Mo Free</span>
                      </span>
                    </button>
                  </div>
                </div>

                {billingInterval === 'annual' && (
                  <p className="mt-2.5 flex items-center justify-center gap-1.5 font-mono text-[11.5px] text-emerald-400 font-semibold text-center px-4">
                    <IconCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Billed annually — two months completely free applied at checkout</span>
                  </p>
                )}
              </SmoothReveal>

              <SmoothReveal delay={100} className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4.5 lg:gap-6 pt-2">
                {/* 1. DEVELOPER FREE */}
                <div className="st-card st-card-hover flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:p-7 h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 min-h-[26px]">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-slate-400 font-bold uppercase">DEVELOPER FREE</span>
                      <span className="rounded-full border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 font-mono text-[9.5px] font-semibold text-slate-400">
                        SIDE PROJECTS
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-[34px] sm:text-[36px] lg:text-[40px] font-black tracking-tight text-white">$0</span>
                      <span className="font-mono text-[12px] text-slate-500">/ month</span>
                    </div>

                    <p className="mt-1 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-400 min-h-[38px]">
                      For side projects, indie hack experiments, and personal sites.
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-5 text-[12px] sm:text-[12.5px] text-slate-300 font-mono">
                      {[
                        '2,000 events / month',
                        '7-day log retention',
                        '1 active project',
                        'Sub-5KB SDK, 0ms delay',
                        'In-dashboard inspection',
                        'Client-side regex PII firewall',
                        'Email & in-app alerts (no webhooks)',
                      ].map((f: string) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/signup" className={BTN_SECONDARY + ' mt-6 w-full font-mono text-center justify-center'}>
                    Start Free Forever →
                  </Link>
                </div>

                {/* 2. PRO BUILDER */}
                <div className="st-glow-amber relative flex flex-col justify-between rounded-2xl border-2 border-yellow-400/60 bg-[linear-gradient(180deg,rgba(250,204,21,0.07),rgba(11,16,29,1)_45%)] p-5 sm:p-6 lg:p-7 h-full mt-3 md:mt-0 md:-translate-y-1 lg:-translate-y-2">
                  <span className="absolute -top-3 left-5 sm:left-6 rounded-full bg-[linear-gradient(180deg,#FDE68A,#FACC15_46%,#EAB308)] px-3 py-0.5 sm:py-1 font-mono text-[9.5px] sm:text-[10px] font-black tracking-wider text-slate-950 shadow-md">
                    POPULAR FOR SOLO DEVS
                  </span>

                  <div>
                    <div className="flex items-center justify-between gap-2 min-h-[26px]">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-yellow-400 font-bold uppercase">PRO BUILDER</span>
                      <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 font-mono text-[9.5px] font-bold text-yellow-300">
                        SOLO DEVS & SAAS
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-[34px] sm:text-[36px] lg:text-[40px] font-black tracking-tight text-white">
                        {billingInterval === 'annual' ? '$15' : '$19'}
                      </span>
                      <span className="font-mono text-[12px] text-slate-400">/ month</span>
                    </div>

                    <p className="mt-1 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-400 min-h-[38px]">
                      {billingInterval === 'annual' ? 'Billed annually at $180/yr (save $48).' : 'For solo developers, freelancers & production micro-SaaS.'}
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-5 text-[12px] sm:text-[12.5px] text-slate-200 font-mono">
                      {[
                        '75,000 events / month',
                        '30-day log retention',
                        'Up to 5 active projects',
                        'Instant Discord & Slack webhooks',
                        '1-click Cursor & Claude AI prompts',
                        '60s loop throttling ([x50])',
                        'BYOK AI Copilot (Gemini & OpenAI)',
                      ].map((f: string) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-400" />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/signup" className={BTN_PRIMARY + ' mt-6 w-full font-mono text-center justify-center'}>
                    Claim Pro Beta Pass →
                  </Link>
                </div>

                {/* 3. AGENCY STUDIO */}
                <div className="st-card st-card-hover flex flex-col justify-between rounded-2xl p-5 sm:p-6 lg:p-7 h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 min-h-[26px]">
                      <span className="font-mono text-[11px] tracking-[0.1em] text-purple-300 font-bold uppercase">AGENCY STUDIO</span>
                      <span className="rounded-full border border-purple-400/25 bg-purple-500/15 px-2 py-0.5 font-mono text-[9.5px] font-bold text-purple-300">
                        CLIENT STUDIOS
                      </span>
                    </div>

                    <div className="mt-3.5 flex items-baseline gap-1.5">
                      <span className="text-[34px] sm:text-[36px] lg:text-[40px] font-black tracking-tight text-white">
                        {billingInterval === 'annual' ? '$39' : '$49'}
                      </span>
                      <span className="font-mono text-[12px] text-slate-500">/ month</span>
                    </div>

                    <p className="mt-1 text-[12.5px] sm:text-[13px] leading-relaxed text-slate-400 min-h-[38px]">
                      {billingInterval === 'annual' ? 'Billed annually at $468/yr (save $120).' : 'For agencies and teams managing multiple client sites.'}
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-5 text-[12px] sm:text-[12.5px] text-slate-300 font-mono">
                      {[
                        '500,000 events / month',
                        '90-day telemetry retention',
                        'UNLIMITED projects & API keys',
                        'Multi-seat client invites',
                        'Cascading outage collapse',
                        'Priority edge ingestion',
                        'Raw log CSV & JSON exports',
                      ].map((f: string) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <IconCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button type="button" onClick={() => setShowAgencyModal(true)} className={BTN_SECONDARY + ' mt-6 w-full cursor-pointer font-mono text-center justify-center'}>
                    Start Agency Workspace →
                  </button>
                </div>
              </SmoothReveal>

              {/* Trust assurance strip */}
              <SmoothReveal delay={140} className="mt-6 rounded-xl border border-slate-800/80 bg-[#070B13]/70 p-4 font-mono text-[11px] sm:text-[12px] text-slate-400">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>No credit card needed</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>0.0ms main thread delay</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Cancel or switch anytime</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <IconCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Zero surprise bills</span>
                  </div>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* 13. SECURITY & COMPLIANCE (#pii) */}
          <section id="pii" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-6xl px-5 sm:px-6">
              <SmoothReveal className="mx-auto max-w-2xl text-center">
                <h2 className="st-h2 text-white">Built for Developer Privacy and Core Web Vitals</h2>
              </SmoothReveal>

              <SmoothReveal delay={80} className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4 font-mono">
                {[
                  { icon: <IconShield />, title: 'GDPR ready', sub: 'On-device PII masking' },
                  { icon: <IconFeather />, title: 'Under 3.4KB', sub: '100/100 Core Web Vitals' },
                  { icon: <IconMute />, title: 'Anti-noise guard', sub: 'SHA-256 loop throttling' },
                  { icon: <IconUnlocked />, title: 'No vendor lock-in', sub: 'Universal REST protocol' },
                ].map((b: { icon: React.ReactNode; title: string; sub: string }) => (
                  <div key={b.title} className="st-card st-card-hover rounded-xl p-5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/[0.08] text-yellow-300">
                      {b.icon}
                    </span>
                    <div className="mt-3.5 text-[13.5px] font-bold text-white font-sans">{b.title}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-slate-400">{b.sub}</div>
                  </div>
                ))}
              </SmoothReveal>
            </div>
          </section>

          {/* 14. FAQ (#faq) */}
          <section id="faq" className="st-section st-cv border-t border-slate-800/70">
            <div className="mx-auto max-w-3xl px-5 sm:px-6 space-y-8">
              <SmoothReveal>
                <h2 className="st-h2 text-white">Frequently asked questions</h2>
                <p className="st-lead mt-2 text-slate-400 font-mono">Real technical answers for developers evaluating SnapTrace.</p>
              </SmoothReveal>

              <SmoothReveal delay={80} className="divide-y divide-slate-800/80 border-y border-slate-800/80">
                {FAQS.map((faq: { q: string; a: string }, idx: number) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div key={idx}>
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="group flex w-full cursor-pointer items-start justify-between gap-6 py-5 text-left transition"
                      >
                        <span className={'text-[15px] font-bold leading-snug transition-colors ' + (isOpen ? 'text-yellow-300' : 'text-white group-hover:text-yellow-200')}>
                          {faq.q}
                        </span>
                        <span className={'mt-0.5 shrink-0 text-slate-500 transition-transform duration-300 ' + (isOpen ? 'rotate-180 text-yellow-400' : '')}>
                          <IconChevron className="h-4 w-4" />
                        </span>
                      </button>
                      <div className="st-accordion" data-open={isOpen ? 'true' : 'false'}>
                        <div>
                          <p className="pb-6 pr-10 text-[14px] leading-relaxed text-slate-400 font-sans">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </SmoothReveal>
            </div>
          </section>

          {/* 15. FOOTER */}
          <footer className="relative overflow-hidden border-t border-slate-800/70 bg-[#060911] pb-28 pt-16 sm:pb-10 sm:pt-20">
            <div className="pointer-events-none absolute inset-0 overflow-hidden w-full max-w-full">
              <div className="pointer-events-none absolute -bottom-52 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(250,204,21,0.08),transparent)] blur-[90px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 space-y-12">
              <div className="mx-auto max-w-xl text-center space-y-3">
                <h2 className="st-h2 text-white">Ready to catch bugs in a snap?</h2>
                <p className="text-[14px] leading-relaxed text-slate-400 font-mono">
                  Join developers catching crashes in real time, with zero noise and instant AI diagnoses.
                </p>
                <div className="pt-2 font-mono">
                  <Link href="/signup" className={BTN_PRIMARY}>
                    Claim your free beta pass in 60s
                    <IconArrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-slate-800/80 pt-10 md:grid-cols-4 font-mono text-xs">
                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.14em] text-yellow-400 font-bold uppercase">COMPANY</span>
                  <ul className="space-y-2 text-slate-400">
                    <li><Link href="/about" className="transition hover:text-white">About SnapTrace</Link></li>
                    <li><a href="#features" className="transition hover:text-white">Engineering blog</a></li>
                    <li><a href="#ai-agent" className="transition hover:text-white">Careers</a></li>
                    <li><a href={'mailto:' + SUPPORT_EMAIL} className="text-yellow-300 transition hover:text-yellow-200 font-bold">Contact support</a></li>
                    <li><Link href="/privacy" className="transition hover:text-white">Trust and security</Link></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.14em] text-yellow-400 font-bold uppercase">PLATFORM</span>
                  <ul className="space-y-2 text-slate-400">
                    <li><a href="#features" className="transition hover:text-white">Telemetry ingestion</a></li>
                    <li><a href="#features" className="transition hover:text-white">&lt;3.4KB client SDK</a></li>
                    <li><a href="#ai-agent" className="transition hover:text-white">AI root-cause engine</a></li>
                    <li><a href="#pii" className="transition hover:text-white">Client-side PII firewall</a></li>
                    <li><a href="#grouping" className="transition hover:text-white">60s loop throttling</a></li>
                    <li><Link href="/dashboard" className="transition hover:text-white">Realtime WebSockets</Link></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.14em] text-yellow-400 font-bold uppercase">SOLUTIONS</span>
                  <ul className="space-y-2 text-slate-400">
                    <li><a href="#quickstart" className="transition hover:text-white">Next.js App Router</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Python and FastAPI</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Node.js / Express</a></li>
                    <li><a href="#quickstart" className="transition hover:text-white">Go, Rust and PHP</a></li>
                    <li><a href="#pricing" className="transition hover:text-white">Micro-SaaS and startups</a></li>
                    <li><a href="#pricing" className="transition hover:text-white">Agencies and studios</a></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] tracking-[0.14em] text-yellow-400 font-bold uppercase">GET HELP</span>
                  <ul className="space-y-2 text-slate-400">
                    <li>
                      <a href={'mailto:' + SUPPORT_EMAIL} className="block truncate font-bold text-yellow-300 transition hover:text-yellow-200">
                        {SUPPORT_EMAIL}
                      </a>
                    </li>
                    <li>
                      <button type="button" onClick={() => setShowFeedbackModal(true)} className="cursor-pointer text-left transition hover:text-yellow-300 font-semibold text-white">
                        Send product feedback
                      </button>
                    </li>
                    <li><a href="#quickstart" className="transition hover:text-white">SDK documentation</a></li>
                    <li><Link href="/demo" className="transition hover:text-yellow-300 font-bold">Public demo</Link></li>
                    <li><Link href="/test" className="transition hover:text-white">Live test sandbox</Link></li>
                    <li>
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Systems operational
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="overflow-hidden text-slate-800 pt-4">
                <svg className="h-3 w-full" viewBox="0 0 1200 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M0 6 Q 30 0, 60 6 T 120 6 T 180 6 T 240 6 T 300 6 T 360 6 T 420 6 T 480 6 T 540 6 T 600 6 T 660 6 T 720 6 T 780 6 T 840 6 T 900 6 T 960 6 T 1020 6 T 1080 6 T 1140 6 T 1200 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex flex-col items-center justify-between gap-5 text-[12px] text-slate-500 md:flex-row font-mono">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <Link href="/terms" className="transition hover:text-yellow-300">TERMS</Link>
                  <Link href="/privacy" className="transition hover:text-yellow-300">SECURITY & COMPLIANCE</Link>
                  <Link href="/privacy" className="transition hover:text-yellow-300">PRIVACY</Link>
                  <Link href="/about" className="transition hover:text-yellow-300">ABOUT</Link>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/Arslan009a"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SnapTrace on X (Twitter)"
                    className="p-2 text-slate-500 hover:text-white transition cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  <a
                    href="https://github.com/arxu009-alt/snaptrace-dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SnapTrace GitHub Repository"
                    className="p-2 text-slate-500 hover:text-white transition cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </a>

                  <a
                    href="https://discord.gg/eUkeFDpRU"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="SnapTrace Discord Community"
                    className="p-2 text-slate-500 hover:text-white transition cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-6 text-center font-mono text-[11px] text-slate-600">
                © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform. Built by developers, for developers.
              </div>
            </div>
          </footer>

          {/* Mobile Bottom CTA */}
          <div className="st-safe-b fixed inset-x-0 bottom-0 z-30 border-t border-slate-800/80 bg-[#070B13]/95 px-4 pt-3 backdrop-blur-xl sm:hidden">
            <Link href="/signup" className={BTN_PRIMARY + ' w-full font-mono'}>
              Claim Lifetime Pro Pass ($0) →
            </Link>
          </div>
        </>
      )}

      {/* FEEDBACK MODAL */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        aria-label="Send feedback"
        className={
          'fixed right-5 z-40 inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-yellow-400/30 bg-[#0B101D]/95 text-yellow-300 shadow-[0_16px_36px_-14px_rgba(0,0,0,0.9)] backdrop-blur-xl transition hover:border-yellow-400 hover:text-yellow-200 ' +
          (marketingMode ? 'bottom-24 sm:bottom-6' : 'bottom-6')
        }
        title="Send feedback directly to founders & engineering"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4"
        >
          <div className="st-card st-safe-b w-full max-w-md rounded-t-2xl border-yellow-400/30 p-6 sm:rounded-2xl sm:p-7 space-y-4">
            <div className="flex items-start justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 font-mono text-[10px] font-bold text-yellow-300">
                <IconMessage className="h-3 w-3" />
                FOUNDER FEEDBACK LOOP
              </span>
              <button
                onClick={closeFeedbackModal}
                aria-label="Close"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                <IconCross className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-[19px] font-bold tracking-tight text-white">Direct Engineering Feedback</h3>
              <p className="text-[13px] leading-relaxed text-slate-400 font-sans">
                Tell us what feature you need, report an edge case, or share your thoughts. Submitting will launch your Gmail web composer directly addressed to <strong className="text-yellow-300">{SUPPORT_EMAIL}</strong>.
              </p>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Category</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: 'feature', label: 'Feature Request' },
                  { id: 'bug', label: 'Bug Report' },
                  { id: 'ux', label: 'Developer UX' },
                  { id: 'general', label: 'General Feedback' },
                ].map((cat: { id: string; label: string }) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setFeedbackCategory(cat.id as FeedbackCategory)}
                    className={
                      'px-2.5 py-1.5 rounded-xl border text-left transition cursor-pointer ' +
                      (feedbackCategory === cat.id
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/60 font-bold'
                        : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white')
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="What can we build or improve to make SnapTrace your daily driver?"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-800 bg-[#05070E] p-3 text-base text-slate-200 placeholder-slate-600 transition focus:border-yellow-400/50 focus:outline-none sm:text-[13px] font-sans"
            />
            <input
              type="text"
              value={feedbackName}
              onChange={(e) => setFeedbackName(e.target.value)}
              placeholder="Your email or @handle (optional)"
              className="w-full rounded-xl border border-slate-800 bg-[#05070E] p-3 text-base text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-400 font-mono sm:text-[13px]"
            />

            <div className="space-y-2 font-mono">
              <button
                type="button"
                onClick={handleSendFeedback}
                disabled={!feedbackMessage.trim()}
                className={BTN_PRIMARY + ' w-full disabled:cursor-not-allowed disabled:opacity-40'}
              >
                <IconMail className="h-4 w-4" />
                {feedbackSent ? 'Opening Gmail Web Composer...' : 'Send via Gmail Web →'}
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

            <p className="text-center font-mono text-[10.5px] text-slate-500">
              All submissions route directly to {SUPPORT_EMAIL}
            </p>
          </div>
        </div>
      )}

      {/* AGENCY STUDIO MODAL */}
      {showAgencyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAgencyModal(false);
          }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
        >
          <div className="st-card relative w-full max-w-md rounded-2xl border-purple-400/30 p-7 space-y-4 font-sans">
            <button
              onClick={() => setShowAgencyModal(false)}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white font-mono"
            >
              <IconCross className="h-4 w-4" />
            </button>

            <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-bold text-purple-300">
              <IconBolt className="h-3 w-3" />
              AGENCY STUDIO · $49/MO
            </span>

            <h3 className="text-[19px] font-bold tracking-tight text-white">Request Agency Studio Access</h3>
            <p className="text-[13px] leading-relaxed text-slate-400">
              For web studios and software agencies managing multiple client projects (
              <strong className="text-slate-200">500,000 events/mo & UNLIMITED projects</strong>), contact our engineering desk for immediate activation:
            </p>

            <div className="rounded-xl border border-slate-800 bg-[#05070E] p-4 font-mono text-xs space-y-2">
              <span className="text-[10px] tracking-[0.12em] text-slate-500 font-bold block">FOUNDER AND ENGINEERING DESK</span>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-bold text-yellow-300 text-sm">{SUPPORT_EMAIL}</span>
                <button type="button" onClick={handleCopyEmail} className={BTN_GHOST_SM + ' shrink-0 cursor-pointer'}>
                  {copiedEmail ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
                  {copiedEmail ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2 font-mono">
              <a
                href={'https://mail.google.com/mail/?view=cm&fs=1&to=' + SUPPORT_EMAIL + '&su=SnapTrace%20Agency%20Studio%20Plan%20Inquiry'}
                target="_blank"
                rel="noopener noreferrer"
                className={BTN_PRIMARY + ' w-full text-center'}
              >
                <span>Compose in Gmail Web →</span>
              </a>
              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-full cursor-pointer rounded-xl px-5 py-2.5 text-[13px] font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="text-center font-mono text-[11px] text-slate-500">
              Guaranteed activation from our lead engineer within 24 hours.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}