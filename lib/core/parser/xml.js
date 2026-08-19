'use strict';

const { readText, parseMarkup } = require('./helpers');

async function xml(res) {
  const text = await readText(res);
  return parseMarkup(text, 'xml');
}

module.exports = xml;