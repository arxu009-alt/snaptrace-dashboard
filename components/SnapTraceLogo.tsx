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
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-End Vector Icon Badge */}
      <div
        className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-br from-yellow-400/20 via-slate-800/60 to-emerald-500/20 p-[1.5px] shadow-xl shadow-yellow-500/10 group transition transform hover:scale-105`}
      >
        <div className="w-full h-full rounded-[14px] bg-[#090D16] flex items-center justify-center relative overflow-hidden border border-slate-800/90">
          {/* Radial Ambient Glow */}
          <div className="absolute inset-0 bg-radial from-yellow-500/20 via-transparent to-transparent opacity-80" />

          {/* Precision Snap & Trace SVG Geometry */}
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[70%] h-[70%] relative z-10 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
          >
            {/* Background Telemetry Pulse Radar */}
            <path
              d="M2 15H6.5L9.5 8L14 20L17 12L19.5 15H26"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.4"
            />
            {/* Foreground Lightning Bolt Spark */}
            <path
              d="M15.5 2.5L5 15.5H13.5L12 25.5L23 12H14.5L15.5 2.5Z"
              fill="url(#snapTraceGradient)"
              stroke="#FACC15"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="snapTraceGradient" x1="5" y1="2.5" x2="23" y2="25.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FEF08A" />
                <stop offset="0.5" stopColor="#FACC15" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-center">
          <span className={`font-black tracking-tight text-white ${textSizes[size]}`}>
            Snap<span className="text-yellow-400">Trace</span>
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ml-1.5 mb-2.5 animate-pulse shadow-md shadow-emerald-400/80" />
        </div>
      )}
    </div>
  );
}