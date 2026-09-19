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

/* ============================================================================
   DESIGN TOKENS (shared class strings — keeps the whole page consistent)
============================================================================ */

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-yellow-300 to-amber-500 px-5 py-3 text-[13px] font-semibold tracking-tight text-slate-950 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_12px_34px_-14px_rgba(250,204,21,0.75)] transition duration-200 hover:from-yellow-200 hover:to-amber-400 active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070E]';

const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-5 py-3 text-[13px] font-semibold tracking-tight text-slate-200 transition duration-200 hover:border-white/20 hover:bg-white/[0.07] hover:text-white active:translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30';

const CARD =
  'rounded-2xl border border-white/[0.07] bg-[#0A0F1A]/80 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]';

const MICRO_LABEL =
  'text-[10.5px] font-mono font-semibold uppercase tracking-[0.16em] text-slate-500';

/* ============================================================================
   ICONS — line icons drawn inline (no emoji, no icon library dependency)
============================================================================ */

function IconFeather({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.2 12.2a6 6 0 0 0-8.5-8.5L5 10.5V19h8.5z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </svg>
  );
}

function IconTarget({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function IconShield({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.5s7.5-3.6 7.5-9.5V5.6L12 2.5 4.5 5.6V12c0 5.9 7.5 9.5 7.5 9.5z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

function IconSpark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 16.5 19 18l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" />
    </svg>
  );
}

function IconBolt({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m20 6-11 11-5-5" />
    </svg>
  );
}

function IconCross({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconCopy({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15V6a2.5 2.5 0 0 1 2.5-2.5H15" />
    </svg>
  );
}

function IconArrow({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function IconChevron({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconMenu({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconTerminal({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 8 4 4-4 4" />
      <path d="M12 16h7" />
    </svg>
  );
}

function IconAlert({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 3.9 2.6 17.2A1.9 1.9 0 0 0 4.3 20h15.4a1.9 1.9 0 0 0 1.7-2.8L13.7 3.9a1.9 1.9 0 0 0-3.4 0z" />
      <path d="M12 9v4.5M12 17h.01" />
    </svg>
  );
}

function IconMute({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 6.5 6 10H3v4h3l4.5 3.5z" />
      <path d="m16 10 4 4M20 10l-4 4" />
    </svg>
  );
}

function IconUnlock({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 7.8-1.3" />
    </svg>
  );
}

function IconGauge({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17a8 8 0 1 1 16 0" />
      <path d="m12 14 4-4" />
    </svg>
  );
}

function IconLayers({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 8.5 4.5L12 12 3.5 7.5z" />
      <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
    </svg>
  );
}

function IconSend({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m4 12 16-8-6 16-2.5-6.5z" />
    </svg>
  );
}

/* ============================================================================
   BRAND MARKS — AI providers & IDEs, drawn as vectors
============================================================================ */

function GeminiMark({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="st-gemini-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="52%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
      <path
        fill="url(#st-gemini-grad)"
        d="M12 24A14.3 14.3 0 0 0 0 12 14.3 14.3 0 0 0 12 0a14.3 14.3 0 0 0 12 12 14.3 14.3 0 0 0-12 12z"
      />
    </svg>
  );
}

function OpenAIMark({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.998-2.9 6.056 6.056 0 0 0-.748-7.073zm-9.022 12.608a4.476 4.476 0 0 1-2.876-1.04l.142-.08 4.778-2.758a.795.795 0 0 0 .393-.681v-6.737l2.02 1.168a.07.07 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.495 4.493zm-9.66-4.125a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.758a.771.771 0 0 0 .78 0l5.843-3.368v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973v5.677a.766.766 0 0 0 .388.677l5.814 3.354-2.02 1.168a.076.076 0 0 1-.071 0L4 14.014a4.504 4.504 0 0 1-1.66-6.118zm16.597 3.855-5.833-3.387 2.015-1.163a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.668zm2.01-3.023-.142-.085-4.773-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zM8.307 12.863l-2.02-1.164a.08.08 0 0 1-.038-.057V6.074a4.5 4.5 0 0 1 7.376-3.454l-.142.081-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v3l-2.598 1.5-2.606-1.5z" />
    </svg>
  );
}

function AnthropicMark({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
        <line x1="12" y1="3.4" x2="12" y2="20.6" />
        <line x1="12" y1="3.4" x2="12" y2="20.6" transform="rotate(36 12 12)" />
        <line x1="12" y1="3.4" x2="12" y2="20.6" transform="rotate(72 12 12)" />
        <line x1="12" y1="3.4" x2="12" y2="20.6" transform="rotate(108 12 12)" />
        <line x1="12" y1="3.4" x2="12" y2="20.6" transform="rotate(144 12 12)" />
      </g>
    </svg>
  );
}

function DeepSeekMark({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 13.5c3.2-.6 5.1-2.6 8.4-2.6 2.8 0 4.9 1.4 6.4 3.1.7.8 1.7 1 2.7.6" />
      <path d="M20.5 14.6c-.5 2.2-2.6 3.8-5.5 3.8-3.6 0-5.6-1.9-7.6-3.4" />
      <path d="M11.4 10.9c-.5-1.9.3-3.7 2-4.9" />
      <circle cx="16.4" cy="13.4" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function OllamaMark({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 8.4C8 6 6.9 3.6 6 3.5c-.9-.1-1.4 2-1 4.4" />
      <path d="M16 8.4c0-2.4 1.1-4.8 2-4.9.9-.1 1.4 2 1 4.4" />
      <path d="M12 8c3 0 5 2.2 5 5.2 0 2-.4 3.2-.4 5.1 0 1.2-.9 2.2-2.1 2.2H9.5c-1.2 0-2.1-1-2.1-2.2 0-1.9-.4-3.1-.4-5.1C7 10.2 9 8 12 8z" />
      <path d="M10.4 13.3h.01M13.6 13.3h.01" />
    </svg>
  );
}

function CursorMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2.5 8.5 4.8v9.4L12 21.5 3.5 16.7V7.3z" />
      <path d="M12 12.1 20.5 7.3M12 12.1v9.4M12 12.1 3.5 7.3" />
    </svg>
  );
}

function VSCodeMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 2.2 22 4.4v15.2l-4.4 2.2-9.1-8-4 3L2 15.6V8.4l2.5-1.2 4 3zm0 5.1L11.7 12l5.9 4.7z" />
    </svg>
  );
}

/* Social marks (footer) */
function XMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GitHubMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedInMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function DiscordMark({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

/* ============================================================================
   SCROLL REVEAL
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
        'transform-gpu transition-all duration-500 ease-out motion-reduce:transition-none ' +
        (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  );
}

/* Small reusable heading block */
function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: 'center' | 'left';
}) {
  return (
    <div className={'space-y-3 ' + (align === 'center' ? 'text-center mx-auto max-w-2xl' : 'text-left max-w-xl')}>
      {eyebrow ? (
        <div
          className={
            'inline-flex items-center gap-2 ' +
            (align === 'center' ? 'justify-center' : '')
          }
        >
          <span className="h-px w-5 bg-gradient-to-r from-transparent to-yellow-400/60" />
          <span className="text-[11px] font-mono font-semibold tracking-[0.14em] text-yellow-400/90">{eyebrow}</span>
          <span className="h-px w-5 bg-gradient-to-l from-transparent to-yellow-400/60" />
        </div>
      ) : null}
      <h2 className="text-[26px] sm:text-4xl font-semibold tracking-[-0.02em] text-white leading-[1.12]">{title}</h2>
      {body ? <p className="text-sm text-slate-400 leading-relaxed">{body}</p> : null}
    </div>
  );
}

/* ============================================================================
   DEV TERMINAL KNOWLEDGE BASE
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
    return 'SnapTrace features a dual AI architecture:\n\n1. In-Dashboard BYOK Diagnostics:\nConnect your Google Gemini (100% Free via Gemini 2.5 Flash Lite) or OpenAI (GPT-4o) key in Settings for automated root-cause analysis and code patch diffs.\n\n2. 1-Click IDE Coding Agent Export:\nClicking "Copy for Cursor" generates an AI-optimized prompt pre-formatted with the environment, error message, and stack frames—ready for Cursor, Claude Code, or VS Code Copilot.';
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
    return 'We support 100% of languages through our open REST ingestion protocol. Pre-configured drop-in snippets are ready in the dashboard for:\n• Frontend: Next.js (App & Pages Router), React, Vue, Svelte, Vite, Vanilla JS\n• Backend: Node.js (Express/Nest), Python (FastAPI/Django), Go (Golang), Rust (Axum/Actix), PHP (Laravel/WordPress), C# (.NET), Ruby on Rails\n• Mobile & Edge: Flutter (Dart), Kotlin/Android, Cloudflare Workers, and raw cURL/Bash.';
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
    return 'Why developers switch to SnapTrace:\n1. Featherweight SDK: <3.4KB vs Sentry\'s 100KB+ bundle penalty [1.2.2].\n2. Zero Alert Fatigue: 60s noise throttling groups cascade crashes into 1 alert tagged [xN] [1.1.7].\n3. On-Device PII Masking: Passwords and cards scrubbed before transmission.\n4. Free BYOK AI: In-dashboard Gemini & OpenAI diagnostics without expensive enterprise add-ons.';
  }

  return 'SnapTrace is a featherweight (<5KB) error monitoring platform built to eliminate alert fatigue and 100KB SDK bloat [1.1.7, 1.2.2]. Try asking about:\n• "which ai models does this support?"\n• "how does cascading error collapse work?"\n• "why is the SDK under 5KB?"\n• "which languages are supported?"\n• "how does client PII masking work?"';
}

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

  // Dual Mode, Billing & UI Navigation States
  const [marketingMode, setMarketingMode] = useState(true);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeIdeTab, setActiveIdeTab] = useState<'cursor' | 'claude' | 'vscode'>('cursor');

  // Header chrome
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Agency Contact Modal State
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'hello.snaptrace@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
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
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMarketingMode = () => {
    setMarketingMode((prev) => !prev);
    setMobileNavOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const setMode = (wantMarketing: boolean) => {
    if (wantMarketing !== marketingMode) toggleMarketingMode();
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

  const snippets: Record<StackKey, string> = {
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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeQuickTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyCursorDemo = () => {
    const promptText = 'Act as an expert software engineer. Fix this runtime exception captured by SnapTrace:\nError: ReferenceError: Connection pool exhausted at 10:00:00 PM\nFile: database.js:18:11\nProvide a plain English diagnosis and the exact corrected code patch.';
    navigator.clipboard.writeText(promptText);
    setCopiedCursorPrompt(true);
    setTimeout(() => setCopiedCursorPrompt(false), 2500);
  };

  const faqs = [
    {
      q: 'How does SnapTrace collapse cascading multi-error outages?',
      a: 'During an outage, a single database connection drop often triggers 4 or 5 different downstream errors (auth fails, queries fail, UI renders fail). Instead of sending 5 separate noisy alerts that you have to piece together manually on a Sunday, SnapTrace groups cascading failures and isolates the single root cause with an instant AI fix [1.1.7].',
    },
    {
      q: 'Do I need to keep the SnapTrace website open to receive alerts?',
      a: 'No! The SnapTrace SDK runs silently inside your live application. When an unhandled crash happens in production, SnapTrace automatically pings your configured Discord channel, Slack room, and Gmail inbox in milliseconds.',
    },
    {
      q: 'How does SnapTrace integrate with VS Code, Cursor, and AI IDEs?',
      a: 'When an exception occurs, SnapTrace provides a 1-click "Copy for Cursor" button inside the Inspect modal. It generates an AI-optimized prompt containing the runtime environment, error message, and stack frames, ready to paste into Cursor, VS Code Copilot, or Claude Code for instant local code fixes [1.4.1, 1.4.2].',
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

  const stackTabs: Array<{ id: StackKey; label: string }> = [
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

  const navLinks = [
    { href: '#quickstart', label: 'SDK setup' },
    { href: '#comparison', label: 'Why SnapTrace' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 rounded-full border border-slate-800" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-yellow-400 animate-spin" />
          </div>
          <p className="text-[11px] font-mono tracking-[0.14em] text-slate-500">Authenticating session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden relative antialiased">

      {/* AMBIENT PAGE BACKDROP */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.055) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 90% 55% at 50% 0%, #000 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 55% at 50% 0%, #000 30%, transparent 85%)',
        }}
      />

      <div className="relative z-10">

        {/* ── 1. ANNOUNCEMENT BAR ─────────────────────────────────────────── */}
        <div className="relative border-b border-white/[0.06] bg-[#080C15]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
          <div className="max-w-7xl mx-auto px-5 py-2.5 flex items-center justify-center gap-3 text-center">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className={'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ' + (marketingMode ? 'bg-yellow-400' : 'bg-emerald-400')} />
              <span className={'relative inline-flex h-1.5 w-1.5 rounded-full ' + (marketingMode ? 'bg-yellow-400' : 'bg-emerald-400')} />
            </span>

            <span className={'text-[11px] font-mono font-semibold tracking-tight ' + (marketingMode ? 'text-yellow-300' : 'text-emerald-300')}>
              {marketingMode ? 'Early adopter launch' : 'Architecture spec'}
            </span>

            <span className="text-[11px] text-slate-300 truncate">
              {marketingMode ? 'Limited seats left for Lifetime Pro access' : 'RFC-9110 asynchronous ingestion engine active'}
            </span>

            <span className="hidden sm:inline text-[11px] text-slate-500 truncate">
              {marketingMode ? '— no credit card needed' : '— 0ms hydration penalty, <3.4KB gzipped'}
            </span>
          </div>
        </div>

        {/* ── 2. HEADER ───────────────────────────────────────────────────── */}
        <header
          className={
            'sticky top-0 z-40 transition-all duration-300 ' +
            (scrolled
              ? 'border-b border-white/[0.08] bg-[#070B13]/90 backdrop-blur-xl shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)]'
              : 'border-b border-white/[0.04] bg-[#070B13]/60 backdrop-blur-md')
          }
        >
          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between gap-5">
            <Link href="/" onClick={scrollToTop} className="shrink-0 rounded-lg transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60">
              <SnapTraceLogo size="md" showText={true} />
            </Link>

            <nav className="hidden lg:flex items-center gap-0.5 text-[13px] font-medium text-slate-300">
              {/* Dropdown 1: Platform */}
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('platform')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/[0.06] hover:text-white cursor-pointer">
                  <span>Platform</span>
                  <IconChevron className={'w-3 h-3 text-slate-500 transition-transform duration-200 ' + (openDropdown === 'platform' ? 'rotate-180' : '')} />
                </button>

                {openDropdown === 'platform' && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div className={'w-[340px] p-2 ' + CARD}>
                      <div className="px-2 pt-1.5 pb-2 text-[10.5px] font-mono uppercase tracking-[0.16em] text-slate-500">Core capabilities</div>
                      <a href="#features" className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05] group">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                          <IconFeather />
                        </span>
                        <span className="block">
                          <span className="block text-[13px] font-semibold text-white">Sub-5KB telemetry SDK</span>
                          <span className="block text-[11.5px] text-slate-400 leading-snug">Zero Core Web Vitals penalty</span>
                        </span>
                      </a>
                      <a href="#grouping" className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                          <IconTarget />
                        </span>
                        <span className="block">
                          <span className="block text-[13px] font-semibold text-white">Root-cause collapse</span>
                          <span className="block text-[11.5px] text-slate-400 leading-snug">Multi-crash incident grouping</span>
                        </span>
                      </a>
                      <a href="#features" className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
                          <IconShield />
                        </span>
                        <span className="block">
                          <span className="block text-[13px] font-semibold text-white">Client-side PII firewall</span>
                          <span className="block text-[11.5px] text-slate-400 leading-snug">On-device password &amp; card masking</span>
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown 2: AI Copilot */}
              <div
                className="relative"
                onMouseEnter={() => setOpenDropdown('ai')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/[0.06] hover:text-white cursor-pointer">
                  <IconSpark className="w-3.5 h-3.5 text-purple-300" />
                  <span>AI Copilot</span>
                  <IconChevron className={'w-3 h-3 text-slate-500 transition-transform duration-200 ' + (openDropdown === 'ai' ? 'rotate-180' : '')} />
                </button>

                {openDropdown === 'ai' && (
                  <div className="absolute top-full left-0 pt-2 z-50">
                    <div className={'w-[340px] p-2 ' + CARD}>
                      <div className="px-2 pt-1.5 pb-2 text-[10.5px] font-mono uppercase tracking-[0.16em] text-slate-500">AI capabilities</div>
                      <a href="#ai-agent" className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-400/10 text-purple-300">
                          <CursorMark />
                        </span>
                        <span className="block">
                          <span className="block text-[13px] font-semibold text-white">Cursor &amp; Claude 1-click export</span>
                          <span className="block text-[11.5px] text-slate-400 leading-snug">Pre-formatted prompts for your IDE [1.4.1, 1.4.2]</span>
                        </span>
                      </a>
                      <a href="#byok" className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.05]">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-yellow-400/20 bg-yellow-400/10 text-yellow-300">
                          <IconBolt />
                        </span>
                        <span className="block">
                          <span className="block text-[13px] font-semibold text-white">BYOK diagnosis hub</span>
                          <span className="block text-[11.5px] text-slate-400 leading-snug">Analyse bugs live with Gemini &amp; OpenAI</span>
                        </span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                </a>
              ))}

              <Link href="/about" className="rounded-lg px-3 py-2 transition hover:bg-white/[0.06] hover:text-white">
                About
              </Link>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-lg px-3 py-2 text-[13px] font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                Sign in
              </Link>

              <Link
                href="/demo"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[13px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                Live demo
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-yellow-300 to-amber-500 px-3.5 py-2 text-[13px] font-semibold text-slate-950 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_10px_26px_-14px_rgba(250,204,21,0.8)] transition hover:from-yellow-200 hover:to-amber-400"
              >
                Get started
              </Link>

              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="lg:hidden ml-1 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-300 transition hover:text-white cursor-pointer"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <IconClose /> : <IconMenu />}
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          {mobileNavOpen && (
            <div className="lg:hidden border-t border-white/[0.06] bg-[#070B13]/98 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-5 py-4 space-y-1 text-[14px]">
                <a href="#features" onClick={() => setMobileNavOpen(false)} className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] hover:text-white">Platform</a>
                <a href="#ai-agent" onClick={() => setMobileNavOpen(false)} className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] hover:text-white">AI Copilot</a>
                <a href="#byok" onClick={() => setMobileNavOpen(false)} className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] hover:text-white">Bring your own key</a>
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
                <Link href="/about" onClick={() => setMobileNavOpen(false)} className="block rounded-lg px-3 py-2.5 text-slate-300 hover:bg-white/[0.05] hover:text-white">About</Link>

                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Link href="/login" onClick={() => setMobileNavOpen(false)} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-[13px] font-semibold text-slate-200">Sign in</Link>
                  <Link href="/demo" onClick={() => setMobileNavOpen(false)} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-[13px] font-semibold text-slate-200">Live demo</Link>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 mt-2">
                  <span className="text-[12px] text-slate-400">Dev spec mode</span>
                  <button
                    onClick={toggleMarketingMode}
                    className={
                      'relative h-5 w-9 rounded-full transition-colors cursor-pointer ' +
                      (marketingMode ? 'bg-slate-700' : 'bg-gradient-to-r from-yellow-300 to-amber-500')
                    }
                    aria-label="Toggle dev spec mode"
                  >
                    <span className={'absolute top-1 h-3 w-3 rounded-full bg-slate-950 transition-all ' + (marketingMode ? 'left-1' : 'right-1')} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* ── MODE SWITCH (Marketing ↔ Dev spec) ──────────────────────────── */}
        <div className="max-w-7xl mx-auto px-5 relative">
          <div className="absolute right-5 top-4 z-30 hidden sm:block">
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0A0F1A]/90 p-1 backdrop-blur-xl shadow-[0_18px_40px_-24px_rgba(0,0,0,1)]">
              <button
                onClick={() => setMode(true)}
                title="Marketing overview"
                className={
                  'rounded-lg px-3 py-1.5 text-[11px] font-mono font-semibold transition cursor-pointer ' +
                  (marketingMode ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950' : 'text-slate-400 hover:text-white')
                }
              >
                Marketing
              </button>
              <button
                onClick={() => setMode(false)}
                title="Developer spec terminal"
                className={
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono font-semibold transition cursor-pointer ' +
                  (!marketingMode ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' : 'text-slate-400 hover:text-white')
                }
              >
                <IconTerminal className="w-3.5 h-3.5" />
                Dev spec
              </button>
            </div>
          </div>
        </div>

        {/* ══ VIEW 1: DEV TERMINAL ═════════════════════════════════════════ */}
        {!marketingMode ? (
          <section className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-5 py-10">
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-7">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.07] px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-emerald-300">marketing.js terminated — 0.0ms main thread blocking</span>
                  </div>

                  <h1 className="font-mono text-[34px] sm:text-5xl lg:text-[56px] font-bold tracking-[-0.03em] text-white leading-[1.02]">
                    No 100KB bundles.<br />
                    No 2 AM spam alerts.<br />
                    <span className="text-yellow-400">No Sunday log hunting.</span>
                  </h1>
                </div>

                <div className="space-y-3 text-[13px] leading-relaxed text-slate-400 max-w-lg">
                  <p>
                    <span className="text-slate-200 font-semibold">Why we built this: </span>
                    legacy APMs became bloated and noisy [1.1.7, 1.2.2]. A single database pool timeout triggers 4 downstream HTTP crashes, and traditional trackers spam your inbox with 4 separate alerts that you have to piece together by hand on a Sunday [1.1.7].
                  </p>
                  <p className="text-yellow-300/90">
                    SnapTrace collapses the entire outage cascade into <strong className="font-semibold text-yellow-300">1 consolidated root cause</strong> with a 2-line AI fix ready in seconds.
                  </p>
                </div>

                <div className={'p-5 ' + CARD}>
                  <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/[0.06]">
                    <IconGauge className="w-3.5 h-3.5 text-yellow-400" />
                    <span className={MICRO_LABEL}>Production benchmarks</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-[12px]">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-slate-500">SDK size</dt>
                      <dd className="font-semibold text-emerald-400">&lt; 3.4KB gzipped</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-slate-500">Transport</dt>
                      <dd className="font-semibold text-slate-200">sendBeacon (0ms)</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-slate-500">PII masking</dt>
                      <dd className="font-semibold text-emerald-400">Client-side regex</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-slate-500">AI workflow</dt>
                      <dd className="font-semibold text-purple-300">1-click Cursor / Claude [1.4.1, 1.4.2]</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/signup" className={BTN_PRIMARY}>
                    Get your free beta key
                    <IconArrow />
                  </Link>
                  <Link href="/demo" className={BTN_GHOST}>
                    <IconBolt className="w-3.5 h-3.5 text-yellow-300" />
                    Open demo workspace
                  </Link>
                </div>
              </div>

              {/* Terminal */}
              <div className="lg:col-span-6">
                <div className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#070B13] shadow-[0_40px_120px_-40px_rgba(16,185,129,0.25)]">
                  <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#0A0F1A] px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                      </span>
                      <span className="font-mono text-[12px] text-slate-300">
                        /snappy-cli <span className="text-slate-600">v1.0-beta</span>
                      </span>
                    </div>
                    <span className="hidden sm:inline font-mono text-[10.5px] text-slate-600">ask any technical question</span>
                  </div>

                  <div className="max-h-[320px] space-y-3 overflow-y-auto p-4">
                    {cliMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={
                          'rounded-xl p-3.5 text-[12.5px] ' +
                          (msg.role === 'user'
                            ? 'ml-8 border border-white/[0.08] bg-white/[0.04] text-yellow-200'
                            : 'mr-4 border border-emerald-500/20 bg-emerald-500/[0.04] text-slate-200')
                        }
                      >
                        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                          {msg.role === 'user' ? 'you' : 'snappy · engine'}
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="space-y-3 border-t border-white/[0.07] bg-[#0A0F1A] p-4">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleAskCli('which ai models does this support?')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-300 cursor-pointer"
                      >
                        Which AI models?
                      </button>
                      <button
                        onClick={() => handleAskCli('which languages does this support?')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-300 cursor-pointer"
                      >
                        Supported languages?
                      </button>
                      <button
                        onClick={() => handleAskCli('how does cascading error collapse work?')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-300 cursor-pointer"
                      >
                        Cascading collapse?
                      </button>
                      <button
                        onClick={() => handleAskCli('why is the SDK under 5KB?')}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[11px] text-slate-300 transition hover:border-yellow-400/40 hover:text-yellow-300 cursor-pointer"
                      >
                        Why under 5KB?
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (cliInput.trim()) handleAskCli(cliInput.trim());
                      }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[12px] text-emerald-500">&gt;</span>
                        <input
                          type="text"
                          placeholder="Ask any technical question..."
                          value={cliInput}
                          onChange={(e) => setCliInput(e.target.value)}
                          className="w-full rounded-lg border border-white/[0.08] bg-[#05070E] py-2.5 pl-7 pr-3 font-mono text-[12.5px] text-slate-200 placeholder-slate-600 transition focus:border-emerald-400/60 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2.5 font-mono text-[12px] font-semibold text-emerald-300 transition hover:bg-emerald-500/25 cursor-pointer"
                      >
                        Send
                        <IconSend />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* ══ VIEW 2: MARKETING ══════════════════════════════════════════ */
          <>
            {/* ── 3. HERO ─────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden pt-16 pb-16 sm:pt-20">
              <TelemetryBeamBackground />

              <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-yellow-500/[0.12] via-purple-500/[0.09] to-emerald-500/[0.10] blur-[150px]" />

              <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
                <a
                  href="#ai-agent"
                  className="group inline-flex items-center gap-2.5 rounded-full border border-purple-400/25 bg-purple-500/[0.08] py-1.5 pl-2 pr-4 transition hover:border-purple-400/50 hover:bg-purple-500/[0.14]"
                >
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-purple-200">New</span>
                  <span className="text-[12.5px] text-purple-100/90">
                    Fix production crashes right inside Cursor &amp; Claude Code [1.4.1, 1.4.2]
                  </span>
                  <IconArrow className="w-3.5 h-3.5 text-purple-300 transition-transform group-hover:translate-x-0.5" />
                </a>

                <h1 className="mt-8 text-[40px] sm:text-[62px] lg:text-[72px] font-semibold tracking-[-0.035em] text-white leading-[1.02]">
                  Code{' '}
                  <span className="relative inline-block text-red-400">
                    breaks
                    <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-gradient-to-r from-red-500/10 via-red-500/80 to-red-500/10" />
                  </span>
                  , fix it in a{' '}
                  <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 bg-clip-text text-transparent">snap.</span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-slate-400">
                  Stop spending Sundays connecting the dots by hand. SnapTrace collapses cascading multi-error outages into a single root-cause incident — under{' '}
                  <span className="font-mono font-semibold text-yellow-300">5KB</span>, with on-device PII masking and 1-click AI code fixes.
                </p>

                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/signup" className={BTN_PRIMARY + ' w-full sm:w-auto'}>
                    Claim lifetime Pro pass
                    <IconArrow />
                  </Link>
                  <Link href="/demo" className={BTN_GHOST + ' w-full sm:w-auto'}>
                    <IconBolt className="w-3.5 h-3.5 text-yellow-300" />
                    Open demo workspace — no signup
                  </Link>
                </div>

                {/* Install line */}
                <div className="mx-auto mt-10 max-w-2xl">
                  <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0A0F1A]/90 backdrop-blur-xl shadow-[0_30px_90px_-40px_rgba(0,0,0,1)]">
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">install — 1 line</span>
                      <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        ready
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-3.5 py-3">
                      <code className="flex-1 truncate text-left font-mono text-[12px] text-slate-300">
                        <span className="text-slate-600">&lt;script</span> src=&quot;https://snaptrace.../snaptrace.js&quot; data-api-key=&quot;
                        <span className="font-semibold text-yellow-300">YOUR_KEY</span>&quot; async
                        <span className="text-slate-600">&gt;&lt;/script&gt;</span>
                      </code>
                      <button
                        onClick={handleCopyHeroScript}
                        className={
                          'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11.5px] font-semibold transition cursor-pointer active:scale-95 ' +
                          (copiedHeroScript
                            ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                            : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:text-white')
                        }
                      >
                        {copiedHeroScript ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy />}
                        {copiedHeroScript ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11.5px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="w-3 h-3 text-emerald-500" /> Drop into HTML head</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="w-3 h-3 text-emerald-500" /> 0ms main thread delay</span>
                    <span className="inline-flex items-center gap-1.5"><IconCheck className="w-3 h-3 text-emerald-500" /> Under 5KB featherweight</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 4. ROOT-CAUSE SCANNER ───────────────────────────────────── */}
            <SmoothReveal className="mx-auto max-w-5xl px-5 pb-24" delay={40}>
              <div id="grouping" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0C1221] to-[#070B13] shadow-[0_40px_120px_-50px_rgba(250,204,21,0.25)]">
                <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#0A0F1A] px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                    </span>
                    <span className="text-[12.5px] font-medium text-slate-300">Live production incident scanner</span>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10.5px] font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    active root cause trace
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 md:grid-cols-12">
                  <div className="md:col-span-7">
                    <ol className="relative space-y-2 pl-6">
                      <span className="absolute left-[7px] top-3 bottom-6 w-px bg-gradient-to-b from-emerald-500/40 via-emerald-500/20 to-red-500/60" />

                      {[
                        'User submits checkout form',
                        'Frontend dispatches POST /v1/order',
                        'Next.js Server Action executes',
                      ].map((step) => (
                        <li key={step} className="relative flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#080C15] px-3.5 py-3">
                          <span className="absolute -left-6 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-2 border-emerald-500/60 bg-[#05070E]" />
                          <span className="text-[12.5px] text-slate-300">{step}</span>
                          <span className="font-mono text-[11px] font-semibold text-emerald-400">200 OK</span>
                        </li>
                      ))}

                      <li className="relative flex items-center justify-between rounded-xl border border-red-500/40 bg-red-950/30 px-3.5 py-3 shadow-[0_0_0_1px_rgba(239,68,68,0.15),0_18px_40px_-26px_rgba(239,68,68,0.8)]">
                        <span className="absolute -left-6 top-1/2 h-[15px] w-[15px] -translate-y-1/2 rounded-full border-2 border-red-500 bg-[#05070E]" />
                        <span className="flex items-center gap-2 font-mono text-[12.5px] font-semibold text-red-300">
                          <IconAlert className="w-3.5 h-3.5" />
                          database.js:18 pool.connect()
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-red-400">crash origin</span>
                      </li>
                    </ol>
                  </div>

                  <div className="md:col-span-5">
                    <div className="h-full rounded-xl border border-yellow-400/25 bg-[#080C15] p-5">
                      <div className="flex items-center gap-2">
                        <IconTarget className="w-3.5 h-3.5 text-yellow-400" />
                        <span className={MICRO_LABEL}>Collapse engine</span>
                      </div>
                      <h3 className="mt-3 text-[15px] font-semibold text-white">Root cause: connection pool exhaustion</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                        4 downstream HTTP 500 crashes collapsed under <code className="font-mono text-yellow-300">database.js</code>. The client connection was never released.
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3 font-mono text-[11.5px]">
                        <span className="text-slate-500">Code patch ready</span>
                        <span className="font-semibold text-emerald-400">client.release()</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SmoothReveal>

            {/* ── 5. SOCIAL PROOF ─────────────────────────────────────────── */}
            <SmoothReveal className="mx-auto max-w-5xl px-5 pb-24" delay={60}>
              <figure id="social-proof" className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0F1A]/70 p-7 sm:p-9">
                <span className="absolute left-0 top-8 h-16 w-[3px] rounded-r-full bg-gradient-to-b from-yellow-300 to-amber-500" />
                <span className="absolute right-6 top-4 select-none font-serif text-[86px] leading-none text-white/[0.04]">&rdquo;</span>

                <blockquote className="relative max-w-3xl text-[15px] leading-relaxed text-slate-300">
                  5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/30 bg-yellow-400/10 font-mono text-[12px] font-semibold text-yellow-300">
                    EB
                  </span>
                  <span className="block">
                    <span className="block text-[13px] font-semibold text-white">Eusebiu Balan</span>
                    <span className="block text-[11.5px] text-slate-500">Senior full-stack engineer · via Dev.to</span>
                  </span>
                </figcaption>
              </figure>
            </SmoothReveal>

            {/* ── 6. AI AGENT EXPORT ──────────────────────────────────────── */}
            <section id="ai-agent" className="border-t border-white/[0.05] py-24">
              <div className="mx-auto max-w-5xl px-5 space-y-10">
                <SmoothReveal>
                  <SectionHeading
                    eyebrow="AI workflow native"
                    title="Turn runtime stack traces into instant AI bug fixes"
                    body="Export pre-formatted, AI-ready crash diagnostics straight into Cursor, Claude Code, or VS Code Copilot and generate 2-line patches locally in your IDE [1.4.1, 1.4.2]."
                  />

                  <div className="mt-7 flex items-center justify-center">
                    <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0A0F1A] p-1">
                      {([
                        { id: 'cursor', label: 'Cursor IDE', mark: <CursorMark className="w-3.5 h-3.5" /> },
                        { id: 'claude', label: 'Claude Code', mark: <AnthropicMark className="w-3.5 h-3.5" /> },
                        { id: 'vscode', label: 'VS Code Copilot', mark: <VSCodeMark className="w-3.5 h-3.5" /> },
                      ] as const).map((ide) => (
                        <button
                          key={ide.id}
                          onClick={() => setActiveIdeTab(ide.id)}
                          className={
                            'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition cursor-pointer ' +
                            (activeIdeTab === ide.id
                              ? 'bg-purple-600/90 text-white shadow-[0_10px_30px_-16px_rgba(147,51,234,1)]'
                              : 'text-slate-400 hover:text-white')
                          }
                        >
                          {ide.mark}
                          {ide.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </SmoothReveal>

                <SmoothReveal delay={100}>
                  <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0F1A]/80 backdrop-blur-xl">
                    <div className="flex flex-col gap-3 border-b border-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-400">
                          <IconAlert className="w-3.5 h-3.5" />
                        </span>
                        <span className="block">
                          <span className="block font-mono text-[12.5px] font-semibold text-red-300">ReferenceError: Connection pool exhausted</span>
                          <span className="block font-mono text-[11px] text-slate-500">captured at database.js:18:11</span>
                        </span>
                      </div>

                      <button
                        onClick={handleCopyCursorDemo}
                        className={
                          'inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-4 py-2.5 text-[12.5px] font-semibold transition cursor-pointer sm:self-auto ' +
                          (copiedCursorPrompt
                            ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                            : 'bg-gradient-to-b from-purple-500 to-indigo-600 text-white shadow-[0_14px_34px_-18px_rgba(129,88,246,1)] hover:from-purple-400 hover:to-indigo-500')
                        }
                      >
                        {copiedCursorPrompt ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy />}
                        {copiedCursorPrompt ? 'Copied AI prompt' : 'Copy prompt for Cursor / Claude [1.4.1, 1.4.2]'}
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="rounded-xl border border-purple-500/25 bg-[#080C15] p-5">
                        <div className="flex items-center gap-2 text-purple-300">
                          <IconSpark className="w-3.5 h-3.5" />
                          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em]">Instant root-cause diagnosis</span>
                        </div>

                        <p className="mt-3 text-[13px] leading-relaxed text-slate-300">
                          <span className="font-semibold text-white">Plain English: </span>
                          the PostgreSQL client in <code className="font-mono text-yellow-300">database.js</code> opens connections inside a tight loop without releasing them back to the pool.
                        </p>

                        <div className="mt-4 overflow-hidden rounded-lg border border-white/[0.07] bg-[#05070E]">
                          <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
                            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">database.js — patch</span>
                            <span className="font-mono text-[10.5px] text-emerald-400">+3 −1</span>
                          </div>
                          <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-emerald-300">
                            {'// Fix in database.js: Release connection back to pool\nconst client = await pool.connect();\ntry {\n  await client.query(\'SELECT * FROM users WHERE id = $1\', [userId]);\n} finally {\n  client.release(); // Releases connection\n}'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </SmoothReveal>
              </div>
            </section>

            {/* ── 7. BYOK ─────────────────────────────────────────────────── */}
            <section id="byok" className="relative border-t border-white/[0.05] bg-gradient-to-b from-[#080C15] to-[#05070E] py-24">
              <div className="mx-auto max-w-5xl px-5 space-y-12">
                <SmoothReveal>
                  <SectionHeading
                    eyebrow="Zero platform markup"
                    title="Bring your own key"
                    body="Analyse and fix runtime crashes inside your dashboard with your favourite AI models. No enterprise markups, no vendor lock-in."
                  />
                </SmoothReveal>

                <SmoothReveal delay={80}>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* Gemini */}
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-6 transition duration-300 hover:border-yellow-400/30">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                          <GeminiMark className="w-6 h-6" />
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-400">
                          free tier
                        </span>
                      </div>
                      <h3 className="mt-5 text-[15px] font-semibold text-white">Google Gemini</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                        Integrated with <span className="font-medium text-slate-200">Gemini 2.5 Flash Lite</span>. Lightning-fast root-cause explanations and copy-paste patches inside your Inspect modal, at $0 cost.
                      </p>
                    </div>

                    {/* OpenAI */}
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-6 transition duration-300 hover:border-yellow-400/30">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/15 to-transparent blur-2xl opacity-0 transition duration-500 group-hover:opacity-100" />
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white">
                          <OpenAIMark className="w-6 h-6" />
                        </span>
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-yellow-300">
                          GPT-4o ready
                        </span>
                      </div>
                      <h3 className="mt-5 text-[15px] font-semibold text-white">OpenAI models</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                        Paste your standard OpenAI key (<code className="font-mono text-yellow-300">sk-...</code>) to analyse deep stack traces with state-of-the-art reasoning models. Stored securely on your device.
                      </p>
                    </div>

                    {/* In pipeline */}
                    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-6 transition duration-300 hover:border-purple-400/30">
                      <div className="flex items-start justify-between">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-purple-300">
                          <IconLayers className="w-5 h-5" />
                        </span>
                        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-purple-300">
                          in pipeline
                        </span>
                      </div>
                      <h3 className="mt-5 text-[15px] font-semibold text-white">More models coming</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                        Direct API support for Claude 3.5 Sonnet, DeepSeek R1, and Ollama for 100% private local offline diagnostics.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10.5px] text-slate-300">
                          <AnthropicMark className="w-3.5 h-3.5 text-[#D97757]" /> Claude
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10.5px] text-slate-300">
                          <DeepSeekMark className="w-3.5 h-3.5 text-sky-400" /> DeepSeek
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10.5px] text-slate-300">
                          <OllamaMark className="w-3.5 h-3.5 text-slate-200" /> Ollama
                        </span>
                      </div>
                    </div>
                  </div>
                </SmoothReveal>
              </div>
            </section>

            {/* ── 8. QUICKSTART (12 stacks) ───────────────────────────────── */}
            <SmoothReveal className="mx-auto max-w-5xl px-5 py-24" delay={40}>
              <div id="quickstart" className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0A0F1A] shadow-[0_40px_120px_-60px_rgba(0,0,0,1)]">
                <div className="flex flex-col gap-3 border-b border-white/[0.07] bg-[#080C15] px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="mr-1 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">stack</span>
                    {stackTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveQuickTab(tab.id)}
                        className={
                          'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 font-mono text-[11.5px] font-medium transition cursor-pointer ' +
                          (activeQuickTab === tab.id
                            ? 'bg-yellow-400/12 text-yellow-300 ring-1 ring-yellow-400/30'
                            : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100')
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className={
                      'inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border px-3 py-1.5 font-mono text-[11.5px] font-semibold transition cursor-pointer md:self-auto ' +
                      (copiedSnippet
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:text-white')
                    }
                  >
                    {copiedSnippet ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy />}
                    {copiedSnippet ? 'Snippet copied' : 'Copy SDK code'}
                  </button>
                </div>

                <div className="overflow-x-auto bg-[#05070E] p-5">
                  <div className="min-w-max select-text font-mono text-[12px] leading-[1.75]">
                    {snippets[activeQuickTab].split('\n').map((line, i) => (
                      <div key={i} className="flex">
                        <span className="w-9 shrink-0 select-none pr-4 text-right text-slate-700">{i + 1}</span>
                        <span className="whitespace-pre text-slate-300">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SmoothReveal>

            {/* ── 9. FEATHERWEIGHT SDK ────────────────────────────────────── */}
            <section id="features" className="border-t border-white/[0.05] bg-[#060911]/60 py-24">
              <div className="mx-auto max-w-5xl px-5">
                <SmoothReveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                  <div className="lg:col-span-6 space-y-6">
                    <SectionHeading
                      align="left"
                      eyebrow="Performance"
                      title="An error tracker that never slows your users down"
                      body="Legacy APMs force your users to download 100KB+ bundles that delay First Contentful Paint and hurt Lighthouse scores [1.2.2]. SnapTrace is a zero-dependency script under 5KB gzipped."
                    />

                    <div className="space-y-3 pt-1">
                      {[
                        { name: 'SnapTrace JS telemetry SDK', size: '< 5 KB', width: '6%', tone: 'text-emerald-400', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500', dim: '' },
                        { name: 'Honeybadger client', size: '~35 KB', width: '35%', tone: 'text-slate-400', bar: 'bg-slate-600', dim: 'opacity-80' },
                        { name: 'Sentry browser SDK', size: '100+ KB', width: '100%', tone: 'text-red-400', bar: 'bg-gradient-to-r from-red-500/70 to-red-500', dim: 'opacity-70' },
                      ].map((row) => (
                        <div key={row.name} className={'rounded-xl border border-white/[0.06] bg-[#0A0F1A] p-3.5 ' + row.dim}>
                          <div className="flex items-center justify-between text-[12.5px]">
                            <span className="text-slate-300">{row.name}</span>
                            <span className={'font-mono font-semibold ' + row.tone}>{row.size}</span>
                          </div>
                          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                            <div className={'h-full rounded-full ' + row.bar} style={{ width: row.width }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-6">
                    <div className={'p-6 sm:p-7 ' + CARD}>
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                        <span className="flex items-center gap-2 text-[12.5px] text-slate-300">
                          <IconGauge className="w-4 h-4 text-yellow-400" />
                          Google Lighthouse impact
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-400">
                          100 / 100
                        </span>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/[0.06] bg-[#080C15] p-5">
                          <div className="font-mono text-[26px] font-semibold tracking-tight text-emerald-400">0.0ms</div>
                          <p className="mt-1 text-[11.5px] text-slate-500">Main thread delay</p>
                        </div>
                        <div className="rounded-xl border border-white/[0.06] bg-[#080C15] p-5">
                          <div className="font-mono text-[26px] font-semibold tracking-tight text-emerald-400">3.4 KB</div>
                          <p className="mt-1 text-[11.5px] text-slate-500">Total gzipped size</p>
                        </div>
                      </div>

                      <p className="mt-5 border-t border-white/[0.06] pt-4 text-[12.5px] italic leading-relaxed text-slate-400">
                        &ldquo;We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly.&rdquo;
                      </p>
                    </div>
                  </div>
                </SmoothReveal>
              </div>
            </section>

            {/* ── 10. COMPARISON ──────────────────────────────────────────── */}
            <section id="comparison" className="mx-auto max-w-5xl px-5 py-24 border-t border-white/[0.05]">
              <SmoothReveal>
                <SectionHeading
                  eyebrow="Comparison"
                  title="Why developers choose SnapTrace"
                  body="Built to replace bloated, noisy enterprise APMs [1.1.7, 1.2.2]."
                />
              </SmoothReveal>

              <SmoothReveal className="mt-10" delay={80}>
                <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0A0F1A]">
                  <table className="w-full min-w-[720px] text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-[#080C15]">
                        <th className="p-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-slate-500">Feature</th>
                        <th className="relative p-4 text-[13px] font-semibold text-yellow-300">
                          <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-yellow-400/0 via-yellow-400 to-yellow-400/0" />
                          SnapTrace
                        </th>
                        <th className="p-4 text-[13px] font-medium text-slate-400">Sentry</th>
                        <th className="p-4 text-[13px] font-medium text-slate-400">GlitchTip</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] text-slate-400">
                      {[
                        { f: 'SDK weight', s: 'Under 5 KB', sentry: '~100 KB+', g: '~100 KB+', ok: true },
                        { f: 'Cascading root-cause collapse', s: 'Multi-crash unified incident', sentry: 'Noisy separate alerts [1.1.7]', g: 'None', ok: true },
                        { f: 'Free tier events', s: '2,000 / month', sentry: '5,000 / month', g: '1,000 / month', ok: true },
                        { f: 'Client-side PII scrubbing', s: 'Native on-device', sentry: 'Complex server rules', g: 'None', ok: true },
                        { f: 'In-dashboard AI diagnosis (BYOK)', s: 'Included in Pro', sentry: 'Expensive add-on', g: 'None', ok: true },
                        { f: '1-click prompt export for Cursor', s: 'Free forever', sentry: 'Manual copy', g: 'Manual copy', ok: true },
                      ].map((row) => (
                        <tr key={row.f} className="transition hover:bg-white/[0.02]">
                          <td className="p-4 font-medium text-white">{row.f}</td>
                          <td className="bg-yellow-400/[0.03] p-4">
                            <span className="inline-flex items-center gap-2 font-medium text-emerald-400">
                              <IconCheck className="w-3.5 h-3.5 shrink-0" />
                              {row.s}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500">{row.sentry}</td>
                          <td className="p-4 text-slate-500">
                            {row.g === 'None' ? (
                              <span className="inline-flex items-center gap-2">
                                <IconCross className="w-3.5 h-3.5 text-slate-600" />
                                None
                              </span>
                            ) : (
                              row.g
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SmoothReveal>
            </section>

            {/* ── 11. PRICING ─────────────────────────────────────────────── */}
            <section id="pricing" className="border-t border-white/[0.05] py-24">
              <div className="mx-auto max-w-6xl px-5">
                <SmoothReveal>
                  <SectionHeading
                    eyebrow="Pricing"
                    title="Simple, developer-first plans"
                    body="No surprise overage bills. Generous headroom for solo builders and client studios."
                  />

                  <div className="mt-7 flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-[#0A0F1A] p-1">
                      <button
                        onClick={() => setBillingInterval('monthly')}
                        className={
                          'rounded-lg px-4 py-2 text-[12.5px] font-semibold transition cursor-pointer ' +
                          (billingInterval === 'monthly' ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:text-white')
                        }
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingInterval('annual')}
                        className={
                          'flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold transition cursor-pointer ' +
                          (billingInterval === 'annual'
                            ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-yellow-300')
                        }
                      >
                        Annual
                        <span
                          className={
                            'rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ' +
                            (billingInterval === 'annual' ? 'bg-slate-950 text-yellow-300' : 'bg-yellow-400/10 text-yellow-300')
                          }
                        >
                          Save 20% + 2 months free
                        </span>
                      </button>
                    </div>

                    {billingInterval === 'annual' && (
                      <p className="flex items-center gap-1.5 font-mono text-[11.5px] text-emerald-400">
                        <IconCheck className="w-3.5 h-3.5" />
                        Billed annually — includes 2 months completely free
                      </p>
                    )}
                  </div>
                </SmoothReveal>

                <SmoothReveal className="mt-12" delay={80}>
                  <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">

                    {/* Tier 1 — Developer Free */}
                    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-7 transition hover:border-white/15">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">Developer Free</span>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-[34px] font-semibold tracking-tight text-white">$0</span>
                          <span className="font-mono text-[12px] text-slate-500">/ month</span>
                        </div>
                        <p className="mt-2 text-[12.5px] text-slate-400">For side projects and personal experiments.</p>

                        <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-[12.5px] text-slate-300">
                          {[
                            '2,000 events / month',
                            '7-day data retention',
                            '1 active project',
                            'Sub-5KB SDK & 0ms main thread delay',
                            'In-dashboard error inspection',
                            'Client-side regex PII firewall',
                            'Email & in-app alerts (no webhooks)',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <IconCheck className="mt-0.5 w-3.5 h-3.5 shrink-0 text-emerald-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        href="/signup"
                        className="mt-7 block w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 text-center text-[13px] font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                      >
                        Start free forever
                      </Link>
                    </div>

                    {/* Tier 2 — Pro Builder */}
                    <div className="relative flex flex-col justify-between rounded-2xl border border-yellow-400/40 bg-gradient-to-b from-[#12172A] to-[#070B14] p-7 shadow-[0_40px_110px_-45px_rgba(250,204,21,0.45)] lg:-translate-y-3">
                      <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 px-3 py-1 font-mono text-[10px] font-semibold text-slate-950">
                        Popular for solo devs
                      </span>

                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-yellow-400">Pro Builder</span>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-[34px] font-semibold tracking-tight text-white">
                            {billingInterval === 'annual' ? '$15' : '$19'}
                          </span>
                          <span className="font-mono text-[12px] text-slate-400">/ month</span>
                        </div>
                        <p className="mt-2 text-[12.5px] text-slate-400">
                          {billingInterval === 'annual' ? 'Billed annually at $180/yr.' : 'For solo developers, freelancers & micro-SaaS.'}
                        </p>

                        <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-[12.5px] text-slate-200">
                          {[
                            '75,000 events / month',
                            '30-day telemetry retention',
                            'Up to 5 active projects',
                            'Instant Discord, Slack & Telegram alerts',
                            '1-click Cursor & Claude AI fix prompts [1.4.1, 1.4.2]',
                            '60s loop deduplication ([x50] noise throttling) [1.1.7]',
                            'In-dashboard BYOK AI Copilot',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <IconCheck className="mt-0.5 w-3.5 h-3.5 shrink-0 text-yellow-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link href="/signup" className={BTN_PRIMARY + ' mt-7 w-full'}>
                        Claim Pro beta pass
                        <IconArrow />
                      </Link>
                    </div>

                    {/* Tier 3 — Agency Studio */}
                    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-7 transition hover:border-purple-400/30">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-purple-400">Agency Studio</span>
                          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-purple-300">
                            for agencies
                          </span>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-[34px] font-semibold tracking-tight text-white">
                            {billingInterval === 'annual' ? '$39' : '$49'}
                          </span>
                          <span className="font-mono text-[12px] text-slate-500">/ month</span>
                        </div>
                        <p className="mt-2 text-[12.5px] text-slate-400">
                          {billingInterval === 'annual' ? 'Billed annually at $468/yr.' : 'For web studios & agencies managing multiple client sites.'}
                        </p>

                        <ul className="mt-6 space-y-3 border-t border-white/[0.06] pt-6 text-[12.5px] text-slate-300">
                          {[
                            '500,000 events / month',
                            '90-day telemetry retention',
                            'Unlimited client projects & keys',
                            'Multi-seat team & client invites',
                            'Cascading multi-error outage collapse',
                            'Priority edge ingestion gateways',
                            'Raw log CSV / JSON data export',
                          ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <IconCheck className="mt-0.5 w-3.5 h-3.5 shrink-0 text-purple-400" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAgencyModal(true)}
                        className="mt-7 block w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 text-center text-[13px] font-semibold text-white transition hover:border-purple-400/40 hover:bg-purple-500/10 cursor-pointer"
                      >
                        Request agency access
                      </button>
                    </div>

                  </div>
                </SmoothReveal>
              </div>
            </section>

            {/* ── 12. SECURITY ────────────────────────────────────────────── */}
            <section className="border-t border-white/[0.05] bg-[#060911]/60 py-20">
              <div className="mx-auto max-w-5xl px-5">
                <SmoothReveal>
                  <SectionHeading
                    eyebrow="Security by default"
                    title="Built for developer privacy and performance"
                  />
                </SmoothReveal>

                <SmoothReveal className="mt-10" delay={60}>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { icon: <IconShield className="w-4 h-4" />, tone: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10', title: 'GDPR ready', body: 'On-device PII masking' },
                      { icon: <IconFeather className="w-4 h-4" />, tone: 'text-yellow-300 border-yellow-400/20 bg-yellow-400/10', title: 'Under 5KB', body: '100/100 Core Web Vitals' },
                      { icon: <IconMute className="w-4 h-4" />, tone: 'text-sky-300 border-sky-400/20 bg-sky-400/10', title: 'Anti-noise guard', body: 'SHA-256 loop throttling [1.1.7]' },
                      { icon: <IconUnlock className="w-4 h-4" />, tone: 'text-purple-300 border-purple-400/20 bg-purple-400/10', title: 'No vendor lock-in', body: 'Universal REST protocol' },
                    ].map((card) => (
                      <div key={card.title} className="rounded-2xl border border-white/[0.07] bg-[#0A0F1A] p-5 transition hover:border-white/15">
                        <span className={'flex h-9 w-9 items-center justify-center rounded-lg border ' + card.tone}>
                          {card.icon}
                        </span>
                        <div className="mt-4 text-[13px] font-semibold text-white">{card.title}</div>
                        <div className="mt-1 text-[11.5px] leading-snug text-slate-500">{card.body}</div>
                      </div>
                    ))}
                  </div>
                </SmoothReveal>
              </div>
            </section>

            {/* ── 13. FAQ ─────────────────────────────────────────────────── */}
            <section id="faq" className="mx-auto max-w-3xl px-5 py-24 border-t border-white/[0.05]">
              <SmoothReveal>
                <SectionHeading
                  eyebrow="FAQ"
                  title="Frequently asked questions"
                  body="Real technical answers for developers evaluating SnapTrace."
                />
              </SmoothReveal>

              <SmoothReveal className="mt-10 space-y-2.5" delay={60}>
                {faqs.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={
                        'overflow-hidden rounded-xl border transition duration-200 ' +
                        (isOpen ? 'border-yellow-400/25 bg-[#0C1221]' : 'border-white/[0.07] bg-[#0A0F1A] hover:border-white/15')
                      }
                    >
                      <button
                        onClick={() => setActiveFaq(isOpen ? null : idx)}
                        className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className={'text-[13.5px] font-semibold transition ' + (isOpen ? 'text-yellow-300' : 'text-white')}>
                          {faq.q}
                        </span>
                        <IconChevron className={'w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ' + (isOpen ? 'rotate-180' : '')} />
                      </button>
                      {isOpen && (
                        <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 text-[13px] leading-relaxed text-slate-400">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </SmoothReveal>
            </section>

            {/* ── 14. FOOTER ──────────────────────────────────────────────── */}
            <footer className="relative overflow-hidden border-t border-white/[0.06] bg-[#060911] pb-12 pt-20">
              <div className="mx-auto max-w-6xl space-y-14 px-5">

                {/* Closing CTA */}
                <div className="mx-auto max-w-xl space-y-4 text-center">
                  <h2 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-white">
                    Ready to catch bugs in a snap?
                  </h2>
                  <p className="text-[13px] leading-relaxed text-slate-400">
                    Join developers catching crashes in real time with zero noise and instant AI diagnoses.
                  </p>
                  <div className="pt-1">
                    <Link href="/signup" className={BTN_PRIMARY}>
                      Claim your free beta pass
                      <IconArrow />
                    </Link>
                  </div>
                </div>

                {/* Link grid */}
                <div className="grid grid-cols-2 gap-10 border-t border-white/[0.06] pt-12 lg:grid-cols-12">
                  <div className="col-span-2 space-y-4 lg:col-span-4">
                    <SnapTraceLogo size="md" showText={true} />
                    <p className="max-w-[260px] text-[12.5px] leading-relaxed text-slate-500">
                      The modern developer telemetry platform. Featherweight crash monitoring with root-cause collapse and AI fixes.
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2.5 py-1 font-mono text-[10.5px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Systems operational
                    </span>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">Company</span>
                    <ul className="space-y-2.5 text-[12.5px] text-slate-400">
                      <li><Link href="/about" className="transition hover:text-white">About SnapTrace</Link></li>
                      <li><a href="#features" className="transition hover:text-white">Engineering blog</a></li>
                      <li><a href="#ai-agent" className="transition hover:text-white">Careers</a></li>
                      <li><a href="mailto:hello.snaptrace@gmail.com" className="font-medium text-slate-300 transition hover:text-yellow-300">Contact support</a></li>
                      <li><Link href="/privacy" className="transition hover:text-white">Trust &amp; security</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">Platform</span>
                    <ul className="space-y-2.5 text-[12.5px] text-slate-400">
                      <li><a href="#features" className="transition hover:text-white">Telemetry ingestion</a></li>
                      <li><a href="#features" className="transition hover:text-white">Sub-5KB client SDK</a></li>
                      <li><a href="#ai-agent" className="transition hover:text-white">AI root cause engine</a></li>
                      <li><a href="#features" className="transition hover:text-white">Client-side PII firewall</a></li>
                      <li><a href="#features" className="transition hover:text-white">60s loop throttling [1.1.7]</a></li>
                      <li><Link href="/dashboard" className="transition hover:text-white">Realtime WebSockets</Link></li>
                    </ul>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">Solutions</span>
                    <ul className="space-y-2.5 text-[12.5px] text-slate-400">
                      <li><a href="#quickstart" className="transition hover:text-white">Next.js App Router</a></li>
                      <li><a href="#quickstart" className="transition hover:text-white">Python &amp; FastAPI</a></li>
                      <li><a href="#quickstart" className="transition hover:text-white">Node.js / Express</a></li>
                      <li><a href="#quickstart" className="transition hover:text-white">Go, Rust &amp; PHP</a></li>
                      <li><a href="#pricing" className="transition hover:text-white">Micro-SaaS &amp; startups</a></li>
                      <li><a href="#pricing" className="transition hover:text-white">Agencies &amp; studios</a></li>
                    </ul>
                  </div>

                  <div className="space-y-3 lg:col-span-2">
                    <span className="block font-mono text-[10.5px] uppercase tracking-[0.16em] text-slate-500">Get help</span>
                    <ul className="space-y-2.5 text-[12.5px] text-slate-400">
                      <li>
                        <a href="mailto:hello.snaptrace@gmail.com" className="block truncate font-medium text-yellow-300 hover:underline">
                          hello.snaptrace@gmail.com
                        </a>
                      </li>
                      <li><a href="#quickstart" className="transition hover:text-white">SDK documentation</a></li>
                      <li><Link href="/demo" className="font-medium text-slate-300 transition hover:text-yellow-300">Public demo</Link></li>
                      <li><Link href="/test" className="transition hover:text-white">Live test sandbox</Link></li>
                    </ul>
                  </div>
                </div>

                {/* Signature wave */}
                <div className="w-full overflow-hidden text-slate-800/80">
                  <svg className="h-3 w-full" viewBox="0 0 1200 12" fill="none" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M0 6 Q 30 0, 60 6 T 120 6 T 180 6 T 240 6 T 300 6 T 360 6 T 420 6 T 480 6 T 540 6 T 600 6 T 660 6 T 720 6 T 780 6 T 840 6 T 900 6 T 960 6 T 1020 6 T 1080 6 T 1140 6 T 1200 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Legal + social */}
                <div className="flex flex-col items-center justify-between gap-5 pt-2 text-[12px] text-slate-500 md:flex-row">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    <Link href="/terms" className="transition hover:text-yellow-300">Terms</Link>
                    <Link href="/privacy" className="transition hover:text-yellow-300">Security &amp; compliance</Link>
                    <Link href="/privacy" className="transition hover:text-yellow-300">Privacy</Link>
                    <Link href="/about" className="transition hover:text-yellow-300">About</Link>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500">
                    <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="X (Twitter)">
                      <XMark />
                    </a>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="GitHub">
                      <GitHubMark />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="LinkedIn">
                      <LinkedInMark />
                    </a>
                    <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-white" aria-label="Discord">
                      <DiscordMark />
                    </a>
                  </div>
                </div>

                <div className="border-t border-white/[0.05] pt-6 text-center font-mono text-[11px] text-slate-600">
                  © {new Date().getFullYear()} SnapTrace. The modern developer telemetry platform.
                </div>
              </div>
            </footer>
          </>
        )}

        {/* ── AGENCY STUDIO CONTACT MODAL ─────────────────────────────────── */}
        {showAgencyModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAgencyModal(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-purple-500/30 bg-[#0A0F1A] p-7 shadow-[0_50px_120px_-40px_rgba(0,0,0,1)]">
              <button
                onClick={() => setShowAgencyModal(false)}
                className="absolute right-5 top-5 text-slate-500 transition hover:text-white cursor-pointer"
                aria-label="Close"
              >
                <IconClose className="w-4 h-4" />
              </button>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-purple-300">
                <IconBolt className="w-3 h-3" />
                Agency Studio — $49/mo
              </span>

              <h3 className="mt-4 text-[17px] font-semibold tracking-tight text-white">Request Agency Studio access</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
                For web development studios and software agencies managing multiple client projects
                (<span className="font-medium text-slate-200">500,000 events/mo and unlimited projects</span>), contact our engineering desk for immediate activation.
              </p>

              <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#05070E] p-4">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                  Direct founder &amp; engineering desk
                </span>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-[13px] font-semibold text-yellow-300">{supportEmail}</span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className={
                      'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11.5px] font-semibold transition cursor-pointer ' +
                      (copiedEmail
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                        : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/20 hover:text-white')
                    }
                  >
                    {copiedEmail ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy />}
                    {copiedEmail ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <a
                  href={
                    'https://mail.google.com/mail/?view=cm&fs=1&to=' +
                    supportEmail +
                    '&su=SnapTrace%20Agency%20Studio%20Plan%20Inquiry'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN_PRIMARY + ' w-full'}
                >
                  Compose in Gmail
                  <IconArrow />
                </a>

                <button
                  type="button"
                  onClick={() => setShowAgencyModal(false)}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2.5 text-[12.5px] font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <p className="mt-4 text-center font-mono text-[11px] text-slate-500">
                Direct activation from our lead engineer within 24 hours.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}