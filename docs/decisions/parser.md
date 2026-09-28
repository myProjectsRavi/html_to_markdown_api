# Decision 0002: HTML parser selection

- Status: Accepted for US009
- Date: 28 September 2026
- Selected candidate for US010: `htmlparser2@12.0.0`
- Compared alternative: `parse5@8.0.1`
- Evidence SHA: `355671d6e0636eccb9932c1e3b0f05e9985e88ed`
- Dedicated evidence run: GitHub Actions `36410050709`, job `108887864514`
- Generic regression run: GitHub Actions `36410050672`, job `108887864751`

## Why this decision exists

The production parser must fit Cloudflare Workers and, more importantly, expose a boundary where the adapter can reject complexity before retaining an unbounded tree. US009 therefore does not choose a parser from familiarity or from a single tiny-input benchmark.

Both candidates are established ESM packages with built-in types and MIT licenses. The dedicated run installed the exact versions ephemerally, executed both in the pinned Cloudflare workerd test environment, bundled each independently with Wrangler, measured representative and adversarial inputs, and audited the exact candidate dependency graph.

## Reproducible candidate matrix

| Property | htmlparser2 12.0.0 | parse5 8.0.1 |
| --- | ---: | ---: |
| License observed from installed package | MIT | MIT |
| workerd import/parse | PASS | PASS |
| Browser `document` required | No | No |
| Network used by parse test | No | No |
| Event-bound early stop | PASS at event 101 for limit 100 | Not exposed by compared high-level `parse()` adapter |
| Wrangler upload | 90.70 KiB | 274.74 KiB |
| Wrangler gzip | 28.31 KiB | 54.38 KiB |
| Generated JS bytes | 92,878 | 281,329 |
| Exact candidate graph npm audit | 0 vulnerabilities | 0 vulnerabilities in the combined exact-version graph |

The audit result is a dated dependency-advisory snapshot, not a guarantee that future advisories will remain empty.

## Median Node measurement snapshot

These timings are evidence from one GitHub-hosted runner and are not treated as a production latency guarantee.

| Input/probe | htmlparser2 | parse5 |
| --- | ---: | ---: |
| 1 KiB representative | 0.494 ms | 1.099 ms |
| 16 KiB representative | 3.958 ms | 3.981 ms |
| 64 KiB representative | 4.575 ms | 3.753 ms |
| 128 KiB representative | 8.441 ms | 6.966 ms |
| 2000-level nesting | 3.802 ms | 19.274 ms |
| 65,536-byte attribute | 0.458 ms | 1.373 ms |

The 64 KiB and 128 KiB representative measurements were faster for parse5 in this run. That is intentional evidence that the selection is not based on claiming htmlparser2 is always faster.

Both candidates decoded the representative `&amp;`, `&nbsp;`, and numeric emoji entity probe to the same text. The malformed probe `<p>a<div>b</p>c` also produced the same extracted text `abc`; this does not imply identical trees.

## Selection rationale

`htmlparser2` is selected because its public `Parser` callback interface gives US010 an explicit point to count tokenizer events, depth and attributes and to stop immediately by throwing a controlled sentinel. In the dedicated run, the parser stopped at event 101 when the configured synthetic limit was 100.

The compared parse5 high-level `parse()` API returned only after constructing its document tree. Although parse5 provides stronger WHATWG/browser-style HTML conformance, that high-level shape is a worse match for the blueprint requirement to reject malicious complexity during parsing rather than after full tree construction.

The Worker bundle was also materially smaller for the htmlparser2 candidate. Bundle size is supporting evidence, not the primary reason for selection.

## Malformed HTML and compatibility trade-off

Upstream describes htmlparser2 as fast and forgiving and explicitly notes that it takes shortcuts; upstream points users needing strict HTML-spec compliance toward parse5. parse5 describes itself as WHATWG HTML compliant and browser-like. Therefore malformed HTML can produce different repaired tree structures even when a text-only probe happens to match.

US010 and later normalization/rendering stories must not assume browser-identical error recovery. Canonical fixtures must define this API's behavior for malformed input, and the adapter must expose only the bounded normalized structure the product contract needs.

## Memory and denial-of-service risks

The selection does not make unbounded DOM construction safe. The US009 Node timing harness used `parseDocument()` only to compare whole-document behavior; production US010 must use the callback `Parser` path instead.

US010 must count parser events, open depth, attributes and retained nodes before retention, bound attribute names/values and URLs, and abort with the defined complexity error as soon as a ceiling is exceeded. Large text or attribute tokens can still exist inside the already bounded 131,072-byte HTML input, so adapter checks remain mandatory even with a streaming callback parser.

## Security and license review

The dedicated exact-version audit reported `found 0 vulnerabilities` for the combined htmlparser2 12.0.0 + parse5 8.0.1 candidate graph. Both installed packages reported MIT licenses. Upstream package metadata likewise declares MIT.

Parser output is not sanitization. Later URL and Markdown rendering stories must continue to classify/escape output independently; this decision grants no trust to input markup merely because parsing succeeded.

## Dependency boundary

US009 intentionally installed both candidates only inside the evidence workflow and did not add either as a production dependency. This avoids leaving the rejected candidate in the production graph.

US010 must add and lock `htmlparser2@12.0.0` as the direct production parser dependency when implementing the bounded adapter. `parse5` must remain absent from the production dependency graph unless a later explicit decision supersedes this record.

## Preserved evidence

- `scripts/parser-spike.mjs`
- `tests/parser-selection.worker.test.mjs`
- `scripts/parser-candidate-htmlparser2-worker.mjs`
- `scripts/parser-candidate-parse5-worker.mjs`
- `.github/workflows/us009-parser-selection.yml`
- `docs/autopilot/evidence/US009.md`
