# US038 integration guide

## First customer request

Set `RAPIDAPI_BASE_URL` to the actual subscribed RapidAPI endpoint base URL and set `RAPIDAPI_KEY` and `RAPIDAPI_HOST` from your own marketplace dashboard. No real marketplace URL or key is hardcoded here.

```bash
export RAPIDAPI_BASE_URL="https://YOUR_RAPIDAPI_GATEWAY_BASE_URL"
export RAPIDAPI_HOST="YOUR_RAPIDAPI_HOST"
export RAPIDAPI_KEY="YOUR_SUBSCRIPTION_KEY"
bash examples/curl.sh markdown
node examples/fetch.mjs text
python3 examples/python.py markdown
```

All three scripts send the same exact request body:

```json
{"html":"<article><h1>Hello</h1><p>World</p></article>"}
```

The Markdown endpoint returns exactly:

```json
{"markdown":"# Hello\n\nWorld","stats":{"input_bytes":45,"output_chars":14}}
```

The clean-text endpoint returns exactly:

```json
{"text":"Hello\n\nWorld","stats":{"input_bytes":45,"output_chars":12}}
```

The customer sends `X-RapidAPI-Key` and `X-RapidAPI-Host`. The RapidAPI gateway handles its private gateway-to-origin credential. **Do not put any private origin credential in a customer request, URL, repository or support ticket.**

## Limits and supported semantics

- Both conversion endpoints accept UTF-8 JSON with exactly one string `html` property. The raw JSON body ceiling is **800,000 bytes**; decoded HTML ceiling is **131,072 UTF-8 bytes**.
- `stats.input_bytes` counts decoded HTML **UTF-8 bytes**, not JSON bytes or JavaScript string code units. `stats.output_chars` counts **Unicode scalar values**, not UTF-16 code units or tokens. In `<p>😊</p>`, `input_bytes` is 11 and clean-text `output_chars` is 1.
- Output is deterministic within the supported HTML subset. Relative links may remain relative, dangerous URLs are removed/neutralized, and unsupported complex tables fall back to documented visible text. Parser depth, event, node, table and output limits also apply.
- This is **not a browser-equivalent renderer**. Scripts, styles, URL fetching, image loading, CSS layout and external HTTP requests are not executed.
- Worker responses set `Cache-Control: no-store`; this is an application response policy, not a guarantee that external marketplace providers keep no metadata.
- For browser display, assign the clean-text result to `textContent`. Use a trusted Markdown renderer configured to disable/sanitize raw HTML; do not insert untrusted output directly via `innerHTML`.

## Fixed errors and retry rules

| Status | Meaning | Action |
| --- | --- | --- |
| 200 | Conversion accepted | Parse JSON output. |
| 400 | Invalid JSON, missing `html` or invalid request shape | Fix request; **no unchanged retry**. |
| 403 | Authorization failed | Check gateway subscription/headers; **no unchanged retry**. |
| 404 / 405 | Wrong endpoint/method | Fix route or HTTP method; **no unchanged retry**. |
| 413 | Request exceeds byte limit | Reduce input; **no unchanged retry**. |
| 415 | Unsupported media type/encoding | Submit UTF-8 JSON; **no unchanged retry**. |
| 422 | Complexity/output limit exceeded | Simplify input; **no unchanged retry**. |
| 429 | Possible RapidAPI gateway rate limit | Honor `Retry-After` and your plan quotas; 429 is not a claimed Worker response. |
| 500 | Internal error | Brief bounded exponential backoff; escalate repeated failures. |
| 503 | Service configuration unavailable | Do not loop endlessly; operator intervention may be required. |

Fixed errors use `{"error":{"code":"...","message":"..."}}`; the OpenAPI document contains the complete status/code catalog. Do not log keys or user HTML when handling errors.

## Local synthetic verification is not a marketplace call

`npm run test:examples` launches `wrangler dev --local` bound to `127.0.0.1:8787`, then a loopback synthetic gateway on `127.0.0.1:8788`. The gateway checks **synthetic** customer key/host values and injects a **synthetic** private origin credential. The unchanged curl/fetch/Python customer samples call that shim with their usual RapidAPI headers. A direct Worker request missing its origin credential must return 403.

The smoke test verifies six successful requests (three languages and both endpoints), exact success JSON, UTF-8/Unicode stats, no-store response, and negative authentication/shape cases. It requires no paid tooling, public website, real credential, separate SDK, or deployment. This synthetic shim is **not** RapidAPI infrastructure, so a green local result is not a claim of live marketplace functionality.
