'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type LanguageKey =
  | 'nextjs'
  | 'js'
  | 'curl'
  | 'node'
  | 'python'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'flutter'
  | 'cloudflare'
  | 'html';

interface IntegrationSnippet {
  name: string;
  badge: string;
  category: string;
  filename: string;
  installCmd?: string;
  guide: string[];
  code: (apiKey: string) => string;
  isNpm?: boolean;
}

function CodeHighlighter({ code }: { code: string }) {
  const lines = code.split('\n');

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto select-text">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('<!--') || trimmed.startsWith('/*');

        return (
          <div key={lineIdx} className="table-row hover:bg-zinc-800/20">
            <span className="table-cell pr-4 text-right text-[11px] text-zinc-600 select-none font-mono w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell whitespace-pre">
              {isComment ? (
                <span className="text-zinc-500 italic">{line}</span>
              ) : (
                line
                  .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/.*|\#.*|\b(?:import|export|default|function|return|from|const|let|var|def|try|except|catch|finally|package|async|await|public|static|void|class|new|true|false|null|nil|None|if|else)\b|<\/?[a-zA-Z0-9_\-]+(?:\s|>|\/)|<\/?>)/g)
                  .map((part, partIdx) => {
                    if (!part) return null;
                    if (part.startsWith('//') || part.startsWith('#')) {
                      return <span key={partIdx} className="text-zinc-500 italic">{part}</span>;
                    }
                    if (part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) {
                      return <span key={partIdx} className="text-emerald-400/90 font-medium">{part}</span>;
                    }
                    if (/^(?:import|export|default|function|return|from|const|let|var|def|try|except|catch|finally|package|async|await|public|static|void|class|new|if|else)$/.test(part)) {
                      return <span key={partIdx} className="text-sky-400 font-semibold">{part}</span>;
                    }
                    if (/^(?:true|false|null|nil|None)$/.test(part)) {
                      return <span key={partIdx} className="text-amber-300 font-semibold">{part}</span>;
                    }
                    if (/^<\/?[a-zA-Z0-9_\-]+/.test(part) || part === '>' || part === '/>' || part === '</>') {
                      return <span key={partIdx} className="text-rose-400 font-medium">{part}</span>;
                    }
                    return <span key={partIdx} className="text-zinc-200">{part}</span>;
                  })
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function LanguageIntegrationsPage() {
  const [apiKey, setApiKey] = useState<string>('YOUR_SNAPTRACE_API_KEY');
  const [activeTab, setActiveTab] = useState<LanguageKey>('nextjs');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedInstall, setCopiedInstall] = useState<boolean>(false);
  const [copiedInit, setCopiedInit] = useState<boolean>(false);
  const [copiedCatch, setCopiedCatch] = useState<boolean>(false);
  const [copiedAiPrompt, setCopiedAiPrompt] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchApiKey = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, api_key')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projects && projects.length > 0) {
        const savedId = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_selected_project_id') : null;
        const activeProj = projects.find((p) => p.id === savedId) || projects[0];

        if (activeProj?.api_key) {
          setApiKey(activeProj.api_key);
        }
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchApiKey();
    window.addEventListener('snaptrace_project_change', fetchApiKey);
    return () => {
      window.removeEventListener('snaptrace_project_change', fetchApiKey);
    };
  }, [fetchApiKey]);

  const nextJsInitCode = `'use client';
import { initSnapTrace } from 'snaptrace';

initSnapTrace({
  apiKey: '${apiKey}',
});`;

  const nextJsCatchCode = `import { captureException } from 'snaptrace';

try {
  // your business logic
} catch (error) {
  captureException(error);
}`;

  const integrations: Record<LanguageKey, IntegrationSnippet> = {
    nextjs: {
      name: 'Next.js / React',
      badge: 'NPM',
      category: 'Official npm Package',
      filename: 'app/layout.tsx',
      isNpm: true,
      installCmd: 'npm install snaptrace',
      guide: [
        'Install the official `snaptrace` package via npm or pnpm.',
        'Initialize once inside your root client layout (`app/layout.tsx` or `providers.tsx`).',
        'Captures uncaught runtime exceptions, React render boundaries, and promise rejections.',
        'Featherweight (<3.4KB gzipped) with 0ms hydration latency and non-blocking beacon delivery.',
      ],
      code: (key) => `'use client';
import { initSnapTrace } from 'snaptrace';

initSnapTrace({
  apiKey: '${key}',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`,
    },
    js: {
      name: 'JavaScript / CDN',
      badge: 'CDN',
      category: 'Browser Script Tag',
      filename: 'index.html',
      installCmd: '<!-- Paste into your HTML head before other scripts -->',
      guide: [
        'Drop-in script tag for React, Vue, Svelte, Angular, Vite, and Vanilla JavaScript.',
        'Automatically captures `window.onerror` and `window.onunhandledrejection`.',
        'Sanitizes passwords, tokens, and credit cards directly in the browser.',
      ],
      code: (key) => `<script 
  src="https://snaptrace.space/snaptrace.js"
  data-api-key="${key}"
  async
></script>`,
    },
    curl: {
      name: 'cURL / REST API',
      badge: 'cURL',
      category: 'DevOps & CI/CD',
      filename: 'terminal.sh',
      installCmd: 'curl -X POST https://snaptrace.space/api/v1/log ...',
      guide: [
        'Send raw JSON payloads directly via HTTP POST.',
        'Ideal for GitHub Actions, Bash scripts, and cron monitors.',
      ],
      code: (key) => `curl -X POST https://snaptrace.space/api/v1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${key}",
    "message": "Critical process crash on worker-01",
    "stackTrace": "ProcessExitedError: Signal SIGSEGV",
    "environment": "production",
    "url": "https://worker-01.internal/jobs"
  }'`,
    },
    node: {
      name: 'Node.js (Express / NestJS)',
      badge: 'Node',
      category: 'Backend Runtime',
      filename: 'server.js',
      installCmd: '// Uses standard native fetch in Node 18+',
      guide: [
        'Hook into `process.on("uncaughtException")` or Express error middleware.',
        'Dispatches backend telemetry without external heavy dependencies.',
      ],
      code: (key) => `// server.js
process.on('uncaughtException', (err) => {
  fetch('https://snaptrace.space/api/v1/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: '${key}',
      message: err.message,
      stackTrace: err.stack,
      environment: process.env.NODE_ENV || 'production'
    })
  }).catch(() => {});
});`,
    },
    python: {
      name: 'Python (Django / FastAPI)',
      badge: 'Python',
      category: 'Backend Language',
      filename: 'client.py',
      installCmd: 'pip install requests',
      guide: [
        'Wrap exception blocks in your FastAPI, Django, or Flask routes.',
        'Dispatches async POST telemetry with full traceback formatting.',
        'Supports Celery background worker crash logging.',
      ],
      code: (key) => `# Python Telemetry Client
import requests, traceback

def capture_snaptrace(exception, route="https://api.mycompany.com"):
    try:
        requests.post("https://snaptrace.space/api/v1/log", json={
            "apiKey": "${key}",
            "message": str(exception),
            "stackTrace": traceback.format_exc(),
            "url": route,
            "environment": "production"
        }, timeout=2)
    except Exception:
        pass`,
    },
    go: {
      name: 'Go (Golang)',
      badge: 'Go',
      category: 'Backend Language',
      filename: 'main.go',
      installCmd: '// Uses standard library net/http and encoding/json',
      guide: [
        'Call `SendSnapTrace(err)` inside your recover() handlers or Gin error middleware.',
        'Runs asynchronously with zero performance overhead.',
      ],
      code: (key) => `package main

import (
  "bytes"
  "encoding/json"
  "net/http"
)

func SendSnapTrace(err error, route string) {
  payload, _ := json.Marshal(map[string]string{
    "apiKey":      "${key}",
    "message":     err.Error(),
    "environment": "production",
    "url":         route,
  })
  go http.Post("https://snaptrace.space/api/v1/log", "application/json", bytes.NewBuffer(payload))
}`,
    },
    rust: {
      name: 'Rust (Axum / Actix)',
      badge: 'Rust',
      category: 'Systems Language',
      filename: 'telemetry.rs',
      installCmd: 'cargo add reqwest serde_json',
      guide: [
        'Integrate into your Axum/Actix error responders or Tokio tasks.',
        'Non-blocking async telemetry reporting.',
      ],
      code: (key) => `async fn capture_snaptrace(err: &str, route: &str) {
    let payload = serde_json::json!({
        "apiKey": "${key}",
        "message": err,
        "url": route,
        "environment": "production"
    });
    let _ = reqwest::Client::new()
        .post("https://snaptrace.space/api/v1/log")
        .json(&payload)
        .send()
        .await;
}`,
    },
    csharp: {
      name: 'C# / .NET Core',
      badge: 'C#',
      category: 'Backend / Enterprise',
      filename: 'SnapTraceClient.cs',
      installCmd: '// Uses System.Net.Http.Json',
      guide: [
        'Add to your ASP.NET Core global exception filter middleware.',
        'Compatible with .NET 6, 7, 8 and Unity game runtime.',
      ],
      code: (key) => `public static async Task CaptureSnapTrace(Exception ex, string url = "API Service") {
    var payload = new {
        apiKey = "${key}",
        message = ex.Message,
        stackTrace = ex.StackTrace,
        url = url,
        environment = "production"
    };
    await new HttpClient().PostAsJsonAsync("https://snaptrace.space/api/v1/log", payload);
}`,
    },
    php: {
      name: 'PHP (Laravel / WordPress)',
      badge: 'PHP',
      category: 'Backend Language',
      filename: 'handler.php',
      installCmd: '// Uses native PHP cURL extension',
      guide: [
        'Hook into `set_exception_handler()` or Laravel `Handler.php`.',
        'Dispatches stack traces with server request context.',
      ],
      code: (key) => `<?php
set_exception_handler(function ($e) {
    $ch = curl_init('https://snaptrace.space/api/v1/log');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'apiKey' => '${key}',
        'message' => $e->getMessage(),
        'stackTrace' => $e->getTraceAsString(),
        'environment' => 'production'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_exec($ch);
});
?>`,
    },
    ruby: {
      name: 'Ruby on Rails',
      badge: 'Ruby',
      category: 'Backend Framework',
      filename: 'snaptrace.rb',
      installCmd: '// Uses standard library Net::HTTP and JSON',
      guide: [
        'Add to `ApplicationController` rescue_from or Sinatra error block.',
        'Formats backtrace into structured telemetry.',
      ],
      code: (key) => `def send_snaptrace_alert(exception)
  uri = URI('https://snaptrace.space/api/v1/log')
  Net::HTTP.post(uri, {
    apiKey: '${key}',
    message: exception.message,
    stackTrace: exception.backtrace&.join("\\n"),
    environment: 'production'
  }.to_json, "Content-Type" => "application/json") rescue nil
end`,
    },
    kotlin: {
      name: 'Kotlin / Android / Java',
      badge: 'Kotlin',
      category: 'Mobile & JVM',
      filename: 'SnapTrace.kt',
      installCmd: 'implementation("com.squareup.okhttp3:okhttp:4.12.0")',
      guide: [
        'Hook into `Thread.setDefaultUncaughtExceptionHandler`.',
        'Captures mobile runtime exceptions with Android device context.',
      ],
      code: (key) => `fun reportSnapTrace(e: Throwable, context: String = "Android App") {
    val json = JSONObject().apply {
        put("apiKey", "${key}")
        put("message", e.localizedMessage ?: "Unknown Error")
        put("stackTrace", e.stackTraceToString())
        put("environment", "production")
        put("url", context)
    }
    val body = json.toString().toRequestBody("application/json".toMediaType())
    OkHttpClient().newCall(Request.Builder().url("https://snaptrace.space/api/v1/log").post(body).build()).enqueue(object: Callback {
        override fun onFailure(call: Call, e: IOException) {}
        override fun onResponse(call: Call, response: Response) { response.close() }
    })
}`,
    },
    flutter: {
      name: 'Flutter / Dart',
      badge: 'Flutter',
      category: 'Mobile Framework',
      filename: 'main.dart',
      installCmd: 'flutter pub add http',
      guide: [
        'Hook into `FlutterError.onError` and `PlatformDispatcher.instance.onError`.',
        'Captures iOS & Android cross-platform exceptions.',
      ],
      code: (key) => `void captureSnapTrace(Object error, StackTrace stack) {
  http.post(
    Uri.parse('https://snaptrace.space/api/v1/log'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'apiKey': '${key}',
      'message': error.toString(),
      'stackTrace': stack.toString(),
      'environment': 'production'
    }),
  );
}`,
    },
    cloudflare: {
      name: 'Cloudflare Workers / Edge',
      badge: 'Edge',
      category: 'Serverless Edge',
      filename: 'worker.js',
      installCmd: '// Uses standard Fetch & ExecutionContext.waitUntil',
      guide: [
        'Wrap your worker `fetch` handler in try/catch.',
        'Uses `ctx.waitUntil()` to deliver telemetry without blocking edge responses.',
      ],
      code: (key) => `export default {
  async fetch(req, env, ctx) {
    try {
      return await handleRequest(req);
    } catch (err) {
      ctx.waitUntil(fetch('https://snaptrace.space/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: '${key}',
          message: err.message,
          stackTrace: err.stack,
          environment: 'production'
        })
      }));
      return new Response('Edge Execution Error', { status: 500 });
    }
  }
};`,
    },
    html: {
      name: 'HTML5 Resource Catcher',
      badge: 'HTML5',
      category: 'Asset Monitoring',
      filename: 'index.html',
      installCmd: '<!-- Paste in HTML head -->',
      guide: [
        'Intercepts broken images, failing CDN stylesheets, and missing scripts.',
        'Uses DOM error event capture before event bubbling.',
      ],
      code: (key) => `<script>
  document.addEventListener('error', function(e) {
    var target = e.target;
    if (target && (target.tagName === 'IMG' || target.tagName === 'LINK' || target.tagName === 'SCRIPT')) {
      fetch('https://snaptrace.space/api/v1/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: '${key}',
          message: 'Asset load failure: ' + (target.src || target.href),
          environment: 'production',
          url: window.location.href
        }),
        keepalive: true
      });
    }
  }, true);
</script>`,
    },
  };

  const current = integrations[activeTab] || integrations['nextjs'];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.code(apiKey));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('npm install snaptrace');
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleCopyInit = () => {
    navigator.clipboard.writeText(nextJsInitCode);
    setCopiedInit(true);
    setTimeout(() => setCopiedInit(false), 2000);
  };

  const handleCopyCatch = () => {
    navigator.clipboard.writeText(nextJsCatchCode);
    setCopiedCatch(true);
    setTimeout(() => setCopiedCatch(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-8 font-sans animate-in fade-in duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-800/80 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-100">
                Language Integrations
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Official NPM package & drop-in snippets with your active project credentials pre-injected.
              </p>
            </div>
            <a
              href="https://www.npmjs.com/package/snaptrace"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15 text-xs font-mono transition cursor-pointer self-start sm:self-auto"
            >
              <span className="font-bold">npm</span>
              <span className="text-zinc-600">•</span>
              <span>snaptrace v1.0.0</span>
              <span className="text-zinc-500 font-mono text-[10px]">↗</span>
            </a>
          </div>
        </div>

        {/* Active Ingestion Key Banner */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Active Ingestion Key
            </span>
            <p className="text-xs text-zinc-400">
              All snippets below use this project token.
            </p>
          </div>
          <code className="bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300 truncate max-w-md">
            {loading ? 'Fetching active key...' : apiKey}
          </code>
        </div>

        {/* Featured: 10-Second Install with AI (Cursor & Claude Code) */}
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-zinc-950 to-zinc-950 p-5 space-y-3 font-mono shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-purple-200">
                  ⚡ 1-Prompt Setup: Install with AI (Cursor &amp; Claude Code)
                </h2>
                <p className="text-xs text-zinc-400 font-sans mt-0.5">
                  Paste this into Cursor Composer (Cmd+I) or Claude Code. Your AI agent installs the package, adds initialization with your key, and configures error boundaries in 10s.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const prompt = `Install and configure SnapTrace error telemetry in this project:
1. Run: npm install snaptrace
2. In root client layout or app entry (e.g. app/layout.tsx for Next.js, or src/main.tsx), initialize SnapTrace:
   import { initSnapTrace } from 'snaptrace';
   initSnapTrace({ apiKey: '${apiKey || 'YOUR_PROJECT_API_KEY'}' });
3. Wrap any critical unhandled exceptions or error boundaries to call captureException(error).
Keep the bundle featherweight (<5KB) with 0ms hydration lag and ensure the build passes cleanly.`;
                navigator.clipboard.writeText(prompt);
                setCopiedAiPrompt(true);
                setTimeout(() => setCopiedAiPrompt(false), 2000);
              }}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>{copiedAiPrompt ? '✓ AI Prompt Copied!' : 'Copy AI Prompt'}</span>
            </button>
          </div>

          <pre className="text-xs text-zinc-200 overflow-x-auto leading-relaxed p-3 font-mono bg-zinc-900/70 rounded-lg border border-purple-500/20 whitespace-pre-wrap select-all">
{`Install and configure SnapTrace error telemetry in this project:
1. Run: npm install snaptrace
2. In root client layout or app entry (e.g. app/layout.tsx for Next.js, or src/main.tsx), initialize SnapTrace:
   import { initSnapTrace } from 'snaptrace';
   initSnapTrace({ apiKey: '${apiKey || 'YOUR_PROJECT_API_KEY'}' });
3. Wrap unhandled exceptions or error boundaries to call captureException(error).
Keep it featherweight (<5KB) with 0ms hydration lag and ensure the build passes cleanly.`}
          </pre>
        </div>

        {/* Grid: Language Selector + Code Box */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Left: Language Tabs */}
          <div className="lg:col-span-1 space-y-1 max-h-[660px] overflow-y-auto pr-1">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 px-1">
              Supported Stacks ({Object.keys(integrations).length})
            </span>

            {(Object.keys(integrations) as LanguageKey[]).map((lang) => {
              const item = integrations[lang];
              const isActive = activeTab === lang;
              const isPrimary = lang === 'nextjs';
              return (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                      : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                    isPrimary 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold' 
                      : 'bg-zinc-800/80 border-zinc-700/80 text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                  <div className="truncate">
                    <div className="truncate font-sans font-medium">{item.name}</div>
                    <span className="text-[9px] text-zinc-500 font-mono block">{item.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Code Viewer & Setup Guide */}
          <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800/80 rounded-xl p-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Integration Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3.5">
                <div className="flex items-center space-x-2.5">
                  <span className={`text-xs font-mono px-2 py-1 rounded-lg border font-bold ${
                    current.isNpm
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                  }`}>
                    {current.badge}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-zinc-100">
                        {current.name}
                      </h2>
                      {current.isNpm && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                          Official SDK
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{current.category}</span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-medium transition flex items-center justify-center space-x-1.5 cursor-pointer self-start sm:self-auto font-mono"
                >
                  <span>{copied ? '✓ Copied' : 'Copy Snippet'}</span>
                </button>
              </div>

              {/* Next.js / React Featured 3-Step NPM Integration */}
              {current.isNpm ? (
                <div className="space-y-4">
                  {/* Step 1: Install official package */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center">1</span>
                        <span className="text-xs font-medium text-zinc-200 font-sans">Install official package</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">&lt;3.4KB gzipped</span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-200">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-zinc-600 select-none">$</span>
                        <code className="text-emerald-400 font-semibold truncate">npm install snaptrace</code>
                      </div>
                      <button
                        onClick={handleCopyInstall}
                        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] px-2.5 py-1 rounded transition font-mono shrink-0 cursor-pointer"
                      >
                        {copiedInstall ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Client initialization */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center">2</span>
                        <span className="text-xs font-medium text-zinc-200 font-sans">Initialize in <code className="text-zinc-300 font-mono text-[11px]">app/layout.tsx</code> or <code className="text-zinc-300 font-mono text-[11px]">providers.tsx</code></span>
                      </div>
                      <button
                        onClick={handleCopyInit}
                        className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                      >
                        {copiedInit ? '✓ Copied' : 'Copy Init'}
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="px-3.5 py-1.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">app/layout.tsx</span>
                        <span className="text-[10px] font-mono text-zinc-600">TypeScript</span>
                      </div>
                      <div className="p-3.5">
                        <CodeHighlighter code={nextJsInitCode} />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Optional manual exception catch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center">3</span>
                        <span className="text-xs font-medium text-zinc-200 font-sans">Manual exception catch <span className="text-zinc-500 text-[11px] font-normal">(Optional)</span></span>
                      </div>
                      <button
                        onClick={handleCopyCatch}
                        className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 transition cursor-pointer"
                      >
                        {copiedCatch ? '✓ Copied' : 'Copy Catch'}
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="px-3.5 py-1.5 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-zinc-500">Manual Error Capture</span>
                        <span className="text-[10px] font-mono text-zinc-600">TypeScript</span>
                      </div>
                      <div className="p-3.5">
                        <CodeHighlighter code={nextJsCatchCode} />
                      </div>
                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="pt-2">
                    <ul className="space-y-1.5 text-xs text-zinc-400 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80 font-mono text-[11.5px]">
                      {current.guide.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-zinc-600 select-none">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                /* Standard layout for secondary alternatives (CDN script, cURL, and backend languages) */
                <>
                  {/* Install Command */}
                  {current.installCmd && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        Installation
                      </span>
                      <pre className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-xs font-mono text-emerald-400/90 overflow-x-auto">
                        {current.installCmd}
                      </pre>
                    </div>
                  )}

                  {/* Setup Guide */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      Setup Instructions
                    </span>
                    <ul className="space-y-1.5 text-xs text-zinc-400 bg-zinc-900 p-3.5 rounded-lg border border-zinc-800 font-mono">
                      {current.guide.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-zinc-500 select-none">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Code Snippet Editor */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                        Code Snippet
                      </span>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {current.filename}
                      </span>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                      <div className="px-3.5 py-2 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                          <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                          <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                          <span className="text-[11px] font-mono text-zinc-500 ml-2">{current.filename}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase">UTF-8</span>
                      </div>

                      <div className="p-4 max-h-[380px] overflow-y-auto">
                        <CodeHighlighter code={current.code(apiKey)} />
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">
                Package: <a href="https://www.npmjs.com/package/snaptrace" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-200 underline">npmjs.com/package/snaptrace</a>
              </span>
              <span className="text-[11px] text-zinc-600 font-mono">
                Endpoint: <code className="text-zinc-400">POST /api/v1/log</code>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}