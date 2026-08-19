'use strict';

const HOOK_KEYS = Object.freeze([
  'beforeRequest',
  'afterResponse',
  'beforeError'
]);

const HOOK_SET = new Set(HOOK_KEYS);

module.exports = {
  HOOK_KEYS,
  HOOK_SET
};

module.exports.default = module.exports;