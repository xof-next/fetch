'use strict';

const decodeBuffer = require('./core/utils/decode');
const { parseHeaders } = require('./core/browser/Buildheaders');
const responseParser = require('./core/parser');
const normalizeCookies = require('./core/browser/cookie');
const { FetchError } = require('./core/utils/FetchError');
const buildResponseType = require('./core/utils/buildResponseType');
//const createSelector = require('./core/browser/selector');

function readStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    stream.on('error', reject);
  });
}

function getFinalUrl(req, res, fallback) {
  if (res && typeof res.url === 'string' && res.url) {
    return res.url;
  }

  if (req && typeof req.protocol === 'string' && typeof req.host === 'string') {
    return `${req.protocol}//${req.host}${req.path || ''}`;
  }

  return fallback || '';
}

async function buildResponse(req, res, config = {}, meta = {}) {
  // GLOBAL WKWK :V
  const headers = parseHeaders(res.headers || {});
  const status = Number(res.statusCode || 0);
  const statusText = res.statusMessage || '';
  const rawHeaders = Array.isArray(res.rawHeaders) ? res.rawHeaders.slice() : [];
  const rawTrailers = Array.isArray(res.rawTrailers) ? res.rawTrailers.slice() : [];
  const cookies = normalizeCookies(headers);
  const httpVersion = res.httpVersion || 'h2';
  const lower = (key) => key.toLowerCase();
  const redirected = Boolean(meta.redirected);
  const url = getFinalUrl(req, res, config.url);
  const startedAt = typeof meta.startedAt === 'number' ? meta.startedAt : null;
  const endedAt = typeof meta.endedAt === 'number' ? meta.endedAt : Date.now();
  const duration = startedAt === null ? (typeof meta.duration === 'number' ? meta.duration : null) : Math.max(0, endedAt - startedAt);
  const rawBuffer = await readStream(res);
  const buffer = decodeBuffer(rawBuffer, headers, config.decompress !== false);
  const type = buildResponseType(headers, config.responseType);
  const data = await responseParser.parseBuffer(buffer, type) || 'ERR';
  const responseType = config.responseType;
  const protocol = req.protocol || null;
  const socket = req.socket;
  const remoteAddress = socket?.remoteAddress || null;
  const remotePort = socket?.remotePort || null;
  const localAddress = socket?.localAddress || null;
  const localPort = socket?.localPort || null;
  const reusedSocket = req.reusedSocket || false;
  
  if (responseParser.resolveResponseType(responseType) === 'stream') {
    return {
      status,
      ok: status >= 200 && status < 300,
      statusText,
      headers,
      rawHeaders,
      rawTrailers,
      cookies,
      httpVersion,
      redirected,
      url,
      duration,
      config,
      request: req,
      response: res,
      data: res ?? "NOT_RESPONSE"
    };
  }
  
  // RESPONSE DEFAULT 
  
  return {
    toBuffer: () => responseParser.toBuffer(data),
    text: () => responseParser.toText(data),
    json: () => responseParser.toJSON(data),
    arrayBuffer: () => responseParser.toArrayBuffer(data),
    request: req,
    response: res,
    rawHeaders,
    rawTrailers,
    redirected,
    url,
    config,
    requestHeaders: config.headers || {},
    headers,
    remotePort,
    localAddress,
    reusedSocket,
    localPort,
    statusText,
    cookies,
    httpVersion,
    protocol,
    ok: status >= 200 && status < 300,
    duration,
    status,
    data: data ?? "NOT_RESPONSE"
  };
}

module.exports = {
  buildResponse
};

module.exports.default = module.exports;