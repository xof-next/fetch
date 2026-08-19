'use strict';

const RETRY_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'EPIPE'
];

const RETRY_STATUS = [
  408,
  429,
  500,
  502,
  503,
  504
];

function shouldRetry(error, response) {
  if (error?.code && RETRY_ERRORS.includes(error.code)) {
    return true;
  }

  if (response?.status && RETRY_STATUS.includes(response.status)) {
    return true;
  }

  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retry(fn, options = {}) {
  const count = Number(options.retry ?? 0);
  const delay = Number(options.retryDelay ?? 1000);

  let attempt = 0;

  while (true) {
    try {
      const response = await fn();
      if (response && typeof response === 'object') {
        response.meta = {
          ...(response.meta || {}),
          retry: {
            attempts: attempt,
            maxRetries: count
          }
        };
      }

      return response;
    } catch (error) {
      if (attempt >= count || !shouldRetry(error, error.response)) {
        if (error.response) {
          error.response.meta = {
            ...(error.response.meta || {}),
            retry: {
              attempts: attempt,
              maxRetries: count,
              failed: true,
              reason: error.code || error.message
            }
          };
        }

        throw error;
      }

      attempt++;

      await sleep(delay * attempt);
    }
  }
}

module.exports = {
  retry,
  shouldRetry,
  sleep
};