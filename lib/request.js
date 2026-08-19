'use strict';

const { URL, URLSearchParams } = require('url');
const { FetchError } = require('./core/utils/FetchError');
const { serializeBody } = require('./body');
const { buildResponse } = require('./response');
const { retry } = require('./core/utils/retry');
const { toReadable } = require('./core/utils/stream');
const { getAdapter } = require('./adapters');
const { normalizeHooks, runHooks } = require('./core/hooks');

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);

const DEFAULT_VALIDATE_STATUS = (status) => status >= 200 && status < 300;

function isStream(value) {
  return value && typeof value.pipe === 'function';
}

function resolveUrl(input, baseURL) {
  try {
    if (input instanceof URL) return new URL(input.href);
    if (baseURL) return new URL(String(input), baseURL);
    return new URL(String(input));
  } catch (err) {
    throw new FetchError(
      err?.message || 'Invalid URL',
      FetchError.ERR_INVALID_URL,
      null,
      null,
      null,
      err
    );
  }
}

function appendParams(target, params, paramsSerializer) {
  if (!params) return target;
  if (typeof paramsSerializer === 'function') {
    const serialized = paramsSerializer(params);
    if (serialized) {
      const add = new URLSearchParams(String(serialized));
      for (const [k, v] of add.entries()) target.searchParams.append(k, v);
    }
    return target;
  }
  
  const add = new URLSearchParams();
  if (params instanceof URLSearchParams) {
    for (const [k, v] of params.entries()) add.append(k, v);
  } else if (typeof params === 'string') {
    const tmp = new URLSearchParams(params);
    for (const [k, v] of tmp.entries()) add.append(k, v);
  } else if (Array.isArray(params)) {
    for (const item of params) {
      if (Array.isArray(item) && item.length >= 2) {
        add.append(String(item[0]), String(item[1]));
      }
    }
  } else if (typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      if (Array.isArray(value)) {
        for (const v of value) add.append(key, v == null ? '' : String(v));
      } else if (value instanceof Date) {
        add.append(key, value.toISOString());
      } else if (typeof value === 'object') {
        add.append(key, JSON.stringify(value));
      } else {
        add.append(key, String(value));
      }
    }
  }

  for (const [k, v] of add.entries()) {
    target.searchParams.append(k, v);
  }

  return target;
}

function applyAuth(headers, auth) {
  if (!auth || typeof auth !== 'object') return headers;
  const username = auth.username == null ? '' : String(auth.username);
  const password = auth.password == null ? '' : String(auth.password);
  const hasAuthorization = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
  if (!hasAuthorization) {
    headers.Authorization = 'Basic ' + Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
  }
  return headers;
}

function stripBodyHeaders(headers) {
  for (const key of Object.keys(headers)) {
    const lower = key.toLowerCase();
    if (lower === 'content-length' || lower === 'content-type' || lower === 'transfer-encoding') {
      delete headers[key];
    }
  }
}

function createResponseError(message, code, config, request, response, cause) {
  return new FetchError(message, code, config, request, response, cause);
}

async function request(url, options = {}) {
  return retry(() => executeRequest(url, options),
    {
      retry: options.retry ?? 0,
      retryDelay: options.retryDelay ?? 1000
    }
  );
}

async function executeRequest(url, options = {}) {
  const baseURL = options.baseURL;
  let currentUrl = resolveUrl(url, baseURL);

  let currentMethod = String(options.method || 'GET').toUpperCase();
  let currentHeaders = { ...(options.headers || {}) };
  let currentBody = options.body;

  const config = {
    url: currentUrl.href,
    adapter: options.adapter,
    browser: options.browser ?? false,
    method: currentMethod,
    headers: currentHeaders,
    body: currentBody,
    timeout: Number(options.timeout || 30000),
    maxRedirects: Math.max(0, Number(options.maxRedirects ?? 5)),
    responseType: options.responseType,
    decompress: options.decompress !== false,
    validateStatus: options.validateStatus || false,
    cookieJar: options.cookieJar,
    signal: options.signal,
    agent: options.agent,
    httpAgent: options.httpAgent,
    httpsAgent: options.httpsAgent,
    params: options.params,
    paramsSerializer: options.paramsSerializer,
    auth: options.auth,
    baseURL,
    hooks: normalizeHooks(options.hooks)
  };

  if (config.params) {
    currentUrl = appendParams(currentUrl, config.params, config.paramsSerializer);
  }

  let redirectsLeft = config.maxRedirects;
  let redirected = false;
  const startedAt = Date.now();

  let lastReq = null;
  let lastRes = null;

  try {
    while (true) {
      const beforeRequestState = await runHooks(
        config.hooks.beforeRequest,
        {
          url: currentUrl.href,
          method: currentMethod,
          headers: currentHeaders,
          body: currentBody,
          config
        },
        { config, url: currentUrl.href, method: currentMethod, redirected }
      );

      if (beforeRequestState && typeof beforeRequestState === 'object') {
        if (typeof beforeRequestState.url === 'string' && beforeRequestState.url) {
          currentUrl = resolveUrl(beforeRequestState.url, baseURL);
        }

        if (typeof beforeRequestState.method === 'string' &&
          beforeRequestState.method
        ) {
          currentMethod = beforeRequestState.method.toUpperCase();
        }

        if (beforeRequestState.headers &&
          typeof beforeRequestState.headers === 'object'
        ) {
          currentHeaders = beforeRequestState.headers;
        }

        if ('body' in beforeRequestState) {
          currentBody = beforeRequestState.body;
        }
      }

      currentHeaders = applyAuth(currentHeaders, config.auth);
      
      // CookieJar
      if (config.cookieJar !== false && config.cookieJar) {
      const cookie = config.cookieJar.get(currentUrl.href);
       if (cookie && !currentHeaders.Cookie) {
           currentHeaders.Cookie = cookie;
          }
       }
       
      currentBody = serializeBody(currentBody, currentHeaders);

      const adapter = getAdapter({
        protocol: currentUrl.protocol,
        adapter: config.adapter,
        http2: options.http2 === true
      });

      const { req, res } = await adapter(currentUrl, {
        method: currentMethod,
        headers: currentHeaders,
        body: currentBody,
        timeout: config.timeout,
        signal: config.signal,
        agent: config.agent || (currentUrl.protocol === 'https:' ? config.httpsAgent : config.httpAgent),
        decompress: config.decompress,
        responseType: config.responseType,
        validateStatus: config.validateStatus,
        url: currentUrl.href
      });

      lastReq = req;
      lastRes = res;

      const status = res.statusCode || 0;
      const location = res.headers && (res.headers.location || res.headers.Location);
      const canRedirect = REDIRECT_STATUS.has(status) && location;
      if (config.cookieJar !== false && config.cookieJar) {
        const setCookie = res.headers?.['set-cookie'];

      if (setCookie) {
         config.cookieJar.set(
         currentUrl.href,
         setCookie
        );
     }
   }

      if (canRedirect) {
        if (redirectsLeft <= 0) {
          res.resume();
          throw createResponseError(`Maximum redirects exceeded`,
            FetchError.ERR_FR_TOO_MANY_REDIRECTS,
            { ...config, url: currentUrl.href, method: currentMethod },
            req,
            {
              status,
              statusText: res.statusMessage || '',
              headers: res.headers,
              config,
              request: req,
              url: currentUrl.href,
              redirected
            }
          );
        }

        const nextLocation = Array.isArray(location) ? location[0] : location;
        const nextUrl = new URL(nextLocation, currentUrl);

        if ((status === 307 || status === 308) && isStream(currentBody)) {
          res.resume();
          throw createResponseError(
            `Cannot redirect a streamed request body with ${Number(status)}`,
            FetchError.ERR_NOT_SUPPORT,
            { ...config, url: currentUrl.href, method: currentMethod },
            req,
            {
              status,
              statusText: res.statusMessage || '',
              headers: res.headers,
              config,
              request: req,
              url: currentUrl.href,
              redirected
            }
          );
        }

        redirectsLeft -= 1;
        redirected = true;

        if (status === 303 || ((status === 301 || status === 302) && currentMethod !== 'GET' && currentMethod !== 'HEAD')) {
          currentMethod = 'GET';
          currentBody = null;
          stripBodyHeaders(currentHeaders);
        }

        res.resume();
        currentUrl = nextUrl;
        continue;
      }

      const responseConfig = {
        ...config,
        url: currentUrl.href,
        method: currentMethod
      };

      if (String(config.responseType || '').toLowerCase() === 'stream') {
        let response = {
          data: toReadable(res),
          status,
          statusText: res.statusMessage || '',
          headers: res.headers,
          config: responseConfig,
          ok: status >= 200 && status < 300,
          request: req,
          url: currentUrl.href,
          redirected
        };

        response = await runHooks(
          config.hooks.afterResponse,
          response,
          {
            config: responseConfig,
            request: req,
            response,
            url: currentUrl.href,
            redirected
          }
        );

        if (config.validateStatus) {
        let valid;

         if (typeof config.validateStatus === 'function') {
            valid = config.validateStatus(response.status, response);
        } else if (config.validateStatus === true) {
            valid = response.status >= 200 && response.status < 300;
        }

       if (!valid) {
            throw createResponseError(
                `Request failed with status code ${response.status}`,
                 FetchError.ERR_BAD_RESPONSE,
                 responseConfig,
                 req,
                 response
             );
          }
      }
        return response;
      }

      let response = await buildResponse(
        req,
        res,
        responseConfig,
        {
          startedAt,
          endedAt: Date.now(),
          redirected
        }
      );

      response = await runHooks(
        config.hooks.afterResponse,
        response,
        {
          config: responseConfig,
          request: req,
          response,
          url: currentUrl.href,
          redirected
        }
      );

  if (config.validateStatus) {
  let valid;
  if (typeof config.validateStatus === 'function') {
    valid = config.validateStatus(response.status, response);
  } else if (config.validateStatus === true) {
    valid = response.status >= 200 && response.status < 300;
  }
  if (!valid) {
    throw createResponseError(`Request failed with status code ${response.status}`,
          FetchError.ERR_BAD_RESPONSE,
          responseConfig,
          req,
          response
         );
       }
    }
    return response;
    }
  } catch (err) {
    try {
      const hookedError = await runHooks(
        config.hooks.beforeError,
        err,
        {
          config,
          request: lastReq,
          response: lastRes,
          url: currentUrl.href,
          method: currentMethod,
          redirected
        }
      );
      throw hookedError || err;
     } catch {
      throw err;
    }
  }
}

module.exports = request;
module.exports.default = request;