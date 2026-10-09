# US039 - RapidAPI listing draft (not published)

**Status:** REVIEW DRAFT ONLY. Do not make public, configure a live base URL, activate a plan, or infer account-level unused capacity. This is **not** a production release decision.

## General tab: proposed copy

**Title:** HTML to Markdown and Clean Text API

**Short description:** Convert submitted HTML into readable Markdown or clean text with predictable JSON responses.

**Long description (paste after review):**

> Send UTF-8 HTML in a JSON request and receive Markdown or clean text with simple input-byte and output-character statistics. The API includes bounded input/output, fixed error codes and working curl, JavaScript and Python examples. It converts submitted HTML only; it does not fetch URLs, execute scripts or reproduce browser CSS layout. Designed for developer workflows that need a predictable text representation of HTML.

**Category:** OWNER ACTION REQUIRED. Pick one category actually present in the current Studio dropdown. Candidate areas to evaluate: Developer Tools or Data; neither has been confirmed to be an available category.

**Suggested tags (verify availability):** html, markdown, plain-text, text-conversion, developer-tools.

**Support contact:** OWNER ACTION REQUIRED. Enter a monitored public email address or a deliberately approved issue tracker. Never publish the placeholder. No support response-time commitment is assumed.

**Website:** Optional; no website is required or provided by this draft.

## Endpoint examples (tested against local Worker, not a live subscription)

POST `/v1/html/markdown` or `/v1/html/text` with:

```json
{"html":"<article><h1>Hello</h1><p>World</p></article>"}
```

Markdown response:

```json
{"markdown":"# Hello\n\nWorld","stats":{"input_bytes":45,"output_chars":14}}
```

Clean-text response:

```json
{"text":"Hello\n\nWorld","stats":{"input_bytes":45,"output_chars":12}}
```

GET `/health` returns `{"status":"ok"}`. Customer subscriptions send `X-RapidAPI-Key` and `X-RapidAPI-Host` to RapidAPI. Never expose or request the private gateway-to-origin credential. Local executable evidence: US037/US038.

## Honest product boundaries and privacy copy

The API accepts **submitted HTML, not a URL**. It is not a browser renderer or an AI summarizer. It does not fetch linked URLs, execute JavaScript or reproduce full layout. Unsafe URLs are restricted, relative links may stay relative, and unsupported complex tables can use text fallback. The raw JSON body limit is 800,000 bytes and the decoded HTML limit is 131,072 UTF-8 bytes; other parse and output safeguards are documented in OpenAPI.

**Privacy wording:** The application does not intentionally persist submitted HTML or converted text, and the origin sets `Cache-Control: no-store`. Cloudflare, RapidAPI, client software and networks can have their own operational logging and retention. Do not claim that every platform stores zero logs.

**Safety for consumers:** Treat output as untrusted text. Prefer `textContent` for clean-text display and a trusted Markdown renderer with raw HTML disabled/sanitized. Follow published 4xx errors by fixing input, not by repeating the same request.

## Pricing experiment: not activated

| Plan | USD/month | Hard requests/month | Average/day (30 days) | Worst single-day burst without rate limit |
| --- | ---: | ---: | ---: | ---: |
| FREE | $0.00 | 1,000 | 33.34 | 1,000 |
| PRO | $4.99 | 25,000 | 833.34 | 25,000 |
| ULTRA | $14.99 | 100,000 | 3,333.34 | 100,000 |
| MEGA | $39.99 | 500,000 | 16,666.67 | 500,000 |

Use the RapidAPI `Requests` billing object with a **monthly HARD quota**; no overage/soft-limit configuration. Validate the exact setting in Studio first. The base fees are experimental rather than market-validated. RapidAPI documents hard monthly quotas, but a monthly quota **alone does not bound requests per day**; separate approved second/minute/hour rate limits are required.

Workers Free is capped at **100,000 requests/day account-wide**. The candidate API planning reserve in US035 is **20,000/day** plus a **10,000/day safety reserve**, and all other Worker/staging/customer/rejection usage is unknown. A single MEGA subscriber could consume 500,000 in one day absent tighter limits, **five times the entire account daily cap**. ULTRA could consume the full account cap in a day. These plans must not be activated on the free account without capacity and burst decisions. All tiers remain provisional.

## Marketplace configuration checklist

- [ ] Confirm the real category from the Studio category list; choose exactly one.
- [ ] Confirm a monitored support contact and a support-response process.
- [ ] Confirm tags are accepted by the marketplace.
- [ ] Confirm ownership and uniqueness of the product identity to avoid duplicate listings.
- [ ] Confirm staging/production origin and private credentials under US040; avoid public credentials.
- [ ] Reconcile all other-Worker consumption and test real Worker CPU using authorized staging evidence (US035/US041).
- [ ] Choose approved prices, per-plan hard monthly quotas and bounded burst/rate limits; verify no overages.
- [ ] Import the tested OpenAPI 3.0.3 spec and validate real marketplace examples before publication.
- [ ] Complete release gate and owner review (US043) before any US044 publication.

## Capability-to-evidence matrix

| Listing claim | Source of evidence |
| --- | --- |
| Routes, limits, fixed error catalog and correct client-auth boundary | `openapi.yaml`, `docs/autopilot/evidence/US037.md` |
| Exact curl, JS and Python success JSON | `docs/autopilot/evidence/US038.md` |
| Conversion security and safe URL handling | `docs/autopilot/evidence/US031.md` |
| Application logging disabled in production configuration | `docs/autopilot/evidence/US036.md` |
| Free account planning constraint and missing aggregate capacity | `docs/capacity/free-account-envelope.json`, `docs/autopilot/evidence/US035.md` |

Platform docs reviewed 2026-10-09: [RapidAPI General](https://docs.rapidapi.com/docs/hub-listing-general-tab), [RapidAPI Monetize](https://docs.rapidapi.com/v2.0/docs/hub-listing-monetize-tab), [Cloudflare Worker limits](https://developers.cloudflare.com/workers/platform/limits/).

**Owner decisions pending:** approved category, real contact, pricing/rate controls, account-wide capacity and publication authorization. No live changes were made.
