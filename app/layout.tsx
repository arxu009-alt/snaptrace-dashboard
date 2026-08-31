import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { SnapTraceProvider } from '@/components/SnapTraceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SnapTrace Dashboard',
  description: 'Real-time telemetry and error monitoring',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SnapTraceProvider apiKey={process.env.SNAPTRACE_API_KEY || ''}>
          {children}
        </SnapTraceProvider>
      </body>
    </html>
  );
}