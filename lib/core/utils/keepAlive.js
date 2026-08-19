'use strict';

const http = require('http');
const https = require('https');

const DEFAULT_MAX_SOCKETS = 100;
const DEFAULT_MAX_FREE_SOCKETS = 100;

function createKeepAlive(options = {}) {
	const config = options === true ? {} : options;
	if (config instanceof http.Agent || config instanceof https.Agent) {
		return config;
   }
	const maxSockets = Number.isFinite(config.maxSockets) ? config.maxSockets : DEFAULT_MAX_SOCKETS;
	const maxFreeSockets = Number.isFinite(config.maxFreeSockets) ? config.maxFreeSockets : DEFAULT_MAX_FREE_SOCKETS;
	return {
		keepAlive: true,
		maxSockets,
		maxFreeSockets
	};
}

function createHttpAgent(options = {}) {
	const config = createKeepAlive(options);
	if (config instanceof http.Agent) {
		return config;
	}
	return new http.Agent(config);
}

function createHttpsAgent(options = {}) {
	const config = createKeepAlive(options);
	if (config instanceof https.Agent) {
		return config;
	}
	return new https.Agent(config);
}

module.exports = {
	createKeepAlive,
	createHttpAgent,
	createHttpsAgent,
	DEFAULT_MAX_SOCKETS,
	DEFAULT_MAX_FREE_SOCKETS
};