;(function (window) {
  'use strict';

  var _apiKey = null;
  var _endpoint = '/api/v1/log';
  var _errorCache = {};
  var THROTTLE_WINDOW_MS = 60000; // 60-second duplicate suppression window

  window.SnapTrace = {
    init: function (config) {
      if (!config || !config.apiKey) {
        console.error('[SnapTrace] API key is required for initialization.');
        return;
      }
      _apiKey = config.apiKey;
      if (config.endpoint) _endpoint = config.endpoint;

      this._listenToErrors();
      console.log('[SnapTrace] SDK initialized (Smart Deduplication & PII Firewall active).');
    },

    // 1. Zero-Trust Client-Side PII Scrubbing
    _scrubPII: function (text) {
      if (!text) return text;
      var scrubbed = String(text);
      // Mask Emails
      scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
      // Mask Credit Cards (13 to 16 digit patterns)
      scrubbed = scrubbed.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
      // Mask Passwords, Secrets, Tokens, and Auth Keys in strings/URLs
      scrubbed = scrubbed.replace(/(password|secret|token|auth|key|apiKey|access_token)=([^&\s]+)/gi, '$1=[REDACTED]');
      return scrubbed;
    },

    // 2. Deterministic Fingerprinting (Hash)
    _generateFingerprint: function (message, stack) {
      var str = (message || '') + '|' + (stack ? stack.split('\n')[0] : '');
      var hash = 0;
      for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return 'fp_' + Math.abs(hash).toString(16);
    },

    captureException: function (error) {
      if (!_apiKey) return;

      var rawMessage = error ? (error.message || String(error)) : 'Unknown Error';
      var rawStack = error ? (error.stack || '') : '';
      var rawUrl = window.location.href;

      // Scrub data on the client device first
      var safeMessage = this._scrubPII(rawMessage);
      var safeStack = this._scrubPII(rawStack);
      var safeUrl = this._scrubPII(rawUrl);
      var env = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'development'
        : 'production';

      var fingerprint = this._generateFingerprint(safeMessage, safeStack);
      var now = Date.now();

      // 3. Intelligent Noise Management
      if (!_errorCache[fingerprint]) {
        // First occurrence: Send immediately and alert developer
        _errorCache[fingerprint] = { count: 1, lastSent: now, timeoutId: null };
        this._dispatch(safeMessage, safeStack, safeUrl, env, fingerprint, 1);
      } else {
        // Duplicate occurrence: Throttle to prevent alert flood
        var cache = _errorCache[fingerprint];
        cache.count += 1;

        if (now - cache.lastSent > THROTTLE_WINDOW_MS) {
          this._dispatch(safeMessage, safeStack, safeUrl, env, fingerprint, cache.count);
          cache.count = 0;
          cache.lastSent = now;
          if (cache.timeoutId) clearTimeout(cache.timeoutId);
        } else if (!cache.timeoutId) {
          cache.timeoutId = setTimeout(function () {
            var current = _errorCache[fingerprint];
            if (current && current.count > 0) {
              window.SnapTrace._dispatch(safeMessage, safeStack, safeUrl, env, fingerprint, current.count);
              current.count = 0;
              current.lastSent = Date.now();
              current.timeoutId = null;
            }
          }, THROTTLE_WINDOW_MS - (now - cache.lastSent));
        }
      }
    },

    _dispatch: function (message, stackTrace, url, environment, fingerprint, occurrenceCount) {
      var payload = {
        apiKey: _apiKey,
        message: message,
        stackTrace: stackTrace,
        url: url,
        environment: environment,
        userAgent: navigator.userAgent,
        fingerprint: fingerprint,
        occurrenceCount: occurrenceCount || 1
      };

      var targetUrl = _endpoint + (_endpoint.includes('?') ? '&apiKey=' : '?apiKey=') + encodeURIComponent(_apiKey);

      if (environment === 'development') {
        console.warn('🛡️ [SnapTrace Debug Event Captured]:', payload);
      }

      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(targetUrl, blob);
      } else {
        fetch(_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      }
    },

    _listenToErrors: function () {
      var self = this;
      window.addEventListener('error', function (event) {
        self.captureException(event.error || new Error(event.message));
      });
      window.addEventListener('unhandledrejection', function (event) {
        self.captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
      });
    }
  };
})(window);