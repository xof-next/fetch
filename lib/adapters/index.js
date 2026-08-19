'use strict';

const httpAdapter = require('./http');
const httpsAdapter = require('./https');
const http2Adapter = require('./http2');
const xhrAdapter = require('./xhr');

const ADAPTERS = Object.freeze({
  http: httpAdapter,
  https: httpsAdapter,
  http2: http2Adapter,
  xhr: xhrAdapter
});

function isBrowser() {
  return typeof XMLHttpRequest !== 'undefined';
}

function resolveAdapter(adapter) {
  if (!adapter) return null;

  if (typeof adapter === 'function') {
    return adapter;
  }

  if (typeof adapter === 'string') {
    const key = adapter.toLowerCase();
    if (ADAPTERS[key]) return ADAPTERS[key];
    throw new Error(`Unknown adapter "${adapter}"`);
  }

  throw new Error('Adapter must be a function or a valid adapter name');
}

function getAdapter(config = {}) {
  const customAdapter = resolveAdapter(config.adapter);

  if (customAdapter) {
    return customAdapter;
  }

  if (isBrowser()) {
    return xhrAdapter;
  }

  if (config.http2 === true) {
    return http2Adapter;
  }

  return config.protocol === 'https:'
    ? httpsAdapter
    : httpAdapter;
}

module.exports = {
  getAdapter,
  httpAdapter,
  httpsAdapter,
  xhrAdapter,
  http2Adapter,
  adapters: ADAPTERS
};