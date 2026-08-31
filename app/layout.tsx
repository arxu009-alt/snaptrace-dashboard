import { SnapTraceProvider } from '@/components/SnapTraceProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SnapTraceProvider apiKey="sk_live_iuog5ef58kgz0j57u3ncj">
          {children}
        </SnapTraceProvider>
      </body>
    </html>
  );
}