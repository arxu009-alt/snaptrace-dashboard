import './globals.css';
import type { Metadata } from 'next';
import React from 'react';
import { SnapTraceProvider } from '@/components/SnapTraceProvider';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  metadataBase: new URL('https://snaptrace.space'),
  title: {
    default: 'SnapTrace — Centralized Crash Telemetry for Web Agencies',
    template: '%s | SnapTrace',
  },
  description:
    'Featherweight (<3.4KB) noise-free crash telemetry and error tracking for web agencies, dev studios, and multi-client fleets. Zero Core Web Vitals penalty.',
  keywords: [
    'SnapTrace',
    'Snap Trace',
    'error tracking for agencies',
    'Next.js crash telemetry',
    'Sentry alternative for agencies',
    'client fleet error monitoring',
    'lightweight error monitoring',
  ],
  authors: [{ name: 'Muhammad Arsalan' }],
  creator: 'Muhammad Arsalan',
  publisher: 'SnapTrace',
  alternates: {
    canonical: 'https://snaptrace.space',
  },
  icons: {
    icon: [
      { url: '/icon.png?v=2', type: 'image/png', sizes: '192x192' },
      { url: '/icon', sizes: 'any' },
    ],
    shortcut: '/icon.png?v=2',
    apple: [
      { url: '/icon.png?v=2', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://snaptrace.space',
    siteName: 'SnapTrace',
    title: 'SnapTrace — Centralized Crash Telemetry for Web Agencies',
    description:
      'Monitor 10 to 50+ client applications under one flat dashboard. Zero 100KB SDK bloat, 0.0ms Core Web Vitals penalty.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SnapTrace — Centralized Crash Telemetry for Web Agencies',
    description:
      'Featherweight (<3.4KB) crash telemetry for web agencies and multi-client fleets.',
    creator: '@Arslan009a',
  },
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
  verification: {
    other: {
      'msvalidate.01': ['EC1C00F550C23BCFCF6A5FB131492203'],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SnapTrace',
    alternateName: ['Snap Trace', 'SnapTrace Telemetry'],
    url: 'https://snaptrace.space',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'All',
    description:
      'Featherweight (<3.4KB) noise-free crash telemetry and error tracking for web agencies and dev studios.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '3',
    },
    author: {
      '@type': 'Person',
      name: 'Muhammad Arsalan',
    },
  };

  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SnapTrace',
    alternateName: ['Snap Trace', 'SnapTrace Telemetry'],
    url: 'https://snaptrace.space',
  };

  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="msvalidate.01" content="EC1C00F550C23BCFCF6A5FB131492203" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webSiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
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