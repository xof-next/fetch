'use strict';

const { readText } = require('./helpers');

function assignValue(target, key, value) {
  if (!Object.prototype.hasOwnProperty.call(target, key)) {
    target[key] = value;
    return;
  }

  const current = target[key];
  if (Array.isArray(current)) {
    current.push(value);
    return;
  }

  target[key] = [current, value];
}

async function formData(res) {
  const text = await readText(res);
  const params = new URLSearchParams(text);
  const output = {};

  for (const [key, value] of params.entries()) {
    assignValue(output, key, value);
  }

  return output;
}

module.exports = formData;