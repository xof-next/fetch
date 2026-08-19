'use strict';

function normalizeResponseType(type) {
  if (!type) return '';

  const t = String(type).trim().toLowerCase();

  if (t === 'arraybuffer' || t === 'array-buffer' || t === 'binary') return 'buffer';
  if (t === 'blob') return 'buffer'; 
  if (t === 'string') return 'text';

  return t;
}

function buildResponseType(headers = {}, responseType) {
  const explicit = normalizeResponseType(responseType);
  if (explicit) return explicit;

  const contentType = String(headers['content-type'] || '').toLowerCase().split(';')[0].trim();
  if (!contentType) return 'buffer';
  
  if (contentType === 'application/json' || contentType.endsWith('+json')) {
    return 'json';
  }

if (
  contentType === 'application/x-ndjson' ||
  contentType === 'application/ndjson' ||
  contentType === 'application/jsonl' ||
  contentType === 'application/x-jsonlines' ||
  contentType === 'application/json-seq'
) {
  return 'jsonl';
}

if (
    contentType.startsWith('text/') ||
    contentType === 'application/xml' ||
    contentType === 'text/xml' ||
    contentType === 'application/xhtml+xml' ||
    contentType === 'image/svg+xml' ||
    contentType === 'application/javascript' ||
    contentType === 'text/javascript' ||
    contentType === 'application/x-www-form-urlencoded'
  ) {
    return 'text';
  }
  
  if (
    contentType.startsWith('image/') ||
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    contentType.startsWith('font/') ||
    contentType === 'application/octet-stream' ||
    contentType === 'application/pdf' ||
    contentType === 'application/zip' ||
    contentType === 'application/gzip' ||
    contentType === 'application/x-gzip' ||
    contentType === 'application/x-bzip2' ||
    contentType === 'application/x-7z-compressed' ||
    contentType === 'application/vnd.ms-fontobject' ||
    contentType === 'application/font-woff' ||
    contentType === 'application/font-woff2' ||
    contentType.startsWith('multipart/')
  ) {
    return 'buffer';
  }

  return 'buffer';
}

module.exports = buildResponseType;
module.exports.default = module.exports;