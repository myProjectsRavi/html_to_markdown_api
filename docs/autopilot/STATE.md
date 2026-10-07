# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F18 Capacity and observability
- Current Story: US036 Configure privacy safe operational visibility
- Phase: TODO
- Completed US034: DONE, tested SHA `5b0c5bdd1fda6c7c667aa6ee8149638abc214db8`.
- Completed US035: DONE, tested SHA `e97988e0f584e7a95bfc56141163284128e66a3c`; capacity validator and audited CI passed.
- US035 launch gate: paid launch remains `BLOCKED_PENDING_ACCOUNT_WIDE_USAGE` until real other-Worker/staging/health/customer/rejected-traffic commitments are supplied.
- Exact next action: claim US036 separately, explicitly disable production Workers Logs persistence, allow only staging synthetic observability for platform CPU validation, add canary tests proving no input/output/secret/query logging, and document status-class metrics without adding an external telemetry sink.
