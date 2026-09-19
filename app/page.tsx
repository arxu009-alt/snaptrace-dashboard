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
type FeedbackCategory = 'bug' | 'feature' | 'ux' | 'general';

/* ─────────────────────────────────────────────────────────────
   AUTHENTIC OFFICIAL BRAND SVG LOGOS (Pixel-Perfect Vector Geometry)
   ───────────────────────────────────────────────────────────── */

function GeminiLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gemini-official-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A73E8" />
          <stop offset="30%" stopColor="#6C5CE7" />
          <stop offset="65%" stopColor="#E056FD" />
          <stop offset="100%" stopColor="#F9CA24" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 2 12.8 7.5 16.5 10.5C19.5 12.8 22 12 22 12C22 12 19.5 13.2 16.5 15.5C12.8 18.5 12 22 12 22C12 22 11.2 18.5 7.5 15.5C4.5 13.2 2 12 2 12C2 12 4.5 10.8 7.5 10.5C11.2 7.5 12 2 12 2Z"
        fill="url(#gemini-official-grad)"
      />
    </svg>
  );
}

function OpenAILogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  );
}

function DeepSeekLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="deepseek-official-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D6EFD" />
          <stop offset="50%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="#00F0FF" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#051329" stroke="#0D6EFD" strokeWidth="1.5" strokeOpacity="0.5" />
      <path
        d="M7.5 21C9 16 12 11 17.5 10C21.5 9.5 24 11.5 24 14.5C24 17.5 21 20 17 20.5C13 21 10 22.5 7.5 24.5"
        stroke="url(#deepseek-official-grad)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="14" r="1.8" fill="#00F0FF" />
      <path
        d="M12.5 15.5C14 14 16 13.5 18.5 14"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
    </svg>
  );
}

function ClaudeLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#24140D" stroke="#D97706" strokeWidth="1" strokeOpacity="0.3" />
      <path
        d="M5 19L12 5L19 19M8.5 14.5H15.5M12 5V19"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.2" fill="#FBBF24" />
    </svg>
  );
}

function OllamaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#111625" stroke="#475569" strokeWidth="1" strokeOpacity="0.4" />
      <ellipse cx="12" cy="12.5" rx="5.5" ry="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="10.5" r="1" fill="currentColor" />
      <circle cx="14" cy="10.5" r="1" fill="currentColor" />
      <path d="M10 16C10 16 11 17 12 17C13 17 14 16 14 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 5.5L9.5 8.5M16 5.5L14.5 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH REVEAL COMPONENT (High-Performance GPU Intersection)
   ───────────────────────────────────────────────────────────── */
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
      style={{ transitionDelay: `${delay}ms` }}
      className={
        'transform-gpu transition-all duration-700 ease-out ' +
        (isVisible
          ? 'opacity-100 translate-y-0 filter blur-0'
          : 'opacity-0 translate-y-6 filter blur-[1px]') +
        (className ? ' ' + className : '')
      }
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DEV KNOWLEDGE BASE & CLI BOT (100% Preserved)
   ───────────────────────────────────────────────────────────── */
const DEV_KNOWLEDGE_BASE: Record<string, string> = {
  collapse: 'When an outage happens (like a DB pool drop), legacy loggers spam 5 separate alerts for downstream errors. SnapTrace hashes the error origin via deterministic SHA-256 fingerprints, collapses the entire cascade into 1 consolidated thread tagged [xN], and points directly to the failing line (database.js:18) with an AI fix.',
  bundle: 'SnapTrace is strictly <3.4KB gzipped (Sentry is ~100KB+). We use native browser listeners and dispatch asynchronously via navigator.sendBeacon. Zero blocking time on page hydration; 100/100 Google Core Web Vitals score.',
  pii: 'Zero-Trust On-Device Sanitization. Passwords, bearer tokens, emails, and credit cards are scrubbed with regex AST directly in the browser before payloads touch the network. Sensitive credentials never hit third-party servers.',
  cursor: 'When an exception occurs, 1 click exports an AI-optimized prompt pre-formatted with the runtime environment, error message, and stack frames ready to paste into Cursor, Claude Code, or VS Code Copilot for an instant 2-line patch.',
};

function getDevBotAnswer(query: string): string {
  const q = query.toLowerCase().trim();

  if (q.includes('ai') || q.includes('model') || q.includes('gemini') || q.includes('openai') || q.includes('gpt') || q.includes('claude') || q.includes('cursor') || q.includes('copilot') || q.includes('llm') || q.includes('deepseek')) {
    return 'SnapTrace features a dual AI architecture:\n\n1. In-Dashboard BYOK Diagnostics (2 Active Live Models):\n• Google Gemini (100% Free via Gemini 2.5 Flash Lite) for instant 150ms root-cause diffs.\n• OpenAI (GPT-4o & GPT-4o-mini) with standard sk-... API keys.\n• DeepSeek, Claude 3.5 Sonnet, and local Ollama are in active pipeline integration.\nYour API keys are encrypted on-device and never stored on our servers.\n\n2. 1-Click IDE Coding Agent Export:\nClicking "Copy for Cursor" generates an AI-optimized prompt pre-formatted with the environment, error message, and stack frames—ready for Cursor, Claude Code, or VS Code Copilot.';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive Live Triage Simulator State
  const [simulatedResolved, setSimulatedResolved] = useState(false);
  const [activeTriageTab, setActiveTriageTab] = useState<'stack' | 'breadcrumbs' | 'aifix'>('stack');

  // Agency Contact Modal State
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'hello.snaptrace@gmail.com';

  // NEW: Interactive Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory>('feature');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    const subject = `[SnapTrace Feedback] ${feedbackCategory.toUpperCase()}: Developer Submission`;
    const bodyContent = `Category: ${feedbackCategory.toUpperCase()}
User Email/Contact: ${feedbackEmail.trim() || 'Anonymous Developer'}
Timestamp: ${new Date().toISOString()}

Feedback Details:
---------------------------------------------
${feedbackMessage}
---------------------------------------------

Device: ${typeof window !== 'undefined' ? window.navigator.userAgent : 'Web Browser'}`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyContent)}`;
    
    // Open Gmail Web Composer
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedbackModal(false);
      setFeedbackMessage('');
      setFeedbackEmail('');
    }, 2800);
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
      a: 'During an outage, a single database connection drop often triggers 4 or 5 different downstream errors (auth fails, queries fail, UI renders fail). Instead of sending 5 separate noisy alerts that you have to piece together manually on a Sunday, SnapTrace groups cascading failures using deterministic SHA-256 fingerprinting and isolates the single root cause with an instant AI fix [1.1.7].',
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#05070E] flex items-center justify-center font-sans text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-10 w-10 border-2 border-yellow-400/20 rounded-full" />
            <div className="h-10 w-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin absolute inset-0 shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
          </div>
          <p className="text-xs font-mono text-slate-400 tracking-wider animate-pulse">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 font-sans selection:bg-yellow-400 selection:text-slate-950 overflow-x-hidden relative">

      {/* ─────────────────────────────────────────────────────────────
          $100M DEV-TOOL BESPOKE CSS ANIMATIONS & SURFACE TOKENS
         ───────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes shimmer-border {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse-halo {
          0%, 100% { opacity: 0.18; transform: scale(0.98); }
          50% { opacity: 0.35; transform: scale(1.02); }
        }
        .hero-matrix-grid {
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .deep-glass-card {
          background: rgba(11, 16, 29, 0.72);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.07);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.06);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .deep-glass-card:hover {
          border-color: rgba(250, 204, 21, 0.3);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75), 0 0 25px -5px rgba(250, 204, 21, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
        }
        .window-topbar {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), #0A0E1A;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pro-pricing-halo {
          background: linear-gradient(135deg, #FACC15, #F59E0B, #A855F7, #38BDF8, #FACC15);
          background-size: 300% 300%;
          animation: shimmer-border 5s linear infinite;
        }
        .kbd-badge {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* 🌟 1. TOP TICKER STATUS BAR */}
      <div className={
        'px-4 py-1.5 text-center text-xs font-mono flex items-center justify-center gap-2.5 transition-colors border-b z-50 relative ' +
        (marketingMode
          ? 'bg-[#090D17] border-yellow-400/20 text-slate-300'
          : 'bg-[#060911] border-yellow-400/30 text-yellow-300')
      }>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-bold text-[11px] text-white tracking-wide">SnapTrace Engine v1.2</span>
        </div>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 font-semibold">
          ⚡ Public Beta Active
        </span>
        <span className="hidden md:inline text-[11px] text-slate-400">
          Lifetime Starter Pro ($0 Forever) • 0.0ms Hydration Overhead • &lt;3.4KB Gzipped
        </span>
      </div>

      {/* 🌟 2. HEADER WITH BETA BADGE & MOBILE DRAWER */}
      <header className="border-b border-slate-800/80 bg-[#070A12]/90 backdrop-blur-2xl sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo with Beta Symbol */}
          <Link href="/" onClick={scrollToTop} className="cursor-pointer hover:opacity-90 transition shrink-0 flex items-center gap-2.5">
            <SnapTraceLogo size="md" showText={true} />
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-yellow-400 border border-yellow-400/35 flex items-center gap-1 shadow-[0_0_10px_rgba(250,204,21,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              BETA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 text-xs font-bold text-slate-300 font-mono">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('platform')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer">
                <span>Architecture</span>
                <span className="text-[10px] text-slate-500">▾</span>
              </button>

              {openDropdown === 'platform' && (
                <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="w-88 bg-[#0B101D]/98 border border-slate-700/60 rounded-2xl shadow-2xl p-3.5 space-y-2 font-sans backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold px-2 font-mono">High-Throughput Telemetry</div>
                    <a href="#features" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition group">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition">
                        🪶
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-yellow-400 transition">&lt;5KB Featherweight SDK</div>
                        <div className="text-[11px] text-slate-400 leading-snug">0ms Core Web Vitals delay & async beacon dispatcher.</div>
                      </div>
                    </a>
                    <a href="#grouping" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition group">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0 group-hover:scale-105 transition">
                        🎯
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-yellow-400 transition">Outage Collapse Engine</div>
                        <div className="text-[11px] text-slate-400 leading-snug">Collapses 500 duplicate cascade errors into 1 root cause.</div>
                      </div>
                    </a>
                    <a href="#pii" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition group">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition">
                        🔒
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-yellow-400 transition">Client-Side PII Firewall</div>
                        <div className="text-[11px] text-slate-400 leading-snug">On-device regex AST scrubs tokens before the wire.</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* AI Diagnostics Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpenDropdown('ai')}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="px-3 py-2 rounded-xl hover:bg-yellow-400/10 text-yellow-300 hover:text-yellow-200 transition-all flex items-center gap-1.5 cursor-pointer border border-yellow-400/20 bg-yellow-400/5">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                <span>AI Diagnostics</span>
                <span className="text-[10px] text-yellow-400">▾</span>
              </button>

              {openDropdown === 'ai' && (
                <div className="absolute top-full left-0 pt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="w-96 bg-[#0B101D]/98 border border-slate-700/60 rounded-2xl shadow-2xl p-3.5 space-y-2 font-sans backdrop-blur-xl">
                    <div className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold px-2 font-mono">Autonomous Root Cause Analysis</div>
                    <a href="#byok" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition group">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <GeminiLogo className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-yellow-400 transition">BYOK AI Hub (Gemini & OpenAI)</div>
                        <div className="text-[11px] text-slate-400 leading-snug">Bring your own key for $0 platform markup & on-device privacy.</div>
                      </div>
                    </a>
                    <a href="#ai-agent" className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-800/80 transition group">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        🤖
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-yellow-400 transition">1-Click Cursor & Claude Export</div>
                        <div className="text-[11px] text-slate-400 leading-snug">Pre-formatted prompts with stack trace for local agent patches.</div>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <a href="#quickstart" className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-white transition">SDK Setup</a>
            <a href="#comparison" className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-white transition">Why SnapTrace</a>
            <a href="#pricing" className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-yellow-400 transition text-yellow-400 font-black">Pricing</a>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-white transition flex items-center gap-1 text-slate-300 cursor-pointer"
            >
              <span>Feedback</span>
              <span className="kbd-badge text-[9px] px-1 py-0.2 rounded font-mono text-slate-400">⌘F</span>
            </button>
            <a href="#faq" className="px-3 py-2 rounded-xl hover:bg-slate-800/60 hover:text-white transition">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2.5 font-mono shrink-0">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 transition hidden sm:inline-block"
            >
              Sign In
            </Link>

            <Link
              href="/demo"
              className="px-3 py-1.5 rounded-xl border border-yellow-400/40 hover:border-yellow-400 text-yellow-300 hover:bg-yellow-400/10 font-bold text-xs transition shadow-sm hidden sm:inline-block"
            >
              DEMO
            </Link>

            <Link
              href="/signup"
              className="px-3.5 sm:px-4 py-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <span>GET PRO PASS</span>
              <span>→</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#070A12] border-b border-slate-800 px-6 py-5 space-y-4 font-mono text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold"
              >
                🪶 Architecture
              </a>
              <a
                href="#byok"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-yellow-300 font-bold"
              >
                ✨ BYOK AI
              </a>
              <a
                href="#quickstart"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold"
              >
                ⚡ SDK Setup
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-yellow-400 font-bold"
              >
                💎 Pricing
              </a>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowFeedbackModal(true);
                }}
                className="flex-1 py-2.5 bg-slate-800 rounded-xl text-center text-white font-bold"
              >
                💬 Submit Feedback
              </button>
              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 border border-yellow-400/40 text-yellow-300 rounded-xl text-center font-bold"
              >
                Live Demo
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SENTRY/ENGINEER TOGGLE FLOATER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
        <div className="absolute top-4 right-4 sm:right-6 z-30 hidden md:block">
          <div className="bg-[#0B101D]/90 border border-yellow-400/30 rounded-2xl p-1.5 px-3 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-1 font-mono">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider select-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Mode Switch
            </span>
            <button
              onClick={toggleMarketingMode}
              className={
                'w-11 h-5.5 rounded-full transition-colors relative cursor-pointer ' +
                (marketingMode ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-slate-700')
              }
              title="Toggle between Marketing Mode and Dev Spec Mode"
            >
              <div
                className={
                  'w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-1 transition-all ' +
                  (marketingMode ? 'right-1' : 'left-1')
                }
              />
            </button>
            <span className={'text-[9px] font-bold font-mono ' + (marketingMode ? 'text-yellow-300' : 'text-slate-400')}>
              {marketingMode ? 'MARKETING' : 'RAW SPEC'}
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: RAW DEV TERMINAL INTERFACE (When MarketingMode = false)
         ════════════════════════════════════════════════════════════════ */}
      {!marketingMode ? (
        <section className="min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 sm:p-6 bg-[#05070E] relative overflow-hidden animate-in fade-in duration-200">
          <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
            <div className="lg:col-span-6 space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Daemon Protocol Active • 0.0ms Main Thread Latency</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black font-mono tracking-tight text-white leading-none">
                  NO 100KB BUNDLES.<br />
                  NO 2 AM SPAM ALERTS.<br />
                  <span className="text-yellow-400">NO SUNDAY LOG HUNTING.</span>
                </h1>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300 leading-relaxed">
                <p>
                  <strong>Why SnapTrace?</strong> Traditional APMs force 100KB+ client libraries that degrade Lighthouse scores, and when a single Postgres connection pool times out, they spam your phone with 5 fragmented alerts.
                </p>
                <p className="text-yellow-300 bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/20">
                  SnapTrace collapses the entire outage cascade into <strong>1 consolidated root cause</strong> with a deterministic SHA-256 fingerprint and generates a 2-line AI code patch via Gemini or GPT-4o.
                </p>
              </div>

              <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-3 text-xs font-mono">
                <span className="text-[10px] text-yellow-400 uppercase font-bold tracking-widest block">
                  ⚡ PRODUCTION BENCHMARKS
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">SDK PAYLOAD</span>
                    <strong className="text-emerald-400 text-sm">&lt;3.4KB gzipped</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">TRANSPORT</span>
                    <strong className="text-slate-200 text-sm">sendBeacon (0ms)</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PII FIREWALL</span>
                    <strong className="text-emerald-400 text-sm">On-Device Regex AST</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">AI AGENT EXPORT</span>
                    <strong className="text-purple-400 text-sm">1-Click Cursor / Claude</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1 font-mono">
                <Link
                  href="/signup"
                  className="px-5 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
                >
                  Get Free Beta Key in 30s →
                </Link>
                <Link
                  href="/demo"
                  className="px-4 py-3 bg-[#0B101D] hover:bg-slate-800 border border-slate-800 text-yellow-300 text-xs font-bold rounded-xl transition"
                >
                  ⚡ Open Demo Workspace
                </Link>
              </div>
            </div>

            {/* CLI Chat Engine */}
            <div className="lg:col-span-6 bg-[#090D16] border border-emerald-500/40 rounded-3xl p-5 shadow-2xl flex flex-col justify-between font-mono space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>/snappy-cli <span className="text-[10px] text-slate-500 font-normal">v2.1-engine</span></span>
                </div>
                <span className="text-[10px] text-slate-500">Autonomous Diagnostic Bot</span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1 text-xs">
                {cliMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={
                      'p-3.5 rounded-2xl ' +
                      (msg.role === 'user'
                        ? 'bg-[#0B101D] border border-slate-800 text-yellow-300 ml-6'
                        : 'bg-[#05070E] border border-emerald-500/30 text-slate-200 mr-4')
                    }
                  >
                    <span className="text-[10px] block font-bold text-slate-500 mb-1">
                      {msg.role === 'user' ? '> YOU' : '⚡ SNAPPY (DIAGNOSTIC ENGINE)'}
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleAskCli('which ai models does this support?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🤖 Supported AI Models?
                  </button>
                  <button
                    onClick={() => handleAskCli('how does cascading error collapse work?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🎯 Outage Collapse?
                  </button>
                  <button
                    onClick={() => handleAskCli('why is the SDK under 5KB?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    ⚡ Why &lt;5KB?
                  </button>
                  <button
                    onClick={() => handleAskCli('how does client PII masking work?')}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-[10px] text-slate-300 hover:text-yellow-400 border border-slate-700/60 transition cursor-pointer"
                  >
                    🔒 PII Scrubbing?
                  </button>
                </div>

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
                    className="flex-1 bg-[#05070E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Query →
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ════════════════════════════════════════════════════════════════
            VIEW 2: THE $100M DEV-TOOL MARKETING MASTERPIECE
           ════════════════════════════════════════════════════════════════ */
        <>
          {/* 🌟 3. HERO: PERSPECTIVE LASER GRID & MACOS INTERACTIVE PREVIEW */}
          <section className="relative pt-8 sm:pt-14 pb-20 overflow-hidden hero-matrix-grid">
            <TelemetryBeamBackground />

            {/* Ambient Background Aura */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-yellow-500/12 via-purple-600/10 to-blue-500/12 blur-[140px] pointer-events-none rounded-full" />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6 relative z-10">
              
              {/* Top Feature Pill */}
              <div className="inline-block">
                <a
                  href="#ai-agent"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1528] border border-purple-500/30 hover:border-yellow-400/60 text-xs font-mono text-slate-200 transition shadow-lg group cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-purple-300 font-bold">SnapTrace AI Protocol</span>
                  <span className="text-slate-500">•</span>
                  <span>Direct 1-Click Code Patches for Cursor & Claude</span>
                  <span className="text-yellow-400 group-hover:translate-x-0.5 transition">→</span>
                </a>
              </div>

              {/* Tight, Impactful Hero Typography */}
              <div className="space-y-3 max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.12]">
                  Code breaks. We isolate the root cause and{' '}
                  <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent underline decoration-yellow-500/30 decoration-wavy">
                    fix it in a snap.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
                  Featherweight telemetry under <strong className="text-yellow-400 font-mono font-bold">&lt;3.4KB</strong>. Zero alert fatigue, client-side PII firewall, and <strong>Bring Your Own Key (BYOK)</strong> AI root-cause diagnostics without enterprise price markups.
                </p>
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-1 font-mono">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-2xl shadow-xl shadow-yellow-500/25 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>Claim Lifetime Starter Pro ($0 Forever)</span>
                  <span>→</span>
                </Link>

                <Link
                  href="/demo"
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0B101D] hover:bg-slate-800/80 border border-slate-700/80 hover:border-yellow-400/50 text-yellow-300 text-xs sm:text-sm font-bold rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
                >
                  <span>⚡ Launch Interactive Demo</span>
                </Link>
              </div>

              {/* Quick SDK 1-Line Drop */}
              <div className="pt-2 max-w-xl mx-auto">
                <div className="bg-[#0B101D]/90 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-xl font-mono text-xs backdrop-blur-xl">
                  <div className="flex items-center gap-2 truncate text-slate-400 pl-2">
                    <span className="text-yellow-400 font-bold select-none">&lt;/&gt;</span>
                    <span className="truncate text-slate-300 text-[11px]">
                      &lt;script src=&quot;https://snaptrace-dashboard.vercel.app/snaptrace.js&quot; data-api-key=&quot;<span className="text-yellow-300 font-bold">YOUR_KEY</span>&quot; async&gt;&lt;/script&gt;
                    </span>
                  </div>
                  <button
                    onClick={handleCopyHeroScript}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm active:scale-95 border border-slate-700/60"
                  >
                    {copiedHeroScript ? '✓ Copied!' : '📋 Copy SDK'}
                  </button>
                </div>
                <div className="flex items-center justify-center gap-5 text-[11px] text-slate-400 font-mono pt-2.5">
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> &lt;3.4KB Gzipped</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> 0.0ms Hydration Penalty</span>
                  <span className="flex items-center gap-1.5"><span className="text-emerald-400 font-bold">✓</span> Drop into HTML &lt;head&gt;</span>
                </div>
              </div>

            </div>

            {/* 🪟 4. MACOS INTERACTIVE CRASH TRIAGE PREVIEW WINDOW */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12">
              <div className="deep-glass-card rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl">
                
                {/* macOS Window Topbar */}
                <div className="window-topbar px-5 py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block border border-[#E0443E]" />
                      <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block border border-[#DEA123]" />
                      <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block border border-[#1AAB29]" />
                    </div>
                    <span className="text-slate-300 font-bold text-xs ml-1 flex items-center gap-1.5">
                      <span>snaptrace-incident-triage</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-400">checkout/route.ts</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-black animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      UNRESOLVED [x500]
                    </span>
                    <button
                      onClick={() => setSimulatedResolved(!simulatedResolved)}
                      className={
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border ' +
                        (simulatedResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30 hover:bg-yellow-400/25')
                      }
                    >
                      {simulatedResolved ? '✓ Resolved' : '⚡ Simulate AI Fix'}
                    </button>
                  </div>
                </div>

                {/* Window Body */}
                <div className="p-5 sm:p-7 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Stack & Breadcrumbs */}
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded font-bold text-[11px]">
                          FATAL EXCEPTION
                        </span>
                        <span className="text-white font-semibold">PostgreSQL Client Pool Timeout</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-yellow-300 font-bold">database.js:18:11</span>
                      </div>

                      {/* Interactive Tab Switcher */}
                      <div className="flex items-center gap-1.5 pt-1 font-mono text-xs">
                        <button
                          onClick={() => setActiveTriageTab('stack')}
                          className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ' + (activeTriageTab === 'stack' ? 'bg-slate-800 text-yellow-300 border border-yellow-400/30' : 'text-slate-400 hover:text-white')}
                        >
                          Stack Trace (AST)
                        </button>
                        <button
                          onClick={() => setActiveTriageTab('breadcrumbs')}
                          className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ' + (activeTriageTab === 'breadcrumbs' ? 'bg-slate-800 text-yellow-300 border border-yellow-400/30' : 'text-slate-400 hover:text-white')}
                        >
                          Breadcrumbs (PII Filtered)
                        </button>
                        <button
                          onClick={() => setActiveTriageTab('aifix')}
                          className={'px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ' + (activeTriageTab === 'aifix' ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40' : 'text-purple-400 hover:text-purple-200')}
                        >
                          ✨ BYOK AI Patch Diff
                        </button>
                      </div>

                      {/* Dynamic Tab Panel */}
                      <div className="bg-[#05070E] border border-slate-800/90 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
                        {activeTriageTab === 'stack' && (
                          <div className="space-y-1 text-slate-300 leading-relaxed text-[11px]">
                            <div className="text-red-400 font-bold">ReferenceError: pool.connect() timed out after 5000ms</div>
                            <div className="text-slate-400 pl-3">at async queryUserOrders (database.js:18:11)</div>
                            <div className="text-slate-500 pl-3">at async handleCheckoutAction (app/api/checkout/route.ts:42:5)</div>
                            <div className="text-slate-600 pl-3">at async NextNodeServer.handleRequest (node_modules/next/...)</div>
                          </div>
                        )}

                        {activeTriageTab === 'breadcrumbs' && (
                          <div className="space-y-1.5 text-[11px] text-slate-300">
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                              <span>1. DOM Click: [data-testid=&quot;checkout-btn&quot;]</span>
                              <span className="text-emerald-400 font-mono">10:00:01 PM</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                              <span>2. POST /v1/checkout - Body: <code className="text-emerald-300">card: &quot;[SCRUBBED]&quot;</code></span>
                              <span className="text-emerald-400 font-mono">200 OK</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded bg-red-950/40 border border-red-500/40 text-red-300 font-bold">
                              <span>3. Crash captured: database.js:18 pool connection dropped</span>
                              <span className="text-red-400 font-mono">🚨 CRASH</span>
                            </div>
                          </div>
                        )}

                        {activeTriageTab === 'aifix' && (
                          <div className="space-y-2 text-[11px]">
                            <div className="text-purple-300 font-bold flex items-center gap-1.5">
                              <GeminiLogo className="w-4 h-4" />
                              <span>Generated by Gemini 2.5 Flash Lite (0.18s)</span>
                            </div>
                            <pre className="text-emerald-400 leading-relaxed bg-[#0A0E1A] p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                              {`// Proposed Patch for database.js:18\n- const client = await pool.connect();\n- return await client.query(sql, params);\n+ const client = await pool.connect();\n+ try { return await client.query(sql, params); }\n+ finally { client.release(); } // Release back to pool`}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Outage Collapse Meta */}
                    <div className="lg:col-span-4 p-4.5 bg-[#080C16] rounded-2xl border border-yellow-400/30 space-y-3.5 font-mono text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">
                        ⚡ CASCADE COLLAPSE STATS
                      </div>
                      <div className="space-y-2 text-slate-300 text-[11px]">
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
                          <strong className="text-purple-400">Verified Patch</strong>
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

          </section>

          {/* 🎯 5. REALISTIC "SUNDAY 2 AM" OUTAGE VISUALIZER (#grouping) */}
          <SmoothReveal className="max-w-5xl mx-auto px-4 sm:px-6 py-12" delay={50}>
            <div id="grouping" className="deep-glass-card rounded-3xl p-6 sm:p-9 space-y-6">
              
              {/* Tight Header */}
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-mono font-bold uppercase">
                  <span>🎯</span> The Sunday 2 AM Cascade Problem
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  One Outage Shouldn’t Trigger 500 Panic Alerts
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  When a backend connection pool dies, your auth breaks, your cart breaks, your checkout breaks, and your webhook breaks. Traditional APMs treat each as an independent emergency. SnapTrace connects the dots.
                </p>
              </div>

              {/* Side-by-Side Graphic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 font-mono text-xs">
                
                {/* Legacy Sentry Alert Storm */}
                <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                    <span className="text-red-400 font-bold uppercase text-[11px]">Legacy Error Trackers</span>
                    <span className="text-red-500 font-bold">5 ALERTS (NOISY FLOOD)</span>
                  </div>
                  <div className="space-y-1.5 opacity-80 text-[11px]">
                    <div className="p-2 bg-red-900/30 rounded-lg border border-red-700/40 text-red-200">
                      🚨 02:00:01 AM - HTTP 500: Auth Service Dropped
                    </div>
                    <div className="p-2 bg-red-900/30 rounded-lg border border-red-700/40 text-red-200">
                      🚨 02:00:02 AM - HTTP 500: Cart Query Failed
                    </div>
                    <div className="p-2 bg-red-900/30 rounded-lg border border-red-700/40 text-red-200">
                      🚨 02:00:03 AM - HTTP 500: Order Checkout Timeout
                    </div>
                    <div className="p-2 bg-red-900/30 rounded-lg border border-red-700/40 text-red-200">
                      🚨 02:00:04 AM - Webhook Retries Exhausted
                    </div>
                  </div>
                  <p className="text-[11px] text-red-300/80 font-sans leading-relaxed">
                    You wake up at 2 AM reading 5 noisy notifications trying to manually diagnose which error caused which.
                  </p>
                </div>

                {/* The SnapTrace Way */}
                <div className="p-5 rounded-2xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <span className="text-emerald-400 font-bold uppercase text-[11px]">SnapTrace Smart Collapse</span>
                    <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">1 UNIFIED THREAD</span>
                  </div>
                  <div className="p-3.5 bg-[#070A12] rounded-xl border border-emerald-500/30 space-y-2 text-slate-200">
                    <div className="text-yellow-400 font-bold text-xs flex items-center justify-between">
                      <span>Root Cause: database.js:18</span>
                      <span className="text-[10px] bg-yellow-400/10 px-2 py-0.5 rounded text-yellow-300">4 Crashes Collapsed</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Downstream HTTP crashes in Auth, Cart, and Checkout were caused by PostgreSQL client exhaustion.
                    </p>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between">
                      <span>✓ 1 Alert to Discord/Slack</span>
                      <span>✓ AI Code Diff Attached</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-sans leading-relaxed">
                    Zero alert fatigue. You receive 1 crisp notification pinpointing the exact broken line and how to patch it.
                  </p>
                </div>

              </div>
            </div>
          </SmoothReveal>

          {/* 💬 6. VALIDATED SENIOR ENGINEER SOCIAL PROOF */}
          <SmoothReveal className="max-w-5xl mx-auto px-4 sm:px-6 py-6" delay={100}>
            <div id="social-proof" className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-[#0B101D] to-[#080d1a] border border-slate-800 shadow-xl space-y-2.5">
              <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-bold uppercase tracking-widest">
                <span>💬</span> Validated by Senior Production Engineers
              </div>
              <blockquote className="text-sm sm:text-base text-slate-200 italic leading-relaxed font-sans">
                &quot;5KB and no inbox flood is a great pair to lead with. The errors that cost me the most time on my own app were not loud at all. Four separate reports, one cause underneath, and I only worked that out by reading all four by hand on a Sunday. If SnapTrace collapses those itself, say it louder than the bundle size. Nobody knows they want that until week two.&quot;
              </blockquote>
              <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                <div className="w-8 h-8 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center font-bold text-yellow-300 text-xs">
                  EB
                </div>
                <div>
                  <div className="text-white font-bold">Eusebiu Balan</div>
                  <div className="text-slate-400 text-[11px]">Senior Full-Stack Engineer • via Dev.to Community</div>
                </div>
              </div>
            </div>
          </SmoothReveal>

          {/* ⚡ 7. BRING YOUR OWN KEY (BYOK) SECTION: 2 LIVE MODELS + 3 PIPELINE (#byok) */}
          <section id="byok" className="py-16 sm:py-20 border-t border-slate-800/80 bg-gradient-to-b from-[#090D18] to-[#05070E] relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 relative z-10">
              
              {/* Tight Heading Group */}
              <div className="text-center space-y-2 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold uppercase font-mono">
                  <span>⚡</span> Zero AI Markups • Client-Side Encryption
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Bring Your Own Key (BYOK) AI Architecture
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-2xl mx-auto">
                  Unlike legacy monitoring tools that charge $49/mo per-seat add-ons for AI summaries, SnapTrace connects directly to your own keys. <strong>Your keys are encrypted on-device and never saved to our servers.</strong>
                </p>
              </div>

              {/* 🟢 2 ACTIVE LIVE MODELS */}
              <div className="space-y-3.5">
                <div className="flex items-center gap-2 font-mono text-xs text-yellow-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Currently Live & Supported in Dashboard</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Google Gemini (Active) */}
                  <div className="p-6 rounded-3xl bg-[#0B101D] border-2 border-emerald-500/50 hover:border-emerald-400 transition-all space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                          <GeminiLogo className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white font-mono">Google Gemini</h3>
                          <span className="text-[11px] text-emerald-400 font-mono font-bold">100% Free Tier • Recommended</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-black">
                        ACTIVE LIVE
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Integrated with <strong className="text-white">Gemini 2.5 Flash Lite</strong>. Generate ultra-fast root-cause analyses and exact code patch diffs directly inside your dashboard modal. <strong>$0 cost on Google&apos;s generous free API tier.</strong>
                    </p>

                    <div className="p-2.5 bg-[#05070E] rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Supported Model: <strong className="text-white">gemini-2.5-flash-lite</strong></span>
                      <span className="text-emerald-400 font-bold">⚡ ~180ms</span>
                    </div>
                  </div>

                  {/* OpenAI (Active) */}
                  <div className="p-6 rounded-3xl bg-[#0B101D] border-2 border-yellow-400/50 hover:border-yellow-400 transition-all space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-slate-800 border border-slate-700">
                          <OpenAILogo className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white font-mono">OpenAI Models</h3>
                          <span className="text-[11px] text-yellow-400 font-mono font-bold">GPT-4o & GPT-4o-mini</span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-mono font-black">
                        ACTIVE LIVE
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      Paste your standard OpenAI key (<code className="text-yellow-300 font-mono bg-yellow-400/10 px-1.5 py-0.5 rounded">sk-...</code>) in Settings. SnapTrace runs AST-level reasoning across stack frames, environment variables, and breadcrumbs to pinpoint concurrency bugs.
                    </p>

                    <div className="p-2.5 bg-[#05070E] rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Supported Model: <strong className="text-white">gpt-4o / gpt-4o-mini</strong></span>
                      <span className="text-yellow-300 font-bold">⚡ Deep AST</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 🟣 3 PIPELINE UPCOMING MODELS */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>In Active Pipeline (Upcoming In-Dashboard Support)</span>
                  </span>
                  <span className="text-[11px] text-purple-400 hidden sm:inline">Coming to Settings</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* DeepSeek */}
                  <div className="p-5 rounded-2xl bg-[#080C16] border border-slate-800 hover:border-blue-500/40 transition space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DeepSeekLogo className="w-6 h-6" />
                        <h4 className="font-bold text-white text-sm font-mono">DeepSeek V3 / R1</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono font-bold">
                        UPCOMING
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      State-of-the-art open-weights reasoning for high-capacity, cost-effective stack trace troubleshooting.
                    </p>
                  </div>

                  {/* Claude */}
                  <div className="p-5 rounded-2xl bg-[#080C16] border border-slate-800 hover:border-amber-500/40 transition space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ClaudeLogo className="w-6 h-6" />
                        <h4 className="font-bold text-white text-sm font-mono">Claude 3.5 Sonnet</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold">
                        UPCOMING
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Direct API integration with Anthropic&apos;s leading coding model for complex multi-file architectural fixes.
                    </p>
                  </div>

                  {/* Ollama */}
                  <div className="p-5 rounded-2xl bg-[#080C16] border border-slate-800 hover:border-slate-600 transition space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <OllamaLogo className="w-6 h-6 text-slate-300" />
                        <h4 className="font-bold text-white text-sm font-mono">Ollama (100% Local)</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                        AIR-GAPPED
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Connect your localhost Ollama endpoint (<code className="text-slate-300">localhost:11434</code>) for completely private inference.
                    </p>
                  </div>

                </div>
              </div>

              {/* Zero-Trust Security Callout */}
              <div className="p-4.5 rounded-2xl bg-[#0B101D] border border-yellow-400/20 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🛡️</span>
                  <div>
                    <strong className="text-white">Zero-Trust Local Key Storage Guarantee:</strong>
                    <span className="text-slate-400 block sm:inline sm:ml-1">
                      SnapTrace never stores your AI keys on databases. Keys reside in encrypted browser memory.
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

          {/* 🤖 8. AI AGENT IDE EXPORT SECTION (#ai-agent) */}
          <section id="ai-agent" className="py-16 sm:py-20 border-t border-slate-800/80 relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
              <SmoothReveal className="text-center space-y-2 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase font-mono">
                  <span>🤖</span> AI Workflow Native
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  Turn runtime stack traces into instant AI bug fixes
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Export pre-formatted, AI-ready crash diagnostic prompts directly into <strong>Cursor, Claude Code, or VS Code Copilot</strong> to generate 2-line code patches locally in your IDE [1.4.1, 1.4.2].
                </p>

                <div className="flex items-center justify-center gap-2 pt-2 font-mono text-xs">
                  {(['cursor', 'claude', 'vscode'] as const).map((ide) => (
                    <button
                      key={ide}
                      onClick={() => setActiveIdeTab(ide)}
                      className={
                        'px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ' +
                        (activeIdeTab === ide
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-[#0B101D] text-slate-400 hover:text-white border border-slate-800')
                      }
                    >
                      {ide === 'cursor' && 'Cursor IDE'}
                      {ide === 'claude' && 'Claude Code'}
                      {ide === 'vscode' && 'VS Code Copilot'}
                    </button>
                  ))}
                </div>
              </SmoothReveal>

              <SmoothReveal className="deep-glass-card rounded-3xl p-5 sm:p-7 max-w-4xl mx-auto space-y-4" delay={150}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
                  <div>
                    <span className="text-xs font-bold text-red-400 font-mono block">CRASH: ReferenceError: Connection pool exhausted</span>
                    <span className="text-[10px] text-slate-500 font-mono">Captured at database.js:18:11</span>
                  </div>
                  <button
                    onClick={handleCopyCursorDemo}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer self-start sm:self-auto font-mono flex items-center gap-2"
                  >
                    <span>{copiedCursorPrompt ? '✓ Copied AI Prompt!' : '📋 Copy Prompt for Cursor / Claude'}</span>
                  </button>
                </div>

                <div className="bg-[#070A12] border border-purple-500/30 rounded-2xl p-4 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center gap-2 text-purple-300 font-bold uppercase tracking-wider text-[10px]">
                    <span>✨</span> Instant AI Root-Cause Diagnosis
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    <strong>Plain English:</strong> The PostgreSQL client in <code className="text-yellow-300">database.js</code> is opening connections inside a tight loop without releasing them back to the pool.
                  </p>
                  <pre className="p-3 bg-[#0B101D] rounded-xl border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                    {'// Fix in database.js: Release connection back to pool\nconst client = await pool.connect();\ntry {\n  await client.query(\'SELECT * FROM users WHERE id = $1\', [userId]);\n} finally {\n  client.release(); // Releases connection\n}'}
                  </pre>
                </div>
              </SmoothReveal>
            </div>
          </section>

          {/* ⚡ 9. INTERACTIVE 12-LANGUAGE CODE STUDIO (#quickstart) */}
          <SmoothReveal className="max-w-5xl mx-auto px-4 sm:px-6 py-10" delay={100}>
            <div id="quickstart" className="deep-glass-card rounded-3xl overflow-hidden shadow-2xl">
              <div className="window-topbar px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
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
                      className={
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition uppercase cursor-pointer whitespace-nowrap font-mono ' +
                        (activeQuickTab === tab.id
                          ? 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/40 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40')
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer self-start md:self-auto font-mono whitespace-nowrap border border-slate-700"
                >
                  {copiedSnippet ? '✓ Snippet Copied!' : '📋 Copy SDK Code'}
                </button>
              </div>

              <div className="p-5 sm:p-6 bg-[#070A12] overflow-x-auto">
                <pre className="font-mono text-xs text-yellow-300 leading-relaxed overflow-x-auto select-text">
                  <code>{snippets[activeQuickTab]}</code>
                </pre>
              </div>
            </div>
          </SmoothReveal>

          {/* 🪶 10. SUB-5KB FEATHERWEIGHT SDK BENCHMARKS (#features) */}
          <section id="features" className="py-16 sm:py-20 border-t border-slate-800/80 bg-[#060911]/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <SmoothReveal className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8">
                
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                    <span>🪶</span> Performance & Core Web Vitals
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    An error tracker that never slows down your users
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                    Legacy APMs force your users to download massive 100KB+ bundles that delay First Contentful Paint (FCP) and hurt Google Lighthouse scores [1.2.2]. SnapTrace is a zero-dependency script under <strong>3.4KB</strong> gzipped.
                  </p>

                  <div className="space-y-2 pt-1 font-mono">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B101D] border border-emerald-500/40 text-xs">
                      <span className="text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        SnapTrace JS Telemetry SDK
                      </span>
                      <span className="text-emerald-400 font-bold">&lt; 3.4 KB Gzipped</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B101D] border border-slate-800 text-xs opacity-70">
                      <span className="text-slate-400">Honeybadger Client</span>
                      <span className="text-slate-400 font-bold">~35 KB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B101D] border border-slate-800 text-xs opacity-50">
                      <span className="text-slate-500">Sentry Browser SDK</span>
                      <span className="text-red-400 font-bold">100+ KB</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 deep-glass-card rounded-3xl p-6 sm:p-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Google Lighthouse Impact</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 font-mono">
                      Score: 100/100
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-[#070A12] border border-slate-800 space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">0.0ms</div>
                      <p className="text-[10px] text-slate-400 font-mono">Main Thread Delay</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#070A12] border border-slate-800 space-y-1">
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">3.4 KB</div>
                      <p className="text-[10px] text-slate-400 font-mono">Total Gzipped Size</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed italic border-t border-slate-800 pt-3 font-mono">
                    &quot;We dropped heavy tracking tools for SnapTrace and our Next.js bundle footprint dropped instantly.&quot;
                  </p>
                </div>

              </SmoothReveal>
            </div>
          </section>

          {/* 📊 11. DETAILED COMPARISON TABLE (#comparison) */}
          <section id="comparison" className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-slate-800/80 space-y-8">
            <SmoothReveal className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Why Developers Choose SnapTrace</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-mono">
                Built to replace bloated, noisy enterprise APMs [1.1.7, 1.2.2].
              </p>
            </SmoothReveal>

            <SmoothReveal className="deep-glass-card rounded-3xl overflow-x-auto shadow-2xl" delay={150}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#070A12] text-slate-400 font-semibold uppercase font-mono">
                    <th className="p-4">Feature Matrix</th>
                    <th className="p-4 text-yellow-400 font-bold bg-yellow-400/5">⚡ SnapTrace</th>
                    <th className="p-4">Sentry</th>
                    <th className="p-4">GlitchTip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                  <tr>
                    <td className="p-4 font-semibold text-white">SDK Bundle Footprint</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">&lt; 3.4 KB (Featherweight)</td>
                    <td className="p-4 text-slate-500">~100 KB+</td>
                    <td className="p-4 text-slate-500">~100 KB+</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Cascading Outage Collapse</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">✓ Multi-crash unified thread</td>
                    <td className="p-4 text-slate-500">5 separate alerts [1.1.7]</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Free Tier Events</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">2,000 / month</td>
                    <td className="p-4 text-slate-500">5,000 / month</td>
                    <td className="p-4 text-slate-500">1,000 / month</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Client-Side PII Scrubbing</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">✓ Native on-device regex</td>
                    <td className="p-4 text-slate-500">Complex server rules</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">BYOK AI Diagnostics Hub</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">✓ Included in Pro ($0 markup)</td>
                    <td className="p-4 text-slate-500">$$$ Expensive per-seat add-on</td>
                    <td className="p-4 text-slate-500">✕ None</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">1-Click Prompt Export for Cursor</td>
                    <td className="p-4 text-emerald-400 font-bold bg-yellow-400/5">✓ Free Forever</td>
                    <td className="p-4 text-slate-500">✕ Manual copy</td>
                    <td className="p-4 text-slate-500">✕ Manual copy</td>
                  </tr>
                </tbody>
              </table>
            </SmoothReveal>
          </section>

          {/* 💎 12. 3-TIER PRICING SECTION (#pricing) */}
          <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-16 border-t border-slate-800/80">
            <div className="deep-glass-card rounded-3xl p-6 sm:p-9 space-y-7">
              <SmoothReveal className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs font-bold uppercase font-mono">
                  <span>💎</span> Predictable APM Pricing
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">Simple, developer-first plans</h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-mono">
                  Zero surprise overage bills. Generous headroom for solo builders and client studios.
                </p>

                {/* Monthly / Annual Toggle */}
                <div className="pt-2 flex items-center justify-center">
                  <div className="bg-[#0B101D] p-1 rounded-2xl border border-slate-800 inline-flex items-center gap-1 font-mono text-xs shadow-xl">
                    <button
                      onClick={() => setBillingInterval('monthly')}
                      className={
                        'px-4 py-2 rounded-xl font-bold transition cursor-pointer ' +
                        (billingInterval === 'monthly'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white')
                      }
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingInterval('annual')}
                      className={
                        'px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ' +
                        (billingInterval === 'annual'
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-yellow-300')
                      }
                    >
                      <span>Annual</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-yellow-300 text-[10px] font-bold">
                        Save 20% + 2 Months Free ⚡
                      </span>
                    </button>
                  </div>
                </div>

                {billingInterval === 'annual' && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    ✓ Billed annually (Includes 2 months completely free)
                  </p>
                )}
              </SmoothReveal>

              {/* The 3 Tiers Grid */}
              <SmoothReveal className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch max-w-6xl mx-auto" delay={150}>
                
                {/* Tier 1: Developer Free */}
                <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3.5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Developer Free</span>
                      <div className="text-3xl font-black text-white">$0 <span className="text-xs text-slate-500 font-normal font-mono">/ month</span></div>
                      <p className="text-xs text-slate-400 pt-0.5">For side projects and personal experiments.</p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4 font-mono">
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> <strong>2,000</strong> Events / Month</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 7-Day Data Retention</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 1 Active Project</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Sub-5KB SDK & 0ms Main Thread Delay</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> In-Dashboard Error Inspection</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Client-Side Regex PII Firewall</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> Email & In-App Alerts (No Webhooks)</li>
                    </ul>
                  </div>

                  <Link
                    href="/signup"
                    className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
                  >
                    Start Free Forever →
                  </Link>
                </div>

                {/* Tier 2: Pro Builder (Most Popular) */}
                <div className="bg-gradient-to-b from-[#0e1424] to-[#070b14] border-2 border-yellow-400/60 rounded-3xl p-6 space-y-5 shadow-2xl relative flex flex-col justify-between transform lg:-translate-y-2 hover:border-yellow-400 transition">
                  <span className="absolute -top-3 right-6 px-3 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-lg font-mono">
                    POPULAR FOR SOLO DEVS
                  </span>

                  <div className="space-y-3.5">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 font-mono">Pro Builder</span>
                      <div className="text-3xl font-black text-white">
                        {billingInterval === 'annual' ? '$15' : '$19'}
                        <span className="text-xs text-slate-400 font-normal font-mono"> / month</span>
                      </div>
                      <p className="text-xs text-slate-400 pt-0.5">
                        {billingInterval === 'annual' ? 'Billed annually at $180/yr.' : 'For solo developers, freelancers & micro-SaaS.'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-200 border-t border-slate-800 pt-4 font-mono">
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> <strong>75,000</strong> Events / Month</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> 30-Day Telemetry Retention</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> Up to 5 Active Projects</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> ⚡ Instant Discord, Slack & Telegram Alerts</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> ⚡ 1-Click Cursor & Claude AI Fix Prompts [1.4.1, 1.4.2]</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> ⚡ 60s Loop Deduplication ([x50] Noise Throttling) [1.1.7]</li>
                      <li className="flex items-center gap-2"><span className="text-yellow-400 font-bold">✓</span> In-Dashboard BYOK AI Copilot (Gemini & OpenAI)</li>
                    </ul>
                  </div>

                  <Link
                    href="/signup"
                    className="block w-full py-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-center text-xs rounded-xl transition shadow-xl shadow-yellow-500/20 cursor-pointer font-mono"
                  >
                    Claim Pro Beta Pass →
                  </Link>
                </div>

                {/* Tier 3: Agency Studio */}
                <div className="bg-[#0B101D] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">Agency Studio</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                          BUILT FOR AGENCIES
                        </span>
                      </div>
                      <div className="text-3xl font-black text-white">
                        {billingInterval === 'annual' ? '$39' : '$49'}
                        <span className="text-xs text-slate-500 font-normal font-mono"> / month</span>
                      </div>
                      <p className="text-xs text-slate-400 pt-0.5">
                        {billingInterval === 'annual' ? 'Billed annually at $468/yr.' : 'For web studios managing multiple client sites.'}
                      </p>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4 font-mono">
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> <strong>500,000</strong> Events / Month</li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> 90-Day Telemetry Retention</li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> <strong>UNLIMITED Client Projects & Keys</strong></li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Multi-Seat Team & Client Invites</li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> ⚡ Cascading Multi-Error Outage Collapse</li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Priority Edge Ingestion Gateways</li>
                      <li className="flex items-center gap-2"><span className="text-purple-400 font-bold">✓</span> Raw Log CSV / JSON Data Export</li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAgencyModal(true)}
                    className="block w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-center text-xs rounded-xl transition cursor-pointer font-mono"
                  >
                    Request Agency Access →
                  </button>
                </div>

              </SmoothReveal>
            </div>
          </section>

          {/* 🛡️ 13. SECURITY & COMPLIANCE BADGES (#pii) */}
          <section id="pii" className="py-14 sm:py-16 border-t border-slate-800/80 bg-[#060911]/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-5">
              <div className="space-y-1">
                <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-yellow-400">Zero-Trust Telemetry</h3>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Client-Side Privacy & AST Sanitization</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 max-w-4xl mx-auto text-xs font-mono">
                <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xl">🛡️</span>
                  <div className="text-white font-bold">GDPR & CCPA</div>
                  <div className="text-[10px] text-slate-400">On-device PII masking</div>
                </div>
                <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xl">🪶</span>
                  <div className="text-white font-bold">&lt;3.4KB Footprint</div>
                  <div className="text-[10px] text-slate-400">100/100 Core Web Vitals</div>
                </div>
                <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xl">🔇</span>
                  <div className="text-white font-bold">Loop Throttler</div>
                  <div className="text-[10px] text-slate-400">SHA-256 deduplication [1.1.7]</div>
                </div>
                <div className="p-4 bg-[#0B101D] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-xl">🔓</span>
                  <div className="text-white font-bold">Open Protocol</div>
                  <div className="text-[10px] text-slate-400">Standard JSON REST API</div>
                </div>
              </div>
            </div>
          </section>

          {/* ❓ 14. TECHNICAL FAQ SECTION (#faq) */}
          <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-slate-800/80 space-y-6">
            <SmoothReveal className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">Real technical answers for developers evaluating SnapTrace.</p>
            </SmoothReveal>

            <SmoothReveal className="space-y-2.5" delay={150}>
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

          {/* 🏢 15. SENTRY-STYLE ENTERPRISE FOOTER */}
          <footer className="border-t border-slate-800/80 bg-[#060911] pt-14 pb-10 relative overflow-hidden font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
              
              {/* Bottom CTA Card */}
              <div className="text-center space-y-3 max-w-xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Ready to catch bugs in a snap?
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
                  Join developers catching crashes in real time with zero noise and instant BYOK AI diagnoses.
                </p>
                <div className="pt-1 font-mono">
                  <Link
                    href="/signup"
                    className="inline-block px-7 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-yellow-500/20 transition transform hover:-translate-y-0.5"
                  >
                    Claim Your Free Beta Pass in 60s →
                  </Link>
                </div>
              </div>

              {/* 4-Column Navigation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
                
                {/* Column 1: Company */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block">Company</span>
                  <ul className="space-y-1.5 text-slate-400">
                    <li><Link href="/about" className="hover:text-white transition">About SnapTrace</Link></li>
                    <li><a href="#features" className="hover:text-white transition">Engineering Blog</a></li>
                    <li><a href="#ai-agent" className="hover:text-white transition">Careers</a></li>
                    <li><a href="mailto:hello.snaptrace@gmail.com" className="hover:text-yellow-400 transition font-bold">Contact Support</a></li>
                    <li><Link href="/privacy" className="hover:text-white transition">Trust & Security</Link></li>
                  </ul>
                </div>

                {/* Column 2: Platform */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block">Platform</span>
                  <ul className="space-y-1.5 text-slate-400">
                    <li><a href="#features" className="hover:text-white transition">Telemetry Ingestion</a></li>
                    <li><a href="#features" className="hover:text-white transition">&lt;5KB Client SDK</a></li>
                    <li><a href="#ai-agent" className="hover:text-white transition">AI Root Cause Engine</a></li>
                    <li><a href="#pii" className="hover:text-white transition">Client-Side PII Firewall</a></li>
                    <li><a href="#grouping" className="hover:text-white transition">60s Loop Throttling [1.1.7]</a></li>
                    <li><Link href="/dashboard" className="hover:text-white transition">Realtime WebSockets</Link></li>
                  </ul>
                </div>

                {/* Column 3: Solutions */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block">Solutions</span>
                  <ul className="space-y-1.5 text-slate-400">
                    <li><a href="#quickstart" className="hover:text-white transition">Next.js App Router</a></li>
                    <li><a href="#quickstart" className="hover:text-white transition">Python & FastAPI</a></li>
                    <li><a href="#quickstart" className="hover:text-white transition">Node.js / Express</a></li>
                    <li><a href="#quickstart" className="hover:text-white transition">Go, Rust & PHP</a></li>
                    <li><a href="#pricing" className="hover:text-white transition">Micro-SaaS & Startups</a></li>
                    <li><a href="#pricing" className="hover:text-white transition">Agencies & Studios</a></li>
                  </ul>
                </div>

                {/* Column 4: Get Help & Contact */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-yellow-400 uppercase tracking-widest block">Get Help</span>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>
                      <a href="mailto:hello.snaptrace@gmail.com" className="text-yellow-300 font-bold hover:underline block truncate">
                        hello.snaptrace@gmail.com
                      </a>
                    </li>
                    <li><button onClick={() => setShowFeedbackModal(true)} className="hover:text-yellow-400 text-left transition font-semibold text-white">Give Product Feedback</button></li>
                    <li><Link href="/demo" className="hover:text-yellow-400 transition font-bold">Public Demo</Link></li>
                    <li><Link href="/test" className="hover:text-white transition">Live Test Sandbox</Link></li>
                    <li><span className="text-emerald-400 flex items-center gap-1.5 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Systems Operational</span></li>
                  </ul>
                </div>
              </div>

              {/* Bottom Copyright & Sentry-Style Legal + Social Row */}
              <div className="flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4 pt-3 border-t border-slate-800">
                <div className="flex items-center space-x-5 text-[11px]">
                  <Link href="/terms" className="hover:text-yellow-400 transition font-bold uppercase">TERMS</Link>
                  <Link href="/privacy" className="hover:text-yellow-400 transition font-bold uppercase">SECURITY & COMPLIANCE</Link>
                  <Link href="/privacy" className="hover:text-yellow-400 transition font-bold uppercase">PRIVACY</Link>
                  <Link href="/about" className="hover:text-yellow-400 transition font-bold uppercase">ABOUT</Link>
                </div>

                {/* Social SVG Links */}
                <div className="flex items-center space-x-4 text-slate-400">
                  <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="X (Twitter)">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="GitHub">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                    </svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="LinkedIn">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                  <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Discord">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </a>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-600 font-mono pt-3">
                © {new Date().getFullYear()} SnapTrace. The Modern Developer Telemetry Platform. Built by developers, for developers.
              </div>

            </div>
          </footer>
        </>
      )}

      {/* 🌟 16. INTERACTIVE FLOATING FEEDBACK TRIGGER (Desktop & Mobile) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="px-3.5 py-2 rounded-full bg-[#0D1222]/95 border border-yellow-400/40 text-yellow-300 hover:text-white hover:bg-yellow-400/10 transition shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-mono font-bold cursor-pointer hover:border-yellow-400"
          title="Send feedback directly to founders & engineers"
        >
          <span className="text-sm">💬</span>
          <span className="hidden sm:inline">Feedback</span>
          <span className="kbd-badge text-[9px] px-1 rounded text-slate-400 font-normal hidden sm:inline">⌘F</span>
        </button>
      </div>

      {/* 🌟 17. INTERACTIVE USER FEEDBACK MODAL (Direct Gmail Web Integration) */}
      {showFeedbackModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFeedbackModal(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
        >
          <div className="bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowFeedbackModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xs cursor-pointer font-mono"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/30 text-[10px] font-mono font-bold uppercase">
                <span>💬</span> Developer Feedback Loop
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Send Direct Feedback to Engineering
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Help us build the ultimate error tracking tool. Submitting will launch your Gmail web composer directly addressed to <strong className="text-yellow-300">{supportEmail}</strong>.
              </p>
            </div>

            {feedbackSent ? (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2 font-mono">
                <span className="text-2xl block">⚡</span>
                <h4 className="text-sm font-bold text-emerald-300">Opening Gmail Web Composer...</h4>
                <p className="text-xs text-slate-400">
                  Thank you for helping us polish SnapTrace!
                </p>
              </div>
            ) : (
              <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 font-mono text-xs">
                
                {/* Category Pills */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Feedback Type
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {[
                      { id: 'feature', label: '💡 Feature Request' },
                      { id: 'bug', label: '🐞 Bug Report' },
                      { id: 'ux', label: '⚡ Developer UX' },
                      { id: 'general', label: '💬 General Vibe' },
                    ].map((cat) => (
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

                {/* Feedback Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Your Thoughts or Request
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what you'd like improved, any bugs encountered, or features you need..."
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-400 text-xs resize-none"
                  />
                </div>

                {/* Optional Contact */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                    Your Contact Email (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    placeholder="name@company.com or @handle"
                    className="w-full bg-[#05070E] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-400 text-xs"
                  />
                </div>

                {/* Actions */}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Submit via Gmail Web →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <p className="text-[10px] text-slate-500 font-mono text-center">
              All messages route directly to hello.snaptrace@gmail.com
            </p>
          </div>
        </div>
      )}

      {/* 🏢 18. AGENCY CONTACT MODAL ($49 TIER) */}
      {showAgencyModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAgencyModal(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans"
        >
          <div className="bg-[#090D16] border-2 border-purple-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAgencyModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white text-xs cursor-pointer font-mono"
            >
              ✕
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono font-bold uppercase">
                <span>⚡</span> Agency Studio Plan ($49/mo)
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Request Agency Studio Access
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                For web development studios & software agencies managing multiple client projects (<strong className="text-slate-200">500,000 events/mo & UNLIMITED projects</strong>), contact our engineering desk for immediate activation:
              </p>
            </div>

            {/* Highlighted Email Box */}
            <div className="bg-[#05070E] border border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                Direct Founder & Engineering Desk
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-yellow-300 font-bold text-sm truncate">
                  {supportEmail}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-sm border border-slate-700"
                >
                  {copiedEmail ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1 font-mono">
              <a
                href={
                  'https://mail.google.com/mail/?view=cm&fs=1&to=' +
                  supportEmail +
                  '&su=SnapTrace%20Agency%20Studio%20Plan%20Inquiry'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>Compose in Gmail Web →</span>
              </a>

              <button
                type="button"
                onClick={() => setShowAgencyModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer text-center"
              >
                Close
              </button>
            </div>

            <p className="text-[11px] text-slate-500 font-mono text-center">
              Guaranteed direct activation from our lead engineer within 24 hours.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
