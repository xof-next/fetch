'use strict';

const { readBuffer } = require('./helpers');

async function buffer(res) {
  return readBuffer(res);
}

module.exports = buffer;