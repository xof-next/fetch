'use strict';

async function runInterceptors(type, value, manager) {
  let result = value;

  const handlers = [];

  manager.forEach((interceptor) => {
    handlers.push(interceptor);
  });

  for (const handler of handlers) {
    try {
      if (handler.fulfilled) {
        result = await handler.fulfilled(result);
      }
    } catch (err) {
      if (handler.rejected) {
        result = await handler.rejected(err);
      } else {
        throw err;
      }
    }
  }

  return result;
}

module.exports = {
  runInterceptors
};