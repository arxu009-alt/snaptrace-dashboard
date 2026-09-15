'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import SnapTraceLogo from '@/components/SnapTraceLogo';

export const dynamic = 'force-dynamic';

type StackKey = 'nextjs' | 'js' | 'python' | 'node' | 'go' | 'rust' | 'csharp' | 'php' | 'ruby' | 'kotlin' | 'flutter' | 'cloudflare';

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
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
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
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform-gpu transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 filter blur-0'
          : 'opacity-0 translate-y-6 filter blur-[1px]'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function CodeHighlighter({ code }: { code: string }) {
  const lines = code.split('\n');

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto select-text">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('<!--') || trimmed.startsWith('/*');

        return (
          <div key={lineIdx} className="table-row hover:bg-slate-800/20">
            <span className="table-cell pr-4 text-right text-[11px] text-slate-600 select-none font-mono w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell whitespace-pre">
              {isComment ? (
                <span className="text-slate-500 italic">{line}</span>
              ) : (
                line
                  .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*|\#.*|\b(?:import|export|default|function|return|from|const|let|var|def|try|except|catch|finally|package|async|await|public|static|void|class|new|true|false|null|nil|None|if|else)\b|<\/?[a-zA-Z0-9_\-]+(?:\s|>|\/)|<\/?>)/g)
                  .map((part, partIdx) => {
                    if (!part) return null;
                    if (part.startsWith('//') || part.startsWith('#')) {
                      return <span key={partIdx} className="text-slate-500 italic">{part}</span>;
                    }
                    if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
                      return <span key={partIdx} className="text-emerald-300 font-medium">{part}</span>;
                    }
                    if (/^(?:import|export|default|function|return|from|const|let|var|def|try|except|catch|finally|package|async|await|public|static|void|class|new|if|else)$/.test(part)) {
                      return <span key={partIdx} className="text-sky-400 font-bold">{part}</span>;
                    }
                    if (/^(?:true|false|null|nil|None)$/.test(part)) {
                      return <span key={partIdx} className="text-amber-300 font-bold">{part}</span>;
                    }
                    if (/^<\/?[a-zA-Z0-9_\-]+/.test(part) || part === '>' || part === '/>' || part === '</>') {
                      return <span key={partIdx} className="text-rose-400 font-semibold">{part}</span>;
                    }
                    return <span key={partIdx} className="text-slate-200">{part}</span>;
                  })
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const DEV_KNOWLEDGE_BASE: Record<string, string> = {
  collapse: "When an outage happens (like a DB pool drop), legacy loggers spam 5 separate alerts for downstream errors. SnapTrace hashes the error origin via deterministic SHA-256 fingerprints, collapses the entire cascade into 1 consolidated thread tagged [xN], and points directly to the failing line (database.js:18) with an AI fix.",
  bundle: "SnapTrace is strictly <3.4KB gzipped (Sentry is ~100KB+). We use native browser listeners and dispatch asynchronously via navigator.sendBeacon. Zero blocking time on page hydration; 100/100 Google Core Web Vitals score.",
  pii: "Zero-Trust On-Device Sanitization. Passwords, bearer tokens, emails, and credit cards are scrubbed with regex AST directly in the browser before payloads touch the network. Sensitive credentials never hit third-party servers.",
  cursor: "When an exception occurs, 1 click exports an AI-optimized prompt pre-formatted with the runtime environment, error message, and stack frames ready to paste into Cursor, Claude Code, or VS Code Copilot for an instant 2-line patch.",
};

function getDevBotAnswer(query: string): string {
  const q = query.toLowerCase().trim();

  if (q.includes('ai') || q.includes('model') || q.includes('gemini') || q.includes('openai') || q.includes('gpt') || q.includes('claude') || q.includes('cursor') || q.includes('copilot') || q.includes('llm')) {
    return `SnapTrace features a dual AI architecture:\n\n1. In-Dashboard BYOK Diagnostics:\nConnect your Google Gemini (100% Free via Gemini 2.5 Flash Lite) or OpenAI (GPT-4o) key in Settings for automated root-cause analysis and code patch diffs.\n\n2. 1-Click IDE Coding Agent Export:\nClicking "Copy for Cursor" generates an AI-optimized prompt pre-formatted with the environment, error message, and stack frames—ready for Cursor, Claude Code, or VS Code Copilot.`;
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
    return `Public Beta is 100% Free until October 31, 2026.\n\nAll developers who sign up receive grandfathered Lifetime Starter Pro ($9/mo value) with 150,000 monthly events, 30-day retention, unlimited projects, and in-dashboard AI diagnostics for $0 forever. No credit card required.`;
  }

  if (q.includes('language') || q.includes('stack') || q.includes('framework') || q.includes('python') || q.includes('node') || q.includes('rust') || q.includes('go') || q.includes('golang') || q.includes('php') || q.includes('csharp') || q.includes('ruby') || q.includes('flutter') || q.includes('kotlin') || q.includes('cloudflare') || q.includes('curl') || q.includes('support')) {
    return `We support 100% of languages through our open REST ingestion protocol. Pre-configured drop-in snippets are ready in the dashboard for:\n• Frontend: Next.js (App & Pages Router), React, Vue, Svelte, Vite, Vanilla JS\n• Backend: Node.js (Express/Nest), Python (FastAPI/Django), Go (Golang), Rust (Axum/Actix), PHP (Laravel/WordPress), C# (.NET), Ruby on Rails\n• Mobile & Edge: Flutter (Dart), Kotlin/Android, Cloudflare Workers, and raw cURL/Bash.`;
  }

  if (q.includes('setup') || q.includes('install') || q.includes('how to') || q.includes('start') || q.includes('quickstart')) {
    return `30-second setup:\n1. Place this 1-line script inside your HTML head or Next.js app/layout.tsx:\n<script src="https://snaptrace-dashboard.vercel.app/snaptrace.js" data-api-key="YOUR_KEY" async></script>\n2. When any uncaught exception occurs, SnapTrace automatically intercepts it, scrubs PII, throttles repeat loops, and pings your Discord/Slack/Email in milliseconds.`;
  }

  if (q.includes('slack') || q.includes('discord') || q.includes('alert') || q.includes('notification') || q.includes('email') || q.includes('webhook')) {
    return `Instant real-time alert dispatch in <1 second to your Discord channels (rich embeds), Slack incoming webhooks, and Gmail inbox with occurrence counters ([x500]). Configure your webhook URLs under Settings in 10 seconds.`;
  }

  if (q.includes('loop') || q.includes('throttle') || q.includes('spam') || q.includes('storm') || q.includes('flood') || q.includes('duplicate') || q.includes('2 am') || q.includes('x500')) {
    return `60-Second Loop Throttling Engine.\n\nIf an infinite re-render loop or failing API poll throws 500 times in 10 seconds, SnapTrace sends the 1st crash immediately, silences duplicate alerts over a 60-second window, and delivers 1 clean summary alert tagged [x500].`;
  }

  if (q.includes('sentry') || q.includes('datadog') || q.includes('glitchtip') || q.includes('honeybadger') || q.includes('why snaptrace') || q.includes('versus') || q.includes('vs')) {
    return `Why developers switch to SnapTrace:\n1. Featherweight SDK: <3.4KB vs Sentry's 100KB+ bundle penalty.\n2. Zero Alert Fatigue: 60s noise throttling groups cascade crashes into 1 alert tagged [xN].\n3. On-Device PII Masking: Passwords and cards scrubbed before transmission.\n4. Free BYOK AI: In-dashboard Gemini & OpenAI diagnostics without expensive enterprise add-ons.`;
  }

  return `SnapTrace is a featherweight (<5KB) error monitoring platform built to eliminate alert fatigue and 100KB SDK bloat. Try asking about:\n• "which ai models does this support?"\n• "how does cascading error collapse work?"\n• "why is the SDK under 5KB?"\n• "which languages are supported?"\n• "how does client PII masking work?"`;
}

export default function WelcomeLandingPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeQuickTab, setActiveQuickTab] = useState<StackKey>('nextjs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedCursorPrompt, setCopiedCursorPrompt] = useState(false);
  const [copiedHeroScript, setCopiedHeroScript] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Sentry-Style Dual Mode
  const [marketingMode, setMarketingMode] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeIdeTab, setActiveIdeTab] = useState<'cursor' | 'claude' | 'vscode'>('cursor');

  // Interactive Dev Terminal Chat State with Auto-Scroll Ref
  const [cliInput, setCliInput] = useState('');
  const [cliMessages, setCliMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Dev Mode active. Ask any technical question about our <5KB SDK, AI model support, cascading error collapse, or client PII masking.",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marketingMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliMessages, marketingMode]);

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

  const heroScriptSnippet = `<script src="https://snaptrace-dashboard.vercel.app/snaptrace.js" data-api-key="sk_live_your_project_key" async></script>`;

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
    nextjs: `// app/layout.tsx (Next.js App Router)
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
          strategy="beforeInteractive"
          data-api-key="sk_live_your_project_key"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    js: `<!-- React, Vue, Svelte, or Vanilla JavaScript -->
<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="sk_live_your_project_key"
  async
></script>`,
    python: `# Python / Django / FastAPI / Flask
import traceback, requests

def log_to_snaptrace(exception, url="https://api.mycompany.com"):
    try:
        requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={
            "apiKey": "sk_live_your_project_key",
            "message": str(exception),
            "stackTrace": traceback.format_exc(),
            "url": url,
            "environment": "production"
        }, timeout=2)
    except Exception:
        pass`,
    node: `// Node.js / Express / NestJS
process.on('uncaughtException', (err) => {
  fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: 'sk_live_your_project_key',
      message: err.message,
      stackTrace: err.stack,
      environment: process.env.NODE_ENV || 'production'
    })
  }).catch(() => {});
});`,
    go: `// Go (Golang) Crash Reporter
package main

import (
  "bytes"
  "encoding/json"
  "net/http"
)

func SendSnapTrace(err error, route string) {
  payload, _ := json.Marshal(map[string]string{
    "apiKey":      "sk_live_your_project_key",
    "message":     err.Error(),
    "environment": "production",
    "url":         route,
  })
  http.Post("https://snaptrace-dashboard.vercel.app/api/v1/log", "application/json", bytes.NewBuffer(payload))
}`,
    rust: `// Rust / Axum / Actix-web
async fn capture_snaptrace(err: &str, route: &str) {
    let payload = serde_json::json!({
        "apiKey": "sk_live_your_project_key",
        "message": err,
        "url": route,
        "environment": "production"
    });
    let _ = reqwest::Client::new()
        .post("https://snaptrace-dashboard.vercel.app/api/v1/log")
        .json(&payload)
        .send()
        .await;
}`,
    csharp: `// C# / ASP.NET Core
public static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {
    var payload = new {
        apiKey = "sk_live_your_project_key",
        message = ex.Message,
        stackTrace = ex.StackTrace,
        url = url,
        environment = "production"
    };
    await new HttpClient().PostAsJsonAsync("https://snaptrace-dashboard.vercel.app/api/v1/log", payload);
}`,
    php: `<?php
// PHP / Laravel / WordPress
set_exception_handler(function ($e) {
    $ch = curl_init('https://snaptrace-dashboard.vercel.app/api/v1/log');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'apiKey' => 'sk_live_your_project_key',
        'message' => $e->getMessage(),
        'stackTrace' => $e->getTraceAsString(),
        'environment' => 'production'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
});
?>`,
    ruby: `# Ruby on Rails / Sinatra
def send_snaptrace_alert(exception)
  uri = URI('https://snaptrace-dashboard.vercel.app/api/v1/log')
  Net::HTTP.post(uri, {
    apiKey: 'sk_live_your_project_key',
    message: exception.message,
    stackTrace: exception.backtrace&.join("\\n"),
    environment: 'production'
  }.to_json, "Content-Type" => "application/json") rescue nil
end`,
    kotlin: `// Kotlin / Android / Java (OkHttp)
fun sendSnapTrace(e: Throwable, context: String = "Android App") {
    val json = JSONObject().apply {
        put("apiKey", "sk_live_your_project_key")
        put("message", e.localizedMessage ?: "Unknown Error")
        put("environment", "production")
        put("url", context)
    }
    // Asynchronous POST dispatch to https://snaptrace-dashboard.vercel.app/api/v1/log
}`,
    flutter: `// Flutter / Dart Crash Handler
void captureSnapTrace(Object error, StackTrace stack) {
  http.post(
    Uri.parse('https://snaptrace-dashboard.vercel.app/api/v1/log'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'apiKey': 'sk_live_your_project_key',
      'message': error.toString(),
      'stackTrace': stack.toString(),
      'environment': 'production'
    }),
  );
}`,
    cloudflare: `// Cloudflare Workers / Serverless Edge
export default {
  async fetch(req: Request, env: any, ctx: any) {
    try {
      return await handleRequest(req);
    } catch (err: any) {
      ctx.waitUntil(fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: 'sk_live_your_project_key',
          message: err.message,
          stackTrace: err.stack,
          environment: 'production'
        })
      }));
      return new Response('Edge Execution Error', { status: 500 });
    }
  }
};`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeQuickTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyCursorDemo = () => {
    const promptText = `Act as an expert software engineer. Fix this runtime exception captured by SnapTrace:
Error: ReferenceError: Connection pool exhausted at 10:00:00 PM
File: database.js:18:11
Provide a plain English diagnosis and the exact corrected code patch.`;
    navigator.clipboard.writeText(promptText);
    setCopiedCursorPrompt(true);
    setTimeout(() => setCopiedCursorPrompt(false), 2500);
  };

  const faqs = [
    {
      q: 'How does SnapTrace collapse cascading multi-error outages?',
      a: 'During an outage, a single database connection drop often triggers 4 or 5 different downstream errors (auth fails, queries fail, UI renders fail). Instead of sending 5 separate noisy alerts that you have to piece together manually on a Sunday, SnapTrace groups cascading failures and isolates the single root cause with an instant AI fix.'
    },
    {
      q: 'Do I need to keep the SnapTrace website open to receive alerts?',
      a: 'No! The SnapTrace SDK runs silently inside your live application. When an unhandled crash happens in production, SnapTrace automatically pings your configured Discord channel, Slack room, and Gmail inbox in milliseconds.'
    },
    {
      q: 'How does SnapTrace integrate with VS Code, Cursor, and AI IDEs?',
      a: 'When an exception occurs, SnapTrace provides a 1-click "Copy for Cursor" button inside the Inspect modal. It generates an AI-optimized prompt containing the runtime environment, error message, and stack frames, ready to paste into Cursor, VS Code Copilot, or Claude Code for instant local code fixes.'
    },
    {
      q: 'What languages and frameworks does SnapTrace support?',
      a: 'SnapTrace uses a universal REST telemetry endpoint. We provide drop-in snippets for Next.js, JavaScript, React, Vue, Node.js, Python, Go, Rust, C# (.NET), PHP, Ruby, Kotlin, Flutter, Cloudflare Workers, and cURL.'
    },
    {
      q: 'How does SnapTrace maintain a <5KB bundle size with 0ms delay?',
      a: 'Unlike legacy APMs that bundle 100KB+ of heavy performance profilers and session serializers, SnapTrace is focused strictly on crash telemetry, client-side PII regex scrubbing, and asynchronous beacon delivery via navigator.sendBeacon. It never delays page hydration or blocks Google Core Web Vitals.'
    },
    {
      q: 'How does the limited-time Beta promotion work?',
      a: 'All developers who sign up during our Public Beta receive automatic, grandfathered Lifetime Pro access with 150,000 monthly events and full in-dashboard AI diagnostics for $0. No credit card required.'
    }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-8 w-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden pb-16 relative">
      
      {/* 1. TOP BANNER */}
      <div className={`px-4 py-2 text-center text-xs font-bold font-mono shadow-md flex items-center justify-center gap-2 transition-colors ${
        marketingMode
          ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950'
          : 'bg-[#0B101D] border-b border-yellow-400/30 text-yellow-300'
      }`}>
        <span>{marketingMode ? '🔥 Early Adopter Launch:' : '⚡ ARCHITECTURE SPEC:'}</span>
        <span className="bg-slate-950 text-yellow-300 px-2.5 py-0.5 rounded text-[11px] font-mono border border-yellow-400/20">
          {marketingMode ? '38 / 50 Free Lifetime Pro Passes Claimed' : 'RFC-9110 Asynchronous Ingestion Engine Active'}
        </span>
        <span className="hidden sm:inline">
          {marketingMode ? '• 12 spots left before Beta closes (No credit card needed)' : '• 0ms Hydration Penalty • <3.4KB Gzipped'}
        </span>
      </div>

      {/* 2. SENTRY-STYLE EXPANSIVE CLEAN HEADER */}
      <header className="border-b border-slate-800/80 bg-[#090D16]/95 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
          
          {/* Logo */}
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition shrink-0">
            <SnapTraceLogo size="md" showText={true} />
          </Link>

          {/* Clean, Uncrowded Center Navigation */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs font-semibold text-slate-300 font-mono">
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('platform')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="hover:text-yellow-400 transition flex items-center gap-1 py-4">
                Platform <span className="text-[10px] text-slate-500">▾</span>
              </button>

              {openDropdown === 'platform' && (
                <div className="absolute top-12 left-0 w-80 bg-[#0B101D] border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2">Capabilities</div>
                  <a href="#features" className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition">
                    <span className="text-base">🪶</span>
                    <div>
                      <div className="text-white font-bold text-xs">&lt;5KB Telemetry SDK</div>
                      <div className="text-[10px] text-slate-400">Zero Core Web Vitals penalty</div>
                    </div>
                  </a>
                  <a href="#grouping" className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition">
                    <span className="text-base">🎯</span>
                    <div>
                      <div className="text-white font-bold text-xs">Root-Cause Collapse</div>
                      <div className="text-[10px] text-slate-400">Multi-crash incident grouping</div>
                    </div>
                  </a>
                  <a href="#features" className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition">
                    <span className="text-base">🔒</span>
                    <div>
                      <div className="text-white font-bold text-xs">Client-Side PII Firewall</div>
                      <div className="text-[10px] text-slate-400">On-device password & card masking</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('ai')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="hover:text-yellow-400 transition flex items-center gap-1 py-4 text-yellow-300">
                <span>✨</span> AI Copilot <span className="text-[10px] text-slate-500">▾</span>
              </button>

              {openDropdown === 'ai' && (
                <div className="absolute top-12 left-0 w-80 bg-[#0B101D] border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2">AI Diagnostics</div>
                  <a href="#ai-agent" className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition">
                    <span className="text-base">🤖</span>
                    <div>
                      <div className="text-white font-bold text-xs">Cursor & Claude 1-Click Export</div>
                      <div className="text-[10px] text-slate-400">Pre-formatted prompt for your IDE</div>
                    </div>
                  </a>
                  <a href="#ai-agent" className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-800/60 transition">
                    <span className="text-base">⚡</span>
                    <div>
                      <div className="text-white font-bold text-xs">BYOK AI Diagnosis</div>
                      <div className="text-[10px] text-slate-400">Free Gemini & OpenAI integration</div>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <a href="#quickstart" className="hover:text-yellow-400 transition">SDK Setup</a>
            <a href="#comparison" className="hover:text-yellow-400 transition">Why SnapTrace</a>
            <a href="#pricing" className="hover:text-yellow-400 transition font-bold text-yellow-400">Pricing</a>
            <a href="#faq" className="hover:text-yellow-400 transition">FAQ</a>
          </nav>

          {/* Sentry-Grade Clean Action Buttons on the Right */}
          <div className="flex items-center space-x-3 font-mono shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/50 transition"
            >
              Sign In
            </Link>

            {/* Distinct Outline Button (Matches Sentry's GET DEMO) */}
            <Link
              href="/demo"
              className="px-4 py-2 rounded-xl border border-yellow-400/40 hover:border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 font-bold text-xs transition shadow-sm"
            >
              Live Demo ⚡
            </Link>

            {/* High-Contrast Filled Button (Matches Sentry's GET STARTED) */}
            <Link
              href="/signup"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
            >
              Claim Beta Pass →
            </Link>
          </div>
        </div>
      </header>

      {/* 🌟 FLOATING SENTRY-STYLE "MARKETING MODE" WIDGET (Docked on Right Screen Edge) */}
      <div className="fixed top-28 right-4 z-40 hidden sm:block animate-in fade-in slide-in-from-right-3 duration-300">
        <div className="bg-[#0B101D]/90 border border-slate-700/80 rounded-2xl p-2 px-3 shadow-2xl backdrop-blur-xl flex items-center gap-2.5 font-mono">
          <span className="text-[11px] font-bold text-slate-300">Marketing Mode</span>
          <button
            onClick={() => setMarketingMode(!marketingMode)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              marketingMode ? 'bg-amber-500' : 'bg-slate-700'
            }`}
            title="Toggle between Marketing Mode and Dev Spec Mode"
          >
            <div
              className={`w-4 h-4 rounded-full bg-slate-950 absolute top-1 transition-transform ${
                marketingMode ? 'right-1' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-[10px] font-bold ${marketingMode ? 'text-amber-400' : 'text-slate-400'}`}>
            {marketingMode ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* 🌟 VIEW 1: WHEN MARKETING MODE IS OFF (SENTRY DEDICATED DEV TERMINAL STATION - NO SCROLL CLUTTER) */}
      {!marketingMode ? (
        <section className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-6 bg-[#05070E] relative overflow-hidden animate-in fade-in duration-150">
          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Developer Manifesto */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-white leading-none">
                  NO 100KB BUNDLES.<br />
                  NO 2 AM SPAM ALERTS.<br />
                  <span className="text-yellow-400">NO SUNDAY LOG HUNTING.</span>
                </h1>
                
                <p className="text-xs font-mono text-emerald-400 flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>• marketing.js terminated (0.0ms main thread blocking)</span>
                </p>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
                <p>
                  <strong>Why did we build this?</strong> Because legacy APMs became bloated and noisy. A single database pool timeout triggers 4 downstream HTTP crashes, and traditional trackers spam your inbox with 4 separate alerts that you have to piece together by hand on a Sunday.
                </p>
                <p className="text-yellow-300">
                  SnapTrace collapses the entire outage cascade into <strong>1 consolidated root cause</strong> with a 2-line AI fix ready in seconds.
                </p>
              </div>

              <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
                <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-widest block">
                  ⚡ PRODUCTION BENCHMARKS
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>• SDK Size: <strong className="text-emerald-400">&lt;3.4KB gzipped</strong></div>
                  <div>• Transport: <strong className="text-slate-200">sendBeacon (0ms)</strong></div>
                  <div>• PII Masking: <strong className="text-emerald-400">Client-Side Regex</strong></div>
                  <div>• AI Workflow: <strong className="text-purple-400">1-Click Cursor / Claude</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 font-mono">
                <Link
                  href="/signup"
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
                >
                  Get Free Beta Key in 30s →
                </Link>
                <Link
                  href="/demo"
                  className="px-5 py-3 bg-[#0B101D] hover:bg-slate-800 border border-slate-800 text-yellow-300 text-xs font-bold rounded-xl transition"
                >
                  ⚡ Open Demo Workspace
                </Link>
              </div>
            </div>

            {/* Right Column: Intelligent /snappy-cli Terminal with AUTO-SCROLL */}
            <div className="lg:col-span-6 bg-[#090D16] border-2 border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col justify-between font-mono space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>/snappy-cli <span className="text-[10px] text-slate-500 font-normal">v1.0-beta</span></span>
                </div>
                <span className="text-[10px] text-slate-500">Ask any technical question</span>
              </div>

              {/* Chat Message Stream */}
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 text-xs">
                {cliMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-[#0B101D] border border-slate-800 text-yellow-300 ml-6'
                        : 'bg-[#05070E] border border-emerald-500/30 text-slate-200 mr-4'
                    }`}
                  >
                    <span className="text-[10px] block font-bold text-slate-500 mb-1">
                      {msg.role === 'user' ? '> YOU' : '⚡ SNAPPY (ENGINE)'}
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Knowledge Prompts */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleAskCli("which ai models does this support?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🤖 Which AI Models?
                  </button>
                  <button
                    onClick={() => handleAskCli("which languages does this support?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🌍 Supported Languages?
                  </button>
                  <button
                    onClick={() => handleAskCli("how does cascading error collapse work?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🎯 Cascading Collapse?
                  </button>
                  <button
                    onClick={() => handleAskCli("why is the SDK under 5KB?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    ⚡ Why &lt;5KB?
                  </button>
                  <button
                    onClick={() => handleAskCli("how does client PII masking work?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🔒 PII Masking?
                  </button>
                  <button
                    onClick={() => handleAskCli("how does the free beta pass work?")}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    💰 Pricing / Beta?
                  </button>
                </div>

                {/* Input Prompt Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (cliInput.trim()) handleAskCli(cliInput.trim());
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask any technical question..."
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    className="flex-1 bg-[#05070E] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Send →
                  </button>
                </form>
              </div>

            </div>

          </div>
        </section>
      ) : (
        /* 🌟 VIEW 2: WHEN MARKETING MODE IS ON (FULL HIGH-CONVERTING SCROLLING LANDING PAGE) */
        <>
          {/* 3. HERO SECTION */}
          <section className="relative pt-12 pb-12 overflow-hidden">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-yellow-500/15 via-purple-500/10 to-emerald-500/15 blur-[130px] pointer-events-none rounded-full" />

            <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10">
              
              {/* SENTRY-STYLE MCP EQUIVALENT ANNOUNCEMENT PILL */}
              <div>
                <a
                  href="#ai-agent"
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-mono font-bold text-purple-300 transition shadow-lg hover:border-purple-400 group cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>✨ SnapTrace AI Protocol: Fix production crashes right inside Cursor & Claude Code →</span>
                </a>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15] max-w-3xl mx-auto">
                Code <span className="text-red-400 underline decoration-red-500/50 decoration-wavy">breaks</span>. Stop spending Sundays connecting the{' '}
                <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
                  dots by hand.
                </span>
              </h1>

              <p className="max-w-xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed font-sans">
                SnapTrace automatically collapses cascading multi-error outages into a single root-cause incident. Under <span className="text-yellow-300 font-mono font-bold">&lt;5KB</span>, with on-device PII masking and 1-click AI code fixes for VS Code & Cursor.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 font-mono">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-yellow-500/25 transition transform hover:-translate-y-0.5"
                >
                  Claim Free Lifetime Pro Pass (12 Spots Left) →
                </Link>
                <Link
                  href="/demo"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#0B101D] hover:bg-slate-800 border border-slate-800 text-yellow-300 text-xs sm:text-sm font-semibold rounded-xl transition shadow-sm"
                >
                  ⚡ Open Demo Workspace (No Signup)
                </Link>
              </div>

              {/* 1-Click Drop-in Hero Code Snippet */}
              <div className="pt-2 max-w-xl mx-auto">
                <div className="bg-[#0B101D] border border-slate-800/90 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xl font-mono text-xs">
                  <div className="flex items-center gap-2 truncate text-slate-400 pl-2">
                    <span className="text-yellow-400 font-bold select-none">&lt;/&gt;</span>
                    <span className="truncate text-slate-300 text-[11px]">
                      &lt;script src=&quot;https://snaptrace.../snaptrace.js&quot; data-api-key=&quot;<span className="text-yellow-300 font-bold">YOUR_KEY</span>&quot; async&gt;&lt;/script&gt;
                    </span>
                  </div>
                  <button
                    onClick={handleCopyHeroScript}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm active:scale-95"
                  >
                    {copiedHeroScript ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 font-mono pt-2">
                  <span>✓ Drop into HTML head</span>
                  <span>✓ 0ms main thread delay</span>
                  <span>✓ &lt;5KB featherweight</span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. SENTRY-STYLE INTERACTIVE ROOT-CAUSE SCANNER */}
          <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={50}>
            <div id="grouping" className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="text-slate-300 font-bold ml-1">Live Production Incident Scanner</span>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase text-[10px]">
                  Active Root Cause Trace
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-2 text-xs font-mono">
                  <div className="p-3 bg-[#070A12] rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">1. User submits checkout form</span>
                    <span className="text-emerald-400 font-bold">✓ 200 OK</span>
                  </div>
                  <div className="p-3 bg-[#070A12] rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">2. Frontend dispatches POST /v1/order</span>
                    <span className="text-emerald-400 font-bold">✓ 200 OK</span>
                  </div>
                  <div className="p-3 bg-[#070A12] rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">3. Next.js Server Action executes</span>
                    <span className="text-emerald-400 font-bold">✓ 200 OK</span>
                  </div>
                  <div className="p-3 bg-red-950/40 rounded-xl border-2 border-red-500/60 flex items-center justify-between shadow-md">
                    <span className="text-red-300 font-bold">4. database.js:18 pool.connect()</span>
                    <span className="text-red-400 font-bold animate-pulse">🚨 CRASH ORIGIN</span>
                  </div>
                </div>

                <div className="md:col-span-5 p-5 bg-[#070A12] rounded-2xl border border-yellow-400/40 space-y-3 font-mono text-xs shadow-xl">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                    ⚡ SNAPTRACE COLLAPSE ENGINE
                  </div>
                  <div className="text-white font-bold text-sm">
                    Root Cause: Connection Pool Exhaustion
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    4 downstream HTTP 500 crashes collapsed under <code className="text-yellow-300">database.js</code>. Client connection wasn't released.
                  </p>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span>Code Patch Ready</span>
                    <span>client.release()</span>
                  </div>
                </div>
              </div>
            </div>
          </SmoothReveal>

          {/* 5. DEVELOPER SOCIAL PROOF */}
          <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={100}>
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B101D] to-[#080d1a] border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-bold uppercase tracking-widest">
                <span>💬</span> Validated by Senior Software Engineers
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-300 italic leading-relaxed font-sans">
                &quot;5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.&quot;
              </blockquote>
              <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center font-bold text-yellow-300 text-xs">
                  EB
                </div>
                <div>
                  <div className="text-white font-bold">Eusebiu Balan</div>
                  <div className="text-slate-500 text-[10px]">Senior Full-Stack Engineer • via Dev.to</div>
                </div>
              </div>
            </div>
          </SmoothReveal>

          {/* 6. AI AGENT EXPORT SECTION */}
          <section id="ai-agent" className="py-20 border-t border-slate-800/80 relative">
            <div className="max-w-5xl mx-auto px-6 space-y-10">
              
              <SmoothReveal className="text-center space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase font-mono">
                  <span>🤖</span> AI Workflow Native
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Turn runtime stack traces into instant AI bug fixes
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Connect your own Google Gemini (100% Free) or OpenAI API key for instant in-dashboard code patches, or use our <strong>1-Click Prompt Export</strong> directly into <strong>VS Code, Cursor, or Claude Code</strong>.
                </p>

                <div className="flex items-center justify-center gap-2 pt-2 font-mono text-xs">
                  {(['cursor', 'claude', 'vscode'] as const).map((ide) => (
                    <button
                      key={ide}
                      onClick={() => setActiveIdeTab(ide)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                        activeIdeTab === ide
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-[#0B101D] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {ide === 'cursor' && 'Cursor IDE'}
                      {ide === 'claude' && 'Claude Code'}
                      {ide === 'vscode' && 'VS Code Copilot'}
                    </button>
                  ))}
                </div>
              </SmoothReveal>

              <SmoothReveal className="bg-[#0B101D] border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-4xl mx-auto space-y-4" delay={150}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                  <div>
                    <span className="text-xs font-bold text-red-400 font-mono block">CRASH: ReferenceError: Connection pool exhausted</span>
                    <span className="text-[10px] text-slate-500 font-mono">Captured at database.js:18:11</span>
                  </div>
                  <button
                    onClick={handleCopyCursorDemo}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto font-mono"
                  >
                    {copiedCursorPrompt ? '✓ Copied AI Prompt!' : '📋 Copy Prompt for Cursor / Claude'}
                  </button>
                </div>

                <div className="bg-[#070A12] border border-purple-500/30 rounded-2xl p-4 space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                    <span>✨</span> Instant AI Root-Cause Diagnosis
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    <strong>Plain English:</strong> The PostgreSQL client in <code className="text-yellow-300">database.js</code> is opening connections inside a tight loop without releasing them back to the pool.
                  </p>
                  <pre className="p-3 bg-[#0B101D] rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto text-[11px]">
{`// Fix in database.js: Release connection back to pool
const client = await pool.connect();
try {
  await client.query('SELECT * FROM users WHERE id = $1', [userId]);
} finally {
  client.release(); // Releases connection
}`}
                  </pre>
                </div>
              </SmoothReveal>

            </div>
          </section>

          {/* 7. INTERACTIVE 12-LANGUAGE TERMINAL */}
          <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={100}>
            <div id="quickstart" className="bg-[#0B101D] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-[#070A12] px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2 font-mono whitespace-nowrap">Stack:</span>
                  {[
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
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveQuickTab(tab.id as StackKey)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition uppercase cursor-pointer whitespace-nowrap font-mono ${
                        activeQuickTab === tab.id
                          ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer self-start md:self-auto font-mono whitespace-nowrap"
                >
                  {copiedSnippet ? '✓ Snippet Copied!' : '📋 Copy SDK Code'}
                </button>
              </div>

              <div className="p-6 bg-[#070A12] overflow-x-auto">
                <CodeHighlighter code={snippets[activeQuickTab]} />
              </div>
            </div>
          </SmoothReveal>

          {/* 8. SUB-5KB FEATHERWEIGHT SDK SECTION */}
          <section id="features" className="py-20 border-t border-slate-800/80 bg-[#060911]/60">
            <div className="max-w-5xl mx-auto px-6">
              <SmoothReveal className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10">
                
                <div className="lg:col-span-6 space-y-5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                    <span>🪶</span> Performance & Core Web Vitals
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                    An error tracker that never slows down your users
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Legacy APMs force your users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores. SnapTrace is a zero-dependency script under <strong>5KB</strong> gzipped.
                  </p>

                  <div className="space-y-2.5 pt-1 font-mono">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-slate-800 text-xs">
                      <span className="text-slate-300 font-semibold">SnapTrace JS Telemetry SDK</span>
                      <span className="text-emerald-400 font-bold">&lt; 5 KB</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-slate-800 text-xs opacity-70">
                      <span className="text-slate-400">Honeybadger Client</span>
                      <span className="text-slate-400 font-bold">~35 KB</span>
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-slate-800 text-xs opacity-50">
                      <span className="text-slate-500">Sentry Browser SDK</span>
                      <span className="text-red-400 font-bold">100+ KB</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-[#0B101D] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Google Lighthouse Impact</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono">
                      Score: 100/100
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 space-y-1">
                      <div className="text-2xl font-black text-emerald-400 font-mono">0.0ms</div>
                      <p className="text-[10px] text-slate-400 font-mono">Main Thread Delay</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800 space-y-1">
                      <div className="text-2xl font-black text-emerald-400 font-mono">3.4 KB</div>
                      <p className="text-[10px] text-slate-400 font-mono">Total Gzipped Size</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-3 font-mono">
                    &quot;We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly.&quot;
                  </p>
                </div>

              </SmoothReveal>
            </div>
          </section>

          {/* 9. COMPARISON TABLE */}
          <section id="comparison" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800/80 space-y-10">
            <SmoothReveal className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why Developers Choose SnapTrace</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-mono">
                Built to replace bloated, noisy enterprise APMs.
              </p>
            </SmoothReveal>

            <SmoothReveal className="bg-[#0B101D] border border-slate-800 rounded-3xl overflow-x-auto shadow-2xl" delay={150}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#070A12] text-slate-400 font-semibold uppercase font-mono">
                    <th className="p-4">Feature</th>
                    <th className="p-4 text-yellow-400 font-bold">⚡ SnapTrace</th>
                    <th className="p-4">Sentry</th>
                    <th className="p-4">GlitchTip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  <tr>
                    <td className="p-4 font-semibold text-white">SDK Weight</td>
                    <td className="p-4 text-emerald-400 font-bold">&lt; 5 KB (Featherweight)</td>
                    <td className="p-4 text-slate-500">~100 KB+</td>
                    <td className="p-4 text-slate-500">~100 KB+</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Cascading Root-Cause Collapse</td>
                    <td className="p-4 text-emerald-400 font-bold">✓ Multi-crash unified incident</td>
                    <td className="p-4 text-slate-500">Noisy separate alerts</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Free Tier Events</td>
                    <td className="p-4 text-emerald-400 font-bold">10,000 / month</td>
                    <td className="p-4 text-slate-500">5,000 / month</td>
                    <td className="p-4 text-slate-500">1,000 / month</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Client-Side PII Scrubbing</td>
                    <td className="p-4 text-emerald-400 font-bold">✓ Native on-device</td>
                    <td className="p-4 text-slate-500">Complex server rules</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">In-Dashboard AI Diagnosis (BYOK)</td>
                    <td className="p-4 text-emerald-400 font-bold">✓ Included in Beta Pass</td>
                    <td className="p-4 text-slate-500">$$$ Expensive addon</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">1-Click Prompt Export for Cursor</td>
                    <td className="p-4 text-emerald-400 font-bold">✓ Free Forever</td>
                    <td className="p-4 text-slate-500">✕ Manual copy</td>
                    <td className="p-4 text-slate-500">✕ Manual copy</td>
                  </tr>
                </tbody>
              </table>
            </SmoothReveal>
          </section>

          {/* 10. PRICING TIERS */}
          <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800/80 space-y-10">
            <SmoothReveal className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                <span>⏰</span> Limited Beta Window (Until Oct 31, 2026)
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Simple, transparent developer tiers</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-mono">
                Zero surprise overage bills. Full Pro access unlocked during public beta.
              </p>
            </SmoothReveal>

            <SmoothReveal className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch" delay={150}>
              
              {/* Card 1: Developer Free */}
              <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Developer Free</span>
                    <div className="text-3xl font-black text-white">$0 <span className="text-xs text-slate-500 font-normal font-mono">/ month</span></div>
                    <p className="text-xs text-slate-400 pt-1">Essential crash monitoring for side projects and hobby apps.</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-5 font-mono">
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>10,000</strong> Events / Month</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 14-Day Data Retention</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Up to 2 Projects</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Sub-5KB Featherweight SDK</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 1-Click Cursor / Claude Export</li>
                    <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Discord, Slack & Email Alert Channels</li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
                >
                  Start Free Forever →
                </Link>
              </div>

              {/* Card 2: Starter Pro */}
              <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/60 rounded-3xl p-7 space-y-6 shadow-2xl relative flex flex-col justify-between transform md:-translate-y-2 hover:border-yellow-400 transition">
                <span className="absolute -top-3.5 right-6 px-3.5 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg font-mono">
                  ★ 12 Spots Remaining
                </span>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono">Starter Pro (Beta Pass)</span>
                    <div className="text-3xl font-black text-white">$0 <span className="text-xs text-yellow-300 font-mono font-bold line-through ml-1">$9/mo</span></div>
                    <p className="text-xs text-slate-400 pt-1">Free full Pro features unlocked for all early beta developers.</p>
                  </div>

                  <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800/80 pt-5 font-mono">
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>150,000</strong> Events / Month</li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> 30-Day Data Retention</li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>Unlimited Projects</strong></li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>In-Dashboard BYOK AI Copilot</strong></li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> Noise Deduplication Throttling</li>
                    <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> 1-Click Database Purge Tools</li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="block w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-center text-xs rounded-xl transition shadow-xl shadow-yellow-500/20 cursor-pointer font-mono"
                >
                  Claim Free Pro Beta Pass →
                </Link>
              </div>

              {/* Card 3: Team Scale */}
              <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                <div className="space-y-4">
                  <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Team Scale</span>
                <div className="text-3xl font-black text-white">$29 <span className="text-xs text-slate-500 font-normal font-mono">/ month</span></div>
                <p className="text-xs text-slate-400 pt-1">For high-traffic production workloads and growing teams.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-5 font-mono">
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> <strong>1,000,000</strong> Events / Month</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> 90-Day Telemetry Retention</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Unlimited Projects & API Keys</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Priority Discord, Slack & Email Delivery</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Team Invites & Multi-Seat Access</li>
                <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Raw Log CSV / JSON Data Export</li>
              </ul>
            </div>

            <Link
              href="/signup"
              className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
            >
              Join Beta Waitlist →
            </Link>
          </div>

        </SmoothReveal>
      </section>

      {/* 11. SECURITY & COMPLIANCE BADGES */}
      <section className="py-16 border-t border-slate-800/80 bg-[#060911]/60">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-yellow-400">Security by Default</h3>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Built for Developer Privacy & Performance</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-xs font-mono">
            <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xl">🛡️</span>
              <div className="text-white font-bold">GDPR Ready</div>
              <div className="text-[10px] text-slate-400">On-device PII masking</div>
            </div>
            <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xl">🪶</span>
              <div className="text-white font-bold">&lt;5KB Footprint</div>
              <div className="text-[10px] text-slate-400">100/100 Core Web Vitals</div>
            </div>
            <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xl">🔇</span>
              <div className="text-white font-bold">Anti-Noise Guard</div>
              <div className="text-[10px] text-slate-400">SHA-256 loop throttling</div>
            </div>
            <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xl">🔓</span>
              <div className="text-white font-bold">No Vendor Lock-in</div>
              <div className="text-[10px] text-slate-400">Universal REST protocol</div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800/80 space-y-8">
        <SmoothReveal className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">Real technical answers for developers evaluating SnapTrace.</p>
        </SmoothReveal>

        <SmoothReveal className="space-y-3" delay={150}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#0B101D] border border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:text-yellow-400 transition"
                >
                  <span className="font-bold text-xs sm:text-sm text-white">{faq.q}</span>
                  <span className="text-slate-500 font-mono text-base">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </SmoothReveal>
      </section>

      {/* 13. SENTRY-STYLE ENTERPRISE FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-16 relative overflow-hidden font-sans">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to catch bugs in a snap?
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Join developers catching crashes in real time with zero noise and instant AI diagnoses.
            </p>
            <div className="pt-1 font-mono">
              <Link
                href="/signup"
                className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
              >
                Claim Your Free Beta Pass in 60s →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-800/80 text-xs font-mono">
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">Platform</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#features" className="hover:text-white transition">Telemetry Ingestion</a></li>
                <li><a href="#features" className="hover:text-white transition">&lt;5KB Client SDK</a></li>
                <li><a href="#ai-agent" className="hover:text-white transition">AI Root Cause Engine</a></li>
                <li><a href="#features" className="hover:text-white transition">Client-Side PII Firewall</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">Stacks & SDKs</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#quickstart" className="hover:text-white transition">Next.js App Router</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Python & FastAPI</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Node.js / Express</a></li>
                <li><a href="#quickstart" className="hover:text-white transition">Go, Rust & PHP</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">Compare</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link href="/vs/sentry" className="hover:text-white transition">SnapTrace vs. Sentry</Link></li>
                <li><a href="#comparison" className="hover:text-white transition">SnapTrace vs. GlitchTip</a></li>
                <li><a href="#comparison" className="hover:text-white transition">SnapTrace vs. Honeybadger</a></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">Company & Legal</span>
              <ul className="space-y-1.5 text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/demo" className="hover:text-yellow-400 transition font-bold">Public Demo</Link></li>
                <li><Link href="/test" className="hover:text-white transition">Live Test Sandbox</Link></li>
                <li><span className="text-emerald-400">● Systems Operational</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-mono gap-3">
            <span>© {new Date().getFullYear()} SnapTrace. All rights reserved. The Independent Developer Telemetry Platform.</span>
            <div className="flex items-center space-x-4 text-slate-400">
              <Link href="/privacy" className="hover:text-yellow-400">Privacy</Link>
              <Link href="/terms" className="hover:text-yellow-400">Terms</Link>
              <Link href="/demo" className="hover:text-yellow-400">Demo</Link>
              <Link href="/test" className="hover:text-yellow-400">Sandbox</Link>
            </div>
          </div>

        </div>
      </footer>

      {/* 14. HIGH-CONVERTING STICKY FLOATING BOTTOM BAR */}
      <div className="fixed bottom-3 inset-x-4 max-w-xl mx-auto z-40 animate-in fade-in slide-in-from-bottom-3 duration-300 font-mono">
        <div className="bg-[#0B101D]/90 border border-yellow-400/40 rounded-2xl p-2.5 px-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping shrink-0" />
            <span className="text-xs text-slate-200 font-bold truncate">
              Beta Offer: <span className="text-yellow-300">12 Lifetime Pro Passes Left</span>
            </span>
          </div>

          <Link
            href="/signup"
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition transform hover:-translate-y-0.5 shrink-0"
          >
            Claim Free Pass →
          </Link>
        </div>
      </div>
        </>
      )}

    </div>
  );
}