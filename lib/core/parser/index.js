'use strict';

const stream = require('./stream');
const buffer = require('./buffer');
const text = require('./text');
const json = require('./json');
const arrayBuffer = require('./arrayBuffer');
const bytes = require('./bytes');
const base64 = require('./base64');
const hex = require('./hex');
const lines = require('./lines');
const formData = require('./formData');
const xml = require('./xml');
const documentParser = require('./document');
const blob = require('./blob');
const auto = require('./auto');
const jsonl = require('./jsonl');

const registry = Object.freeze({
  stream,
  buffer,
  text,
  json,
  jsonl,
  arrayBuffer,
  bytes,
  base64,
  hex,
  lines,
  formData,
  xml,
  document: documentParser,
  blob,
  auto
});

const aliases = Object.freeze({
  json: 'json',
  jsonl: 'jsonl',
  ndjson: 'jsonl',
  jsonlines: 'jsonl',
  'json-lines': 'jsonl',
  'json-lines-stream': 'jsonl',
  'nd-json': 'jsonl',
  text: 'text',
  txt: 'text',
  html: 'text',
  htm: 'text',
  stream: 'stream',
  buffer: 'buffer',
  binary: 'buffer',
  arraybuffer: 'arrayBuffer',
  'array-buffer': 'arrayBuffer',
  bytes: 'bytes',
  uint8array: 'bytes',
  blob: 'blob',
  base64: 'base64',
  hex: 'hex',
  lines: 'lines',
  formdata: 'formData',
  'form-data': 'formData',
  xml: 'xml',
  document: 'document',
  dom: 'document',
  auto: 'auto'
});

function resolveResponseType(value = 'json') {
  const normalized = String(value).trim().toLowerCase();
  const type = aliases[normalized];

  if (!type) {
    throw new TypeError(
      `Unsupported responseType "${value}"`
    );
  }

  return type;
}

async function parseResponse(res, responseType = 'json') {
  const type = resolveResponseType(responseType);
  return registry[type](res);
}

async function parseBuffer(bufferData, responseType = 'json') {
  const type = resolveResponseType(responseType);

  switch (type) {
    case 'buffer':
      return bufferData;

    case 'arrayBuffer':
      return bufferData.buffer.slice(
        bufferData.byteOffset,
        bufferData.byteOffset + bufferData.byteLength
      );

    case 'bytes':
      return new Uint8Array(
        bufferData.buffer,
        bufferData.byteOffset,
        bufferData.byteLength
      );

    case 'base64':
      return bufferData.toString('base64');

    case 'hex':
      return bufferData.toString('hex');

    case 'text':
    case 'html':
      return bufferData.toString('utf8');

    case 'json': {
      const textData = bufferData.toString('utf8').trim();
      return textData ? JSON.parse(textData) : null;
    }

    default: {
      const fakeStream = require('stream').Readable.from([bufferData]);
      return registry[type](fakeStream);
    }
  }
}

function toBuffer(data, encoding = 'utf8') {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }

  if (typeof data === 'string') {
    return Buffer.from(data, encoding);
  }

  try {
    return Buffer.from(JSON.stringify(data));
  } catch {
    return Buffer.from(String(data));
  }
}

function toText(data, encoding = 'utf8') {
  if (Buffer.isBuffer(data)) {
    return data.toString(encoding);
  }

  if (typeof data === 'string') {
    return data;
  }

  return JSON.stringify(data);
}

function toJSON(data) {
  if (typeof data === 'object' && data !== null) {
    return data;
  }

  return JSON.parse(Buffer.isBuffer(data)? data.toString('utf8') : String(data)
  );
}

module.exports = {
  ...registry,
  registry,
  aliases,
  resolveResponseType,
  parseResponse,
  parseBuffer,
  toBuffer,
  toText,
  toJSON
};

module.exports.default = module.exports;