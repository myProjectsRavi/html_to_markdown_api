# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F17 Measured performance
- Current Story: US034 Remove measured performance bottlenecks
- Phase: TODO
- Completed US033: DONE, tested SHA `be2405909ddbfec0c6af04d6f698296cfe41336a`, benchmark run `37639809115` / job `112855452677`, artifact `11490769524`.
- US033 audited regression: run `37639816119` succeeded on lock-only successor `06bda0e160e4264e0e399b89236773db17847bc2`.
- Measured US034 target: 128 KiB link-heavy Markdown; serialization p95 10.1429/10.2277/10.0969 ms and end-to-end p95 16.6969/17.1757/16.7327 ms across three processes.
- Exact next action: claim US034 separately, profile the repeated link serialization/classification path, make only evidence-backed safe optimization(s), then rerun the unchanged US033 corpus and full regression gate for comparable before/after evidence.
