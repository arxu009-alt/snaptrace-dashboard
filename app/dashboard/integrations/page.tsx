'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

type LanguageKey =
  | 'js'
  | 'nextjs'
  | 'python'
  | 'node'
  | 'go'
  | 'rust'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'kotlin'
  | 'flutter'
  | 'cloudflare'
  | 'curl'
  | 'html';

interface IntegrationSnippet {
  name: string;
  icon: string;
  category: string;
  filename: string;
  installCmd?: string;
  guide: string[];
  code: (apiKey: string) => string;
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

export default function LanguageIntegrationsPage() {
  const [apiKey, setApiKey] = useState<string>('YOUR_SNAPTRACE_API_KEY');
  const [activeTab, setActiveTab] = useState<LanguageKey>('nextjs');
  const [copied, setCopied] = useState<boolean>(false);
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

  const integrations: Record<LanguageKey, IntegrationSnippet> = {
    nextjs: {
      name: 'Next.js (App Router)',
      icon: '▲',
      category: 'Fullstack Framework',
      filename: 'app/layout.tsx',
      installCmd: '// Zero dependencies. Drop into your root layout:',
      guide: [
        'Place this script tag inside your root `app/layout.tsx` file inside `<head>`.',
        'Automatically intercepts client-side uncaught exceptions, hydration errors, and unhandled promise rejections.',
        'Uses `navigator.sendBeacon` for zero impact on Core Web Vitals.',
      ],
      code: (key) => `// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
          strategy="beforeInteractive"
          data-api-key="${key}"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,
    },
    js: {
      name: 'JavaScript / React / Vue',
      icon: '🟨',
      category: 'Frontend Client',
      filename: 'index.html',
      installCmd: '<!-- Paste into your HTML head before other scripts -->',
      guide: [
        'Works with React, Vue, Svelte, Angular, Vite, and Vanilla JavaScript.',
        'Automatically captures `window.onerror` and `window.onunhandledrejection`.',
        'Sanitizes passwords, tokens, and credit cards directly on the client.',
      ],
      code: (key) => `<script 
  src="https://snaptrace-dashboard.vercel.app/snaptrace.js"
  data-api-key="${key}"
  async
></script>`,
    },
    python: {
      name: 'Python (Django / FastAPI)',
      icon: '🐍',
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
        requests.post("https://snaptrace-dashboard.vercel.app/api/v1/log", json={
            "apiKey": "${key}",
            "message": str(exception),
            "stackTrace": traceback.format_exc(),
            "url": route,
            "environment": "production"
        }, timeout=2)
    except Exception:
        pass`,
    },
    node: {
      name: 'Node.js (Express / NestJS)',
      icon: '🟩',
      category: 'Backend Runtime',
      filename: 'server.js',
      installCmd: '// Uses standard native fetch in Node 18+',
      guide: [
        'Hook into `process.on("uncaughtException")` or Express error middleware.',
        'Dispatches backend telemetry without external npm dependencies.',
      ],
      code: (key) => `// server.js
process.on('uncaughtException', (err) => {
  fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
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
    go: {
      name: 'Go (Golang)',
      icon: '🐹',
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
  go http.Post("https://snaptrace-dashboard.vercel.app/api/v1/log", "application/json", bytes.NewBuffer(payload))
}`,
    },
    rust: {
      name: 'Rust (Axum / Actix)',
      icon: '🦀',
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
        .post("https://snaptrace-dashboard.vercel.app/api/v1/log")
        .json(&payload)
        .send()
        .await;
}`,
    },
    csharp: {
      name: 'C# / .NET Core',
      icon: '🔷',
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
    await new HttpClient().PostAsJsonAsync("https://snaptrace-dashboard.vercel.app/api/v1/log", payload);
}`,
    },
    php: {
      name: 'PHP (Laravel / WordPress)',
      icon: '🐘',
      category: 'Backend Language',
      filename: 'handler.php',
      installCmd: '// Uses native PHP cURL extension',
      guide: [
        'Hook into `set_exception_handler()` or Laravel `Handler.php`.',
        'Dispatches stack traces with server request context.',
      ],
      code: (key) => `<?php
set_exception_handler(function ($e) {
    $ch = curl_init('https://snaptrace-dashboard.vercel.app/api/v1/log');
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
      icon: '💎',
      category: 'Backend Framework',
      filename: 'snaptrace.rb',
      installCmd: '// Uses standard library Net::HTTP and JSON',
      guide: [
        'Add to `ApplicationController` rescue_from or Sinatra error block.',
        'Formats backtrace into structured telemetry.',
      ],
      code: (key) => `def send_snaptrace_alert(exception)
  uri = URI('https://snaptrace-dashboard.vercel.app/api/v1/log')
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
      icon: '☕',
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
    OkHttpClient().newCall(Request.Builder().url("https://snaptrace-dashboard.vercel.app/api/v1/log").post(body).build()).enqueue(object: Callback {
        override fun onFailure(call: Call, e: IOException) {}
        override fun onResponse(call: Call, response: Response) { response.close() }
    })
}`,
    },
    flutter: {
      name: 'Flutter / Dart',
      icon: '📱',
      category: 'Mobile Framework',
      filename: 'main.dart',
      installCmd: 'flutter pub add http',
      guide: [
        'Hook into `FlutterError.onError` and `PlatformDispatcher.instance.onError`.',
        'Captures iOS & Android cross-platform exceptions.',
      ],
      code: (key) => `void captureSnapTrace(Object error, StackTrace stack) {
  http.post(
    Uri.parse('https://snaptrace-dashboard.vercel.app/api/v1/log'),
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
      icon: '☁️',
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
      ctx.waitUntil(fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
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
    curl: {
      name: 'cURL / REST API',
      icon: '🌐',
      category: 'DevOps & CI/CD',
      filename: 'terminal.sh',
      installCmd: 'curl -X POST ...',
      guide: [
        'Send raw JSON payloads directly via HTTP POST.',
        'Ideal for GitHub Actions, Bash scripts, and cron monitors.',
      ],
      code: (key) => `curl -X POST https://snaptrace-dashboard.vercel.app/api/v1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${key}",
    "message": "Critical process crash on worker-01",
    "stackTrace": "ProcessExitedError: Signal SIGSEGV",
    "environment": "production",
    "url": "https://worker-01.internal/jobs"
  }'`,
    },
    html: {
      name: 'HTML5 Resource Catcher',
      icon: '🎨',
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
      fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
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

  return (
    <div className="min-h-screen bg-[#05070E] text-slate-100 p-6 sm:p-8 font-sans selection:bg-yellow-400 selection:text-slate-950 animate-in fade-in duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>Language & Framework Integrations</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Production-ready drop-in code snippets with your active project credentials pre-injected.
          </p>
        </div>

        {/* Active Ingestion Key Banner */}
        <div className="bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest font-mono block">
              Active Ingestion Key
            </span>
            <p className="text-xs text-slate-400">
              All snippets below are automatically populated with this project token.
            </p>
          </div>
          <code className="bg-[#05070E] px-4 py-2 rounded-xl border border-slate-800 font-mono text-xs text-yellow-300 truncate max-w-md">
            {loading ? 'Fetching active key...' : apiKey}
          </code>
        </div>

        {/* Grid: Language Selector + Code Box */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left: Language Tabs */}
          <div className="lg:col-span-1 space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-1 font-mono">
              Supported Stacks ({Object.keys(integrations).length})
            </span>

            {(Object.keys(integrations) as LanguageKey[]).map((lang) => {
              const item = integrations[lang];
              const isActive = activeTab === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'border-l-4 border-l-yellow-400 bg-gradient-to-r from-yellow-400/15 via-yellow-400/5 to-transparent text-yellow-300 font-bold shadow-sm'
                      : 'bg-[#090D16] text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200 border-l-4 border-l-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="truncate">
                    <div className="truncate">{item.name}</div>
                    <span className="text-[9px] text-slate-500 font-mono block">{item.category}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Code Viewer & Setup Guide */}
          <div className="lg:col-span-3 bg-gradient-to-b from-[#0B0F19] to-[#060911] border border-slate-800/90 rounded-3xl p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl p-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-yellow-400">
                    {current.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {current.name} Integration
                    </h2>
                    <span className="text-[10px] text-yellow-400 font-mono uppercase">{current.category}</span>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 shadow-lg shadow-yellow-500/20 cursor-pointer self-start sm:self-auto font-mono"
                >
                  <span>{copied ? '✓ Snippet Copied!' : '📋 Copy Snippet'}</span>
                </button>
              </div>

              {current.installCmd && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Installation / Dependency
                  </span>
                  <pre className="bg-[#05070E] border border-slate-800 p-3 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                    {current.installCmd}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Setup Instructions
                </span>
                <ul className="space-y-2 text-xs text-slate-300 bg-[#05070E] p-4 rounded-2xl border border-slate-800/80 font-mono">
                  {current.guide.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5">
                      <span className="text-yellow-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code Snippet Editor */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Production Code Snippet
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    File: <span className="text-yellow-400">{current.filename}</span>
                  </span>
                </div>

                <div className="bg-[#05070E] border border-slate-800/90 rounded-2xl overflow-hidden shadow-inner">
                  <div className="px-4 py-2.5 bg-[#080C16] border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                      <span className="text-[11px] font-mono text-slate-400 ml-2 font-medium">{current.filename}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">UTF-8</span>
                  </div>

                  <div className="p-4 max-h-[380px] overflow-y-auto">
                    <CodeHighlighter code={current.code(apiKey)} />
                  </div>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800/80 text-right">
              <span className="text-[11px] text-slate-500 font-mono">
                Ingestion Endpoint: <code className="text-yellow-400">POST /api/v1/log</code>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}