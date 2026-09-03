'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function SnapTraceLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  // Size mapping
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Scalable SVG Icon Badge */}
      <div
        className={`relative ${iconSizes[size]} rounded-xl bg-gradient-to-br from-[#121829] to-[#060911] p-[1px] shadow-lg shadow-yellow-500/10 border border-slate-800/80 group`}
      >
        <div className="w-full h-full rounded-[11px] bg-[#090D16] flex items-center justify-center relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/15 via-transparent to-emerald-500/15 opacity-80" />

          {/* Precision Trace & Spark SVG Icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[60%] h-[60%] relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
          >
            {/* Background Trace Pulse Path */}
            <path
              d="M2 13H6L8.5 7L12 17L14.5 11L16.5 13H22"
              stroke="#10B981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.4"
            />
            {/* Foreground Snap Lightning Spark */}
            <path
              d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z"
              fill="url(#snapGradient)"
              stroke="#FACC15"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="snapGradient" x1="4.5" y1="2" x2="19.5" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE047" />
                <stop offset="1" stopColor="#EAB308" />
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
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1 mb-2 animate-pulse shadow-sm shadow-emerald-400" />
        </div>
      )}
    </div>
  );
}