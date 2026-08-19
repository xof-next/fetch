'use strict';

const CookieJar = require('./jar');

const mapping = new Map([
  ['set-cookie', 'set-cookie'],
  ['set-cookies', 'set-cookies'],
  ['cookie', 'cookie'],
  ['cookies', 'cookies'],
  ['set-cookie2', 'set-cookie2'],
  ['cookie2', 'cookie2']
]);

function toArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(toArray);
  return [String(value).trim()].filter(Boolean);
}

function normalizeCookies(headers = {}) {
  if (!headers || typeof headers !== 'object') return {};
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = String(key).toLowerCase();
    const canonical = mapping.get(lower);
    if (!canonical) continue;
    const list = toArray(value);
    if (!list.length) continue;
    if (!result[canonical]) result[canonical] = [];
    result[canonical].push(...list);
  }
  for (const key of Object.keys(result)) {
    result[key] = [...new Set(result[key])];
  }
  return result;
}

module.exports = normalizeCookies;
module.exports.default = module.exports;
module.exports.CookieJar = CookieJar;