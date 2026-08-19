'use strict';

function cancelTarget(target) {
  if (!target) return;

  if (typeof target.destroy === 'function') {
    return target.destroy();
  }

  if (typeof target.abort === 'function') {
    return target.abort();
  }

  if (typeof target.close === 'function') {
    return target.close();
  }
}

function setupAbort(target, signal, onAbort) {
  if (!signal || typeof signal.addEventListener !== 'function') {
    return () => {};
  }

  const triggerAbort = () => {
    if (typeof onAbort === 'function') {
      onAbort(signal.reason);
      return;
    }

    cancelTarget(target);
  };

  if (signal.aborted) {
    triggerAbort();
    return () => {};
  }

  const handler = () => {
    triggerAbort();
  };

  signal.addEventListener('abort', handler, {
    once: true
  });

  return () => {
    signal.removeEventListener('abort', handler);
  };
}

module.exports = {
  setupAbort
};

module.exports.default = module.exports;