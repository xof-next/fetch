'use strict';

const { readBuffer } = require('./helpers');

async function hex(res) {
  const buffer = await readBuffer(res);
  return buffer.toString('hex');
}

module.exports = hex;