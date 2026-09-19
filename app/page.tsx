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

/* ─────────────────────────────────────────────
   SMOOTH REVEAL — unchanged logic, refined ease
   ───────────────────────────────────────────── */
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
    return () => { if (currentTarget) observer.unobserve(currentTarget); };
  }, []);

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: `${delay}ms` }}
      className={
        'transform-gpu transition-all duration-700 ease-out ' +
        (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   AI BRAND LOGO SVGs — inline, zero network requests
   ───────────────────────────────────────────── */

function GeminiLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gem-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="33%" stopColor="#9B72CB" />
          <stop offset="66%" stopColor="#D96570" />
          <stop offset="100%" stopColor="#F4B400" />
        </linearGradient>
      </defs>
      <path
        d="M16 2C16 2 17.6 10.4 22 14.8C26.4 19.2 30 16 30 16C30 16 21.6 17.6 17.2 22C12.8 26.4 16 30 16 30C16 30 14.4 21.6 10 17.2C5.6 12.8 2 16 2 16C2 16 10.4 14.4 14.8 10C19.2 5.6 16 2 16 2Z"
        fill="url(#gem-grad)"
      />
    </svg>
  );
}

function OpenAILogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M29.1 13.1a7.9 7.9 0 00-.68-6.49 8 8 0 00-8.6-3.84A8 8 0 0014.25 1a8 8 0 00-7.63 5.54 8 8 0 00-5.33 3.88 8 8 0 001 9.38 7.9 7.9 0 00.68 6.49 8 8 0 008.6 3.84A8 8 0 0017.75 31a8 8 0 007.64-5.54 8 8 0 005.33-3.88 8 8 0 00-1.62-9.48zM17.75 29.12a5.93 5.93 0 01-3.81-1.38l.19-.11 6.33-3.65a1 1 0 00.52-.9v-8.94l2.68 1.55a.1.1 0 01.05.07v7.38a5.97 5.97 0 01-5.96 5.98zM4.61 23.74a5.93 5.93 0 01-.71-4 l.19.11 6.33 3.65a1 1 0 001 0l7.73-4.46v3.09a.1.1 0 01-.04.08l-6.4 3.7a5.97 5.97 0 01-8.1-2.17zM3.6 11.15a5.93 5.93 0 013.1-2.61v7.52a1 1 0 00.5.9l7.72 4.46-2.68 1.55a.1.1 0 01-.09 0L5.73 18.9a5.97 5.97 0 01-2.13-7.75zM24.53 17.31l-7.73-4.47 2.68-1.54a.1.1 0 01.09 0l6.43 3.71a5.97 5.97 0 01-.93 10.78v-7.52a1 1 0 00-.54-.96zm2.65-4.01l-.19-.11-6.32-3.67a1 1 0 00-1 0L11.94 14v-3.1a.1.1 0 01.04-.08l6.4-3.69a5.97 5.97 0 018.8 6.17zm-16.77 5.52l-2.68-1.54a.1.1 0 01-.05-.07V10.1a5.97 5.97 0 019.77-4.6l-.19.11-6.33 3.65a1 1 0 00-.52.9v8.93zm1.45-3.14l3.44-1.99 3.44 1.98v3.97l-3.44 1.98-3.44-1.98V15.7z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

function DeepSeekLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ds-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4D9FFF" />
          <stop offset="100%" stopColor="#0057FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ds-grad)" />
      <path
        d="M7 8h8c5 0 9 3.8 9 8.5S20 25 15 25H7V8z"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="21.5" cy="10.5" r="2.5" fill="#7DD3FF" />
    </svg>
  );
}

function ClaudeLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#CC785C" opacity="0.25" />
      <path
        d="M10.5 22L16 10l5.5 12M12.5 18h7"
        stroke="#CC785C"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OllamaLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#444" opacity="0.3" />
      <ellipse cx="16" cy="14" rx="7" ry="8" stroke="#888" strokeWidth="2" />
      <circle cx="13" cy="12" r="1.5" fill="#888" />
      <circle cx="19" cy="12" r="1.5" fill="#888" />
      <path d="M10 22c0 2 12 2 12 0" stroke="#888" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 26v-4M19 26v-4" stroke="#888" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   DEV KNOWLEDGE BASE — unchanged
   ───────────────────────────────────────────── */
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
    return "Why developers switch to SnapTrace:\n1. Featherweight SDK: <3.4KB vs Sentry's 100KB+ bundle penalty [1.2.2].\n2. Zero Alert Fatigue: 60s noise throttling groups cascade crashes into 1 alert tagged [xN] [1.1.7].\n3. On-Device PII Masking: Passwords and cards scrubbed before transmission.\n4. Free BYOK AI: In-dashboard Gemini & OpenAI diagnostics without expensive enterprise add-ons.";
  }
  return 'SnapTrace is a featherweight (<5KB) error monitoring platform built to eliminate alert fatigue and 100KB SDK bloat [1.1.7, 1.2.2]. Try asking about:\n• "which ai models does this support?"\n• "how does cascading error collapse work?"\n• "why is the SDK under 5KB?"\n• "which languages are supported?"\n• "how does client PII masking work?"';
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
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
    { role: 'assistant', text: 'Dev Mode active. Ask any technical question about our <5KB SDK, AI model support, cascading error collapse, or client PII masking.' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!marketingMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cliMessages, marketingMode]);

  const toggleMarketingMode = () => {
    setMarketingMode((prev) => !prev);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    async function checkUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) { router.replace('/dashboard'); return; }
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

  /* ── CODE SNIPPETS — unchanged ── */
  const snippets: Record<StackKey, string> = {
    nextjs: "// app/layout.tsx (Next.js App Router)\nimport Script from 'next/script';\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang=\"en\">\n      <head>\n        <Script\n          src=\"https://snaptrace-dashboard.vercel.app/snaptrace.js\"\n          strategy=\"beforeInteractive\"\n          data-api-key=\"sk_live_your_project_key\"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}",
    js: '<!-- React, Vue, Svelte, or Vanilla JavaScript -->\n<script \n  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"\n  data-api-key="sk_live_your_project_key"\n  async\n></script>',
    python: '# Python / Django / FastAPI / Flask\nimport traceback, requests\n\ndef log_to_snaptrace(exception, url="https://api.mycompany.com"):\n    try:\n        requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={\n            "apiKey": "sk_live_your_project_key",\n            "message": str(exception),\n            "stackTrace": traceback.format_exc(),\n            "url": url,\n            "environment": "production"\n        }, timeout=2)\n    except Exception:\n        pass',
    node: "// Node.js / Express / NestJS\nprocess.on('uncaughtException', (err) => {\n  fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ apiKey: 'sk_live_your_project_key', message: err.message, stackTrace: err.stack, environment: process.env.NODE_ENV || 'production' })\n  }).catch(() => {});\n});",
    go: '// Go (Golang) Crash Reporter\npackage main\n\nimport (\n  "bytes"\n  "encoding/json"\n  "net/http"\n)\n\nfunc SendSnapTrace(err error, route string) {\n  payload, _ := json.Marshal(map[string]string{ "apiKey": "sk_live_your_project_key", "message": err.Error(), "environment": "production", "url": route })\n  http.Post("https://snaptrace-dashboard.vercel.app/api/v1/log", "application/json", bytes.NewBuffer(payload))\n}',
    rust: '// Rust / Axum / Actix-web\nasync fn capture_snaptrace(err: &str, route: &str) {\n    let payload = serde_json::json!({ "apiKey": "sk_live_your_project_key", "message": err, "url": route, "environment": "production" });\n    let _ = reqwest::Client::new().post("https://snaptrace-dashboard.vercel.app/api/v1/log").json(&payload).send().await;\n}',
    csharp: '// C# / ASP.NET Core\npublic static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {\n    var payload = new { apiKey = "sk_live_your_project_key", message = ex.Message, stackTrace = ex.StackTrace, url = url, environment = "production" };\n    await new HttpClient().PostAsJsonAsync("https://snaptrace-dashboard.vercel.app/api/v1/log", payload);\n}',
    php: "<?php\n// PHP / Laravel / WordPress\nset_exception_handler(function ($e) {\n    $ch = curl_init('https://snaptrace-dashboard.vercel.app/api/v1/log');\n    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['apiKey' => 'sk_live_your_project_key', 'message' => $e->getMessage(), 'stackTrace' => $e->getTraceAsString(), 'environment' => 'production']));\n    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);\n    curl_exec($ch);\n});\n?>",
    ruby: "# Ruby on Rails / Sinatra\ndef send_snaptrace_alert(exception)\n  uri = URI('https://snaptrace-dashboard.vercel.app/api/v1/log')\n  Net::HTTP.post(uri, { apiKey: 'sk_live_your_project_key', message: exception.message, stackTrace: exception.backtrace&.join(\"\\n\"), environment: 'production' }.to_json, \"Content-Type\" => \"application/json\") rescue nil\nend",
    kotlin: '// Kotlin / Android / Java (OkHttp)\nfun sendSnapTrace(e: Throwable, context: String = "Android App") {\n    val json = JSONObject().apply {\n        put("apiKey", "sk_live_your_project_key")\n        put("message", e.localizedMessage ?: "Unknown Error")\n        put("environment", "production")\n        put("url", context)\n    }\n}',
    flutter: "// Flutter / Dart Crash Handler\nvoid captureSnapTrace(Object error, StackTrace stack) {\n  http.post(Uri.parse('https://snaptrace-dashboard.vercel.app/api/v1/log'), headers: {'Content-Type': 'application/json'}, body: jsonEncode({'apiKey': 'sk_live_your_project_key', 'message': error.toString(), 'stackTrace': stack.toString(), 'environment': 'production'}));\n}",
    cloudflare: "// Cloudflare Workers / Serverless Edge\nexport default {\n  async fetch(req: Request, env: any, ctx: any) {\n    try {\n      return await handleRequest(req);\n    } catch (err: any) {\n      ctx.waitUntil(fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ apiKey: 'sk_live_your_project_key', message: err.message, stackTrace: err.stack, environment: 'production' })\n      }));\n      return new Response('Edge Execution Error', { status: 500 });\n    }\n  }\n};",
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

  /* ── FAQs — unchanged ── */
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

  /* ── AUTH LOADING STATE ── */
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-10 w-10 border-2 border-yellow-400/30 rounded-full" />
            <div className="h-10 w-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-xs font-mono text-slate-500 tracking-wider">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════
     PAGE RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden relative">

      {/* Global CSS for shimmer, FAQ transition */}
      <style>{`
        @keyframes shimmer-border {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .pricing-popular-ring {
          background: linear-gradient(135deg, #facc15, #f59e0b, #fde68a, #facc15);
          background-size: 300% 300%;
          animation: shimmer-border 4s ease infinite;
        }
        .faq-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.32s ease, opacity 0.32s ease;
          opacity: 0;
        }
        .faq-body.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .faq-body-inner { overflow: hidden; }
        .hero-grid-pattern {
          background-image: radial-gradient(circle, rgba(250,204,21,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .btn-primary-glow:hover {
          box-shadow: 0 0 28px rgba(250,204,21,0.30), 0 4px 16px rgba(250,204,21,0.15);
        }
        .card-hover:hover {
          box-shadow: 0 0 0 1px rgba(250,204,21,0.15), 0 8px 32px rgba(0,0,0,0.4);
        }
      `}</style>

      {/* ── 1. TOP ANNOUNCEMENT BANNER ── */}
      <div className={
        'px-4 py-2 text-center text-xs font-bold font-mono flex items-center justify-center gap-2.5 transition-colors relative overflow-hidden ' +
        (marketingMode
          ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-950'
          : 'bg-[#0B101D] border-b border-yellow-400/30 text-yellow-300')
      }>
        <span>{marketingMode ? '🔥 Early Adopter Launch:' : '⚡ ARCHITECTURE SPEC:'}</span>
        <span className={
          'px-2.5 py-0.5 rounded text-[11px] font-mono border ' +
          (marketingMode ? 'bg-slate-950 text-yellow-300 border-yellow-400/20' : 'bg-yellow-400/10 text-yellow-200 border-yellow-400/20')
        }>
          {marketingMode ? 'Hurry up, limited seats left for Lifetime Pro Access!' : 'RFC-9110 Asynchronous Ingestion Engine Active'}
        </span>
        <span className="hidden sm:inline">
          {marketingMode ? '• Grab the offer now before public registration closes (No credit card needed)' : '• 0ms Hydration Penalty • <3.4KB Gzipped'}
        </span>
      </div>

      {/* ── 2. HEADER ── */}
      <header className="border-b border-slate-800/60 bg-[#090D16]/96 backdrop-blur-xl sticky top-0 z-40 shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition shrink-0">
            <SnapTraceLogo size="md" showText={true} />
          </Link>

          <nav className="hidden lg:flex items-center space-x-0.5 text-xs font-bold text-slate-200 font-mono">
            {/* Dropdown: Platform */}
            <div className="relative" onMouseEnter={() => setOpenDropdown('platform')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200 flex items-center gap-1.5 cursor-pointer">
                <span>Platform</span>
                <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              {openDropdown === 'platform' && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-80 bg-[#0D1220]/98 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 p-3 space-y-1 font-sans">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-400/80 font-bold px-2 pb-1">Core Capabilities</div>
                    <a href="#features" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                      <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/20 transition">
                        <span className="text-sm">🪶</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-xs">&lt;5KB Telemetry SDK</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Zero Core Web Vitals penalty</div>
                      </div>
                    </a>
                    <a href="#grouping" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                      <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition">
                        <span className="text-sm">🎯</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-xs">Root-Cause Collapse</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Multi-crash incident grouping</div>
                      </div>
                    </a>
                    <a href="#features" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition">
                        <span className="text-sm">🔒</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-xs">Client-Side PII Firewall</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">On-device password & card masking</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: AI Copilot */}
            <div className="relative" onMouseEnter={() => setOpenDropdown('ai')} onMouseLeave={() => setOpenDropdown(null)}>
              <button className="px-3.5 py-2 rounded-lg border border-transparent hover:border-yellow-400/30 hover:bg-yellow-400/8 text-yellow-300 hover:text-yellow-200 transition-all duration-200 flex items-center gap-1.5 cursor-pointer">
                <span>✨ AI Copilot</span>
                <svg className="w-3 h-3 text-yellow-500/60" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
              {openDropdown === 'ai' && (
                <div className="absolute top-full left-0 pt-2 z-50">
                  <div className="w-80 bg-[#0D1220]/98 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 p-3 space-y-1 font-sans">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-400/80 font-bold px-2 pb-1">AI Capabilities</div>
                    <a href="#ai-agent" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-xs">Cursor & Claude 1-Click Export</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Export pre-formatted prompts for your IDE [1.4.1, 1.4.2]</div>
                      </div>
                    </a>
                    <a href="#byok" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/60 transition group">
                      <div className="w-7 h-7 rounded-lg bg-yellow-400/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400/20 transition">
                        <span className="text-sm">⚡</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-xs">BYOK AI Diagnosis Hub</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Analyze bugs live with Gemini & OpenAI</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#quickstart" className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200">SDK Setup</a>
            <a href="#comparison" className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200">Why SnapTrace</a>
            <a href="#pricing" className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200 text-yellow-400">Pricing</a>
            <Link href="/about" className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200">About</Link>
            <a href="#faq" className="px-3.5 py-2 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-800/50 hover:text-yellow-300 transition-all duration-200">FAQ</a>
          </nav>

          <div className="flex items-center space-x-2 font-mono shrink-0">
            <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/60 transition">
              Sign In
            </Link>
            <Link href="/demo" className="px-4 py-2 rounded-xl border border-yellow-400/40 hover:border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 font-bold text-xs transition">
              GET DEMO
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/25 transition transform hover:-translate-y-0.5 btn-primary-glow">
              GET STARTED
            </Link>
          </div>
        </div>
      </header>

      {/* ── MARKETING MODE TOGGLE ── */}
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="absolute top-4 right-6 z-30 hidden sm:block">
          <div className="bg-[#0D1220]/95 border border-slate-700/50 rounded-2xl p-2.5 px-3.5 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-1.5 font-mono ring-1 ring-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">Marketing Mode</span>
            <button
              onClick={toggleMarketingMode}
              className={'w-11 h-6 rounded-full transition-all relative cursor-pointer shadow-inner ' + (marketingMode ? 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-yellow-500/20' : 'bg-slate-700/80')}
              title="Toggle between Marketing Mode and Dev Spec Mode"
            >
              <div className={'w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ' + (marketingMode ? 'right-1' : 'left-1')} />
            </button>
            <span className={'text-[9px] font-bold font-mono tracking-widest ' + (marketingMode ? 'text-yellow-300' : 'text-slate-500')}>
              {marketingMode ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          VIEW 1: DEV TERMINAL MODE
      ══════════════════════════════════════════ */}
      {!marketingMode ? (
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-6 bg-[#05070E] relative overflow-hidden animate-in fade-in duration-150">
          {/* subtle scanline bg */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,128,0.015) 2px, rgba(0,255,128,0.015) 4px)' }} />

          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 relative z-10">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  DEV SPEC MODE ACTIVE
                </div>
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

              <div className="space-y-2.5 text-xs font-mono text-slate-300 leading-relaxed">
                <p><strong className="text-white">Why did we build this?</strong> Because legacy APMs became bloated and noisy [1.1.7, 1.2.2]. A single database pool timeout triggers 4 downstream HTTP crashes, and traditional trackers spam your inbox with 4 separate alerts that you have to piece together by hand on a Sunday [1.1.7].</p>
                <p className="text-yellow-300">SnapTrace collapses the entire outage cascade into <strong>1 consolidated root cause</strong> with a 2-line AI fix ready in seconds.</p>
              </div>

              <div className="p-4 bg-[#0B101D] border border-slate-700/60 rounded-2xl space-y-3 ring-1 ring-white/5">
                <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-widest block">⚡ PRODUCTION BENCHMARKS</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>• SDK Size: <strong className="text-emerald-400">&lt;3.4KB gzipped</strong></div>
                  <div>• Transport: <strong className="text-slate-200">sendBeacon (0ms)</strong></div>
                  <div>• PII Masking: <strong className="text-emerald-400">Client-Side Regex</strong></div>
                  <div>• AI Workflow: <strong className="text-purple-400">1-Click Cursor / Claude [1.4.1, 1.4.2]</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 font-mono">
                <Link href="/signup" className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 btn-primary-glow">
                  Get Free Beta Key in 30s →
                </Link>
                <Link href="/demo" className="px-5 py-3 bg-[#0B101D] hover:bg-slate-800 border border-slate-700/60 text-yellow-300 text-xs font-bold rounded-xl transition">
                  ⚡ Open Demo Workspace
                </Link>
              </div>
            </div>

            {/* CLI Chat Terminal */}
            <div className="lg:col-span-6 bg-[#090D16] border border-emerald-500/30 rounded-3xl p-5 shadow-2xl shadow-emerald-500/5 flex flex-col justify-between font-mono space-y-4 ring-1 ring-emerald-500/10">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/70" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="ml-2">/snappy-cli <span className="text-[10px] text-slate-500 font-normal">v1.0-beta</span></span>
                </div>
                <span className="text-[10px] text-slate-500">Ask any technical question</span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 text-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700">
                {cliMessages.map((msg, idx) => (
                  <div key={idx} className={'p-3.5 rounded-2xl ' + (msg.role === 'user' ? 'bg-[#0B101D] border border-slate-700/60 text-yellow-300 ml-6' : 'bg-[#05070E] border border-emerald-500/20 text-slate-200 mr-4')}>
                    <span className="text-[10px] block font-bold text-slate-500 mb-1">{msg.role === 'user' ? '> YOU' : '⚡ SNAPPY (ENGINE)'}</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { label: '🤖 Which AI Models?', q: 'which ai models does this support?' },
                    { label: '🌍 Supported Languages?', q: 'which languages does this support?' },
                    { label: '🎯 Cascading Collapse?', q: 'how does cascading error collapse work?' },
                    { label: '⚡ Why <5KB?', q: 'why is the SDK under 5KB?' },
                  ].map(({ label, q }) => (
                    <button key={q} onClick={() => handleAskCli(q)} className="px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-700/80 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/40 hover:border-slate-600 transition cursor-pointer">
                      {label}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (cliInput.trim()) handleAskCli(cliInput.trim()); }} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask any technical question..."
                    value={cliInput}
                    onChange={(e) => setCliInput(e.target.value)}
                    className="flex-1 bg-[#05070E] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400/60 font-mono transition"
                  />
                  <button type="submit" className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl text-xs font-bold transition cursor-pointer shrink-0">
                    Send →
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

      ) : (
      /* ══════════════════════════════════════════
          VIEW 2: MARKETING MODE
      ══════════════════════════════════════════ */
      <>
        {/* ── 3. HERO SECTION ── */}
        <section className="relative pt-10 pb-16 overflow-hidden">
          <TelemetryBeamBackground />

          {/* Dot grid */}
          <div className="absolute inset-0 hero-grid-pattern pointer-events-none" />

          {/* Gradient orbs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-yellow-500/10 blur-[120px] rounded-full" />
            <div className="absolute top-10 right-1/4 w-[300px] h-[250px] bg-purple-500/10 blur-[120px] rounded-full" />
            <div className="absolute top-20 left-1/2 w-[250px] h-[200px] bg-emerald-500/8 blur-[100px] rounded-full" />
          </div>

          <div className="max-w-5xl mx-auto px-6 text-center space-y-7 relative z-10">
            {/* Badge */}
            <div>
              <a href="#ai-agent" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 hover:bg-purple-500/18 border border-purple-500/25 hover:border-purple-400/50 text-xs font-mono font-bold text-purple-300 transition shadow-lg group cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>✨ SnapTrace AI Protocol: Fix production crashes right inside Cursor & Claude Code → [1.4.1, 1.4.2]</span>
              </a>
            </div>

            {/* H1 */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.06] max-w-5xl mx-auto">
              Code <span className="text-red-400 underline decoration-red-500/40 decoration-wavy underline-offset-4">breaks</span>, fix it in a{' '}
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">snap.</span>
            </h1>

            {/* Subheading */}
            <p className="max-w-2xl mx-auto text-sm sm:text-[15px] text-slate-400 leading-relaxed font-sans">
              Stop spending Sundays connecting the dots by hand. SnapTrace collapses cascading multi-error outages into a single root-cause incident. Under{' '}
              <span className="text-yellow-300 font-mono font-bold">&lt;5KB</span>, with on-device PII masking and 1-click AI code fixes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1 font-mono">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-sm font-black rounded-xl shadow-xl shadow-yellow-500/20 transition transform hover:-translate-y-0.5 btn-primary-glow">
                Claim Lifetime Pro Pass (Limited Seats Left) →
              </Link>
              <Link href="/demo" className="w-full sm:w-auto px-8 py-4 bg-[#0B101D] hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 text-yellow-300 text-sm font-bold rounded-xl transition shadow-md">
                ⚡ Open Demo Workspace (No Signup)
              </Link>
            </div>

            {/* Script snippet box */}
            <div className="pt-1 max-w-xl mx-auto">
              <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-yellow-400/30 via-slate-700/20 to-yellow-400/10">
                <div className="bg-[#0B101D] rounded-2xl p-2.5 flex items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2 truncate text-slate-400 pl-2">
                    <span className="text-yellow-400 font-bold select-none shrink-0">&lt;/&gt;</span>
                    <span className="truncate text-slate-300 text-[11px]">
                      &lt;script src=&quot;https://snaptrace.../snaptrace.js&quot; data-api-key=&quot;<span className="text-yellow-300 font-bold">YOUR_KEY</span>&quot; async&gt;&lt;/script&gt;
                    </span>
                  </div>
                  <button
                    onClick={handleCopyHeroScript}
                    className="px-3.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-yellow-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 border border-slate-700/40"
                  >
                    {copiedHeroScript ? '✓ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-5 text-[10px] text-slate-500 font-mono pt-2">
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> Drop into HTML head</span>
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> 0ms main thread delay</span>
                <span className="flex items-center gap-1"><span className="text-emerald-400">✓</span> &lt;5KB featherweight</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. ROOT-CAUSE SCANNER ── */}
        <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={50}>
          <div id="grouping" className="relative bg-gradient-to-b from-[#0e1424] to-[#070b14] border border-yellow-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 ring-1 ring-yellow-400/10 overflow-hidden">
            {/* subtle corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 font-mono text-xs relative">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-slate-300 font-bold ml-1">Live Production Incident Scanner</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold uppercase text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Root Cause Trace
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-7 space-y-2 text-xs font-mono">
                {[
                  { label: '1. User submits checkout form', status: '✓ 200 OK', ok: true },
                  { label: '2. Frontend dispatches POST /v1/order', status: '✓ 200 OK', ok: true },
                  { label: '3. Next.js Server Action executes', status: '✓ 200 OK', ok: true },
                ].map((row) => (
                  <div key={row.label} className="p-3 bg-[#070A12] rounded-xl border border-slate-800/60 flex items-center justify-between">
                    <span className="text-slate-300">{row.label}</span>
                    <span className="text-emerald-400 font-bold">{row.status}</span>
                  </div>
                ))}
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-500/50 flex items-center justify-between shadow-lg shadow-red-950/30">
                  <span className="text-red-300 font-bold">4. database.js:18 pool.connect()</span>
                  <span className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    CRASH ORIGIN
                  </span>
                </div>
              </div>

              <div className="md:col-span-5 p-5 bg-[#070A12] rounded-2xl border border-yellow-400/30 space-y-3.5 font-mono text-xs shadow-xl ring-1 ring-yellow-400/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">⚡ SNAPTRACE COLLAPSE ENGINE</div>
                <div className="text-white font-bold text-sm leading-snug">Root Cause: Connection Pool Exhaustion</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  4 downstream HTTP 500 crashes collapsed under <code className="text-yellow-300 bg-yellow-400/10 px-1 rounded">database.js</code>. Client connection was not released.
                </p>
                <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Code Patch Ready</span>
                  <code className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300">client.release()</code>
                </div>
              </div>
            </div>
          </div>
        </SmoothReveal>

        {/* ── 5. SOCIAL PROOF ── */}
        <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={100}>
          <div id="social-proof" className="relative p-6 rounded-3xl bg-[#0B101D] border border-slate-800/60 shadow-xl overflow-hidden ring-1 ring-white/5 card-hover transition-all duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-l-3xl" />
            <div className="pl-4">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <span>💬</span> Validated by Senior Software Engineers
              </div>
              <blockquote className="text-sm text-slate-300 italic leading-relaxed font-sans">
                &quot;5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.&quot;
              </blockquote>
              <div className="flex items-center gap-3 pt-3 text-xs font-mono">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-600/20 border border-yellow-400/30 flex items-center justify-center font-bold text-yellow-300 text-xs">
                  EB
                </div>
                <div>
                  <div className="text-white font-bold">Eusebiu Balan</div>
                  <div className="text-slate-500 text-[10px]">Senior Full-Stack Engineer • via Dev.to</div>
                </div>
              </div>
            </div>
          </div>
        </SmoothReveal>

        {/* ── 6. AI AGENT / IDE EXPORT SECTION ── */}
        <section id="ai-agent" className="py-20 border-t border-slate-800/60 relative">
          <div className="max-w-5xl mx-auto px-6 space-y-10">
            <SmoothReveal className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase font-mono">
                <span>🤖</span> AI Workflow Native
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Turn runtime stack traces into instant AI bug fixes
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                Export pre-formatted, AI-ready crash diagnostic prompts directly into{' '}
                <strong className="text-white">Cursor, Claude Code, or VS Code Copilot</strong> to generate 2-line code patches locally in your IDE [1.4.1, 1.4.2].
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 font-mono text-xs">
                {(['cursor', 'claude', 'vscode'] as const).map((ide) => (
                  <button
                    key={ide}
                    onClick={() => setActiveIdeTab(ide)}
                    className={'px-4 py-2 rounded-xl font-bold transition cursor-pointer border ' + (activeIdeTab === ide ? 'bg-purple-600 text-white shadow-md border-purple-500' : 'bg-[#0B101D] text-slate-400 hover:text-white border-slate-700/60 hover:border-slate-600')}
                  >
                    {ide === 'cursor' && 'Cursor IDE'}
                    {ide === 'claude' && 'Claude Code'}
                    {ide === 'vscode' && 'VS Code Copilot'}
                  </button>
                ))}
              </div>
            </SmoothReveal>

            <SmoothReveal className="bg-[#0B101D] border border-slate-800/60 rounded-3xl p-6 shadow-2xl max-w-4xl mx-auto space-y-4 ring-1 ring-white/5" delay={150}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/60 gap-3">
                <div>
                  <span className="text-xs font-bold text-red-400 font-mono block">CRASH: ReferenceError: Connection pool exhausted</span>
                  <span className="text-[10px] text-slate-500 font-mono">Captured at database.js:18:11</span>
                </div>
                <button
                  onClick={handleCopyCursorDemo}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer self-start sm:self-auto font-mono hover:shadow-purple-500/20"
                >
                  {copiedCursorPrompt ? '✓ Copied AI Prompt!' : '📋 Copy Prompt for Cursor / Claude [1.4.1, 1.4.2]'}
                </button>
              </div>

              <div className="bg-[#070A12] border border-purple-500/20 rounded-2xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                  <span>✨</span> Instant AI Root-Cause Diagnosis
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong className="text-white">Plain English:</strong> The PostgreSQL client in{' '}
                  <code className="text-yellow-300 bg-yellow-400/10 px-1.5 py-0.5 rounded">database.js</code> is opening connections inside a tight loop without releasing them back to the pool.
                </p>
                <div className="relative">
                  <pre className="p-4 bg-[#0B101D] rounded-xl border border-slate-800/60 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                    {'// Fix in database.js: Release connection back to pool\nconst client = await pool.connect();\ntry {\n  await client.query(\'SELECT * FROM users WHERE id = $1\', [userId]);\n} finally {\n  client.release(); // ✓ Releases connection\n}'}
                  </pre>
                </div>
              </div>
            </SmoothReveal>
          </div>
        </section>

        {/* ── 7. BYOK AI SECTION — WITH BRAND LOGOS ── */}
        <section id="byok" className="py-20 border-t border-slate-800/60 bg-gradient-to-b from-[#0B101D]/60 to-[#05070E] relative">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            <SmoothReveal className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs font-bold uppercase font-mono">
                <span>⚡</span> Zero Platform Markup
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
                Bring Your Own Key{' '}
                <span className="text-yellow-400">(BYOK)</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-sans">
                Analyze and fix runtime crashes directly inside your dashboard with your favorite AI models. No expensive enterprise markups, and zero vendor lock-in.
              </p>
            </SmoothReveal>

            {/* Active AI Cards: Gemini, OpenAI, DeepSeek */}
            <SmoothReveal className="grid grid-cols-1 md:grid-cols-3 gap-5" delay={100}>
              {/* Google Gemini */}
              <div className="group p-6 rounded-3xl bg-[#090D16] border border-slate-800/60 hover:border-yellow-400/30 transition-all duration-300 space-y-4 ring-1 ring-white/5 card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 via-purple-500/5 to-transparent rounded-3xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center shadow-lg">
                    <GeminiLogo size={26} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    100% FREE TIER
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono mb-1">Google Gemini</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Integrated with <strong className="text-slate-200">Gemini 2.5 Flash Lite</strong>. Get lightning-fast root-cause explanations and copy-paste code patches directly inside your Inspect modal at $0 cost.
                  </p>
                </div>
                <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live in Dashboard
                </div>
              </div>

              {/* OpenAI */}
              <div className="group p-6 rounded-3xl bg-[#090D16] border border-slate-800/60 hover:border-yellow-400/30 transition-all duration-300 space-y-4 ring-1 ring-white/5 card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-3xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center shadow-lg">
                    <OpenAILogo size={26} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 text-[10px] font-mono font-bold">
                    GPT-4o READY
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono mb-1">OpenAI Models</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Paste your standard OpenAI key (<code className="text-yellow-300 font-mono bg-yellow-400/10 px-1 rounded">sk-...</code>) to analyze deep stack traces with state-of-the-art reasoning models. Stored securely on your device.
                  </p>
                </div>
                <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live in Dashboard
                </div>
              </div>

              {/* DeepSeek */}
              <div className="group p-6 rounded-3xl bg-[#090D16] border border-slate-800/60 hover:border-blue-400/30 transition-all duration-300 space-y-4 ring-1 ring-white/5 card-hover relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-3xl pointer-events-none" />
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg">
                    <DeepSeekLogo size={28} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-mono font-bold">
                    BYOK READY
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono mb-1">DeepSeek</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use your <strong className="text-slate-200">DeepSeek API key</strong> for high-performance, cost-efficient reasoning. Excellent for deep stack trace analysis with strong code generation capabilities.
                  </p>
                </div>
                <div className="pt-1 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live in Dashboard
                </div>
              </div>
            </SmoothReveal>

            {/* Coming Soon Row: Claude + Ollama */}
            <SmoothReveal className="grid grid-cols-1 md:grid-cols-2 gap-5" delay={200}>
              <div className="p-5 rounded-3xl bg-[#090D16]/60 border border-slate-800/40 space-y-3 relative overflow-hidden opacity-70">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/3 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                    <ClaudeLogo size={24} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-mono font-bold">IN PIPELINE</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-300 font-mono mb-0.5">Claude 3.5 Sonnet (Anthropic)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Direct API support for Claude's advanced reasoning and code analysis capabilities. Coming soon.</p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-[#090D16]/60 border border-slate-800/40 space-y-3 relative overflow-hidden opacity-70">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-500/3 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-500/10 border border-slate-600/20 flex items-center justify-center">
                    <OllamaLogo size={24} />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 text-[10px] font-mono font-bold">IN PIPELINE</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-300 font-mono mb-0.5">Ollama — 100% Local & Private</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Run diagnostics entirely offline using local models. Zero data leaves your machine. Coming soon.</p>
                </div>
              </div>
            </SmoothReveal>
          </div>
        </section>

        {/* ── 8. 12-LANGUAGE SDK TERMINAL ── */}
        <SmoothReveal className="max-w-5xl mx-auto px-6 pb-20" delay={100}>
          <div id="quickstart" className="bg-[#0B101D] border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/5">
            <div className="bg-[#070A12] px-5 py-4 border-b border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2 font-mono whitespace-nowrap">Stack:</span>
                {([
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
                ] as { id: StackKey; label: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveQuickTab(tab.id)}
                    className={'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition uppercase cursor-pointer whitespace-nowrap font-mono ' +
                      (activeQuickTab === tab.id
                        ? 'bg-yellow-400/12 text-yellow-300 border border-yellow-400/35 shadow-sm'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                      )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold rounded-lg transition cursor-pointer self-start md:self-auto font-mono whitespace-nowrap border border-slate-700/40"
              >
                {copiedSnippet ? '✓ Copied!' : '📋 Copy SDK Code'}
              </button>
            </div>
            <div className="p-6 bg-[#070A12] overflow-x-auto">
              <pre className="font-mono text-xs text-yellow-300/90 leading-relaxed p-1 overflow-x-auto select-text">
                <code>{snippets[activeQuickTab]}</code>
              </pre>
            </div>
          </div>
        </SmoothReveal>

        {/* ── 9. FEATHERWEIGHT SDK SECTION ── */}
        <section id="features" className="py-20 border-t border-slate-800/60 bg-[#060911]/50">
          <div className="max-w-5xl mx-auto px-6">
            <SmoothReveal className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                  <span>🪶</span> Performance & Core Web Vitals
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  An error tracker that never slows down your users
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Legacy APMs force your users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores [1.2.2]. SnapTrace is a zero-dependency script under <strong className="text-white">5KB</strong> gzipped.
                </p>

                <div className="space-y-2 pt-1 font-mono">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-emerald-500/20 text-xs ring-1 ring-emerald-500/5">
                    <span className="text-slate-200 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      SnapTrace JS Telemetry SDK
                    </span>
                    <span className="text-emerald-400 font-bold">&lt; 5 KB</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-slate-800/40 text-xs opacity-60">
                    <span className="text-slate-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-500/50" />Honeybadger Client</span>
                    <span className="text-slate-400 font-bold">~35 KB</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B101D] border border-slate-800/40 text-xs opacity-40">
                    <span className="text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500/50" />Sentry Browser SDK</span>
                    <span className="text-red-400 font-bold">100+ KB</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 bg-[#0B101D] border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 ring-1 ring-white/5">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Google Lighthouse Impact</span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Score: 100/100
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800/60 space-y-1.5">
                    <div className="text-2xl font-black text-emerald-400 font-mono">0.0ms</div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Main Thread Delay</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#070A12] border border-slate-800/60 space-y-1.5">
                    <div className="text-2xl font-black text-emerald-400 font-mono">3.4 KB</div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Gzipped</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-800/60 pt-4 font-mono">
                  &quot;We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly.&quot;
                </p>
              </div>
            </SmoothReveal>
          </div>
        </section>

        {/* ── 10. COMPARISON TABLE ── */}
        <section id="comparison" className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-800/60 space-y-10">
          <SmoothReveal className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Why Developers Choose SnapTrace</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto font-mono">Built to replace bloated, noisy enterprise APMs [1.1.7, 1.2.2].</p>
          </SmoothReveal>

          <SmoothReveal className="bg-[#0B101D] border border-slate-800/60 rounded-3xl overflow-x-auto shadow-2xl ring-1 ring-white/5" delay={150}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/60 bg-[#070A12]">
                  <th className="p-4 text-slate-500 font-semibold uppercase tracking-wider font-mono text-[10px]">Feature</th>
                  <th className="p-4">
                    <span className="flex items-center gap-1.5 text-yellow-400 font-bold font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      SnapTrace
                    </span>
                  </th>
                  <th className="p-4 text-slate-500 font-semibold uppercase tracking-wider font-mono text-[10px]">Sentry</th>
                  <th className="p-4 text-slate-500 font-semibold uppercase tracking-wider font-mono text-[10px]">GlitchTip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {[
                  {
                    feature: 'SDK Weight',
                    snap: { text: '< 5 KB (Featherweight)', badge: true },
                    sentry: '~100 KB+',
                    glitch: '~100 KB+',
                  },
                  {
                    feature: 'Cascading Root-Cause Collapse',
                    snap: { text: 'Multi-crash unified incident', badge: true },
                    sentry: 'Noisy separate alerts [1.1.7]',
                    glitch: '✕ None',
                  },
                  {
                    feature: 'Free Tier Events',
                    snap: { text: '2,000 / month', badge: true },
                    sentry: '5,000 / month',
                    glitch: '1,000 / month',
                  },
                  {
                    feature: 'Client-Side PII Scrubbing',
                    snap: { text: 'Native on-device', badge: true },
                    sentry: 'Complex server rules',
                    glitch: '✕ None',
                  },
                  {
                    feature: 'In-Dashboard AI Diagnosis (BYOK)',
                    snap: { text: 'Included in Pro', badge: true },
                    sentry: '$$$ Expensive addon',
                    glitch: '✕ None',
                  },
                  {
                    feature: '1-Click Prompt Export for Cursor',
                    snap: { text: 'Free Forever', badge: true },
                    sentry: '✕ Manual copy',
                    glitch: '✕ Manual copy',
                  },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-semibold text-white text-xs">{row.feature}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/15">
                        ✓ {row.snap.text}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{row.sentry}</td>
                    <td className="p-4 text-slate-500 text-xs">{row.glitch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SmoothReveal>
        </section>

        {/* ── 11. PRICING SECTION ── */}
        <section id="pricing" className="max-w-7xl mx-auto px-6 pt-8 pb-16 border-t border-slate-800/60">
          <div className="bg-[#090D16]/90 border border-slate-800/60 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 ring-1 ring-white/5">
            <SmoothReveal className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                <span>💎</span> Predictable APM Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Simple, developer-first plans</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto font-mono">Zero surprise overage bills. Generous headroom for solo builders and client studios.</p>

              {/* Billing toggle */}
              <div className="pt-3 flex items-center justify-center">
                <div className="bg-[#0B101D] p-1 rounded-2xl border border-slate-800/60 inline-flex items-center gap-1 font-mono text-xs shadow-xl ring-1 ring-white/5">
                  <button
                    onClick={() => setBillingInterval('monthly')}
                    className={'px-5 py-2.5 rounded-xl font-bold transition cursor-pointer ' + (billingInterval === 'monthly' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-white')}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval('annual')}
                    className={'px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ' + (billingInterval === 'annual' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-yellow-300')}
                  >
                    <span>Annual</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-950/60 text-yellow-300 text-[10px] font-bold">Save 20% ⚡</span>
                  </button>
                </div>
              </div>
              {billingInterval === 'annual' && (
                <p className="text-[11px] text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Billed annually — includes 2 months completely free
                </p>
              )}
            </SmoothReveal>

            <SmoothReveal className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch max-w-6xl mx-auto" delay={150}>

              {/* Tier 1: Developer Free */}
              <div className="bg-[#0B101D] border border-slate-800/60 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-300 ring-1 ring-white/4 card-hover">
                <div className="space-y-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Developer Free</span>
                    <div className="mt-1.5 text-3xl font-black text-white">$0 <span className="text-xs text-slate-500 font-normal font-mono">/ month</span></div>
                    <p className="text-xs text-slate-500 pt-1">For side projects and personal experiments.</p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/60 pt-5 font-mono">
                    {[
                      { t: '2,000 Events / Month', bold: true },
                      { t: '7-Day Data Retention' },
                      { t: '1 Active Project' },
                      { t: 'Sub-5KB SDK & 0ms Main Thread Delay' },
                      { t: 'In-Dashboard Error Inspection' },
                      { t: 'Client-Side Regex PII Firewall' },
                      { t: 'Email & In-App Alerts (No Webhooks)' },
                    ].map(({ t, bold }) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{bold ? <strong className="text-white">{t}</strong> : t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/signup" className="block w-full py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono border border-slate-700/40 hover:border-slate-600">
                  Start Free Forever →
                </Link>
              </div>

              {/* Tier 2: Pro Builder — POPULAR */}
              <div className="relative flex flex-col justify-between transform lg:-translate-y-2">
                {/* Shimmer ring */}
                <div className="pricing-popular-ring p-[2px] rounded-3xl h-full">
                  <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] rounded-[22px] p-6 sm:p-7 space-y-6 shadow-2xl h-full flex flex-col justify-between">
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 font-mono">Pro Builder</span>
                          <div className="mt-1.5 text-3xl font-black text-white">
                            {billingInterval === 'annual' ? '$15' : '$19'}
                            <span className="text-xs text-slate-400 font-normal font-mono"> / month</span>
                          </div>
                          <p className="text-xs text-slate-400 pt-1">
                            {billingInterval === 'annual' ? 'Billed annually at $180/yr.' : 'For solo devs, freelancers & micro-SaaS.'}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[9px] font-black rounded-full uppercase tracking-wider shadow-lg font-mono whitespace-nowrap">
                          MOST POPULAR
                        </span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-slate-200 border-t border-slate-800/60 pt-5 font-mono">
                        {[
                          { t: '75,000 Events / Month', bold: true },
                          { t: '30-Day Telemetry Retention' },
                          { t: 'Up to 5 Active Projects' },
                          { t: '⚡ Instant Discord, Slack & Telegram Alerts' },
                          { t: '⚡ 1-Click Cursor & Claude AI Fix Prompts [1.4.1, 1.4.2]' },
                          { t: '⚡ 60s Loop Deduplication ([x50] Noise Throttling) [1.1.7]' },
                          { t: 'In-Dashboard BYOK AI Copilot' },
                        ].map(({ t, bold }) => (
                          <li key={t} className="flex items-start gap-2.5">
                            <span className="text-yellow-400 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{bold ? <strong className="text-white">{t}</strong> : t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/signup" className="block w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-center text-xs rounded-xl transition shadow-xl shadow-yellow-500/20 cursor-pointer font-mono btn-primary-glow">
                      Claim Pro Beta Pass →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tier 3: Agency Studio */}
              <div className="bg-[#0B101D] border border-slate-800/60 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-300 ring-1 ring-white/4 card-hover">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 font-mono">Agency Studio</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold uppercase">FOR AGENCIES</span>
                    </div>
                    <div className="text-3xl font-black text-white">
                      {billingInterval === 'annual' ? '$39' : '$49'}
                      <span className="text-xs text-slate-500 font-normal font-mono"> / month</span>
                    </div>
                    <p className="text-xs text-slate-400 pt-1">
                      {billingInterval === 'annual' ? 'Billed annually at $468/yr.' : 'For studios & agencies managing client sites.'}
                    </p>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/60 pt-5 font-mono">
                    {[
                      { t: '500,000 Events / Month', bold: true },
                      { t: '90-Day Telemetry Retention' },
                      { t: 'UNLIMITED Client Projects & Keys', bold: true },
                      { t: 'Multi-Seat Team & Client Invites' },
                      { t: '⚡ Cascading Multi-Error Outage Collapse' },
                      { t: 'Priority Edge Ingestion Gateways' },
                      { t: 'Raw Log CSV / JSON Data Export' },
                    ].map(({ t, bold }) => (
                      <li key={t} className="flex items-start gap-2.5">
                        <span className="text-purple-400 font-bold shrink-0 mt-0.5">✓</span>
                        <span>{bold ? <strong className="text-slate-200">{t}</strong> : t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAgencyModal(true)}
                  className="block w-full py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono border border-slate-700/40 hover:border-slate-600"
                >
                  Request Agency Access →
                </button>
              </div>

            </SmoothReveal>
          </div>
        </section>

        {/* ── 12. SECURITY & COMPLIANCE BADGES ── */}
        <section className="py-16 border-t border-slate-800/60 bg-[#060911]/50">
          <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
            <div>
              <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-yellow-400 mb-2">Security by Default</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Built for Developer Privacy & Performance</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: '🛡️', title: 'GDPR Ready', desc: 'On-device PII masking', color: 'emerald' },
                { icon: '🪶', title: '<5KB Footprint', desc: '100/100 Core Web Vitals', color: 'yellow' },
                { icon: '🔇', title: 'Anti-Noise Guard', desc: 'SHA-256 loop throttling [1.1.7]', color: 'blue' },
                { icon: '🔓', title: 'No Vendor Lock-in', desc: 'Universal REST protocol', color: 'purple' },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} className="p-5 bg-[#0B101D] border border-slate-800/60 rounded-2xl space-y-2.5 ring-1 ring-white/5 hover:ring-yellow-400/10 transition card-hover duration-300 text-xs font-mono">
                  <div className={
                    'w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-xl ' +
                    (color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                     color === 'yellow' ? 'bg-yellow-400/10 border border-yellow-400/20' :
                     color === 'blue' ? 'bg-blue-500/10 border border-blue-500/20' :
                     'bg-purple-500/10 border border-purple-500/20')
                  }>
                    {icon}
                  </div>
                  <div className="text-white font-bold">{title}</div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 13. FAQ SECTION ── */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800/60 space-y-8">
          <SmoothReveal className="text-center space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-sm text-slate-400 font-mono">Real technical answers for developers evaluating SnapTrace.</p>
          </SmoothReveal>

          <SmoothReveal className="space-y-2.5" delay={150}>
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className={'bg-[#0B101D] border rounded-2xl overflow-hidden transition-all duration-300 ring-1 ring-white/4 ' + (isOpen ? 'border-yellow-400/30' : 'border-slate-800/60')}>
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <span className={'font-semibold text-sm transition-colors ' + (isOpen ? 'text-yellow-300' : 'text-white group-hover:text-yellow-300')}>
                      {faq.q}
                    </span>
                    <span className={'shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 font-mono text-base ' + (isOpen ? 'bg-yellow-400/15 text-yellow-400 rotate-45' : 'bg-slate-800/60 text-slate-500 group-hover:text-slate-300')}>
                      +
                    </span>
                  </button>
                  <div className={'faq-body' + (isOpen ? ' open' : '')}>
                    <div className="faq-body-inner">
                      <div className="px-4 sm:px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/40 pt-3 font-sans">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </SmoothReveal>
        </section>

        {/* ── 14. FOOTER ── */}
        <footer className="border-t border-slate-800/60 bg-[#060911] pt-16 pb-12 relative overflow-hidden font-sans">
          <div className="max-w-6xl mx-auto px-6 space-y-12">

            {/* Footer CTA */}
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Ready to catch bugs in a snap?</h2>
              <p className="text-xs text-slate-500 leading-relaxed font-mono">Join developers catching crashes in real time with zero noise and instant AI diagnoses.</p>
              <Link href="/signup" className="inline-block px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5 btn-primary-glow font-mono">
                Claim Your Free Beta Pass in 60s →
              </Link>
            </div>

            {/* 4-Column Nav */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-slate-800/40 text-xs font-mono">
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest block">Company</span>
                <ul className="space-y-2 text-slate-500">
                  <li><Link href="/about" className="hover:text-white transition">About SnapTrace</Link></li>
                  <li><a href="#features" className="hover:text-white transition">Engineering Blog</a></li>
                  <li><a href="#ai-agent" className="hover:text-white transition">Careers</a></li>
                  <li><a href="mailto:hello.snaptrace@gmail.com" className="hover:text-yellow-400 transition font-semibold">Contact Support</a></li>
                  <li><Link href="/privacy" className="hover:text-white transition">Trust & Security</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest block">Platform</span>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="#features" className="hover:text-white transition">Telemetry Ingestion</a></li>
                  <li><a href="#features" className="hover:text-white transition">&lt;5KB Client SDK</a></li>
                  <li><a href="#ai-agent" className="hover:text-white transition">AI Root Cause Engine</a></li>
                  <li><a href="#features" className="hover:text-white transition">Client-Side PII Firewall</a></li>
                  <li><a href="#features" className="hover:text-white transition">60s Loop Throttling [1.1.7]</a></li>
                  <li><Link href="/dashboard" className="hover:text-white transition">Realtime WebSockets</Link></li>
                </ul>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest block">Solutions</span>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="#quickstart" className="hover:text-white transition">Next.js App Router</a></li>
                  <li><a href="#quickstart" className="hover:text-white transition">Python & FastAPI</a></li>
                  <li><a href="#quickstart" className="hover:text-white transition">Node.js / Express</a></li>
                  <li><a href="#quickstart" className="hover:text-white transition">Go, Rust & PHP</a></li>
                  <li><a href="#pricing" className="hover:text-white transition">Micro-SaaS & Startups</a></li>
                  <li><a href="#pricing" className="hover:text-white transition">Agencies & Studios</a></li>
                </ul>
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest block">Get Help</span>
                <ul className="space-y-2 text-slate-500">
                  <li><a href="mailto:hello.snaptrace@gmail.com" className="text-yellow-400 font-semibold hover:text-yellow-300 transition block truncate">hello.snaptrace@gmail.com</a></li>
                  <li><a href="#quickstart" className="hover:text-white transition">SDK Documentation</a></li>
                  <li><Link href="/demo" className="hover:text-yellow-400 transition font-semibold">Public Demo</Link></li>
                  <li><Link href="/test" className="hover:text-white transition">Live Test Sandbox</Link></li>
                  <li>
                    <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Systems Operational
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Gradient divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent" />

            {/* Bottom bar */}
            <div className="flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-600 gap-4">
              <div className="flex items-center space-x-5 text-[10px] uppercase tracking-wider">
                <Link href="/terms" className="hover:text-yellow-400 transition font-semibold">Terms</Link>
                <Link href="/privacy" className="hover:text-yellow-400 transition font-semibold">Security & Compliance</Link>
                <Link href="/privacy" className="hover:text-yellow-400 transition font-semibold">Privacy</Link>
                <Link href="/about" className="hover:text-yellow-400 transition font-semibold">About</Link>
              </div>
              <div className="flex items-center space-x-4 text-slate-600">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="X (Twitter)">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="GitHub">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition" aria-label="Discord">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
                </a>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-700 font-mono">
              © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform. Built by developers, for developers.
            </div>
          </div>
        </footer>
      </>
      )}

      {/* ── AGENCY CONTACT MODAL — unchanged logic, refined styling ── */}
      {showAgencyModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowAgencyModal(false); }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
        >
          <div className="bg-[#090D16] border border-purple-500/30 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl shadow-purple-500/10 relative ring-1 ring-purple-500/10">
            <button onClick={() => setShowAgencyModal(false)} className="absolute right-5 top-5 text-slate-500 hover:text-white text-sm cursor-pointer font-mono w-7 h-7 rounded-lg hover:bg-slate-800/60 flex items-center justify-center transition">
              ✕
            </button>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono font-bold uppercase">
                <span>⚡</span> Agency Studio Plan ($49/mo)
              </div>
              <h3 className="text-lg font-bold text-white">Request Agency Studio Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                For web development studios & software agencies managing multiple client projects (<strong className="text-slate-200">500,000 events/mo & UNLIMITED projects</strong>), contact our engineering desk for immediate activation:
              </p>
            </div>

            <div className="bg-[#05070E] border border-slate-800/60 rounded-2xl p-4 space-y-3 font-mono text-xs ring-1 ring-white/5">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Direct Founder & Engineering Desk</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-yellow-300 font-bold truncate">{supportEmail}</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border border-slate-700/40"
                >
                  {copiedEmail ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 font-mono">
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=SnapTrace%20Agency%20Studio%20Plan%20Inquiry`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer btn-primary-glow"
              >
                Compose in Gmail Web →
              </a>
              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-full py-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-800/40"
              >
                Close
              </button>
            </div>

            <p className="text-[10px] text-slate-600 font-mono text-center">
              Guaranteed direct activation from our lead engineer within 24 hours.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}