'use strict';

function isFunction(val) {
	return typeof val === 'function';
}

function isPlainObject(val) {
	if(val == null || typeof val !== 'object') return false;
	return Object.prototype.toString.call(val) === '[object Object]';
}

function isFormData(val) {
	return typeof FormData !== 'undefined' && val instanceof FormData;
}

function isBlob(val) {
	return typeof Blob !== 'undefined' && val instanceof Blob;
}

function isFile(val) {
	return typeof File !== 'undefined' && val instanceof File;
}

function isArrayBuffer(val) {
	return typeof ArrayBuffer !== 'undefined' && val instanceof ArrayBuffer;
}

function isArrayBufferView(val) {
	return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(val);
}

function isURLSearchParams(val) {
	return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

function trim(str) {
	return String(str).trim();
}

function normalizeHeaderName(name) {
	return String(name).toLowerCase();
}

function parseHeaders(raw) {
	const headers = Object.create(null);
	if(!raw) return headers;
	const lines = String(raw).trim().split(/[\r\n]+/);
	for(let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const index = line.indexOf(':');
		if(index === -1) continue;
		const key = normalizeHeaderName(trim(line.slice(0, index)));
		const value = trim(line.slice(index + 1));
		if(!key) continue;
		if(headers[key] === undefined) {
			headers[key] = value;
		} else {
			headers[key] += ', ' + value;
		}
	}
	return headers;
}

function buildBasicAuth(auth) {
	if(!auth) return null;
	const username = auth.username == null ? '' : String(auth.username);
	const password = auth.password == null ? '' : String(auth.password);
	if(typeof btoa === 'function') {
		return 'Basic ' + btoa(unescape(encodeURIComponent(username + ':' + password)));
	}
	return 'Basic ' + Buffer.from(username + ':' + password, 'utf8').toString('base64');
}

function isUnsafeHeader(name) {
	const n = normalizeHeaderName(name);
	return (n === 'accept-encoding' || n === 'connection' || n === 'content-length' || n === 'cookie' || n === 'cookie2' || n === 'date' || n === 'dnt' || n === 'expect' || n === 'host' || n === 'keep-alive' || n === 'origin' || n === 'referer' || n === 'te' || n === 'trailer' || n === 'transfer-encoding' || n === 'upgrade' || n === 'via' || n === 'user-agent' || n.startsWith('sec-') || n.startsWith('proxy-'));
}

function setRequestHeaders(xhr, headers) {
	if(!headers) return;
	const entries = Array.isArray(headers) ? headers : Object.entries(headers);
	for(let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		const name = entry[0];
		const value = entry[1];
		if(value == null) continue;
		if(isUnsafeHeader(name)) continue;
		try {
			xhr.setRequestHeader(String(name), String(value));
		} catch (e) {
		}
	}
}

function getContentType(headers) {
	if(!headers) return '';
	const lower = Object.create(null);
	const entries = Array.isArray(headers) ? headers : Object.entries(headers);
	for(let i = 0; i < entries.length; i++) {
		const k = normalizeHeaderName(entries[i][0]);
		const v = entries[i][1];
		lower[k] = v;
	}
	return lower['content-type'] ? String(lower['content-type']) : '';
}

function getResponseData(xhr, config) {
	const responseType = (config && config.responseType) ? String(config.responseType) : '';
	if(responseType === 'arraybuffer') return xhr.response;
	if(responseType === 'blob') return xhr.response;
	if(responseType === 'document') return xhr.responseXML || xhr.response;
	if(responseType === 'json') {
		if(xhr.responseType === 'json') return xhr.response;
		const text = xhr.responseText;
		if(!text) return null;
		try {
			return JSON.parse(text);
		} catch (e) {
			return text;
		}
	}
	const text = xhr.responseText;
	const contentType = String(getContentType(xhr.__responseHeaders || {})).toLowerCase();
	if(!responseType && contentType.includes('application/json')) {
		if(text === '') return null;
		try {
			return JSON.parse(text);
		} catch (e) {
			return text;
		}
	}
	return text;
}

function createXHRError(message, config, code, request, response) {
	const error = new Error(message);
	error.name = 'XHRError';
	error.code = code || 'ERR_XHR';
	error.config = config;
	error.request = request;
	if(response) error.response = response;
	return error;
}

function getResponseURL(xhr) {
	try {
		return xhr.responseURL || '';
	} catch (e) {
		return '';
	}
}

function resolveTimeout(config) {
	const t = Number(config && config.timeout);
	return Number.isFinite(t) && t > 0 ? t : 0;
}

function normalizeMethod(method) {
	return String(method || 'GET').toUpperCase();
}

function shouldSendBody(method) {
	return method !== 'GET' && method !== 'HEAD';
}

function serializeBodyIfNeeded(data, headers) {
	if(data == null) return data;
	if(typeof data === 'string' || isFormData(data) || isBlob(data) || isFile(data) || isArrayBuffer(data) || isArrayBufferView(data) || isURLSearchParams(data)) {
		return data;
	}
	if(isPlainObject(data)) {
		const contentType = getContentType(headers).toLowerCase();
		if(!contentType) {
			if(headers && typeof headers === 'object') {
				headers['Content-Type'] = 'application/json;charset=utf-8';
			}
		}
		if(contentType.includes('application/x-www-form-urlencoded')) {
			if(typeof URLSearchParams !== 'undefined') {
				return new URLSearchParams(data).toString();
			}
		}
		return JSON.stringify(data);
	}
	return data;
}

function attachAbortSignal(xhr, config, reject) {
	const signal = config && config.signal;
	if(!signal) return function noop() {};
	if(signal.aborted) {
		try {
			xhr.abort();
		} catch (e) {}
		reject(createXHRError('Request aborted', config, 'ERR_CANCELED', xhr));
		return function noop() {};
	}
	const onAbort = function onAbort() {
		try {
			xhr.abort();
		} catch (e) {}
		reject(createXHRError('Request aborted', config, 'ERR_CANCELED', xhr));
	};
	signal.addEventListener('abort', onAbort, {
		once: true
	});
	return function cleanupAbort() {
		try {
			signal.removeEventListener('abort', onAbort);
		} catch (e) {}
	};
}

function attachCancelToken(xhr, config, reject) {
	const token = config && config.cancelToken;
	if(!token || !token.promise || !isFunction(token.promise.then)) {
		return function noop() {};
	}
	let canceled = false;
	const onCancel = function onCancel(reason) {
		if(canceled) return;
		canceled = true;
		try {
			xhr.abort();
		} catch (e) {}
		reject(createXHRError(reason && reason.message ? reason.message : 'Request canceled', config, 'ERR_CANCELED', xhr));
	};
	token.promise.then(onCancel);
	return function cleanupCancel() {
		canceled = true;
	};
}

function maybeSetXSRFHeader(xhr, config, headers) {
	const cookieName = config && config.xsrfCookieName;
	const headerName = config && config.xsrfHeaderName;
	if(!cookieName || !headerName) return;
	if(typeof document === 'undefined' || !document.cookie) return;
	const cookie = document.cookie.split('; ');
	let token = null;
	for(let i = 0; i < cookie.length; i++) {
		const part = cookie[i];
		if(part.indexOf(cookieName + '=') === 0) {
			token = decodeURIComponent(part.slice(cookieName.length + 1));
			break;
		}
	}
	if(token && headers && headers[headerName] == null && !isUnsafeHeader(headerName)) {
		headers[headerName] = token;
	}
}

function xhrAdapter(config) {
	return new Promise(function(resolve, reject) {
		if(typeof XMLHttpRequest === 'undefined') {
			reject(createXHRError('XMLHttpRequest is not available in this environment', config, 'ERR_XHR_UNAVAILABLE'));
			return;
		}
		const xhr = new XMLHttpRequest();
		const method = normalizeMethod(config && config.method);
		let url = config && config.url ? String(config.url) : '';
		if(!url) {
			reject(createXHRError('Missing request URL', config, 'ERR_INVALID_URL', xhr));
			return;
		}
		const headers = Object.assign(Object.create(null), config && config.headers ? config.headers : null);
		maybeSetXSRFHeader(xhr, config, headers);
		let data = config && config.data;
		if(shouldSendBody(method)) {
			data = serializeBodyIfNeeded(data, headers);
		} else {
			data = null;
		}
		xhr.open(method, url, true);
		if(config && config.withCredentials != null) {
			xhr.withCredentials = !!config.withCredentials;
		}
		const timeout = resolveTimeout(config);
		if(timeout) {
			xhr.timeout = timeout;
		}
		const responseType = config && config.responseType ? String(config.responseType) : '';
		if(responseType) {
			// 'json' is not reliable across older browsers; parse ourselves.
			if(responseType === 'json') {
				try {
					xhr.responseType = 'text';
				} catch (e) {}
			} else if(responseType === 'arraybuffer' || responseType === 'blob' || responseType === 'document' || responseType === 'text') {
				try {
					xhr.responseType = responseType;
				} catch (e) {}
			}
		}
		// Auth
		const basicAuth = buildBasicAuth(config && config.auth);
		if(basicAuth && !headers.Authorization && !headers.authorization) {
			headers.Authorization = basicAuth;
		}
		// Default Accept if caller did not set one.
		if(!headers.Accept && !headers.accept) {
			headers.Accept = 'application/json, text/plain, */*';
		}
		// Content-Type for body if needed and not already set.
		if(data != null && shouldSendBody(method)) {
			const hasContentType = headers['Content-Type'] != null || headers['content-type'] != null;
			if(!hasContentType && !isFormData(data) && !isBlob(data) && !isFile(data) && !isArrayBuffer(data) && !isArrayBufferView(data) && !isURLSearchParams(data)) {
				headers['Content-Type'] = 'application/json;charset=utf-8';
			}
		}
		setRequestHeaders(xhr, headers);
		if(config && config.onDownloadProgress && isFunction(config.onDownloadProgress) && xhr.addEventListener) {
			xhr.addEventListener('progress', function(event) {
				config.onDownloadProgress({
					loaded: event.loaded,
					total: event.lengthComputable ? event.total : undefined,
					progress: event.lengthComputable && event.total ? event.loaded / event.total : undefined,
					lengthComputable: event.lengthComputable,
					event: event
				});
			});
		}
		if(xhr.upload && config && config.onUploadProgress && isFunction(config.onUploadProgress)) {
			xhr.upload.addEventListener('progress', function(event) {
				config.onUploadProgress({
					loaded: event.loaded,
					total: event.lengthComputable ? event.total : undefined,
					progress: event.lengthComputable && event.total ? event.loaded / event.total : undefined,
					lengthComputable: event.lengthComputable,
					event: event
				});
			});
		}
		let cleanupAbort = function noop() {};
		let cleanupCancel = function noop() {};
		let settled = false;

		function finalize(fn) {
			if(settled) return;
			settled = true;
			cleanupAbort();
			cleanupCancel();
			fn();
		}
		xhr.onerror = function onerror() {
			finalize(function() {
				reject(createXHRError('Network Error', config, 'ERR_NETWORK', xhr));
			});
		};
		xhr.ontimeout = function ontimeout() {
			finalize(function() {
				reject(createXHRError('Timeout exceeded', config, 'ECONNABORTED', xhr));
			});
		};
		xhr.onabort = function onabort() {
			finalize(function() {
				reject(createXHRError('Request aborted', config, 'ERR_CANCELED', xhr));
			});
		};
		xhr.onload = function onload() {
			const responseHeaders = parseHeaders(xhr.getAllResponseHeaders());
			xhr.__responseHeaders = responseHeaders;
			const response = {
				data: getResponseData(xhr, config),
				status: xhr.status === 1223 ? 204 : xhr.status,
				statusText: xhr.status === 1223 ? 'No Content' : (xhr.statusText || ''),
				headers: responseHeaders,
				config: config,
				request: xhr,
				url: getResponseURL(xhr),
				redirected: false
			};
			const validateStatus = config && isFunction(config.validateStatus) ? config.validateStatus : function defaultValidateStatus(status) {
				return status >= 200 && status < 300;
			};
			finalize(function() {
				if(!validateStatus(response.status)) {
					reject(createXHRError('Request failed with status code ' + response.status, config, 'ERR_BAD_RESPONSE', xhr, response));
					return;
				}
				resolve(response);
			});
		};
		cleanupAbort = attachAbortSignal(xhr, config, reject);
		cleanupCancel = attachCancelToken(xhr, config, reject);
		try {
			xhr.send(data == null ? null : data);
		} catch (err) {
			finalize(function() {
				reject(createXHRError(err && err.message ? err.message : 'XHR send failed', config, 'ERR_SEND', xhr));
			});
		}
	});
}

module.exports = xhrAdapter;
module.exports.default = xhrAdapter;