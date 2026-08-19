'use strict';

const { isString, isBufferLike, isReadable, isAsyncIterable, isResponseLike, hasDataProperty, stripBom, toBuffer } = require('./helpers');

async function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    function cleanup() {
      stream.removeListener('data', onData);
      stream.removeListener('end', onEnd);
      stream.removeListener('error', onError);
      stream.removeListener('close', onClose);
    }

    function onData(chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    function onEnd() {
      cleanup();
      resolve(Buffer.concat(chunks));
    }

    function onClose() {
      cleanup();
      resolve(Buffer.concat(chunks));
    }

    function onError(err) {
      cleanup();
      reject(err);
    }

    stream.on('data', onData);
    stream.once('end', onEnd);
    stream.once('close', onClose);
    stream.once('error', onError);
  });
}

async function readAsyncIterable(iterable) {
  const chunks = [];

  for await (const chunk of iterable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function readResponse(value) {
  if (typeof value.text === 'function') {
    return value.text();
  }

  if (typeof value.arrayBuffer === 'function') {
    const ab = await value.arrayBuffer();
    return Buffer.from(ab).toString('utf8');
  }

  if (typeof value.buffer === 'function') {
    const buf = await value.buffer();
    return Buffer.isBuffer(buf)
      ? buf.toString('utf8')
      : Buffer.from(buf).toString('utf8');
  }

  throw new TypeError('Unsupported Response object');
}

async function decode(input) {

  if (input == null) {
    return '';
  }

  if (isString(input)) {
    return stripBom(input);
  }

  if (isBufferLike(input)) {
    return stripBom(
      toBuffer(input).toString('utf8')
    );
  }

  if (isReadable(input)) {
    const buffer = await readStream(input);

    return stripBom(
      buffer.toString('utf8')
    );
  }

  if (isAsyncIterable(input)) {
    const buffer = await readAsyncIterable(input);

    return stripBom(
      buffer.toString('utf8')
    );
  }

  if (isResponseLike(input)) {
    return stripBom(
      await readResponse(input)
    );
  }

  if (hasDataProperty(input)) {
    return decode(input.data);
  }

  throw new TypeError(`Unsupported JSONL input type: ${Object.prototype.toString.call(input)}`
  );
}

module.exports = decode;

module.exports.default = decode;
module.exports.readStream = readStream;
module.exports.readAsyncIterable = readAsyncIterable;
module.exports.readResponse = readResponse;