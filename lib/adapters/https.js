'use strict';

const https = require('https');
const { FetchError } = require('../core/utils/FetchError');
const { setupAbort } = require('../core/utils/FetchCancel');

function isStream(value) {
  return value && typeof value.pipe === 'function';
}

function buildOptions(url, config = {}) {
  return {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || 443,
    path: `${url.pathname || '/'}${url.search || ''}`,
    method: (config.method || 'GET').toUpperCase(),
    headers: config.headers || {},
    agent: config.agent,
    rejectUnauthorized: config.rejectUnauthorized !== false,
    servername: config.servername || url.hostname,
    family: config.family,
    localAddress: config.localAddress,
    ca: config.ca,
    cert: config.cert,
    key: config.key,
    passphrase: config.passphrase,
    pfx: config.pfx,
    ciphers: config.ciphers,
    secureProtocol: config.secureProtocol,
    minVersion: config.minVersion,
    maxVersion: config.maxVersion,
    ALPNProtocols: config.ALPNProtocols,
  };
}

function toFetchError(err, code, config, req, response) {
  if (err instanceof FetchError) return err;

  return new FetchError(
    err?.message || 'Request failed',
    code || err?.code || FetchError.ERR_NETWORK,
    config,
    req,
    response || null,
    err
  );
}

function httpsAdapter(url, config = {}) {
  return new Promise((resolve, reject) => {
    let req;
    let settled = false;
    let bodyStream;
    let removeAbort;

    const cleanup = () => {
      if (removeAbort) {
        removeAbort();
        removeAbort = null;
     }

      if (bodyStream) {
        bodyStream.removeListener('error', onBodyError);
        bodyStream = null;
      }

      if (req) {
        req.removeListener('error', onReqError);
        req.removeListener('close', onReqClose);
      }
    };

    const doneReject = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const doneResolve = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const onReqError = (err) => {
      doneReject(
        toFetchError(
          err,
          err?.code || FetchError.ERR_NETWORK,
          config,
          req
        )
      );
    };

    const onReqClose = () => {};

    const onBodyError = (err) => {
      if (req && !req.destroyed) {
        req.destroy(err);
      }

      doneReject(
        toFetchError(
          err,
          err?.code || FetchError.ERR_NETWORK,
          config,
          req
        )
      );
    };

    try {
      if (!url || typeof url !== 'object') {
        return doneReject(
          new FetchError(
            'Invalid URL object',
            FetchError.ERR_INVALID_URL,
            config
          )
        );
      }

      if (config.signal?.aborted) {
        return doneReject(
          new FetchError(
            'Request aborted',
            FetchError.ERR_CANCELED,
            config
          )
        );
      }

      const options = buildOptions(url, config);
        req = https.request(options, (res) => {
        res.complete = false;
        res.once('end', () => {
        res.complete = true;
        
      if (removeAbort) {
        removeAbort();
        removeAbort = null;
       }
   });

  res.once('aborted', () => {
    doneReject(
      new FetchError(
        'Response aborted',
        FetchError.ERR_NETWORK,
        config,
        req,
        res
      )
    );
  });

  res.protocol = 'https';
  res.httpVersion = 'https';
  res.request = req;
  res.socket = req.socket;
  doneResolve({ req, res });
});

      req.once('error', onReqError);
      req.once('close', onReqClose);

      const timeout = Number(config.timeout || 0);
      if (timeout > 0) {
        req.setTimeout(timeout, () => {
          req.destroy(
            new FetchError(
              `timeout of ${timeout}ms exceeded`,
              FetchError.ETIMEDOUT,
              config,
              req
            )
          );
        });
      }

      removeAbort = setupAbort(req, config.signal, () => {
       if (req && !req.destroyed) {
           req.destroy(
            new FetchError(
             'Request aborted',
             FetchError.ERR_CANCELED,
             config,
             req
           )
        );
      }  
   });
     
      const body = config.body;

      if (body != null) {
        if (isStream(body)) {
          bodyStream = body;
          bodyStream.once('error', onBodyError);
          bodyStream.pipe(req);
          return;
        }

        if (
          Buffer.isBuffer(body) ||
          typeof body === 'string' ||
          body instanceof Uint8Array
        ) {
          req.end(body);
          return;
        }

        if (typeof body === 'object') {
          req.end(JSON.stringify(body));
          return;
        }

        req.end(String(body));
        return;
      }

      req.end();
    } catch (err) {
      doneReject(
        toFetchError(
          err,
          err?.code || FetchError.ERR_NETWORK,
          config,
          req
        )
      );
    }
  });
}

module.exports = httpsAdapter;
module.exports.default = httpsAdapter;