'use strict';

const InterceptorManager = require('./InterceptorManager');
const { runInterceptors } = require('./chain');

module.exports = {
  InterceptorManager,
  runInterceptors
};

module.exports.default = module.exports;