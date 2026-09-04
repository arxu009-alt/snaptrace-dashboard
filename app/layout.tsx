import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import React from 'react';
import { SnapTraceProvider } from '@/components/SnapTraceProvider';

// 1. High-End UI Font (Used by Linear, Vercel & Stripe)
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

// 2. Developer Monospace Font (Used for stack traces, line numbers & keys)
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'SnapTrace | Modern Developer Telemetry & Error Tracking',
  description: 'Featherweight <5KB error monitoring with zero alert fatigue and BYOK AI root-cause diagnostics.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth`}>
      <body className="min-h-screen bg-[#05070E] text-slate-100 font-sans antialiased selection:bg-yellow-400 selection:text-slate-950">
        <SnapTraceProvider apiKey={process.env.SNAPTRACE_API_KEY || ''}>
          {children}
        </SnapTraceProvider>
      </body>
    </html>
  );
}