'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type LanguageKey = 'js' | 'python' | 'curl' | 'ruby' | 'kotlin' | 'php';

interface IntegrationSnippet {
  name: string;
  icon: string;
  installCmd?: string;
  guide: string[];
  code: (apiKey: string) => string;
}

export default function LanguageIntegrationsPage() {
  const [apiKey, setApiKey] = useState<string>('YOUR_SNAPTRACE_API_KEY');
  const [activeTab, setActiveTab] = useState<LanguageKey>('js');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchApiKey() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (!supabaseUrl || !supabaseAnonKey) {
        setLoading(false);
        return;
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: project } = await supabase
          .from('projects')
          .select('api_key')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (project?.api_key) {
          setApiKey(project.api_key);
        }
      }
      setLoading(false);
    }

    fetchApiKey();
  }, []);

  const integrations: Record<LanguageKey, IntegrationSnippet> = {
    js: {
      name: 'JavaScript / Node.js',
      icon: '🟨',
      installCmd: 'npm install snaptrace-client # Or use native fetch API',
      guide: [
        'Wrap your application entry point or global error boundary with a try/catch block.',
        'Extract error details (message, stack trace, current URL) and send a POST request to SnapTrace.',
        'Supports standard Node.js runtime, Next.js, Express, React, and browser contexts.',
      ],
      code: (key) => `// SnapTrace Error Handler for JavaScript / Node.js
async function sendSnapTraceError(error, environment = 'production') {
  try {
    await fetch('https://snaptrace-dashboard.vercel.app/api/v1/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: '${key}',
        message: error.message || String(error),
        stackTrace: error.stack || null,
        environment: environment,
        url: typeof window !== 'undefined' ? window.location.href : 'Server-side',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js Runtime'
      })
    });
  } catch (err) {
    console.error('SnapTrace Telemetry Dispatch Failed:', err);
  }
}

// Example Usage
try {
  throw new Error('Database connection timeout in payment gateway');
} catch (err) {
  sendSnapTraceError(err, 'production');
}`,
    },
    python: {
      name: 'Python',
      icon: '🐍',
      installCmd: 'pip install requests',
      guide: [
        'Ensure the `requests` library is installed in your Python environment.',
        'Catch exceptions in your FastAPI, Django, Flask, or script functions.',
        'Pass `sys.exc_info()` or `traceback.format_exc()` to include stack traces.',
      ],
      code: (key) => `# SnapTrace Error Telemetry Handler for Python
import requests
import traceback
import sys

def send_snaptrace_error(exception, environment="production", url="http://localhost"):
    payload = {
        "apiKey": "${key}",
        "message": str(exception),
        "stackTrace": traceback.format_exc(),
        "environment": environment,
        "url": url,
        "userAgent": f"Python {sys.version.split()[0]}"
    }
    
    try:
        response = requests.post(
            "https://snaptrace-dashboard.vercel.app/api/v1/log",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to dispatch SnapTrace alert: {e}")
        return False

# Example Usage
try:
    result = 10 / 0
except Exception as e:
    send_snaptrace_error(e, environment="production", url="api/v1/checkout")`,
    },
    curl: {
      name: 'cURL / REST API',
      icon: '🌐',
      guide: [
        'Send raw JSON payloads directly to the SnapTrace ingestion endpoint via HTTP POST.',
        'Ideal for shell scripts, GitHub Actions, server status monitors, or backend cron jobs.',
        'No external SDK dependencies required.',
      ],
      code: (key) => `# Direct cURL Telemetry Payload Test
curl -X POST https://snaptrace-dashboard.vercel.app/api/v1/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${key}",
    "message": "Critical process crash on worker-01",
    "stackTrace": "ProcessExitedError: Signal SIGSEGV at address 0x00000008",
    "environment": "production",
    "url": "https://worker-01.internal/jobs",
    "userAgent": "cURL/7.68.0 Telemetry Client"
  }'`,
    },
    ruby: {
      name: 'Ruby',
      icon: '💎',
      installCmd: 'gem install net-http json',
      guide: [
        'Uses standard Ruby `net/http` and `json` libraries.',
        'Integrate into Rails rescue_from blocks or Sinatra error handlers.',
        'Captures backtraces via `exception.backtrace.join("\\n")`.',
      ],
      code: (key) => `# SnapTrace Ruby Exception Handler
require 'net/http'
require 'uri'
require 'json'

def send_snaptrace_error(exception, environment = 'production')
  uri = URI.parse('https://snaptrace-dashboard.vercel.app/api/v1/log')
  header = { 'Content-Type': 'application/json' }
  
  body = {
    apiKey: '${key}',
    message: exception.message,
    stackTrace: exception.backtrace ? exception.backtrace.join("\n") : nil,
    environment: environment,
    url: 'Ruby Backend Service',
    userAgent: "Ruby #{RUBY_VERSION}"
  }

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  
  request = Net::HTTP::Post.new(uri.request_uri, header)
  request.body = body.to_json
  
  http.request(request)
rescue => e
  puts "SnapTrace dispatch error: #{e.message}"
end

# Example Usage
begin
  raise "Order processing failed due to insufficient inventory"
rescue => e
  send_snaptrace_error(e, 'production')
end`,
    },
    kotlin: {
      name: 'Kotlin / Android',
      icon: '🟪',
      installCmd: 'implementation("com.squareup.okhttp3:okhttp:4.12.0")',
      guide: [
        'Add OkHttp or Ktor client to your Android / Kotlin project dependencies.',
        'Call the dispatcher inside global UncaughtExceptionHandler or coroutine exception handlers.',
        'Ensure internet permissions are added in `AndroidManifest.xml`.',
      ],
      code: (key) => `// SnapTrace Kotlin Error Reporter
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.StringWriter
import java.io.PrintWriter

fun sendSnapTraceError(exception: Throwable, environment: String = "production") {
    val client = OkHttpClient()
    val sw = StringWriter()
    exception.printStackTrace(PrintWriter(sw))

    val jsonPayload = JSONObject().apply {
        put("apiKey", "${key}")
        put("message", exception.message ?: "Unknown Kotlin Exception")
        put("stackTrace", sw.toString())
        put("environment", environment)
        put("url", "Android Native App")
        put("userAgent", "Kotlin/${KotlinVersion.CURRENT}")
    }

    val body = jsonPayload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
    val request = Request.Builder()
        .url("https://snaptrace-dashboard.vercel.app/api/v1/log")
        .post(body)
        .build()

    Thread {
        try {
            client.newCall(request).execute()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }.start()
}`,
    },
    php: {
      name: 'PHP',
      icon: '🐘',
      installCmd: 'extension=curl # Ensure cURL extension is enabled in php.ini',
      guide: [
        'Uses standard PHP cURL functionality.',
        'Integrate into custom exception handlers via `set_exception_handler()`.',
        'Works across Laravel, Symfony, WordPress, and custom PHP apps.',
      ],
      code: (key) => `<?php
// SnapTrace Telemetry Handler for PHP
function sendSnapTraceError(Throwable $exception, $environment = 'production') {
    $url = 'https://snaptrace-dashboard.vercel.app/api/v1/log';
    
    $payload = [
        'apiKey' => '${key}',
        'message' => $exception->getMessage(),
        'stackTrace' => $exception->getTraceAsString(),
        'environment' => $environment,
        'url' => $_SERVER['REQUEST_URI'] ?? 'CLI / Background Job',
        'userAgent' => $_SERVER['HTTP_USER_AGENT'] ?? ('PHP ' . PHP_VERSION)
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $response = curl_exec($ch);
    curl_close($ch);
    return $response;
}

// Example Usage
try {
    throw new Exception("SQLSTATE[HY000] [2002] Connection refused");
} catch (Throwable $e) {
    sendSnapTraceError($e, 'production');
}
?>`,
    },
  };

  const handleCopy = () => {
    const textToCopy = integrations[activeTab].code(apiKey);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Language Integrations</h1>
          <p className="text-sm text-slate-400 mt-1">
            Copy production-ready telemetry snippets and SDK code for your stack.
          </p>
        </div>

        {/* API Key Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">
              Active Project API Key
            </span>
            <p className="text-xs text-slate-400">
              Snippets below are pre-configured with your account key.
            </p>
          </div>
          <code className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs text-purple-300 truncate max-w-md">
            {loading ? 'Fetching API Key...' : apiKey}
          </code>
        </div>

        {/* Tabs & Code Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Language Selector Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3 px-1">
              Select Language
            </span>
            {(Object.keys(integrations) as LanguageKey[]).map((lang) => {
              const item = integrations[lang];
              const isActive = activeTab === lang;
              return (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-medium transition text-left ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-md'
                      : 'bg-slate-900 text-slate-400 border border-slate-800/80 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="font-semibold">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Snippet Display Box */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{integrations[activeTab].icon}</span>
                  <h2 className="text-lg font-bold text-white">
                    {integrations[activeTab].name} Integration Setup
                  </h2>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-2 shadow-lg"
                >
                  <span>{copied ? '✓ Copied to Clipboard' : '📋 Copy Snippet'}</span>
                </button>
              </div>

              {/* Package installation command */}
              {integrations[activeTab].installCmd && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Installation / Requirements
                  </span>
                  <pre className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                    {integrations[activeTab].installCmd}
                  </pre>
                </div>
              )}

              {/* Step-by-step Setup Guide */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Integration Guide
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800/60">
                  {integrations[activeTab].guide.map((step, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-purple-400 font-bold">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code Editor Preview */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Production Code Snippet
                </span>
                <div className="relative">
                  <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-purple-200 overflow-x-auto leading-relaxed max-h-[400px]">
                    {integrations[activeTab].code(apiKey)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <span className="text-[11px] text-slate-500">
                Endpoint: <code className="text-slate-400">POST /api/v1/log</code>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}