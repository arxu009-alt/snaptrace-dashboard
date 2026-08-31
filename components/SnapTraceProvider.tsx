'use client';

import React from 'react';

export class SnapTraceProvider extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const apiKey = this.props.apiKey;
    if (!apiKey) return;

    const payload = {
      api_key: apiKey,
      message: error.message || 'Unhandled Client Exception',
      stack: error.stack || errorInfo?.componentStack || 'No stack trace available',
      environment: process.env.NODE_ENV || 'production',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    fetch('https://snaptrace-dashboard.vercel.app/api/v1/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('SnapTrace SDK Ingest Failed:', err));
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-950/40 border border-red-800 rounded-lg text-red-200 max-w-lg mx-auto my-8 font-sans">
            <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
            <p className="text-xs text-red-300">
              An unexpected application error occurred and has been logged to SnapTrace.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded text-xs font-semibold transition"
            >
              Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}