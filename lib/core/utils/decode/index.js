'use strict';

const zlib = require('zlib');

function normalizeEncoding(value) {
  if (Array.isArray(value)) {
    return value.join(',').toLowerCase();
  }

  return String(value || '').toLowerCase();
}

function decodeBuffer(buffer, headers = {}, decompress = true) {
  if (!decompress) return buffer;

  const encoding = normalizeEncoding(
    headers['content-encoding']
  );

  if (!encoding || encoding === 'identity') {
    return buffer;
  }

  try {
    if (encoding.includes('gzip') || encoding.includes('x-gzip')) {
      return zlib.gunzipSync(buffer);
    }

    if (encoding.includes('deflate')) {
      try {
        return zlib.inflateSync(buffer);
      } catch {
        return zlib.inflateRawSync(buffer);
      }
    }

    if (encoding.includes('br') && typeof zlib.brotliDecompressSync === 'function') {
      return zlib.brotliDecompressSync(buffer);
    }

    if ( encoding.includes('zstd') && typeof zlib.zstdDecompressSync === 'function') {
      return zlib.zstdDecompressSync(buffer);
   }
  } catch (err) {
    err.code = 'DECODE_ERROR';
    throw err;
  }

  return buffer;
}

module.exports = decodeBuffer;
module.exports.default = decodeBuffer;