'use strict';

const http = require('http');
const { once } = require('events');

const go = require('./').create();

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];

		req.on('data', chunk => {
			console.log('[SERVER] data chunk:', {
				length: chunk.length,
				hex: chunk.toString('hex')
			});

			chunks.push(chunk);
		});

		req.on('end', () => {
			const buffer = Buffer.concat(chunks);

			console.log('[SERVER] body complete:', {
				length: buffer.length,
				text: buffer.toString('utf8'),
				hex: buffer.toString('hex')
			});

			resolve(buffer);
		});

		req.on('error', reject);
	});
}

const server = http.createServer(async (req, res) => {


	try {
		const body = await readBody(req);

		console.log('[SERVER] parsed body:', {
			length: body.length,
			text: body.toString('utf8')
		});

		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');

		res.end(JSON.stringify({
			ok: true,
			method: req.method,
			url: req.url,
			body: body.toString('utf8'),
			bodyLength: body.length,
			contentType: req.headers['content-type'] || null
		}));

	} catch (err) {
		console.error('[SERVER ERROR]', err);

		res.statusCode = 500;
		res.end(JSON.stringify({
			ok: false,
			error: err.message
		}));
	}
});

async function main() {
	server.listen(0, '127.0.0.1');

	await once(server, 'listening');

	const { port } = server.address();
	const url = `http://127.0.0.1:${port}/delete`;

	const body = {
		hello: 'xof',
		number: 123
	};

	try {
		const response = await go.delete(url, {
			body
		});

		
console.log(response)
	} catch (err) {
		console.log('\n========== DELETE ERROR ==========');

		console.dir({
			name: err.name,
			message: err.message,
			code: err.code,

			config: err.config
				? {
					url: err.config.url,
					method: err.config.method,
					body: err.config.body,
					bodyType: typeof err.config.body,
					headers: err.config.headers
				}
				: null,

			request: err.request
				? {
					method: err.request.method,
					path: err.request.path,
					headers: err.request.getHeaders?.()
				}
				: null,

			response: err.response
				? {
					status: err.response.status,
					statusText: err.response.statusText,
					headers: err.response.headers,
					data: err.response.data
				}
				: null
		}, {
			depth: null
		});

		if (err.stack) {
			console.error('\nSTACK:\n' + err.stack);
		}

	} finally {
		server.close();
	}
}

main();