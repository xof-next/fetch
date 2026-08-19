'use strict';

const { readBuffer, bufferToArrayBuffer } = require('./helpers');

async function arrayBuffer(res) {
  const buffer = await readBuffer(res);
  return bufferToArrayBuffer(buffer);
}

module.exports = arrayBuffer;