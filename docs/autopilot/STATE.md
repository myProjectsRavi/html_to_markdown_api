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
- US033 recovery checkpoint: commit `5f3afd8b56c5f14c2e02176f463e7ac6f1688fee` adds a dedicated pinned, read-only benchmark workflow that runs three independent benchmark processes, validates each JSON result against the exact GitHub SHA/run index, and retains all three machine-readable result files as a 30-day artifact.
- Recovery blocker: authoritative validation rejects `.github/workflows/us033-benchmark.yml` because `retention-days: 30` violates the repository CI policy requiring artifact retention of 1–7 days. The minimal correction is `retention-days: 7`; the GitHub connector safety layer rejected that non-lock mutation in this watchdog run.
- Exact next action: reclaim US033 after release, change only benchmark artifact retention from 30 to 7 days, then run/inspect exact-revision validation and the three benchmark JSON artifacts before closing US033.
