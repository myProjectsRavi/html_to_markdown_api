# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E02 HTTP boundary
- Current Feature: F04 Bounded request validation
- Current Story: US008 Validate JSON and decoded HTML precisely
- Phase: IN_PROGRESS
- Pre-story checkpoint: `b1b261fdfc37cf2db8ecc4739933253a58c72ba4`
- Lock claim: `fd4ef598f345d6d762c9b2e583e8e7cdeed17e3c`, verified direct child of the pre-story checkpoint and lock-only diff.
- Implementation/tested code SHA: pending exact-head validation.
- Completed work: direct native JSON.parse; exact object shape with only string html; missing_html versus invalid_request split; unpaired-surrogate rejection; decoded HTML UTF-8 byte ceiling; empty/whitespace acceptance; duplicate-key last-value behavior documented; request validation integrated after US007 bounded body and before parser/rendering.
- Remaining criteria: obtain exact-head GitHub Actions success; diagnose/fix any US008 failure; record immutable evidence and release the 20-minute lock.
- Blocker category: none.
- Blocker: none.
- Exact next action: inspect the US008 Actions run, fix the same story until all request-validation and regression tests pass, then complete durable evidence and release the lock.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.
