'use strict';

const decode = require('./decode');
const parse = require('./parser');
const normalize = require('./normalize');

async function jsonl(input, options = {}) {
  const text = await decode(input, options);
  const parsed = await parse(text, options);
  return normalize(parsed, options);
}

module.exports = jsonl;
module.exports.default = jsonl;

module.exports.decode = decode;
module.exports.parse = parse;
module.exports.normalize = normalize;