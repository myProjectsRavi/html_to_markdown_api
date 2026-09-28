# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E02 HTTP boundary
- Current Feature: F03 Routing and authentication
- Current Story: US006 Authenticate RapidAPI origin requests
- Phase: DONE
- Pre-story checkpoint: `8f602cf1f3c4f3cb3064e8532d4e7d7fd1e7522e`
- Abandoned watchdog claim: acquired `2026-09-28T06:24:11Z`; partial implementation `fd9b1e873a12dc90d314ab6f8e085f0f586fe940`; lease expired without durable story reconciliation/release.
- Recovery claim: `d6be38c50c1b99f5b90fb1516fbf8385fefb867e`.
- Tested code SHA: `9c899fe2444b54dc541c5cf600e9787b8e8f4da0`
- Authoritative validation: GitHub Actions run `36393433386`, job `108834180976`, conclusion success.
- Failure repaired within recovery: run `36393347301` failed on TypeScript credential narrowing; `9c899fe2444b54dc541c5cf600e9787b8e8f4da0` fixed the type guard and exact-head CI passed.
- Completed criteria: health public; business routes authenticate after route/method resolution and before body use; missing/incorrect/prefix/suffix/oversized/duplicate-coalesced credentials rejected; missing/invalid server configuration returns 503; correct secret proceeds; customer X-RapidAPI-Key is not accepted as origin auth; rejected-auth body spy records zero reads; secret-pattern console capture is empty; no constant-time guarantee claimed.
- Regression evidence: Worker bootstrap 1/1; contract 4/4; fixture validation and boundaries pass; routing 19/19; auth 8/8; TypeScript/Worker types pass; Wrangler dry-run 4.98 KiB / 1.66 KiB gzip.
- Remaining criterion: none.
- Blocker category: none.
- Blocker: none.
- Lock state: released by this final US006 checkpoint.
- Exact next action: on the next distinct run, acquire the released lock and implement only `US007 Read request bodies within a hard bound` from its durable blueprint specification.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.

- Autopilot hardening after US006: `docs/autopilot/STORY_SPECS.md` now persists the complete US001-US044 source-derived story sections; the canonical branch-lock lease is 20 minutes so an abandoned run can be recovered by the approximately 30-minute staggered watchdog; owning runs must checkpoint/release before minute 15 rather than holding a stale 55-minute lease.
- Scheduler contract: primary hourly at :15 Asia/Kolkata; watchdog hourly at :45 Asia/Kolkata. A task timestamp without repository/CI/blocker movement is explicitly a no-op failure, not progress.
