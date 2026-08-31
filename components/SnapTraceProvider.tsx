'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface SnapTraceProviderProps {
  children: ReactNode;
  apiKey?: string;
  fallback?: ReactNode;
}

interface SnapTraceProviderState {
  hasError: boolean;
  error: Error | null;
}

export class SnapTraceProvider extends Component<SnapTraceProviderProps, SnapTraceProviderState> {
  constructor(props: SnapTraceProviderProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): SnapTraceProviderState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('SnapTrace Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
            <div className="max-w-md w-full p-6 border border-border rounded-lg bg-card text-center shadow-sm">
              <h2 className="text-xl font-semibold mb-2 text-destructive">Something went wrong</h2>
              <p className="text-sm text-muted-foreground mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}