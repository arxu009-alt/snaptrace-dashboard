(function () {
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var apiKey = currentScript ? currentScript.getAttribute('data-api-key') : null;

  if (!apiKey) {
    console.warn('[SnapTrace] SDK initialized without data-api-key attribute.');
    return;
  }

  var INGEST_ENDPOINT = 'https://snaptrace-dashboard.vercel.app/api/v1/ingest';
  if (currentScript && currentScript.src) {
    try {
      var scriptUrl = new URL(currentScript.src);
      INGEST_ENDPOINT = scriptUrl.origin + '/api/v1/ingest';
    } catch (e) {}
  }

  function sendError(payload) {
    payload.api_key = apiKey;
    payload.url = payload.url || window.location.href;
    payload.user_agent = payload.user_agent || navigator.userAgent;

    fetch(INGEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit',
      keepalive: true
    }).catch(function (err) {
      console.error('[SnapTrace] Transmission failed:', err);
    });
  }

  // Global uncaught JavaScript exception handler
  window.addEventListener('error', function (event) {
    sendError({
      message: event.message || 'Script error',
      stack: event.error && event.error.stack ? event.error.stack : (event.filename + ':' + event.lineno + ':' + event.colno),
      environment: 'production'
    });
  });

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', function (event) {
    var message = 'Unhandled Promise Rejection';
    var stack = null;

    if (event.reason) {
      if (typeof event.reason === 'string') {
        message = event.reason;
      } else if (event.reason.message) {
        message = event.reason.message;
        stack = event.reason.stack || null;
      }
    }

    sendError({
      message: message,
      stack: stack,
      environment: 'production'
    });
  });

  console.log('[SnapTrace] Telemetry active.');
})();