'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TourStep {
  title: string;
  badge: string;
  description: string;
  highlightIcon: string;
  actionHint?: string;
  targetLink?: string;
}

export default function DashboardOnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      title: 'Welcome to SnapTrace Telemetry!',
      badge: 'Step 1 of 5 • Overview',
      highlightIcon: '⚡',
      description:
        'Your central hub for monitoring live application crashes, 12-hour error velocity pulses, and incident frequency in real time with zero noise.',
      actionHint: 'Look at the Overview cards to see your total captured errors and active noise suppression.',
    },
    {
      title: 'Exception Stream & Live Triage',
      badge: 'Step 2 of 5 • Exception Logs',
      highlightIcon: '🚨',
      description:
        'All incoming crashes stream here over live WebSockets. Filter between Unresolved and Resolved, search error messages, and click the checkbox to mark bugs as fixed.',
      actionHint: 'Click "Inspect" on any error to see line-by-line stack frames or copy AI prompts for Cursor.',
      targetLink: '/dashboard/errors',
    },
    {
      title: 'Multi-Language SDK Snippets',
      badge: 'Step 3 of 5 • Integrations',
      highlightIcon: '💻',
      description:
        'Ready-to-use drop-in code snippets for JavaScript, Next.js App Router, Python, Node.js, PHP, Ruby, Kotlin, and cURL with your live API keys injected.',
      actionHint: 'Install our <5KB SDK in under 60 seconds with zero dependencies.',
      targetLink: '/dashboard/integrations',
    },
    {
      title: 'Discord & Email Alert Channels',
      badge: 'Step 4 of 5 • Settings',
      highlightIcon: '🔔',
      description:
        'Configure your Discord webhook URL and alert email. Use the "🧪 Send Test Alert" button inside Settings to verify your alerts instantly.',
      actionHint: 'You can also add your OpenAI API key here to unlock in-dashboard AI bug fixes.',
      targetLink: '/dashboard/settings',
    },
    {
      title: 'Multi-Project Management',
      badge: 'Step 5 of 5 • Projects',
      highlightIcon: '📁',
      description:
        'Create separate projects for each of your apps (e.g. Next.js Frontend, Python API). Use the Project Switcher in the sidebar to toggle views anytime!',
      actionHint: 'You are now ready to catch crashes in a snap. Happy debugging!',
      targetLink: '/dashboard/projects',
    },
  ];

  useEffect(() => {
    // Check if user has already seen the tour
    const tourDone = typeof window !== 'undefined' ? localStorage.getItem('snaptrace_tour_completed') : null;
    if (!tourDone) {
      // Small delay for smooth entry animation on first load
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }

    // Listen for manual replay events
    const handleReplay = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    window.addEventListener('snaptrace_replay_tour', handleReplay);
    return () => window.removeEventListener('snaptrace_replay_tour', handleReplay);
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
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

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans">
      {/* Translucent Light Yellow Glassmorphic Card */}
      <div className="bg-[#090D16]/95 border-2 border-yellow-400/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-yellow-500/15 relative backdrop-blur-2xl">
        
        {/* Step Progress & Skip Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl p-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl text-yellow-400">
              {step.highlightIcon}
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 font-mono block">
                {step.badge}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {step.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss guide"
          >
            Skip Guide
          </button>
        </div>

        {/* Step Body Description */}
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p className="text-slate-200 text-sm leading-relaxed">{step.description}</p>
          
          {step.actionHint && (
            <div className="p-3 bg-[#05070E] rounded-xl border border-slate-800 text-yellow-300/90 font-mono text-[11px] flex items-start gap-2">
              <span className="text-yellow-400 font-bold">💡</span>
              <span>{step.actionHint}</span>
            </div>
          )}
        </div>

        {/* Optional Direct Quick Link */}
        {step.targetLink && (
          <div className="text-[11px]">
            <Link
              href={step.targetLink}
              onClick={() => setIsOpen(false)}
              className="text-yellow-400 hover:underline font-semibold flex items-center gap-1 font-mono"
            >
              <span>Jump to this section now</span>
              <span>→</span>
            </Link>
          </div>
        )}

        {/* Navigation & Progress Bar Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
          
          {/* Step Dots Indicator */}
          <div className="flex items-center space-x-1.5">
            {tourSteps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-6 bg-yellow-400'
                    : idx < currentStep
                    ? 'w-2 bg-emerald-400'
                    : 'w-2 bg-slate-800'
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
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-yellow-500/20 cursor-pointer"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish Tour 🎉' : 'Next Step →'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}