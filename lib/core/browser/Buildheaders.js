'use strict';

const { resolveFingerprint } = require('./UserAgent');

function buildBrowserHeaders(type = 'chromium', url, options = {}) {
  const fp = resolveFingerprint(type);
  const browser = fp.browser;

  let origin = '';
  let referer = '';
  let host = "";
  
  if (url) {
    try {
      const target = new URL(url);
      origin = target.origin;
      host = target.host;
      referer = `${target.origin}/`;
    } catch {}
  }
  
  function randomBooleanHeader() {
     return Math.random() > 0.5 ? '?1' : '?0';
 }

  function fallback(value, defaultValue) {
     return value !== undefined && value !== null && value !== '' ? value : defaultValue;
  }
  
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Priority': 'u=0, i',
    'DNT': '1',
    'Sec-GPC': '1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': fp.userAgent,
    ...(host && {
      Host: host
    }),
    ...(origin && {
      Origin: origin
    }),
    ...(referer && {
      Referer: referer
    }),
    ...(options.ifNoneMatch && {
      'If-None-Match': options.ifNoneMatch
    }),
    ...(options.ifModifiedSince && {
      'If-Modified-Since': options.ifModifiedSince
    })
  };
 
 if (options.browser) {
   headers['Sec-CH-UA'] = fallback(fp.secChUa, `"Google Chrome";v="139", "Chromium";v="139", "Not.A/Brand";v="24"`);
   headers['Sec-CH-UA-Full-Version-List'] = fallback(fp.secChUaFullVersionList,`"Google Chrome";v="139.0.0.0", "Chromium";v="139.0.0.0", "Not.A/Brand";v="24.0.0.0"`);
   headers['Sec-CH-UA-Mobile'] = fallback(fp.secChUaMobile, randomBooleanHeader());
   headers['Sec-CH-UA-Platform'] = fallback(fp.secChUaPlatform,'Windows');
   headers['Sec-CH-UA-Platform-Version'] = fallback(fp.secChUaPlatformVersion, '10.0.0');
   headers['Sec-CH-UA-Arch'] = fallback(fp.secChUaArch,'x86');
   headers['Sec-CH-UA-Bitness'] = fallback(fp.secChUaBitness, '64');
   headers['Sec-CH-UA-Model'] = fallback(fp.secChUaModel, '');
   headers['Sec-CH-Prefers-Color-Scheme'] = fallback(fp.secChPrefersColorScheme, 'light');
   headers['Sec-CH-Prefers-Reduced-Motion'] = fallback(fp.secChPrefersReducedMotion, 'no-preference');
   headers['Sec-Fetch-Dest'] = 'document';
   headers['Sec-Fetch-Mode'] = 'navigate';
   headers['Sec-Fetch-Site'] = 'none';
   headers['Sec-Fetch-User'] = '?1';
  }
  
  else if (browser === 'chromium' || browser === 'edge') {
    headers['Sec-CH-UA'] = fp.secChUa;
    headers['Sec-CH-UA-Full-Version-List'] = fp.secChUaFullVersionList;
    headers['Sec-CH-UA-Mobile'] = fp.model ? '?1' : '?0';
    headers['Sec-CH-UA-Platform'] = fp.secChUaPlatform;
    headers['Sec-CH-UA-Platform-Version'] = fp.secChUaPlatformVersion;
    headers['Sec-CH-UA-Arch'] = fp.secChUaArch;
    headers['Sec-CH-UA-Bitness'] = fp.secChUaBitness;
    headers['Sec-CH-UA-Model'] = fp.secChUaModel;
    headers['Sec-CH-Prefers-Color-Scheme'] = fp.secChPrefersColorScheme;
    headers['Sec-CH-Prefers-Reduced-Motion'] = fp.secChPrefersReducedMotion;
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  else if (browser === 'firefox') {
    headers['Sec-Fetch-Dest'] = 'document';
    headers['Sec-Fetch-Mode'] = 'navigate';
    headers['Sec-Fetch-Site'] = 'none';
    headers['Sec-Fetch-User'] = '?1';
  }

  return headers;
}

function parseHeaders(headers) {
  const result = Object.create(null);
  if (!headers) return result;
  if (typeof headers.entries === 'function') {
    for (const [key, value] of headers.entries()) {
      const name = key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(result, name)) {
        if (Array.isArray(result[name])) {
          result[name].push(value);
        } else {
          result[name] = [result[name], value];
        }
      } else {
        result[name] = value;
      }
    }

    // Undici / Node.js
    if (typeof headers.getSetCookie === 'function') {
      const cookies = headers.getSetCookie();
      if (cookies.length) {
        result['set-cookie'] = cookies;
      }
    }
  }

  else {
    for (const key of Object.keys(headers)) {
      result[key.toLowerCase()] = headers[key];
    }
  }

  Object.defineProperties(result, {
    raw: {
      value: headers,
      enumerable: false
    },

    get: {
      enumerable: false,
      value(name) {
        return result[String(name).toLowerCase()];
      }
    },

    has: {
      enumerable: false,
      value(name) {
        return Object.prototype.hasOwnProperty.call(
          result,
          String(name).toLowerCase()
        );
      }
    },

    keys: {
      enumerable: false,
      value() {
        return Object.keys(result);
      }
    },

    values: {
      enumerable: false,
      value() {
        return Object.values(result);
      }
    },

    entries: {
      enumerable: false,
      value() {
        return Object.entries(result);
      }
    },

    toJSON: {
      enumerable: false,
      value() {
        return { ...result };
      }
    }
  });

  return result;
}

module.exports = {
  buildBrowserHeaders,
  parseHeaders
};

module.exports.default = module.exports;