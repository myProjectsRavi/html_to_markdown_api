# HTML to Markdown and Clean Text API

Stateless, deterministic HTML conversion on Cloudflare Workers. Routes: `POST /v1/html/markdown`, `POST /v1/html/text` and `GET /health`. No URL fetching, browser scripting, external storage or AI inference is part of conversion.

## RapidAPI customer quickstart

Obtain your actual gateway base URL, host header and subscription key from the RapidAPI dashboard. These are **customer** credentials, not the Worker's private gateway-to-origin secret.

```bash
export RAPIDAPI_BASE_URL="https://YOUR_RAPIDAPI_GATEWAY_BASE_URL"
export RAPIDAPI_HOST="YOUR_RAPIDAPI_HOST"
export RAPIDAPI_KEY="YOUR_SUBSCRIPTION_KEY"
bash examples/curl.sh markdown
```

The script sends `{"html":"<article><h1>Hello</h1><p>World</p></article>"}`. Its exact success body is:

```json
{"markdown":"# Hello\n\nWorld","stats":{"input_bytes":45,"output_chars":14}}
```

Use `bash examples/curl.sh text`, `node examples/fetch.mjs markdown`, or `python3 examples/python.py text` for other variants. See [integration guide](docs/integration/US038_QUICKSTART.md) for supported limits, 4xx errors, safe rendering, and retry policy.

Run `npm run test:examples` for a **synthetic loopback-only** test against a locally running Worker through a gateway shim. This does **not** prove the RapidAPI marketplace listing has been published. Development progress is tracked in `docs/autopilot/` on `autopilot/html-markdown-v1`.
