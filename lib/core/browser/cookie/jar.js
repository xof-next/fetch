'use strict';

const { URL } = require('url');

function parseSetCookie(cookie) {
  const parts = String(cookie).split(';').map(v => v.trim());
  const [nameValue] = parts;
  const index = nameValue.indexOf('=');
  if (index === -1) return null;
  const name = nameValue.slice(0, index);
  const value = nameValue.slice(index + 1);
  const data = {
    name,
    value,
    path: '/',
    domain: null,
    expires: null
  };

  for (let i = 1; i < parts.length; i++) {
    const [key, val] = parts[i].split('=');
    const lower = key.toLowerCase();
    if (lower === 'path' && val) {
      data.path = val;
    }
    if (lower === 'domain' && val) {
      data.domain = val.replace(/^\./, '');
    }
    if (lower === 'expires' && val) {
      const date = new Date(val);
      if (!Number.isNaN(date.getTime())) {
        data.expires = date;
      }
    }
  }

  return data;
}

class CookieJar {
  constructor() {
    this.cookies = [];
  }

  set(url, cookies) {
    if (!cookies) return;
    const target = new URL(url);
    const list = Array.isArray(cookies)? cookies : [cookies];

    for (const item of list) {
      const parsed = parseSetCookie(item);
      if (!parsed) continue;
      if (!parsed.domain) {
        parsed.domain = target.hostname;
      }
      const exists = this.cookies.findIndex((cookie) =>
        cookie.name === parsed.name &&
        cookie.domain === parsed.domain &&
        cookie.path === parsed.path
      );
      if (exists !== -1) {
        this.cookies[exists] = parsed;
      } else {
        this.cookies.push(parsed);
      }
    }
    this.cleanup();
  }

  get(url) {
    const target = new URL(url);
    const now = Date.now();
    return this.cookies.filter(cookie => {
    	
        if (cookie.expires && cookie.expires.getTime() < now) {
          return false;
        }
        
        const domainMatch = target.hostname === cookie.domain || target.hostname.endsWith('.' + cookie.domain);
        const pathMatch = target.pathname.startsWith(cookie.path);
        return domainMatch && pathMatch;
      })
      .map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
  }

  clear() {
    this.cookies = [];
  }

  getAll() {
    return [...this.cookies];
  }

  cleanup() {
    const now = Date.now();
    this.cookies = this.cookies.filter(cookie => {
      if (!cookie.expires) return true;
      return cookie.expires.getTime() > now;
    });
  }
}


module.exports = CookieJar;
module.exports.default = CookieJar;