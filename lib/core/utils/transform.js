'use strict';

function normalizeTransforms(transforms) {
  if (transforms == null) {
    return [];
  }
  if (typeof transforms === 'function') {
    return [transforms];
  }
  if (Array.isArray(transforms)) {
    return transforms.filter((fn) => typeof fn === 'function');
  }
  return [];
}

async function runTransform(data, headers, transforms, context) {
  const handlers = normalizeTransforms(transforms);
  let result = data;
  for (const transform of handlers) {
    const next = await transform(result, headers, context);
    if (next !== undefined) {
      result = next;
    }
  }

  return result;
}

module.exports = {
  runTransform,
  normalizeTransforms
};

module.exports.default = module.exports;