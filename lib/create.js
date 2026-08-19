'use strict';

const request = require('./request');
const { buildBrowserHeaders } = require('./core/browser/Buildheaders');
const RequestResolver = require('./core/utils/requestResolver');
const { replaceParams, appendQuery } = require('./core/browser/BuildUrls');
const { Disable, Enable, isDisabled, disabledClear, listDisabled } = require('./core/utils/disable');
const { InterceptorManager, runInterceptors } = require('./core/interceptors');
const { runTransform } = require('./core/utils/transform');
const { CookieJar } = require('./core/browser/cookie');
const { isFormData, buildFormDataBody } = require('./core/utils/FormData');
const { createHttpAgent, createHttpsAgent } = require('./core/utils/keepAlive');

const Http_Method = ['delete', 'get', 'head', 'post', 'put', 'patch', 'options', 'trace', 'connect'];

function isPlainObject(value) {
	return Object.prototype.toString.call(value) === '[object Object]';
}

function hasHeaderShape(headers) {
	if(!isPlainObject(headers)) return false;
	if(isPlainObject(headers.common)) {
		return true;
	}
	return Http_Method.some((method) => isPlainObject(headers[method]));
}

function createHeaders(source = {}, url) {
	const headers = {
		common: {},
		delete: {},
		get: {},
		head: {},
		post: {},
		put: {},
		patch: {},
		options: {},
		trace: {},
		connect: {}
	};
	if(!isPlainObject(source)) {
		return headers;
	}
	if(hasHeaderShape(source)) {
		if(isPlainObject(source.common)) {
			Object.assign(headers.common, source.common);
		}
		for(const method of Http_Method) {
			if(isPlainObject(source[method])) {
				Object.assign(headers[method], source[method]);
			}
		}
		for(const [key, value] of Object.entries(source)) {
			if(key === 'common') continue;
			if(Http_Method.includes(key)) continue;
			if(value == null) continue;
			headers.common[key] = value;
		}
		return headers;
	}
	Object.assign(headers.common, source);
	return headers;
}

function mergeHeaderBag(target, source) {
	if(!isPlainObject(source)) {
		return target;
	}
	for(const [key, value] of Object.entries(source)) {
		if(value == null) continue;
		const lower = key.toLowerCase();
		if(lower === 'common') continue;
		if(Http_Method.includes(lower)) continue;
		target[key] = value;
	}
	return target;
}

function resolveRequestHeaders(method, ...sources) {
	const headers = {};
	for(const source of sources) {
		if(!isPlainObject(source)) continue;
		if(isPlainObject(source.common)) {
			mergeHeaderBag(headers, source.common);
		}
		if(method && isPlainObject(source[method])) {
			mergeHeaderBag(headers, source[method]);
		}
		mergeHeaderBag(headers, source);
	}
	return headers;
}

function create(defaultOptions = {}) {
	const defaults = {
		timeout: 40000,
		maxRedirects: 5,
		decompress: true,
		transformRequest: [],
		transformResponse: [],
		headersJar: defaultOptions.headersJar,
		formData: defaultOptions.formData,
		validateStatus: false,
		headers: createHeaders(defaultOptions.headers),
		...defaultOptions
	};
	
	if (defaults.keepAlive && !defaults.agent) {
  	defaults.httpAgent = createHttpAgent(defaults.keepAlive);
  	defaults.httpsAgent = createHttpsAgent(defaults.keepAlive);
     }
     
	async function client(url, options = {}) {
		const method = String(options.method || defaults.method || 'GET').toLowerCase();
		let requestUrl = url;
		if(options.params) {
			requestUrl = replaceParams(requestUrl, options.params);
		}
		if(options.query) {
			requestUrl = appendQuery(requestUrl, options.query);
		}
		const browserType = options.browser || defaults.browser || 'chromium';
		const browserHeaders = browserType === false ? {} : buildBrowserHeaders(browserType, requestUrl, options);

		let headers = isDisabled('headers') ? {
			...(options.headers || {})
		} : resolveRequestHeaders(method, {
			...client.defaults.headers,
			common: {
				...client.defaults.headers.common,
				...browserHeaders
			}
		}, options.headers);
		
		if(!isDisabled('headers')) {
			for(const key of Object.keys(headers)) {
				const feature = `headers.${key.toLowerCase()}`;
				if(isDisabled(feature)) {
					delete headers[key];
				}
			}
		}
		
		const headersJar = options.headersJar ?? client.defaults.headersJar;
		if(headersJar === false) {
			headers = {};
		} else if(Array.isArray(headersJar)) {
			const removeHeaders = new Set(headersJar.map(header => String(header).toLowerCase()));
			for(const key of Object.keys(headers)) {
				if(removeHeaders.has(key.toLowerCase())) {
					delete headers[key];
				}
			}
		}
		const { params, query, ...requestOptions } = options;
		
		let config = {
			...client.defaults,
			...requestOptions,
			url: requestUrl,
			method: method.toUpperCase(),
			headers,
			cookieJar: options.cookieJar === undefined ? client.cookieJar : options.cookieJar
		};
		
		if(client.interceptors?.request) {
			const interceptedConfig = await runInterceptors('request', config, client.interceptors.request);
			if(interceptedConfig) {
				config = interceptedConfig;
			}
		}
		
	  if (isFormData(config.body)) {
    	const formDataOptions = config.formData ?? client.defaults.formData ?? {};
    	const formDataResult = await buildFormDataBody(config.body, config.headers, formDataOptions);
        config.body = formDataResult.body;
        config.headers = formDataResult.headers;
        }
        
		config.body = await runTransform(config.body, config.headers, config.transformRequest);
		
		let response = await request(config.url, config);
		
		if(response && 'data' in response) {
			response.data = await runTransform(response.data, response.headers, config.transformResponse);
		}
		
		if(client.interceptors?.response) {
			const interceptedResponse = await runInterceptors('response', response, client.interceptors.response);
			if(interceptedResponse !== undefined) {
				response = interceptedResponse;
			}
		}
		return response;
	}
	
	client.interceptors = {
		request: new InterceptorManager(),
		response: new InterceptorManager()
	};
	
	client.cookieJar = defaultOptions.cookieJar === true ? new CookieJar() : null;
	client.defaults = defaults;
	client.request = function requestConfig(config = {}) {
		
		if(!config.url) {
			throw new TypeError('Missing request URL');
		}
		return client(config.url, config);
	};
	// Mehtod
	client.get = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'GET'
	});
	client.post = (url, json = {}) => client(url, {
		...RequestResolver(json),
		method: 'POST'
	});
	client.put = (url, json = {}) => client(url, {
		...RequestResolver(json),
		method: 'PUT'
	});
	client.patch = (url, json = {}) => client(url, {
		...RequestResolver(json),
		method: 'PATCH'
	});
	client.delete = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'DELETE'
	});
	client.head = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'HEAD'
	});
	client.options = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'OPTIONS'
	});
	client.trace = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'TRACE'
	});
	client.connect = (url, options = {}) => client(url, {
		...RequestResolver(options),
		method: 'CONNECT'
	});
	// Advanced request methods (full options)
	client.post.options = (url, options = {}) => client(url, {
		...options,
		method: 'POST'
	});
	client.put.options = (url, options = {}) => client(url, {
		...options,
		method: 'PUT'
	});
	client.patch.options = (url, options = {}) => client(url, {
		...options,
		method: 'PATCH'
	});
	client.get.options = (url, options = {}) => client(url, {
		...options,
		method: 'GET'
	});
	client.delete.options = (url, options = {}) => client(url, {
		...options,
		method: 'DELETE'
	});
	client.head.options = (url, options = {}) => client(url, {
		...options,
		method: 'HEAD'
	});
	client.options.options = (url, options = {}) => client(url, {
		...options,
		method: 'OPTIONS'
	});
	client.trace.options = (url, options = {}) => client(url, {
		...options,
		method: 'TRACE'
	});
	client.connect.options = (url, options = {}) => client(url, {
		...options,
		method: 'CONNECT'
	});
	
	// Fungsi
	client.all = Promise.all.bind(Promise);
	client.create = create;
	client.disable = Disable;
	client.enable = Enable;
	client.disabled = listDisabled;
	client.clearDisabled = disabledClear;
	return client;
}

const api = create();

module.exports = api;
module.exports.default = api;
module.exports.create = create;