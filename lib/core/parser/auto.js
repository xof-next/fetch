'use strict';

const {
  getContentType,
  readBuffer,
  readText,
  isProbablyTextBuffer,
  safeJsonParse,
  parseMarkup,
  getHeaderValue
} = require('./helpers');

async function auto(res) {
  const contentType = getContentType(res).toLowerCase();
  const buffer = await readBuffer(res);

  if (buffer.length === 0) return null;

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(buffer.toString('utf8'));
    const out = {};

    for (const [key, value] of params.entries()) {
      if (!Object.prototype.hasOwnProperty.call(out, key)) {
        out[key] = value;
        continue;
      }

      const current = out[key];
      out[key] = Array.isArray(current) ? current.concat(value) : [current, value];
    }

    return out;
  }

  if (contentType.includes('application/json') || contentType.endsWith('+json')) {
    return safeJsonParse(buffer.toString('utf8'));
  }

  if (contentType.includes('text/xml') || contentType.includes('application/xml') || contentType.endsWith('+xml')) {
    return parseMarkup(buffer.toString('utf8'), 'xml');
  }

  if (contentType.includes('text/html')) {
    const text = buffer.toString('utf8');
    return {
      type: 'document',
      contentType: 'html',
      source: text,
      tree: parseMarkup(text, 'html'),
      root: parseMarkup(text, 'html').root,
      children: parseMarkup(text, 'html').children
    };
  }

  if (
    contentType.startsWith('text/') ||
    contentType.includes('javascript') ||
    contentType.includes('ecmascript') ||
    contentType.includes('css')
  ) {
    return buffer.toString('utf8');
  }

  if (
    contentType.startsWith('image/') ||
    contentType.startsWith('audio/') ||
    contentType.startsWith('video/') ||
    contentType.includes('octet-stream')
  ) {
    return buffer;
  }

  if (!contentType && isProbablyTextBuffer(buffer)) {
    const text = buffer.toString('utf8');
    const trimmed = text.trimStart();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(text);
      } catch {}
    }

    if (trimmed.startsWith('<') && /<\/?[A-Za-z_:-][\s\S]*>/.test(trimmed)) {
      if (trimmed.startsWith('<?xml') || /<\/[A-Za-z_:-][^>]*>/.test(trimmed)) {
        return parseMarkup(text, 'xml');
      }

      return {
        type: 'document',
        contentType: 'html',
        source: text,
        tree: parseMarkup(text, 'html'),
        root: parseMarkup(text, 'html').root,
        children: parseMarkup(text, 'html').children
      };
    }

    return text;
  }

  return buffer;
}

module.exports = auto;