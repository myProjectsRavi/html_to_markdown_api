# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E06 Clean text and output accounting
- Current Feature: F14 Output accounting and error behavior
- Current Story: US027 Enforce bounded output and factual statistics
- Phase: VALIDATING
- Prerequisite US026: DONE, tested SHA `96de63916af13b4dbd489f7665202c59808f65bb`.
- Shared bounded writer: `src/output/writer.ts` landed at `47961dab0deb3009c02c7405f05b56de4f5e50ba`.
- Renderer accounting checkpoints: Markdown `2a90c6015460eed7a5d0dff48f9bd3cfc5359245`; clean text `4716cf410fff7da7a2013f4c7111970a334aef53`.
- Integrated conversion routes: `src/routes/conversion.ts` at `640bb3448659e4d9860ad9090e6a2fe98b7c1788`; Worker integration at `7ff9972166da8a726d2809bda2a25cfb435eddf0`.
- US027 tests: exact writer boundaries plus route/statistics/expansion fixtures through `da6dc2ed3bdcfcf237f8c2ab061e8a63d2bfa1c0`.
- Validation wiring / candidate code SHA: `f130f014b3766d1b95f76e0eeced2d90179f9a72`.
- Validation status: authoritative GitHub Actions pending; no pass is claimed yet.
- Failure history: one same-story contents-API collision occurred during route integration; the lease was released and the durable writer checkpoint was reconciled before resuming. No reset/force-push was used.
- Exact next action: inspect the authoritative Actions run for the released US027 head, fix any US027 failure in-story, and mark DONE only after all acceptance evidence passes. Do not start US028 before US027 is DONE.
