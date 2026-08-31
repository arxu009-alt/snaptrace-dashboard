'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
}

type Language = 'nextjs' | 'js' | 'python' | 'kotlin' | 'ruby' | 'curl';

export default function ProjectsPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [selectedLang, setSelectedLang] = useState<Language>('nextjs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProject() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1)
        .single();

      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    }
    fetchProject();
  }, []);

  const apiKey = project?.api_key || 'sk_live_iuog5ef58kgz0j57u3ncj';

  const snippets: Record<Language, string> = {
    nextjs: `// Next.js App Router (app/api/example/route.ts or catch block)
try {
  // Your code here
} catch (error: any) {
  await fetch('https://snaptrace-dashboard.vercel.app/api/v1/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: '${apiKey}',
      message: error.message || 'Unhandled Next.js Exception',
      stack: error.stack || '',
      environment: process.env.NODE_ENV || 'production',
      url: typeof window !== 'undefined' ? window.location.href : 'Server Side',
    }),
  });
}`,
    js: `<!-- HTML / Vanilla JavaScript Global Listener -->
<script>
window.addEventListener('error', (event) => {
  fetch('https://snaptrace-dashboard.vercel.app/api/v1/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: '${apiKey}',
      message: event.message || 'Browser Error',
      stack: event.error ? event.error.stack : '',
      environment: 'production',
      url: window.location.href,
    }),
  });
});
</script>`,
    python: `# Python 3 Integration (using requests)
import requests
import traceback

def log_snaptrace_error(error, environment="production"):
    url = "https://snaptrace-dashboard.vercel.app/api/v1/ingest"
    payload = {
        "api_key": "${apiKey}",
        "message": str(error),
        "stack": traceback.format_exc(),
        "environment": environment,
        "url": "Python Service"
    }
    try:
        requests.post(url, json=payload, timeout=5)
    except Exception as e:
        print("SnapTrace logging failed:", e)

# Example Usage:
try:
    result = 10 / 0
except Exception as e:
    log_snaptrace_error(e)`,
    kotlin: `// Kotlin / Android HTTP Ingestion (OkHttp)
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

fun reportErrorToSnapTrace(errorMessage: String, stackTrace: String) {
    val client = OkHttpClient()
    val json = JSONObject().apply {
        put("api_key", "${apiKey}")
        put("message", errorMessage)
        put("stack", stackTrace)
        put("environment", "production")
        put("url", "Kotlin Client App")
    }
    val body = json.toString().toRequestBody("application/json".toMediaType())
    val request = Request.Builder()
        .url("https://snaptrace-dashboard.vercel.app/api/v1/ingest")
        .post(body)
        .build()
    
    client.newCall(request).execute()
}`,
    ruby: `# Ruby Standard Library Integration
require 'net/http'
require 'uri'
require 'json'

def send_snaptrace_error(exception)
  uri = URI.parse('https://snaptrace-dashboard.vercel.app/api/v1/ingest')
  header = { 'Content-Type': 'application/json' }
  payload = {
    api_key: '${apiKey}',
    message: exception.message,
    stack: exception.backtrace&.join("\n"),
    environment: ENV['RUBY_ENV'] || 'production',
    url: 'Ruby Backend'
  }

  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  request = Net::HTTP::Post.new(uri.request_uri, header)
  request.body = payload.to_json
  http.request(request)
rescue StandardError => e
  puts "SnapTrace dispatch error: #{e.message}"
end`,
    curl: `# cURL Command Line Integration Test
curl -X POST https://snaptrace-dashboard.vercel.app/api/v1/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${apiKey}",
    "message": "Manual cURL Test Exception",
    "stack": "Error: CLI execution\\n    at main (cli.sh:1:1)",
    "environment": "development",
    "url": "Terminal CLI"
  }'`
  };

  const guides: Record<Language, string[]> = {
    nextjs: [
      'Copy the snippet above into your API route handlers or global error boundaries.',
      'Ensure the api_key value matches your project credentials.',
      'Deploy your Next.js application; caught exceptions will automatically stream to SnapTrace.'
    ],
    js: [
      'Paste the script block inside the <head> tag of your HTML documents.',
      'The window.onerror listener automatically captures unhandled JavaScript exceptions.',
      'Ensure standard network requests to external domains are allowed by your CSP headers.'
    ],
    python: [
      'Install the HTTP library if missing: pip install requests.',
      'Wrap critical application modules inside standard try...except blocks.',
      'Call log_snaptrace_error(e) inside exception handlers to forward stack traces.'
    ],
    kotlin: [
      'Add OkHttp dependency implementation("com.squareup.okhttp3:okhttp:4.12.0") to build.gradle.',
      'Ensure Internet permission is present in AndroidManifest.xml (<uses-permission android:name="android.permission.INTERNET" />).',
      'Execute reportErrorToSnapTrace on background coroutine workers to avoid blocking the main UI thread.'
    ],
    ruby: [
      'Include the helper method in your central application module or Rails rescue_from controller blocks.',
      'Net::HTTP is built into Ruby standard library; no external gem installation is required.',
      'Errors captured during script execution will forward directly to your error stream.'
    ],
    curl: [
      'Open your terminal or command line prompt.',
      'Paste the cURL command directly into your console and hit Enter.',
      'Check the Exception Logs tab to verify immediate telemetry delivery.'
    ]
  };

  const copyToClipboard = (text: string, type: 'key' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const languages: { key: Language; label: string }[] = [
    { key: 'nextjs', label: 'Next.js / Node' },
    { key: 'js', label: 'Browser JS / HTML' },
    { key: 'python', label: 'Python' },
    { key: 'kotlin', label: 'Kotlin' },
    { key: 'ruby', label: 'Ruby' },
    { key: 'curl', label: 'cURL CLI' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">Projects & API Keys</h1>
          <p className="text-sm text-slate-400">Manage your credentials and integrate SnapTrace across any programming environment.</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading project configuration...</div>
        ) : (
          <>
            {/* API Key Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-white">{project?.name || 'Default Project'}</h2>
                  <p className="text-xs text-slate-400">Active API key for event ingestion</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 p-3 rounded-lg">
                <code className="text-xs font-mono text-purple-400 flex-1 truncate">
                  {apiKey}
                </code>
                <button
                  onClick={() => copyToClipboard(apiKey, 'key')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium rounded transition"
                >
                  {copiedKey ? 'Copied!' : 'Copy Key'}
                </button>
              </div>
            </div>

            {/* Quickstart Snippet Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Integration Setup</h2>
                  <p className="text-xs text-slate-400">Select your environment language to view code snippets and setup instructions</p>
                </div>
                
                {/* Language Switcher Tabs */}
                <div className="flex flex-wrap bg-slate-950 border border-slate-800 p-1 rounded-lg gap-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.key}
                      onClick={() => setSelectedLang(lang.key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                        selectedLang === lang.key
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="relative">
                <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
                  {snippets[selectedLang]}
                </pre>
                <button
                  onClick={() => copyToClipboard(snippets[selectedLang], 'snippet')}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium rounded transition"
                >
                  {copiedSnippet ? 'Copied Snippet!' : 'Copy Snippet'}
                </button>
              </div>

              {/* Integration Guide */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">Integration Guide: {languages.find(l => l.key === selectedLang)?.label}</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
                  {guides[selectedLang].map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="text-slate-200 font-medium">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* HTML/CSS Notice Box */}
              <div className="p-4 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs text-purple-300 space-y-1">
                <p className="font-semibold text-purple-200">💡 HTML & CSS Integration Notice</p>
                <p className="leading-relaxed text-purple-300/80">
                  CSS is a presentation language and cannot perform HTTP requests directly. To track errors on static HTML/CSS sites, embed the Browser JS script block inside your main HTML file before any other script executions.
                </p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}