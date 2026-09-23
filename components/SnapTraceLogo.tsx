'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function SnapTraceLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {/* Precision Geometric Emblem */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl bg-zinc-800/80 p-[1px] border border-zinc-700/80 shadow-lg transition-transform duration-300 ease-out group-hover:scale-105`}
      >
        <div className="w-full h-full rounded-[11px] bg-zinc-950 flex items-center justify-center relative overflow-hidden">
          {/* Subtle Ambient Depth */}
          <div className="absolute inset-0 bg-radial from-zinc-800/40 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Precision Vector Emblem */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[72%] h-[72%] relative z-10"
          >
            {/* Background Telemetry Pulse Wave */}
            <path
              d="M3 17H7.5L10.5 9L15 23L18.5 13L21 17H29"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.4"
            />
            {/* Foreground Snap Lightning Bolt */}
            <path
              d="M17.5 3L6.5 17.5H15.5L13.5 29L25.5 13.5H16.5L17.5 3Z"
              fill="url(#snapTraceBrandGradient)"
              stroke="#E4E4E7"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="snapTraceBrandGradient" x1="6.5" y1="3" x2="25.5" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="0.5" stopColor="#E4E4E7" />
                <stop offset="1" stopColor="#A1A1AA" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center">
          <span className={`font-semibold tracking-[-0.03em] text-zinc-100 ${textSizes[size]}`}>
            Snap<span className="text-zinc-400">Trace</span>
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5 mb-2.5 animate-pulse" />
        </div>
      )}
    </div>
  );
}