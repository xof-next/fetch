'use strict';

const { readText, getContentType, parseMarkup } = require('./helpers');

async function documentParser(res) {
  const text = await readText(res);
  const contentType = getContentType(res).toLowerCase();

  const mode =
    contentType.includes('xml') || contentType.endsWith('+xml')
      ? 'xml'
      : 'html';

  const tree = parseMarkup(text, mode);

  return {
    type: 'document',
    contentType: mode,
    source: text,
    tree,
    root: tree.root,
    children: tree.children
  };
}

module.exports = documentParser;