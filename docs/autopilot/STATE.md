# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E07 Verification, security and CI hardening
- Current Feature: F15 Regression and fuzz verification
- Current Story: US029 Complete the supported behavior regression suite
- Phase: DONE
- Prerequisite US028: DONE, tested SHA `207c0517c922984f2aa517086cd1779985d49a68`.
- Tested SHA: `bddd65015e675d334df50cb988cc55f82b55df90`.
- Authoritative validation: GitHub Actions run `37297313833`, job `111721631347`, conclusion `success`.
- Canonical corpus: 120 reviewed synthetic fixtures.
- Requirements map: `docs/testing/US029_REQUIREMENTS_MAP.md`.
- Evidence: `docs/autopilot/evidence/US029.md`.
- Failure repairs: stale fixture expectations were reviewed; document-head metadata leakage was fixed in production normalization and covered by a focused regression test.
- Exact next action: begin US030 Add reproducible property and fuzz tests as a distinct story run. Do not skip ahead.
