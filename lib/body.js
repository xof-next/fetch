'use strict';

const { Readable } = require('stream');

function isPlainObject(value) {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasHeader(headers, name) {
  const target = String(name).toLowerCase();
  
  return Object.keys(headers || {}).some(
    key => key.toLowerCase() === target
  );
}

function setHeader(headers, name, value) {
  if (!hasHeader(headers, name)) {
    headers[name] = value;
  }
}

function serializeBody(body, headers = {}) {
	 
  if (body == null) {
    return null;
  }

  if (typeof body === 'string') {
    setHeader(headers, 'Content-Type', 'text/plain;charset=UTF-8');
    return body;
  }

  if (Buffer.isBuffer(body)) {
    setHeader(headers, 'Content-Length', String(body.length));
    return body;
  }

  if (body instanceof ArrayBuffer) {
    const buffer = Buffer.from(body);

    setHeader(headers, 'Content-Length', String(buffer.length));

    return buffer;
  }

  if (ArrayBuffer.isView(body)) {
    const buffer = Buffer.from(body.buffer, body.byteOffset, body.byteLength);

    setHeader(headers, 'Content-Length', String(buffer.length));
   
    return buffer;
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    setHeader(headers, 'Content-Type', body.type || 'application/octet-stream');
    return body;
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body;
  }

  if (body instanceof URLSearchParams) {
    setHeader(
      headers,
      'Content-Type',
      'application/x-www-form-urlencoded;charset=UTF-8'
    );

    return body.toString();
  }

  if (body instanceof Readable || typeof body.pipe === 'function') {
    return body;
  }

  if (Array.isArray(body) || isPlainObject(body)) {
    setHeader(headers, 'Content-Type', 'application/json');

    return JSON.stringify(body);
  }
  
  return body;
}

module.exports = {
  serializeBody,
  isPlainObject
};

module.exports.default = module.exports;