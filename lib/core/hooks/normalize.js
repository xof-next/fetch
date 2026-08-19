'use strict';

const { HOOK_KEYS } = require('./constants');

function isFunction(value) {
  return typeof value === 'function';
}

function isPlainObject(value) {
  if (value == null || typeof value !== 'object') return false;
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeHookList(hooks) {
  if (!hooks) return [];

  if (isFunction(hooks)) {
    return [hooks];
  }

  if (Array.isArray(hooks)) {
    return hooks.filter(isFunction);
  }

  return [];
}

function normalizeHooks(hooks = {}) {
  const result = {
    beforeRequest: [],
    afterResponse: [],
    beforeError: []
  };

  if (!isPlainObject(hooks)) {
    return result;
  }

  for (const key of HOOK_KEYS) {
    result[key] = normalizeHookList(hooks[key]);
  }

  return result;
}

function hasHookList(hooks) {
  return normalizeHookList(hooks).length > 0;
}

function hasHooks(hooks = {}) {
  if (!isPlainObject(hooks)) return false;

  for (const key of HOOK_KEYS) {
    if (hasHookList(hooks[key])) return true;
  }

  return false;
}

module.exports = {
  isFunction,
  isPlainObject,
  normalizeHookList,
  normalizeHooks,
  hasHookList,
  hasHooks
};

module.exports.default = module.exports;