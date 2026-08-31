import './globals.css';
import React from 'react';
import { SnapTraceProvider } from '@/components/SnapTraceProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SnapTraceProvider apiKey={process.env.SNAPTRACE_API_KEY || ''}>
          {children}
        </SnapTraceProvider>
      </body>
    </html>
  );
}