'use strict';

const { readBuffer, getContentType } = require('./helpers');

async function blob(res) {
  const buffer = await readBuffer(res);
  const type = getContentType(res);

  if (typeof Blob === 'function') {
    return new Blob([buffer], { type });
  }

  return buffer;
}

module.exports = blob;