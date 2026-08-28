// snaptrace-dashboard/lib/sdk.js

class SnapTrace {
  constructor() {
    this.apiKey = null;
    this.endpoint = 'http://localhost:3000/api/v1/log';
    this.initialized = false;
  }

  /**
   * Initialize SnapTrace with your Project API Key
   * @param {string} apiKey - Your sk_live_... key
   */
  init(apiKey) {
    if (this.initialized) return;
    this.apiKey = apiKey;
    this.initialized = true;

    console.log('[SnapTrace] SDK initialized successfully.');
    this._startListening();
  }

  /**
   * Set up global error listeners
   */
  _startListening() {
    // 1. Capture standard uncaught exceptions
    window.onerror = (message, source, lineno, colno, error) => {
      this._captureError({
        message,
        source,
        lineno,
        colno,
        stack: error ? error.stack : 'No stack trace available'
      });
    };

    // 2. Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
      this._captureError({
        message: `Unhandled Rejection: ${event.reason?.message || event.reason}`,
        source: 'Unknown (Promise Rejection)',
        lineno: 0,
        colno: 0,
        stack: event.reason?.stack || 'No stack trace available'
      });
    };
  }

  /**
   * Format and send the error telemetry to the ingestion API
   */
  async _captureError(errorData) {
    if (!this.initialized || !this.apiKey) return;

    // Use current browser metadata
    const payload = {
      error_msg: errorData.message || 'Unknown Exception',
      stack_trace: errorData.stack || 'No stack trace provided',
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    try {
      // POST the telemetry using standard fetch
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey // Attach the user's secret key
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorRes = await response.json();
        console.error(`[SnapTrace] Ingestion failed: ${errorRes.error}`);
      } else {
        console.log('[SnapTrace] Telemetry sent successfully.');
      }
    } catch (err) {
      // Catch network errors silently to avoid impacting the host application
      console.error('[SnapTrace] Network connection error:', err);
    }
  }
}

// Export as a singleton instance
export const snaptrace = new SnapTrace();