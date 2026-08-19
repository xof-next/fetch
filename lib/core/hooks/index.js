'use strict';

const { HOOK_KEYS, HOOK_SET } = require('./constants');
const { isFunction, isPlainObject, normalizeHookList, normalizeHooks, hasHookList, hasHooks } = require('./normalize');
const { runHookList, runHooks } = require('./runner');

module.exports = {
  HOOK_KEYS,
  HOOK_SET,
  isFunction,
  isPlainObject,
  normalizeHookList,
  normalizeHooks,
  hasHookList,
  hasHooks,
  runHookList,
  runHooks
};

module.exports.default = module.exports;