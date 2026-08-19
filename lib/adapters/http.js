'use strict';

const http = require('http');
const { FetchError } = require('../core/utils/FetchError');
const { setupAbort } = require('../core/utils/FetchCancel');

function isStream(value) {
	return value && typeof value.pipe === 'function';
}

function buildOptions(url, config = {}) {
	if(!url || typeof url !== 'object') {
		throw new FetchError('Invalid URL object', FetchError.ERR_INVALID_URL, config);
	}
	return {
		protocol: url.protocol,
		hostname: url.hostname,
		port: url.port || 80,
		path: `${url.pathname || '/'}${url.search || ''}`,
		method: (config.method || 'GET').toUpperCase(),
		headers: config.headers || {},
		agent: config.agent,
		family: config.family,
		localAddress: config.localAddress,
		auth: config.auth,
		setHost: config.setHost
	};
}

function toFetchError(err, code, config, req, response) {
	if(err instanceof FetchError) {
		return err;
	}
	return new FetchError(err?.message || 'Request failed', code || err?.code || FetchError.ERR_NETWORK, config, req, response || null, err);
}

function httpAdapter(url, config = {}) {
	return new Promise((resolve, reject) => {
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
			if(req) {
				req.removeListener('error', onReqError);
				req.removeListener('close', onReqClose);
			}
		};
		const doneResolve = (value) => {
			if(settled) return;
			settled = true;
			resolve(value);
		};
		const doneReject = (err) => {
			if(settled) return;
			settled = true;
			cleanup();
			reject(err);
		};
		const onReqError = (err) => {
			doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
		};
		const onReqClose = () => {};
		const onBodyError = (err) => {
			if(req && !req.destroyed) {
				req.destroy(err);
			}
			doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
		};
		try {
			if(config.signal?.aborted) {
				return doneReject(new FetchError('Request aborted', FetchError.ERR_CANCELED, config));
			}
			req = http.request(buildOptions(url, config), (res) => {
				res.complete = false;
				res.once('end', () => {
					res.complete = true;
					if(removeAbort) {
						removeAbort();
						removeAbort = null;
					}
				});
				res.once('aborted', () => {
					doneReject(new FetchError('Response aborted', FetchError.ERR_NETWORK, config, req, res));
				});
				res.protocol = 'http';
				res.httpVersion = 'http';
				res.rawHeaders = res.rawHeaders || [];
				res.request = req;
				res.socket = req.socket;
				doneResolve({
					req,
					res
				});
			});
			req.once('error', onReqError);
			req.once('close', onReqClose);
			const timeout = Number(config.timeout || 0);
			if(timeout > 0) {
				req.setTimeout(timeout, () => {
					req.destroy(new FetchError(`timeout of ${timeout}ms exceeded`, FetchError.ETIMEDOUT, config, req));
				});
			}
			removeAbort = setupAbort(req, config.signal, () => {
				if(req && !req.destroyed) {
					req.destroy(new FetchError('Request aborted', FetchError.ERR_CANCELED, config, req));
				}
			});
			const body = config.body;
			if(body != null) {
				if(isStream(body)) {
					bodyStream = body;
					bodyStream.once('error', onBodyError);
					bodyStream.pipe(req);
					return;
				}
				if(Buffer.isBuffer(body) || body instanceof Uint8Array || typeof body === 'string') {
					req.end(body);
					return;
				}
				if(typeof body === 'object') {
					req.end(JSON.stringify(body));
					return;
				}
				req.end(String(body));
				return;
			}
			req.end();
		} catch (err) {
			doneReject(toFetchError(err, err?.code || FetchError.ERR_NETWORK, config, req));
		}
	});
}


module.exports = httpAdapter;
module.exports.default = httpAdapter;