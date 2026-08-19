'use strict';

const { readBuffer, bufferToUint8Array } = require('./helpers');

async function bytes(res) {
  const buffer = await readBuffer(res);
  return bufferToUint8Array(buffer);
}

module.exports = bytes;