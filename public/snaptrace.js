;(function (window) {
  'use strict';

  var _apiKey = null;
  var _endpoint = '/api/v1/log';

  window.SnapTrace = {
    init: function (config) {
      if (!config || !config.apiKey) {
        console.error('[SnapTrace] API key is required for initialization.');
        return;
      }
      _apiKey = config.apiKey;
      if (config.endpoint) _endpoint = config.endpoint;

      this._listenToErrors();
      console.log('[SnapTrace] SDK initialized successfully.');
    },

    captureException: function (error) {
      if (!_apiKey) {
        console.warn('[SnapTrace] SDK not initialized with API key.');
        return;
      }

      var payload = {
        error_msg: error ? (error.message || String(error)) : 'Unknown Error',
        stack_trace: error ? (error.stack || '') : '',
        url: window.location.href,
        user_agent: navigator.userAgent
      };

      this._send(payload);
    },

    _send: function (payload) {
      var targetUrl = _endpoint + (_endpoint.includes('?') ? '&apiKey=' : '?apiKey=') + encodeURIComponent(_apiKey);

      // Preferred delivery using sendBeacon (prevents loss during page unload)
      if (navigator.sendBeacon) {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        var sent = navigator.sendBeacon(targetUrl, blob);
        if (sent) return;
      }

      // Fallback delivery via Fetch API
      fetch(_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': _apiKey
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function (err) {
        console.error('[SnapTrace] Delivery failed:', err);
      });
    },

    _listenToErrors: function () {
      var self = this;

      // 1. Synchronous uncaught exceptions
      window.addEventListener('error', function (event) {
        if (event.error) {
          self.captureException(event.error);
        } else {
          self.captureException(new Error(event.message || 'Uncaught Exception'));
        }
      });

      // 2. Asynchronous unhandled promise rejections
      window.addEventListener('unhandledrejection', function (event) {
        var reason = event.reason;
        if (reason instanceof Error) {
          self.captureException(reason);
        } else {
          self.captureException(new Error(typeof reason === 'string' ? reason : 'Unhandled Promise Rejection'));
        }
      });
    }
  };
})(window);