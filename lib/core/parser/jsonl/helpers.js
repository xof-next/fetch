'use strict';

const { Readable } = require('stream');

function isString(value) {
  return typeof value === 'string';
}

function isBuffer(value) {
  return Buffer.isBuffer(value);
}

function isUint8Array(value) {
  return value instanceof Uint8Array;
}

function isArrayBuffer(value) {
  return value instanceof ArrayBuffer;
}

function isArrayBufferView(value) {
  return ArrayBuffer.isView(value);
}

function isBufferLike(value) {
  return (
    isBuffer(value) ||
    isUint8Array(value) ||
    isArrayBuffer(value) ||
    isArrayBufferView(value)
  );
}

function isReadable(value) {
  return (
    value instanceof Readable ||
    (
      value &&
      typeof value === 'object' &&
      typeof value.pipe === 'function' &&
      typeof value.on === 'function'
    )
  );
}

function isAsyncIterable(value) {
  return (
    value &&
    typeof value[Symbol.asyncIterator] === 'function'
  );
}

function isResponseLike(value) {
  return (
    value &&
    typeof value === 'object' &&
    (
      typeof value.text === 'function' ||
      typeof value.arrayBuffer === 'function' ||
      typeof value.buffer === 'function'
    )
  );
}

function hasDataProperty(value) {
  return (
    value &&
    typeof value === 'object' &&
    Object.prototype.hasOwnProperty.call(value, 'data')
  );
}

function stripBom(text) {
  if (!isString(text) || text.length === 0) {
    return '';
  }

  return text.charCodeAt(0) === 0xFEFF
    ? text.slice(1)
    : text;
}

function toBuffer(value, encoding = 'utf8') {
  if (isBuffer(value)) {
    return value;
  }

  if (isUint8Array(value)) {
    return Buffer.from(value);
  }

  if (isArrayBuffer(value)) {
    return Buffer.from(new Uint8Array(value));
  }

  if (isArrayBufferView(value)) {
    return Buffer.from(
      value.buffer,
      value.byteOffset,
      value.byteLength
    );
  }

  if (isString(value)) {
    return Buffer.from(value, encoding);
  }

  throw new TypeError('Unsupported buffer source');
}

module.exports = {
  isString,
  isBuffer,
  isUint8Array,
  isArrayBuffer,
  isArrayBufferView,
  isBufferLike,
  isReadable,
  isAsyncIterable,
  isResponseLike,
  hasDataProperty,
  stripBom,
  toBuffer
};

module.exports.default = module.exports;