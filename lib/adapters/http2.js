'use strict';

const http2 = require('http2');
const { Readable } = require('stream');
const { FetchError } = require('../core/utils/FetchError');
const { setupAbort } = require('../core/utils/FetchCancel');

const Forbidden = new Set(['connection', 'host', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'upgrade', 'te']);

function normalizeHeaders(headers = {}) {
	const result = {};
	for(const [key, value] of Object.entries(headers)) {
		if(Forbidden.has(key.toLowerCase())) {
			continue;
		}
		result[key] = value;
	}
	return result;
}

function isStream(value) {
	return value && typeof value.pipe === 'function';
}

function toFetchError(err, code, config, req, response) {
	if(err instanceof FetchError) return err;
	return new FetchError(err?.message || 'Request failed', code || err?.code || FetchError.ERR_NETWORK, config, req, response || null, err);
}

function http2Adapter(url, config = {}) {
	return new Promise((resolve, reject) => {
		let client;
		let req;
		let settled = false;
		let bodyStream;
		let removeAbort;
		const cleanup = () => {
			if(removeAbort) {
				removeAbort();
				removeAbort = null;
			}
			if(bodyStream) {
				bodyStream.removeListener('error', onBodyError);
				bodyStream = null;
			}
		};
		const doneReject = (err) => {
			if(settled) return;
			settled = true;
			cleanup();
			if(client && !client.closed && !client.destroyed) {
				client.destroy();
			}
			reject(err);
		};
		const doneResolve = (value) => {
			if(settled) return;
			settled = true;
			resolve(value);
		};
		const onBodyError = (err) => {
			if(req && !req.closed) {
				req.close();
			}
			doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
		};
		try {
			if(config.signal?.aborted) {
				return doneReject(new FetchError('Request aborted', FetchError.ERR_CANCELED, config));
			}
			client = http2.connect(`${url.protocol}//${url.host}`, {
				rejectUnauthorized: config.rejectUnauthorized !== false,
				...(config.http2 || {})
			});
			client.once('error', (err) => {
				client = null;
				doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
			});
			client.once('goaway', () => {
				if(req && !req.closed) {
					req.close();
				}
			});
			const headers = {
				':method': (config.method || 'GET').toUpperCase(),
				':path': `${url.pathname || '/'}${url.search || ''}`,
				':scheme': url.protocol.replace(':', ''),
				':authority': url.host,
				...normalizeHeaders(config.headers)
			};
			// HTTP/2 forbidden headers
			req = client.request(headers);
			client.once('error', (err) => {
				doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
			});
			const timeout = Number(config.timeout || 0);
			if(timeout > 0) {
				req.setTimeout(timeout, () => {
					if(!req.closed) {
						req.close();
					}
					doneReject(new FetchError(`timeout of ${timeout}ms exceeded`, FetchError.ETIMEDOUT, config, req));
				});
			}
			removeAbort = setupAbort(req, config.signal, () => {
				if(req && !req.closed) {
					req.close();
				}
				doneReject(new FetchError('Request aborted', FetchError.ERR_CANCELED, config, req));
			});
			req.once('response', (headers) => {
				const responseHeaders = {};
				for(const [key, value] of Object.entries(headers)) {
					if(!key.startsWith(':')) {
						responseHeaders[key.toLowerCase()] = value;
					}
				}
				const res = new Readable({
					read() {}
				});
				res.complete = false;
				req.on('data', chunk => {
					res.push(chunk);
				});
				req.once('end', () => {
					res.complete = true;
					res.push(null);
					if(removeAbort) {
						removeAbort();
						removeAbort = null;
					}
				});
				req.once('aborted', () => {
					const err = new FetchError('Response aborted', FetchError.ERR_NETWORK, config, req, res);
					res.destroy(err);
					doneReject(err);
				});
				req.once('close', () => {
					if(!res.complete) {
						res.destroy(new FetchError('Response closed unexpectedly', FetchError.ERR_NETWORK, config, req, res));
					}
					if(client && !client.closed && !client.destroyed) {
						client.close();
					}
				});
				res.statusCode = headers[':status'] || 0;
				res.statusMessage = '';
				res.headers = responseHeaders;
				res.rawHeaders = headers;
				res.protocol = 'h2';
				res.httpVersion = 'h2';
				res.http2Session = client;
				res.alpnProtocol = client.alpnProtocol;
				res.socket = client.socket;
				res.trailers = {};
				req.once('trailers', (trailers) => {
					res.trailers = trailers;
				});
				doneResolve({
					req,
					res
				});
			});
			const body = config.body;
			if(body != null) {
				if(isStream(body)) {
					bodyStream = body;
					bodyStream.once('error', onBodyError);
					bodyStream.pipe(req);
				} else {
					let payload = body;
					if(typeof body === 'object' && !Buffer.isBuffer(body) && !(body instanceof Uint8Array)) {
						payload = JSON.stringify(body);
					}
					req.end(payload);
				}
			} else {
				req.end();
			}
		} catch (err) {
			if(client && !client.closed && !client.destroyed) {
				client.destroy();
				client = null;
			}
			doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
		}
	});
}


module.exports = http2Adapter;
module.exports.default = http2Adapter;