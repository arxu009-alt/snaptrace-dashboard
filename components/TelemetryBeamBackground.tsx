'use client';

import React from 'react';

export default function TelemetryBeamBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Precision Tech Matrix Grid (Linear & Supabase Style) */}
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(250, 204, 21, 0.4) 1px, transparent 1px), radial-gradient(rgba(16, 185, 129, 0.25) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0, 18px 18px',
        }}
      />

      {/* 2. Top-Center Electric Snap Yellow Ambient Aura (Slow Breathing) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[420px] bg-gradient-to-b from-yellow-400/14 via-amber-500/6 to-transparent blur-[130px] rounded-full pointer-events-none" />

      {/* 3. Left-Side Subtle Emerald Telemetry Pulse Glow */}
      <div className="absolute top-1/4 -left-28 w-[450px] h-[320px] bg-emerald-500/9 blur-[140px] rounded-full pointer-events-none" />

      {/* 4. Right-Side Subtle AI Violet Accent Aura */}
      <div className="absolute top-1/3 -right-28 w-[450px] h-[320px] bg-purple-500/8 blur-[140px] rounded-full pointer-events-none" />

      {/* 5. Center Radial Vignette: Guarantees 100% Razor-Sharp Text Contrast */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#05070E]/50 to-[#05070E] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05070E]/30 to-[#05070E] pointer-events-none" />
    </div>
  );
}