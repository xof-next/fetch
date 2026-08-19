## New Features

### Keep-Alive Support

`@xof/fetch` now supports HTTP and HTTPS Keep-Alive connections for reusing TCP connections across multiple requests.

Enable Keep-Alive with the default configuration:

```js
const api = fetch.create({
  keepAlive: true
});

const response = await api.get('https://example.com');
```

By default, Keep-Alive uses:

```js
{
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 100
}
```

#### Custom Keep-Alive Options

Keep-Alive connection limits can be configured through `maxSockets` and `maxFreeSockets`:

```js
const api = fetch.create({
  keepAlive: {
    maxSockets: 50,
    maxFreeSockets: 20
  }
});
```

- `maxSockets` — Maximum number of active sockets per host.
- `maxFreeSockets` — Maximum number of idle sockets kept in the connection pool.

When Keep-Alive is enabled, `@xof/fetch` automatically creates separate HTTP and HTTPS agents.

Custom Node.js agents can also be provided when more advanced agent configuration is required.

---

### Network Error Handling

`@xof/fetch` now provides improved error information through `FetchError`.

Network-level errors such as DNS failures, connection refusals, connection resets, timeouts, and broken pipes are exposed through the standard error object.

```js
try {
  await fetch.get('https://example.com');
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

The original Node.js error is preserved through `cause`:

```js
try {
  await fetch.get('https://example.com');
} catch (err) {
  console.log(err.cause);
}
```

Network errors do not contain an HTTP response because the connection failed before a response could be received:

```js
try {
  await fetch.get('https://example.com');
} catch (err) {
  console.log(err.response);
  // null
}
```

This allows HTTP responses and network-level failures to be handled separately:

```js
try {
  const response = await fetch.get('https://example.com');

  console.log(response.status);
  console.log(response.data);
} catch (err) {
  console.log(err.code);
  console.log(err.data);
}
```