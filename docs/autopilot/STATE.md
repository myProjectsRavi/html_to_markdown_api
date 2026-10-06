# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E07 Verification, security and CI hardening
- Current Feature: F16 Security and CI hardening
- Current Story: US031 Audit security and privacy behavior
- Phase: TODO
- Completed US030: DONE, tested SHA `89e87fcfaffd47929e23fc06684c5f55f94a6a0a`, authoritative run `37453553810` / job `112236147904`.
- US030 campaign: deterministic generator `us030-grammar-v1`, seeds 1-10000, <=4096-byte cases, depth <=4, replay seed 4242, 40,000 integrated endpoint requests, no egress and no minimized failures required.
- Exact next action: claim US031, audit source and artifacts for raw HTML fallback, URL bypasses, unsafe regex/recursion, secret/log leakage and runtime outbound/storage primitives; add regression tests and `SECURITY_REVIEW.md`; validate with authoritative Actions.
