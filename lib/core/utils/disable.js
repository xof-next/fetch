'use strict';

const disabled = new Set();

const Valid = new Set(['headers' ]);

function normalize(feature) {
  return String(feature).trim().toLowerCase();
}

function isValid(feature) {
  const root = normalize(feature).split('.')[0];
  return Valid.has(root);
}

function disable(features) {
  if (Array.isArray(features)) {
    for (const feature of features) {
      if (typeof feature !== 'string') continue;
      const value = normalize(feature);
      if (!value || !isValid(value)) continue;
      disabled.add(value);
    }
    return;
  }

  if (typeof features === 'string') {
    const value = normalize(features);
    if (!value || !isValid(value)) return;
    disabled.add(value);
  }
}

function enable(features) {
  if (Array.isArray(features)) {
    for (const feature of features) {
      if (typeof feature !== 'string') continue;
      const value = normalize(feature);
      if (!value || !isValid(value)) continue;
      disabled.delete(value);
    }
    return;
  }

  if (typeof features === 'string') {
    const value = normalize(features);
    if (!value || !isValid(value)) return;
    disabled.delete(value);
  }
}

function isDisabled(feature) {
  feature = normalize(feature);
  if (disabled.has(feature)) {
    return true;
  }
  const parts = feature.split('.');
  while (parts.length > 1) {
    parts.pop();
    if (disabled.has(parts.join('.'))) {
      return true;
    }
  }

  return false;
}

function clear() {
  disabled.clear();
}

function list() {
  return [...disabled];
}

module.exports = {
  Disable: disable,
  Enable: enable,
  isDisabled,
  disabledClear: clear,
  listDisabled: list
};