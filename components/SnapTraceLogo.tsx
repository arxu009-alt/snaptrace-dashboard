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
        className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-br from-yellow-400/30 via-slate-800/80 to-emerald-400/20 p-[1.5px] shadow-xl shadow-yellow-500/10 transition-transform duration-300 ease-out group-hover:scale-105`}
      >
        <div className="w-full h-full rounded-[14px] bg-[#070A12] flex items-center justify-center relative overflow-hidden border border-slate-800/90">
          
          {/* Radial Ambient Core */}
          <div className="absolute inset-0 bg-radial from-yellow-400/20 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Tier-1 Silicon Valley Vector Trace Spark */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[72%] h-[72%] relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.55)]"
          >
            {/* Background Telemetry Pulse Wave */}
            <path
              d="M3 17H7.5L10.5 9L15 23L18.5 13L21 17H29"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.45"
            />
            {/* Foreground Electric Snap Lightning Bolt */}
            <path
              d="M17.5 3L6.5 17.5H15.5L13.5 29L25.5 13.5H16.5L17.5 3Z"
              fill="url(#snapTraceBrandGradient)"
              stroke="#FACC15"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="snapTraceBrandGradient" x1="6.5" y1="3" x2="25.5" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FEF08A" />
                <stop offset="0.4" stopColor="#FACC15" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center">
          <span className={`font-black tracking-[-0.04em] text-white ${textSizes[size]}`}>
            Snap<span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Trace</span>
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1.5 mb-3 animate-pulse shadow-[0_0_8px_#10B981]" />
        </div>
      )}
    </div>
  );
}