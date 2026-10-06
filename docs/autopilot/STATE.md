# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F17 Measured performance
- Current Story: US033 Measure end-to-end performance
- Phase: TODO
- Completed US032: DONE, tested SHA `11aec7adbf67217880f488e68991207a90563aea`, authoritative run `37455989867` / job `112244172396`.
- US032 evidence: full and production npm audits both 0 vulnerabilities; 6 runtime transitive packages policy-clean; all retained CI Action refs immutable; PR validation is read-only/no-secrets; built bundle 446,473 bytes with zero forbidden import/egress/storage findings; one-day artifact 11408988630.
- Exact next action: claim US033, add a fixed multi-family/multi-size benchmark corpus for both endpoints and internal stages, run it in three independent processes, retain machine-readable results, document methodology and validate ordinary 128 KiB acceptance separately from the isolated 256 KiB rejection experiment.
