'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  sender: 'snappy' | 'user';
  text: string;
}

export default function SnappyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: Message = {
    sender: 'snappy',
    text: "⚡ Hi! I'm Snappy, your SnapTrace AI copilot. Ask me anything about setting up SDKs, the Incident Velocity graph, Discord alerts, or using BYOK AI!",
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);

  // 1. Auto-scroll to bottom on every new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Comprehensive Knowledge Base
  const knowledgeBase = [
    // Greetings & Casual
    {
      keywords: ['hi', 'hello', 'hey', 'how are you', 'how r u', 'who are you', 'what is snappy'],
      answer: "⚡ I'm doing great and ready to assist! I'm Snappy, your in-app telemetry assistant. I know everything about your SnapTrace dashboard, SDK installations, alert channels, and incident analysis.",
    },
    // Incident Velocity Pulse
    {
      keywords: ['velocity', 'pulse', 'graph', 'chart', 'bars', '12 hours', 'hourly', 'frequency'],
      answer: "📈 The Incident Velocity Pulse tracks error frequency over the last 12 hours. It breaks crashes into hourly buckets. When an error spikes right now, the rightmost bar ('Current Hour / Now') lights up in Snap Yellow so you immediately spot active server outages.",
    },
    // Exception Logs & Triage
    {
      keywords: ['exception', 'logs', 'stream', 'triage', 'resolved', 'unresolved', 'mark as resolved', 'checkbox', 'inspect'],
      answer: "🚨 In Exception Logs: All runtime crashes stream live via WebSockets. Filter between Unresolved and Resolved tabs, click the checkbox on the left to mark a bug as fixed, or click 'Inspect' to see line-by-line stack frames and copy AI prompts for Cursor/Claude!",
    },
    // Settings, Alerts & Test Button
    {
      keywords: ['settings', 'discord', 'webhook', 'email', 'alert', 'notification', 'test alert', 'purge'],
      answer: "⚙️ In Settings: Enter your Discord Webhook URL and Alert Email, then click 'Save Notification Channels'. You can click the '🧪 Send Test Alert' button anytime to test your channels without terminal commands, or use 'Purge Resolved Logs' to clean your database.",
    },
    // BYOK AI & Cursor Prompts
    {
      keywords: ['ai', 'byok', 'openai', 'claude', 'cursor', 'prompt', 'code fix', 'analyze with ai'],
      answer: "🤖 BYOK (Bring Your Own Key) AI: Add your OpenAI API key in Settings. Then on any error in Exception Logs, click 'Inspect' and hit '✨ Analyze with AI' for an instant root-cause explanation and code fix, or click '📋 Copy for Cursor / AI' to export a ready-to-paste prompt!",
    },
    // PII Firewall & Privacy
    {
      keywords: ['pii', 'password', 'privacy', 'credit card', 'firewall', 'token', 'gdpr', 'scrub'],
      answer: "🔒 Zero-Trust PII Firewall: Passwords (password=...), auth tokens (apiKey=...), emails, and credit cards are scrubbed directly on the user's browser before telemetry payloads ever touch our servers.",
    },
    // Noise Deduplication
    {
      keywords: ['loop', 'noise', 'spam', 'throttle', 'dedup', 'x50', 'x500', 'deduplication'],
      answer: "🔇 Noise Deduplication: If a broken React loop or failing database throws 500 errors in 10 seconds, SnapTrace sends the 1st crash instantly, drops the duplicate spam, and delivers 1 clean summary alert tagged [x500].",
    },
    // Projects & API Keys
    {
      keywords: ['project', 'api key', 'token', 'create project', 'delete project', 'sk_live', 'credentials'],
      answer: "📁 In API Keys & Projects: Create separate projects for different apps (e.g., Next.js Web App vs Python Backend). Each gets a unique sk_live_... key. Click the event badge (e.g. '11 events →') to jump straight to filtered logs for that project!",
    },
    // Test Playground
    {
      keywords: ['test', 'playground', 'simulate', 'trigger crash', 'demo', 'simulation'],
      answer: "🧪 Test Playground: Click '🧪 Open Test Playground' in Overview Quick Actions (or visit /test) to simulate synchronous crashes, async promise rejections, fake PII leaks, and 50x loop floods live with 1 click!",
    },
    // Supported Languages
    {
      keywords: ['languages', 'python', 'nextjs', 'node', 'php', 'ruby', 'kotlin', 'curl', 'html', 'sdk'],
      answer: "💻 Supported Stacks: Open the 'Language Integrations' tab in the sidebar to get pre-configured, copy-paste snippets for Next.js App Router, JavaScript, Python, Node.js, PHP, Ruby, Kotlin, and direct cURL APIs with your live key injected.",
    },
    // Pricing
    {
      keywords: ['price', 'pricing', 'plan', 'free', 'pro', '$9', '$29', 'cost', 'subscription'],
      answer: "💎 Plans: 1. Developer Free ($0/mo - 10k events, Cursor prompt export), 2. Starter Pro ($9/mo - 150k events, In-Dashboard BYOK AI Copilot, unlimited projects), and 3. Team Scale ($29/mo - 1M events, 90-day retention, priority delivery).",
    },
  ];

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = { sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    const q = queryText.toLowerCase();

    // Match best answer
    const matched = knowledgeBase.find((item) =>
      item.keywords.some((kw) => q.includes(kw))
    );

    setTimeout(() => {
      if (matched) {
        setMessages((prev) => [...prev, { sender: 'snappy', text: matched.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'snappy',
            text: "I can help with: 1. Next.js/Python SDK setup, 2. Incident Velocity graph, 3. Discord & Email alerts, 4. BYOK AI & Cursor prompts, 5. Noise deduplication, or 6. Pricing plans. Try asking about any of those!",
          },
        ]);
      }
    }, 350);
  };

  const handleResetChat = () => {
    setMessages([initialGreeting]);
  };

  return (
    <>
      {/* 1. High-Contrast Snappy Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        <div className="absolute right-16 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-[#090D16] border border-yellow-400/40 text-yellow-300 text-xs font-bold font-mono px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
          Ask Snappy AI ✨
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1c2333] via-[#0e1424] to-[#060911] border-2 border-yellow-400 text-yellow-400 flex items-center justify-center font-black shadow-2xl shadow-yellow-500/25 transition-all duration-300 transform hover:scale-110 cursor-pointer"
          title="Ask Snappy AI Copilot"
        >
          {/* Active Emerald Pulse Dot */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#05070E]" />
          </span>

          {isOpen ? (
            <span className="text-white text-base font-mono font-bold">✕</span>
          ) : (
            <svg
              className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" fill="#090D16" />
              <circle cx="12" cy="5" r="2" fill="#FACC15" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" strokeWidth="3" stroke="#FACC15" />
              <line x1="16" y1="16" x2="16" y2="16.01" strokeWidth="3" stroke="#FACC15" />
              <path d="M9 19h6" stroke="#10B981" />
            </svg>
          )}
        </button>
      </div>

      {/* 2. Snappy Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl shadow-2xl shadow-yellow-500/15 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 bg-[#060911] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Snappy AI Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">SnapTrace Knowledge Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {messages.length > 1 && (
                <button
                  onClick={handleResetChat}
                  className="text-[10px] text-slate-400 hover:text-yellow-300 px-2 py-1 bg-slate-800/80 rounded-lg transition"
                  title="Reset conversation"
                >
                  Clear ↺
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Feed (Auto-Scrolling) */}
          <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto text-xs leading-relaxed bg-[#05070E]/90">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-bold shadow-md'
                      : 'bg-[#090D16] border border-slate-800 text-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Smart FAQ Chips (Hides automatically once user starts chatting) */}
          {messages.length <= 1 && (
            <div className="px-3.5 py-2.5 bg-[#060911] border-t border-slate-800/80 flex flex-wrap gap-1.5 animate-in fade-in">
              {[
                'How does Velocity Pulse work?',
                'How to connect Next.js?',
                'Setup Discord Alerts',
                'How BYOK AI works?',
                'What is PII Scrubbing?',
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(chip)}
                  className="px-2.5 py-1 bg-[#090D16] hover:bg-slate-800 border border-slate-800 hover:border-yellow-400/30 rounded-lg text-[10px] text-yellow-300 font-medium transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(inputQuery);
            }}
            className="p-3 bg-[#090D16] border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Snappy anything..."
              className="flex-1 bg-[#05070E] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </>
  );
}