'use strict';

const desktop = require('./lib/ua/desktop.json');
const mobile = require('./lib/ua/mobile.json');
const tablet = require('./lib/ua/tablet.json');
const android = require('./lib/ua/android.json');
const ios = require('./lib/ua/ios.json');

const DATABASE = {
  desktop,
  mobile,
  tablet,
  android,
  ios
};

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function pickPool(type = 'random') {
  type = String(type || '').trim().toLowerCase();

  const list = DATABASE[type];
  if (Array.isArray(list) && list.length) return list;

  return Object.values(DATABASE).flat().filter(Boolean);
}

function isIOSEntry(entry) {
  return entry && (entry.ios != null || entry.device === 'iPhone' || entry.device === 'iPad' || entry.device === 'iPad Air' || entry.device === 'iPad Pro');
}

function isAndroidEntry(entry) {
  return entry && (entry.android != null);
}

function normalizePlatform(entry) {
  if (!entry) return 'Windows';
  if (entry.platform) return entry.platform;
  if (isIOSEntry(entry)) return 'iOS';
  if (isAndroidEntry(entry)) return 'Android';
  if (entry.os) {
    if (/Windows/i.test(entry.os)) return 'Windows';
    if (/Macintosh|Mac OS X/i.test(entry.os)) return 'macOS';
    if (/Linux/i.test(entry.os)) return 'Linux';
  }

  return 'Windows';
}

function normalizePlatformVersion(entry) {
  if (!entry) return '0.0.0';
  if (entry.platformVersion) {
    return String(entry.platformVersion).replace(/_/g, '.');
  }
  if (typeof entry.android === 'number') {
    return `${entry.android}.0.0`;
  }
  if (typeof entry.ios === 'string' && entry.ios) {
    return `${entry.ios.replace(/_/g, '.')}.0`;
  }

  if (entry.os) {
    const win = entry.os.match(/Windows NT (\d+(?:\.\d+)?)/i);
    if (win) return `${win[1]}.0`;
    const mac = entry.os.match(/Mac OS X (\d+)_?(\d+)?_?(\d+)?/i);
    if (mac) {
      const major = mac[1] || '0';
      const minor = mac[2] || '0';
      const patch = mac[3] || '0';
      return `${major}.${minor}.${patch}`;
    }
    if (/Linux/i.test(entry.os)) return '0.0.0';
  }
  return '0.0.0';
}

function normalizeArch(entry) {
  if (!entry) return 'x86';
  if (entry.arch) return String(entry.arch);
  if (isIOSEntry(entry)) return 'arm';
  if (isAndroidEntry(entry)) return 'arm';
  if (entry.os) {
    if (/Apple Silicon/i.test(entry.os)) return 'arm';
    if (/x86_64|Win64|Intel|x64/i.test(entry.os)) return 'x86';
  }
  return 'x86';
}

function normalizeBitness(entry) {
  if (!entry) return '64';
  if (entry.bitness) return String(entry.bitness);
  if (normalizeArch(entry) === 'arm') return '64';
  return '64';
}

function normalizeModel(entry) {
  if (!entry) return '';
  if (entry.model != null) return String(entry.model);
  if (isIOSEntry(entry)) return String(entry.device || '');
  if (isAndroidEntry(entry)) return String(entry.device || '');
  return '';
}

function getBrowserFamilyFromEntry(entry) {
  return String((entry && entry.browser) || 'chrome').trim().toLowerCase();
}

function buildUserAgent(entry, major, build, patch, version) {
  const browser = getBrowserFamilyFromEntry(entry);
  const androidVersion = typeof entry.android === 'number' ? entry.android : null;
  const iosVersion = typeof entry.ios === 'string' ? entry.ios : null;
  const device = entry.device || '';
  const os = entry.os || '';
  const webkit = entry.webkit || '537.36';
  switch (browser) {
    case 'edge': {
      if (iosVersion) {
        return `Mozilla/5.0 (${device}; CPU ${device} OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/${major}.0.${build}.${patch} Mobile/15E148 Safari/604.1`;
      }
      if (androidVersion != null) {
        return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${build}.${patch} Mobile Safari/537.36 EdgA/${major}.0.${build}.${patch}`;
      }
      return `Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.${build}.${patch}`;
    }
    case 'firefox': {
      if (iosVersion) {
        return `Mozilla/5.0 (${device}; CPU ${device} OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/${version}.0 Mobile/15E148 Safari/605.1.15`;
      }
      if (androidVersion != null) {
        return `Mozilla/5.0 (Android ${androidVersion}; Mobile; rv:${version}.0) Gecko/${version}.0 Firefox/${version}.0`;
      }
      return `Mozilla/5.0 (${os}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`;
    }
    case 'safari': {
      const safariVersion = rand(17, 18);
      if (iosVersion) {
        return `Mozilla/5.0 (${device}; CPU ${device} OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion}.0 Mobile/15E148 Safari/604.1`;
      }
      return `Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safariVersion}.0 Safari/605.1.15`;
    }
    case 'chrome':
    default: {
      if (iosVersion) {
        return `Mozilla/5.0 (${device}; CPU ${device} OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/${major}.0.${build}.${patch} Mobile/15E148 Safari/604.1`;
      }
      if (androidVersion != null) {
        return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${device}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.${build}.${patch} Mobile Safari/537.36`;
      }
      return `Mozilla/5.0 (${os}) AppleWebKit/${webkit} (KHTML, like Gecko) Chrome/${major}.0.${build}.${patch} Safari/${webkit}`;
    }
  }
}

function buildFingerprint(type = 'random') {
  const pool = pickPool(type);
  const entry = random(pool) || {};

  const browser = getBrowserFamilyFromEntry(entry);

  let major = rand(136, 138);
  let build = rand(7000, 7300);
  let patch = rand(1, 200);
  let version = rand(138, 140);

  if (browser === 'edge') {
    major = rand(136, 138);
    build = rand(3300, 3400);
    patch = rand(1, 99);
  }

  if (browser === 'safari') {
    version = rand(17, 18);
  }

  const userAgent = buildUserAgent(entry, major, build, patch, version);
  const fullVersion = browser === 'safari' ? `${version}.0` : `${major}.0.${build}.${patch}`;
  const platform = normalizePlatform(entry);
  const platformVersion = normalizePlatformVersion(entry);
  const arch = normalizeArch(entry);
  const bitness = normalizeBitness(entry);
  const model = normalizeModel(entry);

  const result = {
    browser,
    userAgent,
    ua: userAgent,
    major,
    fullVersion,
    platform,
    platformVersion,
    arch,
    bitness,
    model,
    device: entry.device || '',
    os: entry.os || '',
    android: entry.android,
    ios: entry.ios,
    webkit: entry.webkit || '537.36',
    source: entry,
    secChUa: browser === 'chrome' || browser === 'edge' ? `"Chromium";v="${major}", "Not=A?Brand";v="24", "Google Chrome";v="${major}"` : undefined,
    secChUaFullVersionList: browser === 'chrome' || browser === 'edge' ? `"Chromium";v="${fullVersion}", "Not=A?Brand";v="24.0.0.0", "Google Chrome";v="${fullVersion}"` : undefined,
    secChUaPlatform: `"${platform}"`,
    secChUaPlatformVersion: `"${platformVersion}"`,
    secChUaArch: `"${arch}"`,
    secChUaBitness: `"${bitness}"`,
    secChUaModel: `"${model || ''}"`,
    secChPrefersColorScheme: '"light"',
    secChPrefersReducedMotion: '"no-preference"'
  };

  return result;
}

function Ua(type = 'random') {
  return buildFingerprint(type).userAgent;
}

function getPlatformFromUA(ua = '') {
  ua = String(ua);

  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';

  return 'Windows';
}

function getBrowserFamily(ua = '') {
  ua = String(ua);

  if (/EdgA\//i.test(ua) || /Edg\//i.test(ua) || /EdgiOS\//i.test(ua)) return 'edge';
  if (/FxiOS\//i.test(ua) || /Firefox\//i.test(ua)) return 'firefox';
  if (/CriOS\//i.test(ua) || /Chrome\//i.test(ua) || /Chromium\//i.test(ua)) return 'chrome';
  if (/Safari\//i.test(ua)) return 'safari';

  return 'chrome';
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

Ua.fingerprint = buildFingerprint;
Ua.details = buildFingerprint;
Ua.random = buildFingerprint;
Ua.resolve = buildFingerprint;

module.exports = Ua;
module.exports.default = Ua;
module.exports.DATABASE = DATABASE;
module.exports.fingerprint = buildFingerprint;
module.exports.details = buildFingerprint;
module.exports.random = buildFingerprint;
module.exports.resolve = buildFingerprint;
module.exports.getPlatformFromUA = getPlatformFromUA;
module.exports.getBrowserFamily = getBrowserFamily;
module.exports.getChromiumMajorVersion = getChromiumMajorVersion;