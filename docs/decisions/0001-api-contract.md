# Decision 0001: V1 API contract freeze

- Status: Accepted for US003
- Blueprint: HTML to Markdown and Clean Text API Implementation Blueprint v1.0, 27 September 2026
- Scope: request/response models, counts, validation precedence, routes, application headers, fixed application errors and launch ceilings

## Public endpoints

The V1 public path set is exactly:

- `GET /health`
- `POST /v1/html/markdown`
- `POST /v1/html/text`

Paths are case-sensitive. A trailing slash is a different path. Query parameters do not change routing.

Conversion requests are JSON objects with exactly one property, `html`, whose value is a string. Empty and whitespace-only strings are valid. There is no URL input, base URL, file upload, batch option or hidden conversion mode.

## Success models and counts

Markdown success:

`{"markdown":"<string>","stats":{"input_bytes":<integer>,"output_chars":<integer>}}`

Text success:

`{"text":"<string>","stats":{"input_bytes":<integer>,"output_chars":<integer>}}`

`input_bytes` is the UTF-8 byte count of the decoded `html` string before parser or newline normalization. `output_chars` is the Unicode scalar-value count of the final output, not UTF-16 code units or grapheme clusters. Unpaired surrogates are invalid before conversion.

Canonical source example:

- HTML: `<article><h1>Hello</h1><p>World</p></article>`
- input bytes: 45
- Markdown: `# Hello\n\nWorld`, 14 scalars
- text: `Hello\n\nWorld`, 12 scalars

Empty HTML has 0 input bytes and empty output has 0 scalars.

## Validation precedence

Business requests are evaluated in this order:

1. resolve path and method;
2. verify required server configuration;
3. authenticate the gateway-origin request;
4. validate Content-Type and Content-Encoding;
5. read and count the bounded raw body;
6. decode strict UTF-8;
7. parse JSON;
8. validate request object shape;
9. validate decoded HTML byte/character ceilings;
10. parse HTML and convert.

`GET /health` bypasses secret configuration, authentication and parsing.

## Application response headers

Application-controlled responses use:

- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store`
- `X-Content-Type-Options: nosniff`

A 405 response also carries `Allow: POST` for the conversion paths or `Allow: GET` for health.

## Fixed application errors

The blueprint fixes each code/status meaning and requires a constant message for every code, but it supplies exact message wording only for `input_too_large`. US003 therefore makes the remaining message strings explicit contract decisions rather than presenting them as quoted source wording.

| HTTP | code | fixed message |
| ---: | --- | --- |
| 400 | `invalid_json` | `Request body must be valid UTF-8 JSON.` |
| 400 | `missing_html` | `The html property is required.` |
| 400 | `invalid_request` | `Request does not match the supported schema.` |
| 403 | `forbidden` | `Request is not authorized.` |
| 404 | `not_found` | `Resource not found.` |
| 405 | `method_not_allowed` | `Method not allowed.` |
| 413 | `input_too_large` | `Input exceeds the supported limit.` |
| 415 | `unsupported_media_type` | `Request media type or encoding is not supported.` |
| 422 | `input_too_complex` | `Input exceeds the supported complexity limit.` |
| 422 | `output_too_large` | `Output exceeds the supported limit.` |
| 500 | `internal_error` | `An internal error occurred.` |
| 503 | `service_unavailable` | `Service configuration is unavailable.` |

The application envelope is always `{"error":{"code":"<code>","message":"<fixed message>"}}`. Source HTML, output, secret material and raw exception text never appear in controlled error envelopes.

## Launch ceilings

All ceilings are inclusive unless the contract explicitly says a request has already exceeded the boundary.

| Limit | V1 value |
| --- | ---: |
| raw JSON body | 800000 UTF-8 bytes |
| decoded HTML | 131072 UTF-8 bytes |
| tokenizer events | 20000 |
| retained nodes | 10000 |
| open-element depth | 64 |
| attributes per element | 64 |
| attribute-name length | 256 Unicode scalars |
| individual attribute value | 8192 UTF-8 bytes |
| URL | 2048 UTF-8 bytes |
| table rows | 200 |
| cells in any row | 32 |
| cells in one table | 6400 |
| output | 262144 Unicode scalars |
| output | 1048576 UTF-8 bytes |

These are engineering launch limits. Later benchmark stories may justify a versioned correction, but a failing implementation must not silently change this table.

## OpenAPI scope in US003

`openapi.yaml` starts the public machine-readable contract with the three paths, exact request/success shapes, canonical examples, fixed error schemas, application headers and the limits that can be represented without inventing hidden options. Authentication mechanics are not expanded into customer-facing headers in US003 because the blueprint assigns implementation to US006 and full public authentication documentation to US037.

## Change control

A later contract change requires an explicit decision update plus synchronized fixtures, tests and OpenAPI. The uploaded source example's incorrect historical input count is not copied; the verified V1 count is 45 bytes.
