# Changelog

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog** and this project follows **Semantic Versioning (SemVer)**.

### [1.1.7] - 2026-08-18

---

Improved

- Improved JSONL response parsing and normalization to prevent double parsing of already-parsed objects.
- Improved response parsing consistency across JSON, text, gzip-compressed JSON, and NDJSON responses.
- Improved JSONL response helpers so "text()" and "toBuffer()" correctly serialize parsed NDJSON data.

---

### [1.1.6] - 2026-08-17

## Added

- Added HTTP and HTTPS Keep-Alive connection support.
- Added configurable connection pooling through "keepAlive".
- Added configurable "maxSockets" and "maxFreeSockets" settings.
- Added automatic HTTP and HTTPS Agent creation when Keep-Alive is enabled.
- Added support for custom "http.Agent" and "https.Agent" instances.
- Added default connection limits of "100" "maxSockets" and "100" "maxFreeSockets".

## Improved

- Improved network error handling through "FetchError".
- Improved error information by exposing error codes through "error.data".
- Improved transport error handling for DNS, connection, timeout, reset, and other Node.js network errors.
- Improved error debugging by preserving the original Node.js error through "error.cause".
- Improved error serialization to include error data in "FetchError.toJSON()".

---

### [1.1.5] - 2026-08-16

## Added

- res.ok in stream

---

### [1.1.3-1.14] - 2026-08-16

## Improved

- Improved Validated status

---

### [1.1.2] - 2026-08-14

## Added

- Added multipart `FormData` request support.
- Added automatic `FormData` detection and encoding.
- Added Blob and File support for multipart uploads.
- Added custom multipart boundary configuration.
- Added automatic `Content-Type` and `Content-Length` handling for `FormData`.
- Added support for Buffer, Uint8Array, ArrayBuffer, and readable streams as multipart values.
- Added `formDataToObject()` utility for converting FormData entries into an object.
- Added configurable `headersJar` support for removing automatically generated headers.

## Improved

- Improved multipart header generation and filename handling.
- Improved multipart value conversion and stream handling.
- Improved header name matching with case-insensitive comparison.
- Improved request configuration to support per-request and instance-level `FormData` options.
- Improved request header management with `headersJar`.
- Improved error handling for invalid FormData values, multipart boundaries, and readable streams.

---

### [1.1.1] - 2026-08-06

## Added

- Added CookieJar

## Improved

- Cookie handling now automatically stores "Set-Cookie" values and injects them into subsequent requests for matching domains and paths.
- Reduced manual cookie parsing for session-based workflows.

--

### [1.1.0] - 2026-08-03

## Added

- Added full "AbortController" / "AbortSignal" cancellation support across HTTP, HTTPS, and HTTP/2 adapters.
- Added response completion tracking through "response.complete".
- Added protocol metadata ("http", "https", "h2") to response objects.
- Added response stream abort detection for prematurely terminated responses.
- Added response request reference ("response.request") for easier debugging.
- Added response socket references where supported by the underlying protocol.
- Added reusable transform pipeline utilities ("runTransform" and "normalizeTransforms") for request/response transformations.

## Improved

- Improved adapter cleanup to properly remove abort listeners after request completion.
- Improved stream error handling for request body streams.
- Improved timeout, cancellation, and network error consistency across all adapters.
- Improved HTTP/2 lifecycle handling, including session cleanup and stream termination.
- Improved response metadata consistency across HTTP, HTTPS, and HTTP/2 implementations.

## Changed

- Unified adapter behavior to expose a more consistent response structure regardless of transport protocol.
- Standardized cancellation flow to always throw "FetchError".

## Fixed

- Fixed potential abort listener leaks after successful responses.
- Fixed premature response termination handling in HTTP, HTTPS, and HTTP/2 adapters.
- Fixed HTTP/2 session cleanup after stream completion or failure.
- Fixed body stream errors not always propagating as "FetchError".

---

## [1.0.9] - 2026-08-02

### Added

- Added explicit `body` support for shortcut request methods.

### Improved

- Improved request resolver to automatically treat all non-reserved properties as request options.
- Improved shortcut request APIs by separating request payload (`body`) from request configuration.
- Improved maintainability by allowing future request options without requiring resolver updates.

### Changed

- Updated shortcut request methods to require request payloads through the `body` property instead of automatically inferring the request body.
- Updated internal request resolution to reserve only `body`, `headers`, `query`, and `params`; all other properties are forwarded as request options.

### Fixed

- Fixed request configuration values (such as `timeout`, `responseType`, and future options) from being mistakenly interpreted as request body.

---

## [1.0.8] - 2026-08-01

### Added

- Added automatic request resolver for shortcut request methods.
- Added `query` support for automatic query string generation.
- Added `params` support for automatic URL path parameter replacement.
- Added runtime feature toggle API:
  - `fetch.disable()`
  - `fetch.enable()`
  - `fetch.disabled()`
  - `fetch.clearDisabled()`
- Added support for disabling all default request headers:
  - `fetch.disable('headers')`
- Added support for disabling individual default headers:
  - `fetch.disable('headers.User-Agent')`
  - `fetch.disable('headers.Accept')`
  - `fetch.disable('headers.Accept-Language')`
  - and other default headers.

### Improved

- Improved shortcut request methods to correctly distinguish request options from request body.
- Improved URL building by supporting both path parameters and query parameters in a single request.
- Improved default header management with selective runtime disabling.
- Improved header matching to be case-insensitive.

### Changed

- Updated shortcut request APIs to use the new request resolver internally.
- Updated request pipeline to resolve URL parameters before sending requests.

### Fixed

- Fixed request body being incorrectly generated when only request options were provided.
- Fixed header disabling behavior for different header name casing.
- Fixed ambiguity between request body and configuration options in shortcut methods.

---

## [1.0.7] - 2026-07-31

### Added

- Added Fetch API compatible response helpers:
  - `response.json()`
  - `response.text()`
  - `response.arrayBuffer()`
- Added response body access support.
- Added improved response object structure for easier debugging.
- Added request header exposure through:
  - `response.requestHeaders`
- Added advanced request methods:
  - `fetch.get.options()`
  - `fetch.post.options()`
  - `fetch.put.options()`
  - `fetch.patch.options()`
  - `fetch.delete.options()`
  - `fetch.head.options()`
  - `fetch.options.options()`
  - `fetch.trace.options()`
  - `fetch.connect.options()`
- Added full options-only request mode to prevent body/options ambiguity.

### Improved

- Improved automatic response type detection.
- Improved binary response handling.
- Improved compatibility with non-JSON responses:
  - HTML
  - images
  - binary files
  - plain text
- Improved cookie normalization system.
- Improved response debugging experience through expanded metadata.
- Improved Fetch API compatibility.

### Changed

- Updated response cookies structure to support multiple cookie header formats.
- Updated response parsing flow to avoid forcing unknown content types into JSON.

### Fixed

- Fixed invalid JSON parsing errors on binary responses.
- Fixed incorrect response type detection when `responseType` is undefined.
- Fixed image responses being parsed as JSON.

---

## [1.0.6] - 2026-07-30

### Added

- Added advanced response decompression support:
  - `gzip`
  - `x-gzip`
  - `deflate`
  - `deflateRaw`
  - `brotli`
  - `zstd`
- Added automatic content-encoding detection from response headers.
- Added improved decode utility component.

### Improved

- Improved binary response decoding.
- Improved compressed response handling.
- Improved compatibility with modern servers using `zstd` encoding.
- Improved response processing stability.

---

## [1.0.5] - 2026-07-30

### Added

- Added response converter helpers:
  - `response.toBuffer()`
  - `response.text()`
  - `response.json()`
- Added automatic response decompression support:
  - `gzip`
  - `deflate`
  - `brotli`
- Added cookie normalization support.
- Added response duration tracking.
- Added improved response metadata:
  - `status`
  - `headers`
  - `cookies`
  - `httpVersion`
  - `redirected`
  - `url`

### Improved

- Improved stream response handling.
- Improved binary buffer response support.

---

## [1.0.4] - 2026-07-29

### Improved

- Improved fetch error.
- Improved cannot access data in http 500x / 400x

---

## [1.0.3] - 2026-07-29

### Updated

- Improved [README](README.md)
- Create [LOG FITUR](NEW.md)

---

## [1.0.2] - 2026-07-29

### Added

- Added optional retry system for failed requests.
- Added configurable retry attempts and retry delay.
- Added retry metadata tracking through response `meta`.
- Added retry failure information for debugging failed requests.
- Added response converter helpers:
  - `response.toBuffer()`
  - `response.text()`
  - `response.json()`
- Added separated internal utility modules for reusable core functions.

### Improved

- Improved request execution flow by separating request handling and execution logic.
- Improved response object structure with additional metadata support.
- Improved header handling and request configuration management.
- Improved internal code organization and maintainability.

### Fixed

- Fixed request retry behavior to prevent automatic retries unless explicitly enabled.
- Fixed response handling consistency between different response types.
- Fixed internal header resolution edge cases.

---

## [1.0.1] - 2026-07-26

### Updated

- Added automatic User-Agent generation and browser header support.
- Improved default request headers handling.
- Updated internal header resolution system.
- Improved compatibility with modern websites requiring browser-like requests.
- Minor internal improvements and code cleanup.

---

## [1.0.0] - 2026-07-22

### Added

- Initial release.
- Fetch-based HTTP client wrapper.
- Default `fetch` API implementation.
- Support for common HTTP methods:
  - `GET`
  - `POST`
  - `PUT`
  - `PATCH`
  - `DELETE`
  - `HEAD`
  - `OPTIONS`
  - `TRACE`
  - `CONNECT`
- Support for custom request headers.
- Support for creating custom fetch instances using `create()`.
- CommonJS compatibility.
- Default browser-like request configuration.