'use client';

import { FC } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const SnapTraceLoading: FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
}) => {
  const dimensions = {
    sm: { container: 'h-8 w-8', logo: 'w-4 h-4', text: 'text-[10px]' },
    md: { container: 'h-12 w-12', logo: 'w-6 h-6', text: 'text-xs' },
    lg: { container: 'h-16 w-16', logo: 'w-8 h-8', text: 'text-xs' },
  };

  const dim = dimensions[size];

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing trace ring */}
        <div
          className={`${dim.container} rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl relative flex items-center justify-center overflow-hidden`}
        >
          {/* Subtle spinning conic sweep accent */}
          <div
            className="absolute inset-0 rounded-2xl opacity-40 animate-spin"
            style={{
              animationDuration: '2.5s',
              background:
                'conic-gradient(from 0deg, transparent 0deg 270deg, rgba(255, 255, 255, 0.35) 360deg)',
            }}
          />

          {/* Inner dark center plate */}
          <div className="absolute inset-[1.5px] rounded-[14px] bg-zinc-950 flex items-center justify-center">
            {/* Pulsing center telemetry spark icon */}
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${dim.logo} text-zinc-100 animate-pulse`}
            >
              <path
                d="M17.5 3L6.5 17.5H15.5L13.5 29L25.5 13.5H16.5L17.5 3Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Ambient subtle blur glow behind */}
        <div className="absolute -inset-1 bg-zinc-800/20 rounded-full blur-md -z-10" />
      </div>

      {text && (
        <p className={`font-mono text-zinc-500 uppercase tracking-widest ${dim.text}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default SnapTraceLoading;
