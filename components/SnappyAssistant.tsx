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
      text: "⚡ Hi! I'm Snappy, your in-app telemetry copilot. Ask me anything about setting up SDKs, configuring Discord alerts, or using BYOK AI!",
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

    // Answer matching
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
      {/* 1. Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-13 w-13 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-2xl shadow-yellow-500/30 transition transform hover:scale-105 cursor-pointer border-2 border-yellow-300/80"
          title="Ask Snappy AI"
        >
          {isOpen ? '✕' : '⚡'}
        </button>
      </div>

      {/* 2. Snappy Chat Window */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-full max-w-[360px] bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl shadow-2xl shadow-yellow-500/15 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="p-4 bg-[#060911] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Snappy AI Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">SnapTrace In-App Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto text-xs leading-relaxed bg-[#05070E]/80">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-yellow-400 text-slate-950 font-semibold'
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
              className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </>
  );
}