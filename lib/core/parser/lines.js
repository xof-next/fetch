'use strict';

const { readText } = require('./helpers');

async function lines(res) {
  const text = await readText(res);
  if (!text) return [];
  return text.split(/\r?\n/).filter((line) => line.length > 0);
}

module.exports = lines;