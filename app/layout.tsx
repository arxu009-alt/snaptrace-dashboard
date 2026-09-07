import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import React from 'react';
import { SnapTraceProvider } from '@/components/SnapTraceProvider';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// Comprehensive Pro SEO & Social Share Meta Tags
export const metadata: Metadata = {
  metadataBase: new URL('https://snaptrace-dashboard.vercel.app'),
  title: {
    default: 'SnapTrace | The Featherweight Error Tracker & Sentry Alternative',
    template: '%s | SnapTrace',
  },
  description:
    'Lightweight <5KB error monitoring and crash telemetry for Next.js, Python, Node, and JavaScript with zero alert fatigue, client-side PII scrubbing, and BYOK AI root-cause diagnostics.',
  keywords: [
    'Sentry alternative',
    'GlitchTip alternative',
    'Honeybadger alternative',
    'error tracking',
    'crash monitoring',
    'Next.js error logging',
    'telemetry APM',
    'BYOK AI error diagnosis',
    'lightweight error tracker',
    'noise deduplication APM',
  ],
  authors: [{ name: 'SnapTrace Team' }],
  creator: 'SnapTrace',
  publisher: 'SnapTrace',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snaptrace-dashboard.vercel.app',
    siteName: 'SnapTrace',
    title: 'SnapTrace | Code breaks, fix it in a snap',
    description:
      'Featherweight <5KB error tracker with zero alert fatigue, client PII firewall, and 1-click Cursor/Claude AI prompts.',
    images: [
      {
        url: '/globe.svg',
        width: 1200,
        height: 630,
        alt: 'SnapTrace Developer Telemetry Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapTrace | The Featherweight Sentry Alternative',
    description:
      'Catch crashes in real time with <5KB SDK overhead, client-side PII scrubbing, and BYOK AI root-cause fixes.',
    creator: '@snaptrace',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD Structured Data Schema for Google Search Rich Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SnapTrace',
    operatingSystem: 'Any',
    applicationCategory: 'DeveloperApplication',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description:
      'Featherweight error tracking and crash telemetry platform with noise deduplication and BYOK AI diagnostics.',
    url: 'https://snaptrace-dashboard.vercel.app',
  };

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#05070E] text-slate-100 font-sans antialiased selection:bg-yellow-400 selection:text-slate-950">
        <SnapTraceProvider apiKey={process.env.SNAPTRACE_API_KEY || ''}>
          {children}
        </SnapTraceProvider>
        <Analytics />
      </body>
    </html>
  );
}