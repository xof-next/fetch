'use strict';

const { readBuffer } = require('./helpers');

async function base64(res) {
  const buffer = await readBuffer(res);
  return buffer.toString('base64');
}

module.exports = base64;