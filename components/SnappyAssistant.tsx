'use client';

import { useState } from 'react';

interface Message {
  sender: 'snappy' | 'user';
  text: string;
}

export default function SnappyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'snappy',
      text: "⚡ Hi! I'm Snappy, your in-app telemetry copilot. Ask me anything about SDK setup, Discord alerts, or BYOK AI diagnostics!",
    },
  ]);

  const knowledgeBase = [
    {
      keywords: ['nextjs', 'next.js', 'react', 'app router'],
      answer: 'To install in Next.js: Open Language Integrations, copy the layout.tsx script tag, and paste it into your app/layout.tsx inside <head>. It will automatically catch client & server exceptions!',
    },
    {
      keywords: ['discord', 'webhook', 'email', 'alert', 'notification'],
      answer: 'To set up Discord alerts: Go to Settings & Alert Channels, paste your Discord Webhook URL, and click "Save Notification Channels". You can click "🧪 Send Test Alert" to verify it immediately!',
    },
    {
      keywords: ['pii', 'password', 'privacy', 'credit card'],
      answer: 'SnapTrace automatically strips passwords, credit cards, emails, and auth tokens on the client browser before the error payload is ever sent across the network.',
    },
    {
      keywords: ['ai', 'byok', 'openai', 'claude', 'cursor'],
      answer: 'Go to Settings, paste your OpenAI API key in the BYOK card, and click Save. Then in Exception Logs, click "Inspect" on any error and hit "✨ Analyze with AI" or "📋 Copy for Cursor" for an instant code fix!',
    },
    {
      keywords: ['loop', 'noise', 'spam', 'throttle', 'dedup'],
      answer: 'If an error throws in an infinite loop 500 times, SnapTrace sends the 1st error instantly, drops the duplicates, and sends a single summary count tag [x500] over 60 seconds.',
    },
  ];

  const handleAsk = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: Message = { sender: 'user', text: queryText };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    const q = queryText.toLowerCase();
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
            text: "I can help you with: 1. Next.js/Python SDK setup, 2. Discord Webhooks, 3. BYOK AI Configuration, and 4. Noise deduplication. Click one of the quick suggestions below!",
          },
        ]);
      }
    }, 400);
  };

  return (
    <>
      {/* 1. High-Contrast Snappy Copilot Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 group">
        
        {/* Floating Tooltip Hint on Hover */}
        <div className="absolute right-16 top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-[#090D16] border border-yellow-400/40 text-yellow-300 text-xs font-bold font-mono px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap">
          Ask Snappy AI ✨
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1c2333] via-[#0e1424] to-[#060911] border-2 border-yellow-400 text-yellow-400 flex items-center justify-center font-black shadow-2xl shadow-yellow-500/25 transition-all duration-300 transform hover:scale-110 cursor-pointer"
          title="Ask Snappy AI Copilot"
        >
          {/* Active Emerald Pulse Indicator */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#05070E]" />
          </span>

          {isOpen ? (
            <span className="text-white text-base">✕</span>
          ) : (
            /* High-Contrast AI Copilot Mascot Icon */
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
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-[370px] bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl shadow-2xl shadow-yellow-500/15 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
          
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
                <p className="text-[10px] text-slate-400 font-mono">SnapTrace Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-lg transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto text-xs leading-relaxed bg-[#05070E]/90">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-yellow-400 text-slate-950 font-bold shadow-md'
                      : 'bg-[#090D16] border border-slate-800 text-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick FAQ Chips */}
          <div className="px-3 py-2 bg-[#060911] border-t border-slate-800/80 flex flex-wrap gap-1.5">
            {[
              'How to connect Next.js?',
              'Setup Discord Alerts',
              'How BYOK AI works?',
              'What is PII Scrubbing?',
            ].map((chip, i) => (
              <button
                key={i}
                onClick={() => handleAsk(chip)}
                className="px-2.5 py-1 bg-[#090D16] hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-yellow-300 font-medium transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

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
              className="flex-1 bg-[#05070E] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </>
  );
}