# Installation & Usage

## Installation

Install @xof/fetch using npm:

```bash
npm install @xof/fetch
```

After installation, import the module into your Node.js project:

```js
const fetch = require('@xof/fetch');
```

For ES Module:

```js
import fetch from '@xof/fetch';
```

@xof/fetch provides a simple and modern interface for making HTTP requests using a lightweight request engine with advanced configuration support.

It supports common HTTP methods such as GET, POST, PUT, PATCH, DELETE, HEAD, and More. for communicating with APIs and web services.

# Features

- Simple HTTP request API
- Native Node.js HTTP/HTTPS support
- Automatic JSON parsing
- Automatic JSON body serialization
- Browser-style request headers
- Dynamic User-Agent support
- Custom request instances
- Redirect handling
- Compression support
- Cookie compatible
- CommonJS and ESM support
- Lightweight and extensible architecture
- Optional request retry system
- Retry metadata tracking
- Response data conversion helpers
- Buffer, text, and JSON response converters
- URL path parameter replacement
- Automatic query string builder
- Runtime header toggle API
- Explicit request body support
- CookieJar request 
- HeadersJar request

# Basic GET Request

Example:

```js
const fetch = require('@xof/fetch');

async function main() {
  const response = await fetch.get(
    'https://api.example.com/data'
  );

  console.log(response.data);
}

main();
```

# Params, Query, Options

```js
await fetch.get('/users/:id', {
  params: {
    id: 123
  },
  query: {
    page: 1
  },
  timeout: 5000
});
```

# POST Request

Send JSON data directly using the POST method:

```js
const response = await fetch.post(url, {
  body: {
    username: 'xof',
    active: true
  }
});

console.log(response.data);
```

Object request bodies are automatically serialized into JSON format.

# Custom Request Instance

Create a reusable client with default configuration:

```js
const api = fetch.create({
  headers: {
    Authorization: 'Bearer your-token'
  }
});

const response = await api.get(
  'https://api.example.com/profile'
);

console.log(response.data);
```

# Auto CookieJar

Enable automatic cookie management:

```js
const api = fetch.create({
  baseURL: 'https://example.com',
  browser: true,
  cookieJar: true
});

await api.post('/login', {
  body: {
    username: 'admin',
    password: 'secret'
  }
});

// Cookies are automatically sent
const profile = await api.get('/profile');

console.log(profile.data);
```

Cookies received from `Set-Cookie` are stored automatically and attached to subsequent requests for the same domain.

# Read Stored Cookies

```js
const cookies = api.cookieJar.getAll();

console.log(cookies);
```

Example output:

```js
[
  {
    name: "session",
    value: "eyJhbGciOi...",
    domain: "example.com",
    path: "/",
    expires: 2026-08-06T10:23:53.000Z
  },
  {
    name: "ads_session",
    value: "eyJhbGciOi...",
    domain: "example.com",
    path: "/",
    expires: 2026-08-06T10:54:59.000Z
  }
]
```

# Custom instances can store:

- Default headers
- Authentication headers
- Timeout settings
- Request options
- API configurations

# Response Object

Every request returns a response object containing request information, server response details, and parsed response data.

Example:

```js
const response = await fetch.get(
  'https://api.example.com'
);

console.log(response.status);
console.log(response.headers);
console.log(response.data);
```

## Available Properties

### response.status

HTTP status code returned by the server.

Example:

```js
200
```

### response.statusText

HTTP status message.

Example:

```js
"OK"
```

### response.headers

Response headers returned by the server.

Example:

```json
{
  "content-type": "application/json",
  "server": "nginx"
}
```

### response.config

Configuration used during the request.

Example:

```js
{
  method: "GET",
  url: "https://api.example.com"
}
```

### response.request

Contains request information including the generated HTTP request.

### response.data

Parsed response data.

Example:

```json
{
  "message": "success",
  "data": []
}
```

### response.meta

Contains internal request metadata.

Example:

```json
{
  "retry": {
    "attempts": 1,
    "maxRetries": 3
  }
}
```

# Response Helpers

@xof/fetch provides helper methods for converting response data.

## response.toBuffer()

Convert response data into a Node.js Buffer.

Example:

```js
const response = await fetch.get('https://example.com/file');
const buffer = await response.toBuffer();
console.log(Buffer.isBuffer(buffer));
```

```js
const response = await fetch.get('https://example.com');
const html = await response.text();
console.log(html);
```

```js
const response = await fetch.get('https://api.example.com/data');
const json = await response.json();
console.log(json);
```
# Error Handling

@xof/fetch uses `FetchError` for request-level and network-level errors.

Network errors such as DNS failures, connection refusals, connection resets, timeouts, and broken pipes are exposed through the error object.

Example:

```js
try {
  const response = await fetch.get(
    'https://example.com'
  );

  console.log(response.data);
} catch (err) {
  console.log(err.code);
  console.log(err.data);
}
```

For example, a DNS failure may produce:

```js
err.code
// ENOTFOUND

err.data
// ENOTFOUND

err.message
// getaddrinfo ENOTFOUND example.com
```

The original Node.js error is preserved through `err.cause`:

```js
try {
  await fetch.get('https://example.com');
} catch (err) {
  console.log(err.cause);
}
```

Network errors occur before an HTTP response is received, so `err.response` will be `null`:

```js
try {
  await fetch.get('https://example.com');
} catch (err) {
  console.log(err.response);
  // null
}
```

## FetchError Properties

- `err.message` — Human-readable error message.
- `err.code` — Error code such as `ENOTFOUND`, `ECONNRESET`, or `ETIMEDOUT`.
- `err.data` — Exposed error data.
- `err.cause` — Original underlying Node.js error.
- `err.config` — Request configuration.
- `err.request` — Underlying request object when available.
- `err.response` — HTTP response when available.

# Requests Retry

Retry is disabled by default.

Enable retry manually:

```js
const response = await fetch.get(
  'https://api.example.com/data',
  {
    retry: 3,
    retryDelay: 500
  }
);

console.log(response.meta.retry);
/* Example:

{
  "attempts": 2,
  "maxRetries": 3
}

*/
```

# Supported retry conditions:

- Connection errors:
- ECONNRESET
- ETIMEDOUT
- ECONNREFUSED
- EPIPE

# Headers

@xof/fetch automatically provides modern browser-style request headers.

Included headers:

- User-Agent
- Accept
- Accept-Encoding
- Accept-Language
- Cache-Control
- Sec-CH-UA
- Sec-Fetch headers
- Upgrade-Insecure-Requests

Custom headers can be added manually:

```js
const response = await fetch.get(
  'https://api.example.com',
  {
    headers: {
      'X-App-Name': 'MyApp'
    }
  }
);
```

# Cookies

@xof/fetch supports cookie-based requests through custom headers.

Example:

```js
const response = await fetch.get(
  'https://example.com',
  {
    headers: {
      Cookie: 'session=value'
    }
  }
);
```

# Method

- GET
- POST
- PUT 
- PATCH
- HEAD
- DELETE
- OPTIONS
- TRACE
- CONNECT

# Complete Example

```js
const fetch = require('@xof/fetch');

async function example() {
  const response = await fetch.get(
    'https://api.example.com/users'
  );

  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  console.log('Request:', response.requestHeaders);
  console.log('Data:', response.data);
}

example();
```
# New Feature 

[New](NEW.md)

# Changelog

[Changelog](CHANGELOG.md)

# License

[MIT © XOF](LICENSE)