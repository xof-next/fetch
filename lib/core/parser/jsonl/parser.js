'use strict';

function stripBom(text) {
  return text && text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

function isNoiseLine(value) {
  if (!value) return true;

  if (value === ")]}'" || value === ")]}'\u0000" || value === ")]}']" || value.startsWith(")]}'")) {
    return true;
  }

  if (/^\d+$/.test(value)) {
    return true;
  }

  if (value === '\u001e') {
    return true;
  }

  return false;
}

function safeParse(line) {
  try {
    return { ok: true, value: JSON.parse(line) };
  } catch (error) {
    return { ok: false, error };
  }
}

function parse(text, options = {}) {
  const {
    trim = true,
    skipInvalid = true,
    keepRaw = false,
    skipNoise = true
  } = options;

  if (typeof text !== 'string') {
    throw new TypeError('JSONL parser expects a string');
  }

  const out = [];
  const lines = stripBom(text).split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (trim) line = line.trim();
    if (!line) continue;
    if (skipNoise && isNoiseLine(line)) continue;

    const parsed = safeParse(line);

    if (parsed.ok) {
      out.push(parsed.value);
      continue;
    }

    if (skipInvalid) {
      if (keepRaw) {
        out.push({
          raw: line,
          line: i + 1,
          valid: false,
          error: parsed.error?.message || 'Invalid JSON'
        });
      }
      continue;
    }

    const err = new SyntaxError(`Invalid JSONL at line ${i + 1}: ${parsed.error?.message || 'Invalid JSON'}`);
    err.line = i + 1;
    err.raw = line;
    throw err;
  }

  return out;
}

module.exports = parse;
module.exports.default = parse;
module.exports.stripBom = stripBom;
module.exports.isNoiseLine = isNoiseLine;
module.exports.safeParse = safeParse;