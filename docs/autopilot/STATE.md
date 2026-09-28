# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E02 HTTP boundary
- Current Feature: F04 Bounded request validation
- Current Story: US007 Read request bodies within a hard bound
- Phase: IN_PROGRESS
- Pre-story checkpoint: `66240fca2e384808458d74436420f03f26941efd`
- Lock claim: `6cf7d9e6cdd9278db5a5d4239520db6bfde47a50`, verified direct child of the pre-story checkpoint and lock-only diff.
- Implementation/tested code SHA: pending exact-head validation.
- Completed work: added bounded stream collector with Content-Type/Content-Encoding checks, numeric Content-Length early rejection, actual byte counting, overflow cancellation before chunk retention, bounded copied chunks, strict fatal UTF-8 decode and fixed malformed-body errors; integrated it after US006 auth and before US008 JSON validation; added boundary/chunk/disconnect/cancellation/logging tests.
- Remaining criteria: run authoritative exact-head Actions, repair any US007 failure, review the final diff, record tested SHA, mark DONE and release the 20-minute lock.
- Blocker category: none.
- Blocker: none.
- Exact next action: inspect the Actions run produced by this implementation checkpoint and repair only US007 until the full current suite is green.
- Autopilot invariant: repository-local `STORY_SPECS.md` is authoritative for scheduled recovery; a task timestamp without repo/CI movement is not progress.
