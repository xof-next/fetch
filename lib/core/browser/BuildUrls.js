'use strict';

function replaceParams(url, params = {}) {
  return String(url).replace(/:([A-Za-z0-9_]+)/g, (_, key) =>
    key in params ? encodeURIComponent(params[key]) : _
  );
}

function appendQuery(url, query = {}) {
  const u = new URL(url);

  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        u.searchParams.append(key, item);
      }
    } else {
      u.searchParams.set(key, value);
    }
  }

  return u.toString();
}

module.exports = { replaceParams, appendQuery };