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

