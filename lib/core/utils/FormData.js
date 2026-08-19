'use strict';

const crypto = require('crypto');
const { Readable } = require('stream');

function isFormData(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof value.entries === 'function' &&
		typeof value.append === 'function' &&
		typeof value.get === 'function'
	);
}

function isBlob(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof value.arrayBuffer === 'function' &&
		typeof value.type === 'string'
	);
}

function isFile(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof value.name === 'string' &&
		typeof value.arrayBuffer === 'function' &&
		typeof value.stream === 'function'
	);
}

function isReadable(value) {
	return (
		value !== null &&
		typeof value === 'object' &&
		typeof value.pipe === 'function'
	);
}

function randomBoundary() {
	return '----xof-fetch-' + crypto.randomBytes(16).toString('hex');
}

function escapeHeaderValue(value) {
	return String(value)
		.replace(/\\/g, '\\\\')
		.replace(/"/g, '%22')
		.replace(/\r/g, '%0D')
		.replace(/\n/g, '%0A');
}

function toBuffer(value) {
	if (value == null) {
		return Buffer.alloc(0);
	}

	if (Buffer.isBuffer(value)) {
		return value;
	}

	if (value instanceof Uint8Array) {
		return Buffer.from(value);
	}

	if (value instanceof ArrayBuffer) {
		return Buffer.from(new Uint8Array(value));
	}

	if (ArrayBuffer.isView(value)) {
		return Buffer.from(
			value.buffer,
			value.byteOffset,
			value.byteLength
		);
	}

	return Buffer.from(String(value));
}

async function readStreamToBuffer(stream) {
	if (!isReadable(stream)) {
		throw new TypeError('Value is not a readable stream');
	}

	const chunks = [];

	try {
		for await (const chunk of stream) {
			if (Buffer.isBuffer(chunk)) {
				chunks.push(chunk);
			} else if (chunk instanceof Uint8Array) {
				chunks.push(Buffer.from(chunk));
			} else if (typeof chunk === 'string') {
				chunks.push(Buffer.from(chunk));
			} else {
				throw new TypeError(
					'Readable stream yielded an unsupported chunk type'
				);
			}
		}
	} catch (error) {
	  throw new TypeError(`Failed to read multipart stream: ${error?.message || error}`);
	}

	return Buffer.concat(chunks);
}

async function valueToBuffer(value) {
	if (value == null) {
		return Buffer.alloc(0);
	}

	if (Buffer.isBuffer(value)) {
		return value;
	}

	if (value instanceof Uint8Array || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
		return toBuffer(value);
	}

	if (typeof value === 'string') {
		return Buffer.from(value, 'utf8');
	}

	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
		return Buffer.from(String(value), 'utf8');
	}

	if (isFile(value) || isBlob(value)) {
		const arrayBuffer = await value.arrayBuffer();
		return Buffer.from(new Uint8Array(arrayBuffer));
	}

	if (isReadable(value)) {
		return readStreamToBuffer(value);
	}

	return Buffer.from(String(value), 'utf8');
}

function normalizeContentType(value) {
	if (typeof value !== 'string') {
		return '';
	}

	const type = value.trim();

	if (!type) {
		return '';
	}

	return type;
}

function guessContentType(value) {
	if (isFile(value) || isBlob(value)) {
		if (typeof value.type === 'string' && value.type.trim()) {
			return value.type.trim();
		}
	}

	if (value && typeof value === 'object') {
		if (typeof value.mimetype === 'string' && value.mimetype.trim()) {
			return value.mimetype.trim();
		}
		if (typeof value.mimeType === 'string' && value.mimeType.trim()) {
			return value.mimeType.trim();
		}
	}
	return 'application/octet-stream';
}

function guessFilename(name, value) {
	if (isFile(value) && value.name) {
		return value.name;
	}

	if (value && typeof value === 'object') {
		if (typeof value.filename === 'string' && value.filename) {
			return value.filename;
		}
		if (typeof value.name === 'string' && value.name && !isBlob(value)) {
			return value.name;
		}
	}

	return String(name || 'blob');
}

function isBinaryPart(value) {
	return (
		isBlob(value) ||
		isFile(value) ||
		isReadable(value) ||
		Buffer.isBuffer(value) ||
		value instanceof Uint8Array ||
		value instanceof ArrayBuffer ||
		ArrayBuffer.isView(value)
	);
}

function partHeader(name, value) {
	const fieldName = escapeHeaderValue(name);
	let header =`Content-Disposition: form-data; name="${fieldName}"`;

	if (isBinaryPart(value)) {
		const filename = escapeHeaderValue(guessFilename(name, value));
		const contentType = normalizeContentType(guessContentType(value));
		header += `; filename="${filename}"`;
		if (contentType) {
			header += `\r\nContent-Type: ${contentType}`;
		}
	}

	return header;
}

async function encodeFormData(formData, options = {}) {
	if (!isFormData(formData)) {
		throw new TypeError('encodeFormData() expects a FormData-compatible instance');
	}

	const boundary = String(options.boundary || randomBoundary()).trim();
	if (!boundary) {
		throw new TypeError('Multipart boundary must not be empty');
	}
	if (/[\r\n]/.test(boundary)) {
		throw new TypeError('Multipart boundary must not contain CR or LF');
	}

	const chunks = [];
	let entries;
	try {
		entries = formData.entries();
	} catch (error) {
		throw new TypeError(`Failed to read FormData entries: ${error?.message || error}`);
	}

	if (!entries || typeof entries[Symbol.iterator] !== 'function') {
		throw new TypeError(
			'FormData.entries() must return an iterable'
		);
	}

	for (const entry of entries) {
		if (!Array.isArray(entry) && !entry) {
			throw new TypeError('FormData entry must contain a field name and value');
		}

		const [name, value] = entry;
		const header = partHeader(name, value);
		const body = await valueToBuffer(value);
		chunks.push(Buffer.from(`--${boundary}\r\n`, 'utf8'));
		chunks.push(Buffer.from(`${header}\r\n\r\n`, 'utf8'));
		chunks.push(body);
		chunks.push(Buffer.from('\r\n', 'utf8'));
    }
	    chunks.push(
		Buffer.from(`--${boundary}--\r\n`, 'utf8')
	);

	return {
		body: Buffer.concat(chunks),
		boundary
	};
}

function hasHeader(headers, name) {
	const target = String(name).toLowerCase();
	return Object.keys(headers).some(
		(key) => key.toLowerCase() === target
	);
}

function setHeader(headers, name, value) {
	const existingKey = Object.keys(headers).find((key) => key.toLowerCase() === name.toLowerCase());
	if (existingKey) {
		headers[existingKey] = value;
	} else {
		headers[name] = value;
	}
}

async function buildFormDataBody(formData, headers = {}, options = {}) {
	if (!isFormData(formData)) {
		throw new TypeError('buildFormDataBody() expects a FormData-compatible instance');
	}

	if (headers === null || typeof headers !== 'object' || Array.isArray(headers)) {
		throw new TypeError('buildFormDataBody() headers must be an object');
	}

	const result = await encodeFormData(
		formData,
		options
	);

	const nextHeaders = {
		...headers
	};

	setHeader(nextHeaders, 'Content-Type', `multipart/form-data; boundary=${result.boundary}`);
	setHeader(nextHeaders, 'Content-Length', String(result.body.length));
	
	return {
		body: result.body,
		headers: nextHeaders,
		boundary: result.boundary
	};
}

function formDataToObject(formData) {
	if (!isFormData(formData)) {
		throw new TypeError('formDataToObject() expects a FormData-compatible instance');
	}
	const output = {};
	for (const [key, value] of formData.entries()) {
		if (!Object.prototype.hasOwnProperty.call(output, key)) {
			output[key] = value;
			continue;
		}

		if (Array.isArray(output[key])) {
			output[key].push(value);
			continue;
		}

		output[key] = [output[key], value];
	}
	return output;
}

module.exports = {
	isFormData,
	isBlob,
	isFile,
	buildFormDataBody,
	encodeFormData,
	formDataToObject,
	randomBoundary
};

module.exports.default = module.exports;