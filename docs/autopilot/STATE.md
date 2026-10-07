# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F17 Measured performance
- Current Story: US033 Measure end-to-end performance
- Phase: VALIDATING
- Completed US032: DONE, tested SHA `11aec7adbf67217880f488e68991207a90563aea`, authoritative run `37455989867` / job `112244172396`.
- US033 implementation checkpoint: fixed multi-family/multi-size benchmark corpus and methodology are present; checkpoint validation succeeded on `8de72452faa921f481c61ae89978f780133977e8` in run `37479136292`.
- US033 benchmark workflow: dedicated pinned, read-only workflow runs three independent benchmark processes, validates each JSON result against the exact GitHub SHA/run index, and retains all three machine-readable result files.
- Recovery fix: commit `5c85be0071b39f72510329420070bb9c23568cf3` changes benchmark artifact retention from 30 to 7 days to satisfy repository CI policy.
- Exact next action: inspect exact-revision validation and US033 benchmark workflow for `5c85be0071b39f72510329420070bb9c23568cf3`; if terminal green, inspect all three benchmark JSON artifacts and outliers before closing US033.
