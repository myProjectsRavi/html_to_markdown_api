# Validation ledger

Blueprint: HTML to Markdown and Clean Text API Implementation Blueprint v1.0, 27 September 2026.

## US001 - Establish the repository and checkpoint ledger

- Environment: ChatGPT sandbox + connected GitHub repository.
- Repository: `myProjectsRavi/html_to_markdown_api` (public).
- Allowed branch: `autopilot/html-markdown-v1`.
- Approved starting `main` SHA: `51497790a365b9465e35bb8dd2b06adb4ac38d4c`.
- Implementation/tested code SHA: `51649e95d3ada3264eda5b3dc7916f4fea0d6070`.
- Remote branch verification: branch HEAD observed at the implementation SHA; its ancestry begins at the approved starting `main` SHA.
- Branch comparison: ahead by 2, behind by 0 at implementation validation. Changed paths were only `.gitignore`, `README.md`, `package.json`, `docs/autopilot/*`, and `scripts/check-state*.mjs`.
- CI status at the implementation SHA: no status checks existed yet. US001 does not infer a CI pass from that absence.
- Sandbox runtime: Node `v22.16.0`; npm `10.9.2`.
- Command: `npm run check:state`.
- Result: exit 0. Validator selected `US001 (VALIDATING)` from the implementation checkpoint; negative tests passed for missing story, dependency cycle, and DONE without evidence. A first completion-state rehearsal exposed that two negative-test expectations were tied to US001 being unfinished; the test was corrected in the same story and the exact repaired SHA was retested successfully.
- Remote-content provenance: every intended implementation file was matched to the exact Git blob SHA of remote tree `4051ee75133181f9bb3c7454bbec32309e083549` before the sandbox run.
- Clean-checkout limitation: direct `git clone` from the sandbox failed because sandbox DNS could not resolve `github.com`. To avoid fabricating a clone result, validation used a fresh clean directory materialized from the exact remote-matched file bytes; the full state command passed there. GitHub connector reads independently verified branch HEAD, ancestry, tree, and diff.
- Conclusion: US001 acceptance criteria are satisfied for the recorded implementation SHA within the observed scope.

## US002 - Install the hourly execution contract

- Status: DONE.
- Final tested story SHA: `0d93ea0a6a3c3e102691426da17dcf68e7e8ad5c`.
- Original executable Worker/bootstrap candidate: `f51dac153e5cbafc088d99b240a36f867a6b89fc`.
- Original authoritative candidate run: GitHub Actions `36340561663`, job `108679689891`, conclusion `success`.
- Final authoritative US002 run after DONE-state fixture repair: GitHub Actions `36370812410`, job `108766582093`, exact SHA `0d93ea0a6a3c3e102691426da17dcf68e7e8ad5c`, conclusion `success`.
- Runtime: Node `v22.22.2`, npm `10.9.7`.
- Dependency provenance: committed lockfile generated from exact package versions; CI uses `npm ci` from that reviewed lockfile and `npm ls --all`.
- State checks: current ledger selects `US003 (TODO)` after US002 completion; negative fixtures pass for initial state, missing ID, dependency cycle, and DONE without evidence.
- Runner checks at final SHA: wrong-branch-before-mutation PASS; interrupted-run-resumes-same-story PASS using the dynamically selected eligible story; overlapping-run-rejected PASS.
- Type/build checks: `wrangler types src/worker-configuration.d.ts && tsc --noEmit` passed.
- Worker harness: 1 test file passed, 1 test passed inside the Cloudflare Vitest/workerd integration.
- Bundle dry run: Wrangler completed with total upload 0.32 KiB / gzip 0.22 KiB and exited in dry-run mode.
- Generated-file cleanliness: `git status --short` passed with no tracked generated-file diff.
- CI hardening: workflow has `contents: read`, checkout credentials are not persisted, action revisions are pinned, concurrency does not cancel an in-progress run, and the job has a 15-minute timeout.
- Scheduler evidence: primary Story Runner observed at `2026-09-27T17:45:34Z` and again at `2026-09-27T18:46:53Z`; watchdog observed independently. The two-successive-primary-trigger gate is satisfied.
- Failure history retained: initial bootstrap failures exposed incompatible npm/Node pairing, npm peer-resolution behavior, and missing Worker/tooling types. Later, after US002 became DONE, runs `36345718801`, `36345733919`, `36367181400`, and `36370758300` exposed a different deterministic regression: the interruption test expected literal `RESUME US002` even though the ledger correctly selected US003 next. The failures were not reclassified. Commit `0d93ea0a6a3c3e102691426da17dcf68e7e8ad5c` repaired the fixture to derive the current active/eligible story from BACKLOG, and exact-head run `36370812410` passed.
- Lock recovery: the stale lease acquired at `2026-09-28T01:44:27Z` expired after its declared 55-minute lease. It was reclaimed optimistically against the exact lock blob in commit `6094b6c8ac56cc9fa27faf8b6df0aba703d8cd9d`, whose sole parent is the recorded pre-claim HEAD `9e4c4340a32119e79a693ae06aa09bdc2dfd0504`; the claim changed only `RUN_LOCK.json`.
- Conclusion: all US002 acceptance criteria and post-completion runner-integrity checks are satisfied. US002 is DONE. US003 is the next eligible story and must begin only in a distinct subsequent run.

## US003 - Freeze the machine readable API contract

- Status: DONE.
- Tested implementation SHA: `9be9096ee3aa05853cb8618192f624319d59d440`.
- Authoritative validation: GitHub Actions run `36371305905`, job `108768080396`, exact SHA `9be9096ee3aa05853cb8618192f624319d59d440`, conclusion `success`.
- State/runner checks: state validator selected `US003 (IN_PROGRESS)`; negative state fixtures passed; wrong-branch-before-mutation passed; interrupted-run-resumes-same-story passed for US003; overlapping-run-rejected passed for US003.
- Typed contract: `src/config.ts` defines the exact three V1 endpoints, application response headers, validation precedence, numeric launch ceilings, conversion request/stats types, and distinct Markdown/Text success types.
- Error contract: `src/errors.ts` defines all documented application error codes, exactly one HTTP status per code, and one fixed message per code. The blueprint-provided `input_too_large` message is preserved verbatim; other fixed messages are explicitly recorded as US003 decisions rather than misattributed to the source.
- Canonical counts: contract test independently verified the Hello HTML as 45 UTF-8 bytes, Markdown output as 14 Unicode scalars, clean-text output as 12 Unicode scalars, and empty input/output counts as zero.
- Unicode evidence: the contract test independently verified `😀` as four UTF-8 bytes and one Unicode scalar.
- Type-level evidence: compile-time assertions distinguish `SuccessFor<"/v1/html/markdown">` from `SuccessFor<"/v1/html/text">` and prove the endpoint-specific result keys do not leak into each other.
- OpenAPI: initial `openapi.yaml` contains only `GET /health`, `POST /v1/html/markdown`, and `POST /v1/html/text`; it declares the exact request/success shapes, canonical examples, application errors, response headers, and supported limits without adding a URL-fetch or hidden option.
- Decision record: `docs/decisions/0001-api-contract.md` freezes counting rules, validation precedence, endpoint names, response headers, fixed errors, numeric ceilings and later-change control.
- Test results in the authoritative run: TypeScript/Worker types passed; Cloudflare workerd bootstrap test passed (1/1); US003 contract test passed (4/4); Wrangler dry-run build passed at 0.32 KiB total / 0.22 KiB gzip; generated-file cleanliness passed.
- Boundary review: the implementation uses the corrected 45-byte Hello count and does not copy the source brief's earlier incorrect count. No production conversion success was fabricated.
- Conclusion: all US003 acceptance and evidence criteria are satisfied for `9be9096ee3aa05853cb8618192f624319d59d440`. US004 is next and may begin only in a distinct subsequent run.

## US004 - Create the canonical synthetic fixture corpus

- Status: DONE.
- Tested implementation SHA: `a47d87e7666e28ad41804d1acc8ecfff2903e2ac`.
- Authoritative validation: GitHub Actions run `36378870175`, job `108790252001`, exact SHA `a47d87e7666e28ad41804d1acc8ecfff2903e2ac`, conclusion `success`.
- Initial validation attempt: run `36378816899` failed because `scripts/validate-fixtures.mjs` accidentally contained TypeScript-only `as const` syntax. The failure was diagnosed, not ignored; commit `a47d87e7666e28ad41804d1acc8ecfff2903e2ac` removed the invalid syntax and the exact-head rerun passed.
- Corpus: `tests/fixtures/corpus.json` contains 62 small, literal, synthetic records. No expected output is generated by the converter under test.
- Required category coverage observed by the validator: blocks 10, inline 6, urls 12, code 8, tables 4, whitespace 3, entities 3, removed 8. Additional reviewed categories: malformed 2, nesting 3, unicode 3.
- Hand-review coverage tags observed: nesting, adjacent-blocks, unicode, unsafe-target, malformed-html.
- Negative schema evidence: missing expected field rejected; duplicate ID rejected; prohibited external/customer provenance metadata rejected.
- Provenance: fixture document declares `synthetic-only`; corpus uses authored synthetic strings and example-style URLs only. No customer payload or scraped third-party document is present.
- Boundary generation: `scripts/generate-boundary-fixtures.mjs` creates exact/plus-one values in memory instead of committing megabyte-scale data. Self-test verified decoded HTML 131072/131073 bytes and raw JSON body 800000/800001 bytes.
- Regression validation at the same SHA: state validator and negative state tests passed; runner wrong-branch/resume/overlap checks passed for US004; TypeScript/Worker types passed; workerd bootstrap passed 1/1; US003 contract suite remained green 4/4; Wrangler dry-run passed at 0.32 KiB / 0.22 KiB gzip; generated-file cleanliness passed.
- Scope boundary: renderer stories have not been implemented yet. US004 completion proves fixture schema, literal expectations, coverage and provenance only; it does not claim that future renderers already satisfy every expected output.
- Conclusion: all US004 acceptance and evidence criteria are satisfied for `a47d87e7666e28ad41804d1acc8ecfff2903e2ac`. US005 is next and may begin only in a distinct subsequent run.

## US005 - Implement exact routing and response headers

- Status: DONE.
- Source implementation commit: `60671f4d7219b35ba2a4a76f5275d38a79a289f2`.
- Tested SHA: `9c756c2eec62dd10103863e05c8e26608a588a8f`.
- Authoritative validation: GitHub Actions run `36385013819`, job `108808468707`, conclusion `success`.
- Routing: exact case-sensitive path matching for `/health`, `/v1/html/markdown`, and `/v1/html/text`; wrong case and trailing slashes are 404; unknown paths are 404; known-path wrong methods including HEAD and OPTIONS are 405 with exact Allow headers.
- Health: `GET /health` returns exactly `{"status":"ok"}`.
- Headers: every application-controlled response is serialized as JSON and centrally receives `Content-Type: application/json; charset=utf-8`, `Cache-Control: no-store`, and `X-Content-Type-Options: nosniff`.
- Conversion boundary: valid conversion POST paths deliberately return a controlled 503 `service_unavailable` placeholder until later stories integrate authentication/body parsing/conversion. No conversion success is fabricated.
- Auth-order precursor: an unknown path carrying a synthetic `X-RapidAPI-Proxy-Secret` header remains 404, preserving the route-before-auth precedence required by the contract.
- Query privacy: query parameters do not change routing; route tests prove query values are absent from response bodies. Repository source search for `console.` returned no production logging calls.
- Route suite: 19/19 tests passed inside the Cloudflare Worker harness.
- Regression suite: state/runner checks passed for US005; Worker bootstrap 1/1; contract 4/4; fixture validation and boundary generation passed; TypeScript/Worker types passed; Wrangler dry-run passed at 3.33 KiB / 1.16 KiB gzip.
- Autopilot recovery: the primary scheduler fired at `2026-09-28T05:45:37Z` without repository/CI movement. The task prompts were hardened to define progress only as durable repo/CI/blocker movement and require immediate recovery of eligible no-op runs. This manual recovery then completed US005.
- Conclusion: all US005 acceptance and evidence criteria are satisfied for `9c756c2eec62dd10103863e05c8e26608a588a8f`. US006 is the next eligible story and must begin only in a distinct run.

## US006 - Authenticate RapidAPI origin requests

- Status: DONE.
- Tested SHA: `9c899fe2444b54dc541c5cf600e9787b8e8f4da0`.
- Authoritative validation: GitHub Actions run `36393433386`, job `108834180976`, conclusion `success`.
- Recovery history: an earlier watchdog claimed US006 and committed only `src/auth/rapidapi.ts` at `fd9b1e873a12dc90d314ab6f8e085f0f586fe940`. Generic CI passed, but authentication was not wired into routing, no US006 acceptance suite existed, durable state still said US005/US006 TODO, and the lock was left active. The expired lease was reclaimed and the story was completed rather than treating that green run as acceptance evidence.
- First recovery candidate `60a48ae50362ac79847fef22094e6eca2587ff93` failed run `36393347301` at TypeScript narrowing in `src/auth/rapidapi.ts`; commit `9c899fe2444b54dc541c5cf600e9787b8e8f4da0` repaired the type predicate and the exact-head rerun passed.
- Integration order: exact path/method resolution occurs first; public health returns before authentication; both conversion routes authenticate before any body/parser work.
- Credential cases: missing, incorrect, prefix-only, suffix-only, oversized (>512 characters), and duplicate/coalesced proxy-secret values return 403. Missing/invalid server proxy-secret configuration returns 503. A customer `X-RapidAPI-Key` without the proxy secret returns 403.
- Correct-secret evidence: direct auth returns `null`, and the Worker proceeds to US005's controlled non-success conversion placeholder rather than being rejected by authentication.
- Body-read evidence: a Request subclass spy covering `body`, `text`, `json`, `arrayBuffer`, `blob`, and `formData` remained at zero reads for a rejected credential.
- Secret-log evidence: console log/info/warn/error capture remained empty after both rejected and accepted synthetic-secret requests; neither configured nor supplied synthetic secret pattern appeared.
- Comparison approach: supplied/configured secrets are SHA-256 digested with WebCrypto and compared by a full scan over the fixed 32-byte digests. The implementation explicitly does not claim JavaScript/runtime constant-time guarantees.
- Regression evidence from the same run: state and runner tests passed for US006; Worker bootstrap 1/1; contract 4/4; fixture checks and generated boundaries passed; routing 19/19; auth 8/8; Worker/TypeScript checks passed; Wrangler dry-run passed at 4.98 KiB / 1.66 KiB gzip.
- Conclusion: all US006 acceptance criteria and requested evidence pass for `9c899fe2444b54dc541c5cf600e9787b8e8f4da0`. US007 is next and must start in a distinct run.

## US007 - Read request bodies within a hard bound

- Status: DONE.
- Tested SHA: `364f952bd93dd2ac42d40aef7c53e6870f32e643`.
- Authoritative validation: GitHub Actions run `36394951628`, job `108839034367`, conclusion `success`.
- Request-body implementation: `src/http/body.ts` validates JSON media type/optional UTF-8 charset and Content-Encoding before reading, uses numeric Content-Length only as an early rejection, then counts every ReadableStream chunk against the 800000-byte raw-body limit.
- Bounded allocation: a chunk is cap-checked before it is copied/retained; retained raw chunk bytes cannot exceed 800000. A single retained chunk is decoded directly; multi-chunk input is combined into an allocation exactly equal to observed bounded bytes.
- Overflow: actual byte count of 800001 returns 413 whether Content-Length is absent, false-small, or malformed. Overflow calls `reader.cancel()`; the test stream is configured with zero high-water prefetch so the underlying cancellation callback remains observable.
- Exact boundary: exactly 800000 raw bytes returns an admitted bounded-body result for the later JSON-validation stage.
- Media/encoding: `application/json`, optional case-insensitive `charset=utf-8`, and identity/no Content-Encoding are accepted. Unsupported media, charset, or content encoding returns 415.
- UTF-8: decoding occurs after bounded collection with `TextDecoder(..., { fatal: true })`. A four-byte emoji split into one-byte chunks decodes correctly; an invalid UTF-8 sequence returns the fixed 400 `invalid_json` envelope.
- Malformed transport evidence: a synthetic early stream disconnect maps to fixed 400 without including the transport exception.
- Logging evidence: console log/info/warn/error capture remained empty while a synthetic body canary was read.
- Integration order: route/method resolution -> server auth configuration/authentication -> media/encoding/body bound/strict UTF-8 -> future US008 JSON validation. No unbounded `request.text()` or `request.json()` call was added.
- Failure history retained: run `36394744467` exposed a TypeScript header-fixture union issue; run `36394825309` then exposed that a test stream could pre-close before its cancellation callback was observed. Both were fixed within US007; neither failing run was reclassified as passing.
- Regression evidence at the tested SHA: state/negative checks PASS; runner branch/resume/overlap PASS for US007; Worker bootstrap 1/1; contract 4/4; fixtures/boundaries PASS; routing 19/19; auth 8/8; body 9/9; TypeScript/Worker types PASS; Wrangler dry-run PASS at 8.92 KiB / 2.76 KiB gzip.
- Conclusion: all US007 acceptance and evidence requirements pass for `364f952bd93dd2ac42d40aef7c53e6870f32e643`. US008 is next and must begin only in a distinct run.

## US008 - Validate JSON and decoded HTML precisely

- Status: DONE.
- Tested SHA: `0a7aa1367484809cdfedece2475427d71da1a052`.
- Authoritative validation: GitHub Actions run `36396483763`, job `108843975949`, conclusion `success`.
- Native JSON parsing: `src/http/request.ts` uses `JSON.parse` directly; no secondary JSON parser was introduced. Duplicate `html` keys therefore follow native last-value-wins semantics and are covered by a fixture.
- Shape validation: missing `html` returns `missing_html`; null, arrays, top-level primitives, non-string html and extra fields return `invalid_request`.
- Unicode safety: unpaired high and low UTF-16 surrogates are rejected; a valid surrogate pair is accepted. Emoji and combining-mark content is preserved unchanged.
- Decoded HTML accounting: `TextEncoder` measures the decoded `html` value before normalization. ASCII 131072 bytes passes and plus one returns 413; a multibyte 131072-byte value also passes and plus one returns 413. Escaped JSON is measured after JSON decoding.
- Empty/whitespace behavior: empty and whitespace-only html pass this layer and proceed to the existing controlled downstream placeholder; this does not fabricate parser/rendering success.
- Independent limits: US007 raw-body tests remain in the same validation command (9/9), while US008 request tests independently exercise the decoded HTML ceiling (10/10).
- Failure history retained: run `36396112409` failed a TypeScript syntax error in an invalid-shape fixture; run `36396243196` then exposed a malformed whitespace JSON fixture; run `36396370423` exposed that the repaired fixture represented literal backslash sequences and therefore had 6 bytes rather than the intended 4 whitespace bytes. Each defect was fixed in the same story. Exact-head run `36396483763` passed.
- Regression evidence at the tested SHA: state/negative checks pass; runner branch/resume/overlap checks pass for US008; Worker bootstrap 1/1; contract 4/4; fixture checks/boundaries pass; routing 19/19; auth 8/8; body 9/9; request validation 10/10; Worker/TypeScript checks pass; Wrangler dry-run passes at 10.71 KiB / 3.16 KiB gzip.
- Conclusion: all US008 acceptance/evidence criteria pass for `0a7aa1367484809cdfedece2475427d71da1a052`. US009 is next and must begin only in a distinct run.

## US009 - Select a parser with measured evidence

- Status: DONE.
- Tested SHA: `355671d6e0636eccb9932c1e3b0f05e9985e88ed`.
- Dedicated evidence: GitHub Actions run `36410050709`, job `108887864514`, conclusion `success`.
- Generic regression validation: GitHub Actions run `36410050672`, job `108887864751`, conclusion `success`.
- Compared exact candidates: `htmlparser2@12.0.0` and `parse5@8.0.1`; installed metadata reported MIT for both.
- Pinned workerd evidence: both candidates imported/parsed with no browser DOM and no observed network call; parser-selection Worker tests passed 3/3.
- Enforceable limit evidence: htmlparser2 callback parser stopped at event 101 for limit 100. The compared parse5 high-level `parse()` API constructs its tree before returning and did not expose an equivalent callback boundary in the adapter.
- Worker bundle comparison: htmlparser2 90.70 KiB / 28.31 KiB gzip / 92,878 JS bytes; parse5 274.74 KiB / 54.38 KiB gzip / 281,329 JS bytes.
- Representative medians in ms at 1/16/64/128 KiB: htmlparser2 0.494/3.958/4.575/8.441; parse5 1.099/3.981/3.753/6.966. parse5 being faster at 64/128 KiB is retained to show selection was not based on a blanket performance claim.
- Adversarial probes: 2000-level nesting 3.802 ms vs 19.274 ms; 65,536-byte attribute 0.458 ms vs 1.373 ms. Both candidates decoded the entity probe identically; the malformed text probe yielded `abc` for both.
- Security snapshot: exact candidate graph npm audit reported 0 vulnerabilities. This is dated evidence, not a future-security guarantee.
- Decision: `htmlparser2@12.0.0` selected for US010 because its public event callbacks permit early bounded rejection and its compared Worker bundle is smaller. `docs/decisions/parser.md` records malformed-HTML compliance trade-offs and memory/retention risks.
- Dependency boundary: candidate installs were ephemeral in US009; no rejected parser was added to production. US010 owns adding/locking htmlparser2 as the direct production dependency.
- Conclusion: US009 acceptance/evidence is satisfied for `355671d6e0636eccb9932c1e3b0f05e9985e88ed`. US010 is next and must begin only in a distinct run.

## US010 - Build the bounded parser adapter

- Status: DONE.
- Tested SHA: `03f4886b9456e4b11ae6537a3b904ca69a31908b`.
- Authoritative exact-head validation: GitHub Actions run `36427410547`, job `108944669880`, conclusion `success`.
- Selected production parser: `htmlparser2@12.0.0`, locked in `package.json` and `package-lock.json`. Lock generation commit `310b4f852281b1c84cf807e7d8d8bd81780eda27` changed only `package-lock.json`; the one-shot write workflow was removed before authoritative validation.
- Parser budget coverage: exact and plus-one tests exist for tokenizer events (20000/20001), retained nodes (10000/10001), open-element depth (64/65), attributes per element (64/65), attribute-name Unicode scalars (256/257), and attribute-value UTF-8 bytes (8192/8193).
- Parser implementation: callback-based `htmlparser2.Parser`; attributes are validated from `onattribute` before an application node is retained; application traversal uses an explicit bounded frame stack; skipped subtrees retain null frames while their parser callbacks continue to consume structural budgets.
- Skipped-content evidence: a template-subtree test with a reduced synthetic event ceiling proves discarded nested content still consumes parser budgets; the limit observer fires exactly once and no skipped descendants are retained.
- Malformed/long-tag evidence: an overlong attribute name in an unterminated opening tag is rejected as `attributeNameScalars`, demonstrating that the application does not retain a partial element before validation completes.
- Error behavior: parser limit failures are typed `ParserLimitError` and map to fixed `input_too_complex`; unexpected parser failures are wrapped as `ParserInternalError` and map to `internal_error`. The Worker never emits partial success after a parser exception.
- CPU boundary: no timer or `Promise.race` is used or claimed as synchronous parser preemption.
- Allocation reasoning: raw JSON and decoded HTML are already bounded by US007/US008; each application-retained node consumes the retained-node budget; attributes are checked before application retention; skipped subtrees allocate only bounded parser/internal input state plus one bounded frame per currently open element; open depth is capped at 64.
- Smallest limit reproducers recorded in evidence: 20001st event after 10000 `<i></i>` pairs; 10001st empty comment node; 65th nested `<div>`; 65th unique attribute; 257-scalar attribute name; 8193-byte attribute value.
- Exact-head regression: state/negative checks PASS; runner branch/resume/overlap PASS for US010; Worker bootstrap 1/1; contract 4/4; fixture validation/boundaries PASS; routing 19/19; auth 8/8; body 9/9; request 10/10; parser budget + parser integration 15/15; Worker/TypeScript checks PASS; Wrangler dry-run PASS at 106.07 KiB / 32.74 KiB gzip.
- Failure history: the initial implementation run `36427202959` failed at `npm ci` because the dependency lock had not yet been generated; this expected bootstrap failure was not reclassified as passing. The one-shot lock workflow `36427203043` generated the exact lock, after which authoritative run `36427410547` passed.
- Conclusion: all US010 acceptance/evidence criteria pass for `03f4886b9456e4b11ae6537a3b904ca69a31908b`. US011 is next and must begin only in a distinct run.

## US012 - Preserve Unicode and normalize whitespace

- Status: DONE.
- Tested SHA: `6deb6997945b5cf5c2e2dfabc8a5dcfe8bd42cd3`.
- Authoritative validation: GitHub Actions run `36729200912`, job `109933975411`, conclusion `success`.
- Shared text helpers normalize CRLF/CR and HTML ASCII whitespace outside protected pre/code content while preserving Unicode content including Hindi, Telugu, Arabic, emoji, combining marks and non-breaking spaces.
- Exact US012 tests cover tabs, mixed line endings, adjacent inline boundaries, Unicode scalar behavior and protected segments.
- The `&amp;lt;` fixture verifies there is no second entity decode. The repaired assertion validates the concatenated text stream rather than requiring htmlparser2 to coalesce adjacent text nodes.
- Failure history is retained: runs `36670074467` and `36680192891` failed the over-specific node-boundary assertion; commit `d3251667d0eba59208223224253dee01707b0399` corrected only that test boundary.
- Final exact-head validation passed at `6deb6997945b5cf5c2e2dfabc8a5dcfe8bd42cd3`.
- Conclusion: US012 acceptance/evidence is satisfied. US013 is next and must begin only in a distinct run.



## US013 - Render Markdown blocks

- Status: DONE.
- Tested SHA: `dc2d77eb4c5c07ddd8e76c026b1200b85716240c`.
- Authoritative validation: GitHub Actions run `37025693574`, conclusion `success`.
- Exact block fixtures cover h1-h6, adjacent/nested blocks, empty wrappers, br/hr behavior, block-leading punctuation, source-tag absence, and retained pre/code placeholders.
- Failure history retained: run `36970137580` exposed pre-placeholder leading whitespace loss; commit `720112f22dfed0eeba063c8bd68223b652489bef` repaired it and the later authoritative run passed.
- Conclusion: US013 acceptance/regression validation passes. US014 is next.
