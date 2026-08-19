'use strict';

const { normalizeHookList } = require('./normalize');

async function runHookList(list, value, context = {}) {
  const handlers = normalizeHookList(list);
  let result = value;

  for (const hook of handlers) {
    const next = await hook(result, context);

    if (next !== undefined) {
      result = next;
    }
  }

  return result;
}

async function runHooks(hooks, value, context = {}) {
  if (Array.isArray(hooks) || typeof hooks === 'function') {
    return runHookList(hooks, value, context);
  }

  return value;
}

module.exports = {
  runHookList,
  runHooks
};

module.exports.default = module.exports;