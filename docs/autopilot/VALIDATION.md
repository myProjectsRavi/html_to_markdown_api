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
