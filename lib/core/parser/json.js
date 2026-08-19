'use strict';

const { readText, safeJsonParse } = require('./helpers');

async function json(res) {
  const text = await readText(res);
  return safeJsonParse(text);
}

module.exports = json;