'use strict';

var _apiKey = null;
var _endpoint = 'https://snaptrace.space/api/v1/log';
var _errorCache = {};
var THROTTLE_WINDOW_MS = 60000;
var _queue = [];
var MAX_QUEUE = 10;

function enqueue(url, body) {
  if (_queue.length >= MAX_QUEUE) _queue.shift();
  _queue.push({ u: url, b: body });
}

function send(url, body) {
  var ok = false;
  try {
    ok = !!(typeof navigator !== 'undefined' && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'application/json' })));
  } catch (e) {}
  if (ok) return;
  try {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true })
      .catch(function () { enqueue(url, body); });
  } catch (e) {}
}

function flushBuffer() {
  var q = _queue.splice(0);
  for (var i = 0; i < q.length; i++) send(q[i].u, q[i].b);
}

function scrubPII(text) {
  if (!text) return text;
  var scrubbed = String(text);
  scrubbed = scrubbed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  scrubbed = scrubbed.replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
  scrubbed = scrubbed.replace(/(password|secret|token|auth|key|apiKey|access_token)=([^&\s]+)/gi, '$1=[REDACTED]');
  return scrubbed;
}

function generateFingerprint(message, stack) {
  var str = (message || '') + '|' + (stack ? stack.split('\n')[0] : '');
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(16);
}

export function captureException(error) {
  if (!_apiKey || typeof window === 'undefined') return;
  var rawMessage = error ? (error.message || String(error)) : 'Unknown Error';
  var rawStack = error ? (error.stack || '') : '';
  var rawUrl = window.location.href;

  var safeMessage = scrubPII(rawMessage);
  var safeStack = scrubPII(rawStack);
  var safeUrl = scrubPII(rawUrl);
  var env = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'development' : 'production';
  var fingerprint = generateFingerprint(safeMessage, safeStack);
  var now = Date.now();

  if (!_errorCache[fingerprint]) {
    _errorCache[fingerprint] = { count: 0, lastSent: now, timeoutId: null };
    dispatch(safeMessage, safeStack, safeUrl, env, fingerprint, 1);
  } else {
    var cache = _errorCache[fingerprint];
    cache.count += 1;
    if (now - cache.lastSent > THROTTLE_WINDOW_MS) {
      dispatch(safeMessage, safeStack, safeUrl, env, fingerprint, cache.count);
      cache.count = 0;
      cache.lastSent = now;
      if (cache.timeoutId) clearTimeout(cache.timeoutId);
    }
  }
}

function dispatch(message, stackTrace, url, environment, fingerprint, occurrenceCount) {
  var payload = {
    apiKey: _apiKey,
    message: message,
    stackTrace: stackTrace,
    url: url,
    environment: environment,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    fingerprint: fingerprint,
    occurrenceCount: occurrenceCount || 1
  };

  var targetUrl = _endpoint + '?apiKey=' + encodeURIComponent(_apiKey);
  var body = JSON.stringify(payload);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return enqueue(targetUrl, body);
  send(targetUrl, body);
}

export function initSnapTrace(config) {
  if (typeof window === 'undefined') return;
  if (!config || !config.apiKey) {
    console.error('[SnapTrace] API key is required.');
    return;
  }
  _apiKey = config.apiKey;
  if (config.endpoint) _endpoint = config.endpoint;

  if (window.__snaptrace_init) return;
  window.__snaptrace_init = true;

  window.addEventListener('online', flushBuffer);
  window.addEventListener('error', function (event) {
    captureException(event.error || new Error(event.message));
  });
  window.addEventListener('unhandledrejection', function (event) {
    captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
}

export default { init: initSnapTrace, captureException: captureException };