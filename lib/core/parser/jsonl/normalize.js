'use strict';

function normalize(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value == null) {
    return [];
  }

  return [value];
}

module.exports = normalize;
module.exports.default = normalize;