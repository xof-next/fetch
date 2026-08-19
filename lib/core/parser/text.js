'use strict';

const { readText } = require('./helpers');

async function text(res) {
  return readText(res);
}

module.exports = text;