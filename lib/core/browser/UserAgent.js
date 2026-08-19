'use strict';

const Ua = require('../UserAgent');

const Default_platform = 'Windows';

const Default_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function getPlatformFromUA(ua = '') {
  ua = String(ua);
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return Default_platform;
}


function getBrowserFamily(ua = '') {
  ua = String(ua);

  if (/EdgA\//i.test(ua) || /Edg\//i.test(ua) || /EdgiOS\//i.test(ua)) {
    return 'edge';
  }

  if (/FxiOS\//i.test(ua) || /Firefox\//i.test(ua)) {
    return 'firefox';
  }

  if (/CriOS\//i.test(ua) || /Chrome\//i.test(ua) || /Chromium\//i.test(ua)) {
    return 'chromium';
  }

  if (/Safari\//i.test(ua)) {
    return 'safari';
  }

  return 'chromium';
}

function getChromiumMajorVersion(ua = '') {
  ua = String(ua);
  const match =
    ua.match(/EdgA\/(\d+)/i) ||
    ua.match(/Edg\/(\d+)/i) ||
    ua.match(/EdgiOS\/(\d+)/i) ||
    ua.match(/Chrome\/(\d+)/i) ||
    ua.match(/Chromium\/(\d+)/i) ||
    ua.match(/CriOS\/(\d+)/i);
  return match ? match[1] : '140';
}


function resolveFingerprint(type = 'random') {
  try {
    if (Ua && typeof Ua.fingerprint === 'function') {
      return Ua.fingerprint(type);
    }
    if (Ua && typeof Ua.random === 'function') {
      return Ua.random(type);
    }
  } catch (_) {}

  return {
    userAgent: Default_user_agent,
    ua: Default_user_agent,
    browser: 'chromium',
    platform: Default_platform,
    platformVersion: '10.0',
    arch: 'x86',
    bitness: '64',
    model: '',
    major: '140'
  };
}


function resolveUserAgent(type = 'random') {
  const fp = resolveFingerprint(type);
  return fp.userAgent || fp.ua || Default_user_agent;
}

module.exports = {
  Default_platform,
  Default_user_agent,
  resolveFingerprint,
  resolveUserAgent,
  getPlatformFromUA,
  getBrowserFamily,
  getChromiumMajorVersion
};

module.exports.default = module.exports;