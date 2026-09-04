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
      badge: 'Step 3 of 5 • SDK Snippets',
      icon: '⚡',
      title: 'Language Integration Hub',
      description: 'Copy drop-in setup code for Next.js, Python, Node.js, PHP, Ruby, Kotlin, and cURL with your live project API key pre-injected.',
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
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 transition-opacity duration-300"
      />

      {/* 2. Glowing Yellow Spotlight Ring on the Active Target Element */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
          className="fixed z-50 pointer-events-none rounded-2xl border-2 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.45)] transition-all duration-300 ease-out"
        />
      )}

      {/* 3. Anchored Compact Tooltip Card */}
      <div
        style={getPopoverStyle()}
        className="fixed z-50 w-full max-w-[340px] bg-[#090D16]/95 border-2 border-yellow-400/50 rounded-3xl p-5 space-y-4 shadow-2xl shadow-yellow-500/20 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 font-sans"
      >
        {/* Card Header with Skip Button */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base p-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-yellow-400">
              {current.icon}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 font-mono block">
                {current.badge}
              </span>
              <h3 className="text-xs font-bold text-white tracking-tight">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss tour"
          >
            Skip
          </button>
        </div>

        {/* Description */}
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {current.description}
        </p>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          
          {/* Step Dots */}
          <div className="flex items-center space-x-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-4 bg-yellow-400' : 'w-1.5 bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-yellow-500/20 cursor-pointer"
            >
              {currentStep === steps.length - 1 ? 'Got it! 🎉' : 'Next →'}
            </button>
          </div>

        </div>

      </div>
    </>
  );
}