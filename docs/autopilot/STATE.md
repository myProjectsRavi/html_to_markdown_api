# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F18 Capacity and observability
- Current Story: US036 Configure privacy safe operational visibility
- Phase: IN_PROGRESS
- Completed US034: DONE, tested SHA `5b0c5bdd1fda6c7c667aa6ee8149638abc214db8`.
- Completed US035: DONE, tested SHA `e97988e0f584e7a95bfc56141163284128e66a3c`.
- US035 launch gate remains `BLOCKED_PENDING_ACCOUNT_WIDE_USAGE`.
- US036 checkpoint: production Workers Logs persistence is explicitly disabled; staging observability is enabled only for synthetic platform CPU validation with full head sampling.
- Runtime canaries cover input/output/secret/query leakage, validation/internal failures and logger-failure isolation; static policy rejects production console logging and external telemetry sinks.
- Exact next action: run full current validation on this checkpoint, inspect the US036 canary/policy results, and close only if both configuration and privacy regression evidence pass.
