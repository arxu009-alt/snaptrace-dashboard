'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  sender: 'snappy' | 'user';
  text: string;
}

export default function SnappyAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dragging state
  // Position stores { x, y } in pixels from top-left, or null for default bottom-right placement
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
  });

  // Docked / minimized side state ('right' | 'left')
  const [dockedSide, setDockedSide] = useState<'right' | 'left'>('right');
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-hide inactivity timer (4 seconds)
  const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
    }
    // Only auto-hide if chat window is NOT currently open
    if (!isOpen) {
      autoHideTimerRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 4000);
    }
  }, [isOpen]);

  // When isOpen changes, clear or restart timer
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    } else {
      resetAutoHideTimer();
    }
    return () => {
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [isOpen, resetAutoHideTimer]);

  // Initialize position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultX = Math.max(20, window.innerWidth - 80);
      const defaultY = Math.max(20, window.innerHeight - 88);
      setPosition({ x: defaultX, y: defaultY });
    }
    resetAutoHideTimer();
  }, [resetAutoHideTimer]);

  // Handle window resize to clamp within screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const buttonWidth = 56;
        const buttonHeight = 56;
        const maxX = window.innerWidth - buttonWidth - 10;
        const maxY = window.innerHeight - buttonHeight - 10;
        const clampedX = Math.min(Math.max(10, prev.x), maxX);
        const clampedY = Math.min(Math.max(10, prev.y), maxY);
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initialGreeting: Message = {
    sender: 'snappy',
    text: "⚡ Hi! I'm Snappy, your SnapTrace AI copilot. Ask me anything about setting up SDKs, the Incident Velocity graph, Discord alerts, or using BYOK AI!",
  };

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);

  // Auto-scroll to bottom on every new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Knowledge Base
  const knowledgeBase = [
    {
      keywords: ['hi', 'hello', 'hey', 'how are you', 'how r u', 'who are you', 'what is snappy'],
      answer: "⚡ I'm doing great and ready to assist! I'm Snappy, your in-app telemetry assistant. I know everything about your SnapTrace dashboard, SDK installations, alert channels, and incident analysis.",
    },
    {
      keywords: ['velocity', 'pulse', 'graph', 'chart', 'bars', '12 hours', 'hourly', 'frequency'],
      answer: "📈 The Incident Velocity Pulse tracks error frequency over the last 12 hours. It breaks crashes into hourly buckets. When an error spikes right now, the rightmost bar ('Current Hour / Now') lights up in Snap Yellow so you immediately spot active server outages.",
    },
    {
      keywords: ['exception', 'logs', 'stream', 'triage', 'resolved', 'unresolved', 'mark as resolved', 'checkbox', 'inspect'],
      answer: "🚨 In Exception Logs: All runtime crashes stream live via WebSockets. Filter between Unresolved and Resolved tabs, click the checkbox on the left to mark a bug as fixed, or click 'Inspect' to see line-by-line stack frames and copy AI prompts for Cursor/Claude!",
    },
    {
      keywords: ['settings', 'discord', 'webhook', 'email', 'alert', 'notification', 'test alert', 'purge'],
      answer: "⚙️ In Settings: Enter your Discord Webhook URL and Alert Email, then click 'Save Notification Channels'. You can click the '🧪 Send Test Alert' button anytime to test your channels without terminal commands, or use 'Purge Resolved Logs' to clean your database.",
    },
    {
      keywords: ['ai', 'byok', 'openai', 'claude', 'cursor', 'prompt', 'code fix', 'analyze with ai'],
      answer: "🤖 BYOK (Bring Your Own Key) AI: Add your OpenAI or Anthropic API key in Settings. Then on any error in Exception Logs, click 'Inspect' and hit '✨ Analyze with AI' for an instant root-cause explanation and code fix, or click '📋 Copy for Cursor / AI' to export a ready-to-paste prompt!",
    },
    {
      keywords: ['pii', 'password', 'privacy', 'credit card', 'firewall', 'token', 'gdpr', 'scrub'],
      answer: "🔒 Zero-Trust PII Firewall: Passwords (password=...), auth tokens (apiKey=...), emails, and credit cards are scrubbed directly on the user's browser before telemetry payloads ever touch our servers.",
    },
    {
      keywords: ['loop', 'noise', 'spam', 'throttle', 'dedup', 'x50', 'x500', 'deduplication'],
      answer: "🔇 Noise Deduplication: If a broken React loop or failing database throws 500 errors in 10 seconds, SnapTrace sends the 1st crash instantly, drops the duplicate spam, and delivers 1 clean summary alert tagged [x500].",
    },
    {
      keywords: ['project', 'api key', 'token', 'create project', 'delete project', 'sk_live', 'credentials'],
      answer: "📁 In API Keys & Projects: Create separate projects for different apps (e.g., Next.js Web App vs Python Backend). Each gets a unique sk_live_... key. Click the event badge to jump straight to filtered logs for that project!",
    },
    {
      keywords: ['test', 'playground', 'simulate', 'trigger crash', 'demo', 'simulation'],
      answer: "🧪 Test Playground: Click '🧪 Open Test Playground' in Overview Quick Actions (or visit /test) to simulate synchronous crashes, async promise rejections, fake PII leaks, and 50x loop floods live with 1 click!",
    },
    {
      keywords: ['languages', 'python', 'nextjs', 'node', 'php', 'ruby', 'kotlin', 'curl', 'html', 'sdk'],
      answer: "💻 Supported Stacks: Open the 'Language Integrations' tab in the sidebar to get pre-configured, copy-paste snippets for Next.js App Router, JavaScript, Python, Node.js, PHP, Ruby, Kotlin, and direct cURL APIs with your live key injected.",
    },
    {
      keywords: ['price', 'pricing', 'plan', 'free', 'pro', '$19', '$49', 'cost', 'subscription'],
      answer: "💎 Plans: 1. Developer Free ($0/mo - 2,000 events, 1 project, Cursor/Claude AI prompts), 2. Pro Builder ($19/mo - 75,000 events, 5 projects, Discord/Slack alerts), and 3. Agency Studio ($49/mo - 500,000 events, unlimited projects).",
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
            text: "I can help with: 1. Next.js/Python SDK setup, 2. Incident Velocity graph, 3. Discord & Email alerts, 4. BYOK AI & Cursor prompts, 5. Noise deduplication, or 6. Pricing plans. Try asking about any of those!",
          },
        ]);
      }
    }, 350);
  };

  const handleResetChat = () => {
    setMessages([initialGreeting]);
  };

  // --- DRAGGING & CURSOR HANDLERS ---
  const handlePointerDown = (e: React.PointerEvent) => {
    // If chat window is open, let the user interact normally or close
    const target = e.target as HTMLElement;
    if (target.closest('input') || target.closest('textarea') || target.closest('button.chat-control')) {
      return;
    }

    setIsDragging(true);
    setIsMinimized(false);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);

    const currentX = position?.x ?? (window.innerWidth - 80);
    const currentY = position?.y ?? (window.innerHeight - 88);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      hasMoved: false,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.hasMoved = true;
    }

    const buttonWidth = 56;
    const buttonHeight = 56;
    const newX = Math.min(Math.max(8, dragRef.current.initialX + deltaX), window.innerWidth - buttonWidth - 8);
    const newY = Math.min(Math.max(8, dragRef.current.initialY + deltaY), window.innerHeight - buttonHeight - 8);

    setPosition({ x: newX, y: newY });

    // Update docked side based on nearest edge
    if (newX < window.innerWidth / 2) {
      setDockedSide('left');
    } else {
      setDockedSide('right');
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }

    // If it was just a click (not a drag), toggle open/close
    if (!dragRef.current.hasMoved) {
      setIsOpen((prev) => !prev);
    } else {
      // Snapped / released: start auto-hide countdown if closed
      resetAutoHideTimer();
    }
  };

  // When hovering on minimized pill, wake it up
  const handleMouseEnter = () => {
    setIsMinimized(false);
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current);
  };

  const handleMouseLeave = () => {
    if (!isOpen) {
      resetAutoHideTimer();
    }
  };

  // Compute transform when minimized into edge
  const getDockedTransform = () => {
    if (!isMinimized) return 'translate(0, 0)';
    return dockedSide === 'right' ? 'translate(36px, 0)' : 'translate(-36px, 0)';
  };

  // Compute chat window popup position relative to current button position
  const getChatWindowStyle = () => {
    if (!position) return { bottom: '96px', right: '24px' };

    const buttonX = position.x;
    const buttonY = position.y;
    const chatWidth = 360;
    const chatHeight = 440;

    // Prefer above the button, clamp inside viewport
    let top = buttonY - chatHeight - 12;
    if (top < 16) {
      top = Math.min(buttonY + 68, window.innerHeight - chatHeight - 16);
    }

    let left = buttonX - chatWidth + 56;
    if (dockedSide === 'left') {
      left = buttonX;
    }
    // Clamp horizontal
    left = Math.max(16, Math.min(left, window.innerWidth - chatWidth - 16));

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  return (
    <>
      {/* Moveable & Auto-Hideable Floating Button */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'fixed',
          left: position ? `${position.x}px` : 'auto',
          top: position ? `${position.y}px` : 'auto',
          right: position ? 'auto' : '24px',
          bottom: position ? 'auto' : '24px',
          transform: getDockedTransform(),
          touchAction: 'none',
        }}
        className={`z-50 select-none transition-transform duration-300 ease-out group ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
        }`}
      >
        {/* Tooltip on Hover */}
        {!isDragging && !isOpen && (
          <div
            className={`absolute top-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#090D16] border border-yellow-400/40 text-yellow-300 text-[11px] font-bold font-mono px-3 py-1 rounded-xl shadow-2xl whitespace-nowrap ${
              dockedSide === 'right' ? 'right-16' : 'left-16'
            }`}
          >
            {isMinimized ? 'Click to show Snappy' : '⚡ Drag or Click Snappy'}
          </div>
        )}

        <button
          type="button"
          aria-label="Snappy AI Copilot"
          className={`relative h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1c2333] via-[#0e1424] to-[#060911] border-2 text-yellow-400 flex items-center justify-center font-black shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'border-yellow-300 shadow-yellow-500/40'
              : isMinimized
              ? 'border-yellow-400/50 opacity-60 hover:opacity-100 hover:border-yellow-400 shadow-yellow-500/20'
              : 'border-yellow-400 shadow-yellow-500/25 hover:scale-105'
          }`}
          title="Drag anywhere or click to chat with Snappy"
        >
          {/* Active Emerald Pulse Dot */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#05070E]" />
          </span>

          {isOpen ? (
            <span className="text-white text-base font-mono font-bold pointer-events-none">✕</span>
          ) : (
            <svg
              className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)] pointer-events-none"
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

          {/* Minimized Peek Indicator */}
          {isMinimized && !isOpen && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-mono font-black text-yellow-400 bg-yellow-400/20 px-1 py-0.5 rounded ${
                dockedSide === 'right' ? 'left-1' : 'right-1'
              }`}
            >
              {dockedSide === 'right' ? '◀' : '▶'}
            </span>
          )}
        </button>
      </div>

      {/* 2. Snappy Chat Window */}
      {isOpen && (
        <div
          style={getChatWindowStyle()}
          className="fixed z-50 w-[360px] max-w-[calc(100vw-32px)] bg-[#090D16] border-2 border-yellow-400/40 rounded-3xl shadow-2xl shadow-yellow-500/20 overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3.5 bg-[#060911] border-b border-slate-800 flex items-center justify-between cursor-default">
            <div className="flex items-center space-x-2.5">
              <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                ⚡
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Snappy AI Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[9.5px] text-slate-400 font-mono">Moveable Telemetry Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {messages.length > 1 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="chat-control text-[10px] text-slate-400 hover:text-yellow-300 px-2 py-1 bg-slate-800/80 rounded-lg transition"
                  title="Reset conversation"
                >
                  Clear ↺
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="chat-control text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Feed (Auto-Scrolling) */}
          <div className="p-3.5 space-y-3 max-h-[290px] overflow-y-auto text-xs leading-relaxed bg-[#05070E]/90 st-scroll">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-semibold shadow-md'
                      : 'bg-[#090D16] border border-slate-800 text-slate-200 shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-[#060911] border-t border-slate-800/80 flex flex-wrap gap-1.5">
              {[
                'Incident Velocity Pulse',
                'Connect Next.js SDK',
                'Setup Discord Alerts',
                'BYOK AI & Cursor',
                'Zero-Trust PII',
              ].map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAsk(chip)}
                  className="chat-control px-2 py-1 bg-[#090D16] hover:bg-slate-800 border border-slate-800 hover:border-yellow-400/30 rounded-lg text-[10px] text-yellow-300 font-medium transition cursor-pointer"
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
            className="p-2.5 bg-[#090D16] border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Snappy anything..."
              className="flex-1 bg-[#05070E] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition font-mono"
            />
            <button
              type="submit"
              className="chat-control px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}