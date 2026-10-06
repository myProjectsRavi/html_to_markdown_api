# Security Review

Scope: US031, branch `autopilot/html-markdown-v1`. This review is limited to the inspected source, tests, workflow evidence and the supported V1 threat model. It is not a certification and does not describe the API as an XSS firewall.

## Findings

| Area | Files inspected | Finding | Disposition |
| --- | --- | --- | --- |
| Raw HTML fallback | `src/html/clean.ts`, `src/markdown/blocks.ts`, `src/html/text.ts` | Active subtrees are dropped, unknown tags are transparent wrappers, and literal angle brackets are escaped in Markdown normal text. Clean-text output is plain text by contract. | Covered by `tests/security.test.ts`; no defect found. |
| URL scheme bypass | `src/markdown/url.ts`, `src/markdown/link.ts`, image/link renderers | Unsafe schemes, network-path references, credentials, backslashes, control characters and percent-obfuscated scheme prefixes are rejected before Markdown serialization. No URL is resolved or fetched. | Integrated bypass cases added to `tests/security.test.ts`; no defect found. |
| Regex and recursion bounds | `src/html/limits.ts`, `src/html/parse.ts`, `src/markdown/table.ts`, renderers | Parser events, retained nodes, attributes and open-element depth are bounded. Security-critical regexes are linear fixed-shape checks; recursive renderer paths operate only on the bounded tree. | Depth-overflow regression remains a fixed 422; no unbounded source traversal found. |
| Exception disclosure | `src/index.ts`, `src/errors.ts`, `src/http/response.ts` | Unexpected parser/conversion failures cross one generic business-route boundary and return a fixed internal-error envelope without exception text, stack or partial output. | Injected `ParserInternalError` canary regression added; no disclosure observed. |
| Secret handling | `src/auth/rapidapi.ts`, tracked files and Git history | Proxy secret is supplied only through runtime environment, validated, hashed with SHA-256, and digest-compared with a full-byte scan. No runtime logging exists. | High-confidence tracked/history secret scan added; synthetic fixtures are intentionally non-secret. |
| Network and storage | all `src/**/*.ts`, `wrangler.jsonc` | No runtime outbound primitive, system networking/storage import, Cloudflare storage binding, cache write, application logger or persistence binding is present. | Static source/binding audit plus runtime fetch trap added. |

## Markdown consumer boundary

The API converts untrusted HTML into a constrained Markdown representation. It does not control every downstream Markdown extension or browser renderer. Consumers that enable non-CommonMark extensions should still apply their own renderer policy. The regression suite specifically verifies that ordinary generated Markdown does not contain unescaped source HTML tags for active-content inputs. Fenced code can legitimately contain literal text that resembles HTML and remains code.

Clean-text output must be inserted as text, for example with `textContent`, not reinterpreted as HTML by a caller.

## Privacy boundary

The Worker is stateless. Production runtime source contains no request/response logging, outbound fetch, cache/database/object-storage write, analytics SDK or persistent binding. Successful responses necessarily contain the converted user-visible content requested by the caller; the privacy claim is that submitted content is not separately logged, persisted or transmitted by this implementation.

## Residual limitations

- A safe Markdown link can still point to an external HTTPS URL; classification prevents scheme bypass but does not establish reputation or content safety for the destination.
- The API does not sanitize arbitrary Markdown supplied by another source.
- Platform-level infrastructure outside this repository is not attested by source review.
- Security approval is limited to the exact validated revision recorded in `docs/autopilot/evidence/US031.md`.
