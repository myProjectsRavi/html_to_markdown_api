# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E06 Clean text and output accounting
- Current Feature: F14 Output accounting and error behavior
- Current Story: US028 Finalize error precedence and stateless requests
- Phase: VALIDATING
- Prerequisite US027: DONE, tested SHA `485df10c19b25ddeefaf46ea66bb631a5b167046`.
- Route-boundary failure ownership: `src/routes/conversion.ts` throws typed conversion failures at `e11367878ed19c13e015a06a73c89f460e063c9b`; `src/index.ts` owns the single generic business-route exception boundary at `678bedab92fa5a767810432fb0066af460268119`.
- US028 Worker-harness evidence: precedence, exact error/header parity, injected 500, controlled 503, 100 concurrent mixed requests, and failure-then-success isolation in `tests/error-isolation.test.ts` at `4649035a575d1c4bb67cf71fb586d9cfbc14b38a`.
- Validation wiring / candidate SHA: `951e432369bdc909f5a9dad0f1d00f5cba9c548a`.
- Validation status: authoritative GitHub Actions pending; no pass is claimed yet.
- Exact next action: inspect the released-head Actions run, fix any US028-only failure in-story, and mark DONE only after all acceptance evidence passes. Do not start US029 before US028 is DONE.
