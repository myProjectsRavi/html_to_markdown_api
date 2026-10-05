# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E07 Verification, security and CI hardening
- Current Feature: F15 Regression and fuzz verification
- Current Story: US029 Complete the supported behavior regression suite
- Phase: VALIDATING
- Prerequisite US028: DONE, tested SHA `207c0517c922984f2aa517086cd1779985d49a68`.
- Corpus checkpoint: 120 reviewed synthetic fixtures in `tests/fixtures/corpus.json`.
- Coverage map: `docs/testing/US029_REQUIREMENTS_MAP.md`.
- Integrated regression runner: `tests/regression-corpus.test.ts` exercises both conversion endpoints and validates factual stats.
- Validation wiring: `npm run test:regression` is part of `verify:current`.
- Candidate branch HEAD before release: `45954bd6d5b388c45274aaf824801e837f4cf984`.
- Validation status: authoritative GitHub Actions pending; no PASS is claimed yet.
- Exact next action: inspect the released-head Actions run, fix any US029-only regression mismatch without weakening assertions, and mark DONE only after all acceptance evidence passes.
