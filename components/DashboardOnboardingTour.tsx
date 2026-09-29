'use client';

import { useState, useEffect, useCallback } from 'react';

interface SpotlightStep {
  targetId: string;
  title: string;
  badge: string;
  description: string;
  icon: string;
}

export default function DashboardOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps: SpotlightStep[] = [
    {
      targetId: 'tour-project-switcher',
      badge: 'Step 1 of 5 • Projects',
      icon: '📁',
      title: 'Global Project Switcher',
      description: 'Switch between specific apps or choose "All Projects" to view your combined crash telemetry stream across all your services.',
    },
    {
      targetId: 'tour-nav-errors',
      badge: 'Step 2 of 5 • Live Stream',
      icon: '🚨',
      title: 'Exception Logs & Triage',
      description: 'All unhandled exceptions appear here in real time. Search error text, filter by environment, or mark fixed bugs as resolved.',
    },
    {
      targetId: 'tour-nav-integrations',
      badge: 'Step 3 of 5 • SDK & AI Setup',
      icon: '⚡',
      title: 'Language Integration & AI Install Hub',
      description: 'Copy our 1-prompt "Install with AI" text for Cursor and Claude Code, or grab drop-in snippets for Next.js, Python, Node.js, and cURL with your live API key pre-injected.',
    },
    {
      targetId: 'tour-nav-settings',
      badge: 'Step 4 of 5 • Alerts & AI',
      icon: '⚙️',
      title: 'Alert Channels & AI Copilot',
      description: 'Configure your Discord webhook and email notifications. Add your OpenAI key to unlock in-dashboard AI root-cause fixes.',
    },
    {
      targetId: 'tour-header-actions',
      badge: 'Step 5 of 5 • Real-Time Engine',
      icon: '💡',
      title: 'Feedback & Live Ingestion',
      description: 'Check your real-time connection status here or click the Feedback button anytime to share feature requests directly with the builder!',
    },
  ];

  // Calculate coordinates of target UI element
  const updatePosition = useCallback(() => {
    if (!isOpen) return;
    const current = steps[currentStep];
    const el = document.getElementById(current.targetId);

    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen, steps]);

  useEffect(() => {
    const tourDone = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_tour_completed') : null;
    if (!tourDone) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }

    const handleReplay = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };

    window.addEventListener('snaptrace_replay_tour', handleReplay);
    return () => window.removeEventListener('snaptrace_replay_tour', handleReplay);
  }, []);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('snaptrace_tour_completed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const current = steps[currentStep];

  // Calculate popover positioning near the element
  const getPopoverStyle = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const isHeaderItem = current.targetId === 'tour-header-actions';
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      return {
        bottom: '24px',
        left: '16px',
        right: '16px',
      };
    }

    if (isHeaderItem) {
      return {
        top: `${targetRect.bottom + 14}px`,
        left: `${Math.max(16, targetRect.right - 340)}px`,
      };
    }

    // Sidebar items (popover appears to the right of the sidebar item)
    return {
      top: `${Math.max(16, Math.min(window.innerHeight - 240, targetRect.top - 10))}px`,
      left: `${targetRect.right + 16}px`,
    };
  };

  return (
    <>
      {/* 1. Backdrop */}
      <div
        onClick={handleComplete}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 transition-opacity duration-300"
      />

      {/* 2. Sleek Spotlight Ring on the Active Target Element */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
          className="fixed z-50 pointer-events-none rounded-xl border-2 border-zinc-400/90 shadow-[0_0_20px_rgba(255,255,255,0.12)] ring-4 ring-zinc-500/20 transition-all duration-300 ease-out"
        />
      )}

      {/* 3. Anchored Compact Tooltip Card */}
      <div
        style={getPopoverStyle()}
        className="fixed z-50 w-full max-w-[340px] bg-zinc-950/95 border border-zinc-800 rounded-xl p-5 space-y-4 shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 font-sans"
      >
        {/* Card Header with Skip Button */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-sm p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200">
              {current.icon}
            </span>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 font-mono block">
                {current.badge}
              </span>
              <h3 className="text-xs font-semibold text-zinc-100 tracking-tight">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 px-2 py-0.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition cursor-pointer font-mono"
            title="Dismiss tour"
          >
            Skip
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          {current.description}
        </p>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
          
          {/* Step Dots */}
          <div className="flex items-center space-x-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-4 bg-zinc-100' : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs rounded-lg transition cursor-pointer"
            >
              {currentStep === steps.length - 1 ? 'Got it! 🎉' : 'Next →'}
            </button>
          </div>

        </div>

      </div>
    </>
  );
}