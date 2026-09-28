# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E01 Foundation
- Current Feature: F02 Contract and fixtures
- Current Story: US004 Create the canonical synthetic fixture corpus
- Phase: IN_PROGRESS
- Pre-story checkpoint: `d031e178c53c41cd904d3846e7122b85f49915e2`
- Lock claim: `ac6524c3cfa80a37254d64c030eebcb5f109687f`, verified direct parent of the pre-story checkpoint and lock-only diff.
- Implementation/tested code SHA: pending this story's implementation checkpoint and CI.
- Completed work: US004 source requirements reviewed; synthetic corpus, schema validator, negative validator tests and runtime boundary generators prepared; renderer acceptance is intentionally not claimed before renderer stories exist.
- Remaining criteria: push US004 implementation checkpoint; obtain exact-head GitHub Actions success; record category coverage and negative-test evidence; review diff; mark US004 DONE and release the lock.
- Blocker category: none.
- Blocker: none.
- Exact next action: validate the US004 fixture checkpoint in GitHub Actions; diagnose any failure within US004; if green, atomically mark US004 DONE, append VALIDATION/evidence, and release RUN_LOCK.json.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.
