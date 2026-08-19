'use strict';

const { Readable } = require('../utils/stream');

const HTML_VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function getHeaderValue(headers, key) {
  if (!headers || typeof headers !== 'object') return '';

  const target = String(key).toLowerCase();

  for (const [name, value] of Object.entries(headers)) {
    if (String(name).toLowerCase() !== target) continue;

    if (Array.isArray(value)) return value.join(', ');
    return value == null ? '' : String(value);
  }

  return '';
}

function getContentType(res) {
  return getHeaderValue(res && res.headers, 'content-type');
}

function normalizeChunk(chunk) {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  if (chunk instanceof ArrayBuffer) return Buffer.from(chunk);
  if (chunk && chunk.buffer instanceof ArrayBuffer && typeof chunk.byteLength === 'number') {
    return Buffer.from(chunk.buffer, chunk.byteOffset || 0, chunk.byteLength);
  }
  return Buffer.from(String(chunk));
}

async function readBuffer(stream) {
  if (!stream) return Buffer.alloc(0);

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(normalizeChunk(chunk));
  }

  return Buffer.concat(chunks);
}

async function readText(stream) {
  return (await readBuffer(stream)).toString('utf8');
}

function bufferToArrayBuffer(buffer) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
}

function bufferToUint8Array(buffer) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
}

function safeJsonParse(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function looksLikeJson(text) {
  const raw = String(text ?? '').trimStart();
  return raw.startsWith('{') || raw.startsWith('[');
}

function looksLikeXml(text) {
  const raw = String(text ?? '').trimStart();
  return raw.startsWith('<') && /<\/?[A-Za-z_:-][\s\S]*>/.test(raw);
}

function isProbablyTextBuffer(buffer) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (view.length === 0) return true;

  const limit = Math.min(view.length, 512);
  let suspicious = 0;

  for (let i = 0; i < limit; i += 1) {
    const byte = view[i];

    if (byte === 0) return false;

    const isControl =
      byte < 7 ||
      (byte > 13 && byte < 32) ||
      byte === 127;

    if (isControl && byte !== 9 && byte !== 10 && byte !== 13) {
      suspicious += 1;
    }
  }

  return suspicious / limit < 0.3;
}

function parseAttributes(attrText = '') {
  const attrs = {};
  const re = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  let match;
  while ((match = re.exec(attrText))) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = value;
  }

  return attrs;
}

function createNode(name, attributes = {}) {
  return {
    type: 'element',
    name,
    attributes,
    children: [],
    text: ''
  };
}

function appendText(node, text) {
  const value = String(text ?? '');
  if (!value) return;

  node.children.push({
    type: 'text',
    value
  });

  node.text += value;
}

function closeToTag(stack, tagName) {
  const target = String(tagName).toLowerCase();

  for (let i = stack.length - 1; i > 0; i -= 1) {
    const node = stack[i];
    if (node && node.type === 'element' && String(node.name).toLowerCase() === target) {
      stack.length = i;
      return;
    }
  }
}

function parseMarkup(source = '', kind = 'xml') {
  const input = String(source ?? '');
  const root = {
    type: 'document',
    children: []
  };

  const stack = [root];
  const tagRe = /<!--[\s\S]*?-->|<\!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[^>]+?>/g;

  let lastIndex = 0;
  let match;

  while ((match = tagRe.exec(input))) {
    const before = input.slice(lastIndex, match.index);
    if (before) appendText(stack[stack.length - 1], before);

    const token = match[0];

    if (token.startsWith('<!--') || token.startsWith('<?')) {
      lastIndex = tagRe.lastIndex;
      continue;
    }

    if (token.startsWith('<![CDATA[')) {
      appendText(stack[stack.length - 1], token.slice(9, -3));
      lastIndex = tagRe.lastIndex;
      continue;
    }

    if (token.startsWith('</')) {
      const closeTag = token.slice(2, -1).trim().split(/\s+/)[0];
      if (closeTag) closeToTag(stack, closeTag);
      lastIndex = tagRe.lastIndex;
      continue;
    }

    const selfClosing = /\/\s*>$/.test(token);
    const inner = token.slice(1, token.length - (selfClosing ? 2 : 1)).trim();

    const spaceIndex = inner.search(/\s/);
    const tagName = (spaceIndex === -1 ? inner : inner.slice(0, spaceIndex)).trim();
    const attrText = spaceIndex === -1 ? '' : inner.slice(spaceIndex + 1);

    if (!tagName) {
      lastIndex = tagRe.lastIndex;
      continue;
    }

    const node = createNode(tagName, parseAttributes(attrText));
    const parent = stack[stack.length - 1];

    if (parent.children) {
      parent.children.push(node);
    }

    const isVoid = kind === 'html' && HTML_VOID_ELEMENTS.has(tagName.toLowerCase());

    if (!selfClosing && !isVoid) {
      stack.push(node);
    }

    lastIndex = tagRe.lastIndex;
  }

  const tail = input.slice(lastIndex);
  if (tail) appendText(stack[stack.length - 1], tail);

  const rootElement = root.children.find((item) => item && item.type === 'element') || null;

  return {
    type: kind,
    source: input,
    root: rootElement,
    children: root.children
  };
}

module.exports = {
  getHeaderValue,
  getContentType,
  normalizeChunk,
  readBuffer,
  readText,
  bufferToArrayBuffer,
  bufferToUint8Array,
  safeJsonParse,
  looksLikeJson,
  looksLikeXml,
  isProbablyTextBuffer,
  parseAttributes,
  createNode,
  appendText,
  parseMarkup
};