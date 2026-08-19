'use strict';

function RequestResolver(input = {}) {
  const {
    body,
    headers,
    query,
    params,
    ...options
  } = input;

  return {
    ...options,
    body,
    headers,
    query,
    params
  };
}

module.exports = RequestResolver;