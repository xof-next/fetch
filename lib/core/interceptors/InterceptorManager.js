'use strict';

class InterceptorManager {
  constructor() {
    this.handlers = [];
  }

  use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled: fulfilled || null,
      rejected: rejected || null
    });

    return this.handlers.length - 1;
  }

  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  clear() {
    this.handlers = [];
  }

  forEach(fn) {
    for (const handler of this.handlers) {
      if (handler !== null) {
        fn(handler);
      }
    }
  }
}

module.exports = InterceptorManager;
module.exports.default = InterceptorManager;