'use strict';

const VERSION = require('./Version');

const CODES = Object.freeze({
  ERR_BAD_OPTION_VALUE: 'ERR_BAD_OPTION_VALUE',
  ERR_BAD_OPTION: 'ERR_BAD_OPTION',
  ECONNABORTED: 'ECONNABORTED',
  ETIMEDOUT: 'ETIMEDOUT',
  ECONNREFUSED: 'ECONNREFUSED',
  ECONNRESET: 'ECONNRESET',
  EPIPE: 'EPIPE',
  ERR_NETWORK: 'ERR_NETWORK',
  ERR_BAD_REQUEST: 'ERR_BAD_REQUEST',
  ERR_INVALID_URL: 'ERR_INVALID_URL',
  ERR_CANCELED: 'ERR_CANCELED',
  ERR_ABORTED: 'ERR_ABORTED',
  ERR_BAD_RESPONSE: 'ERR_BAD_RESPONSE',
  ERR_FR_TOO_MANY_REDIRECTS: 'ERR_FR_TOO_MANY_REDIRECTS',
  ERR_BAD_BODY: 'ERR_BAD_BODY',
  ERR_BAD_JSON: 'ERR_BAD_JSON',
  ERR_BAD_XML: 'ERR_BAD_XML',
  ERR_UNSUPPORTED_RESPONSE_TYPE: 'ERR_UNSUPPORTED_RESPONSE_TYPE',
  ERR_NOT_SUPPORT: 'ERR_NOT_SUPPORT',
  ERR_DEPRECATED: 'ERR_DEPRECATED',
  ERR_NO_ADAPTER: 'ERR_NO_ADAPTER',
  ERR_ADAPTER_FAILED: 'ERR_ADAPTER_FAILED',
  ERR_HTTP2_PROTOCOL: 'ERR_HTTP2_PROTOCOL',
  ERR_FORM_DATA_DEPTH_EXCEEDED: 'ERR_FORM_DATA_DEPTH_EXCEEDED',
  ERR_BROWSER: 'ERR_BROWSER',
  ERR_BROWSER_CLOSED: 'ERR_BROWSER_CLOSED',
  ERR_PAGE_CLOSED: 'ERR_PAGE_CLOSED',
  ERR_PAGE_NOT_FOUND: 'ERR_PAGE_NOT_FOUND',
  ERR_NAVIGATION: 'ERR_NAVIGATION',
  ERR_NAVIGATION_TIMEOUT: 'ERR_NAVIGATION_TIMEOUT',
  ERR_SELECTOR_NOT_FOUND: 'ERR_SELECTOR_NOT_FOUND',
  ERR_SELECTOR_TIMEOUT: 'ERR_SELECTOR_TIMEOUT',
  ERR_ELEMENT_NOT_FOUND: 'ERR_ELEMENT_NOT_FOUND',
  ERR_ELEMENT_NOT_INTERACTABLE: 'ERR_ELEMENT_NOT_INTERACTABLE',
  ERR_CLICK_FAILED: 'ERR_CLICK_FAILED',
  ERR_INPUT_FAILED: 'ERR_INPUT_FAILED',
  ERR_FILL_FAILED: 'ERR_FILL_FAILED',
  ERR_WAIT_TIMEOUT: 'ERR_WAIT_TIMEOUT',
  ERR_SCRIPT_ERROR: 'ERR_SCRIPT_ERROR',
  ERR_EVALUATION: 'ERR_EVALUATION',
  ERR_SCREENSHOT: 'ERR_SCREENSHOT',
  ERR_UNSUPPORTED_BROWSER: 'ERR_UNSUPPORTED_BROWSER'
});

class FetchError extends Error {
  constructor(message, code, config, request, response, cause, data) {
    super(message);

    this.name = 'FetchError';
    this.code = code || null;
    this.config = config || null;
    this.request = request || null;
    this.response = response || null;
    this.data = data ?? this.code;

    if (cause !== undefined) {
      this.cause = cause;
    }

    Error.captureStackTrace?.(this, FetchError);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      data: this.data,
      config: this.config,
      status: this.response?.statusCode ?? null,
      stack: this.stack
    };
  }

  static from(error, code, config, request, response) {
    if (error instanceof FetchError) {
      return error;
    }

    return new FetchError(
      error?.message || String(error),
      code || error?.code,
      config,
      request,
      response,
      error,
      code || error?.code
    );
  }
}

Object.assign(FetchError, CODES);

FetchError.VERSION = VERSION;

module.exports = { FetchError };