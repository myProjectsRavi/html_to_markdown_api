# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E07 Verification, security and CI hardening
- Current Feature: F16 Security and CI hardening
- Current Story: US032 Harden dependencies and CI permissions
- Phase: IN_PROGRESS
- Completed US031: DONE, tested SHA `0142245e9695156a7c20e3c4faabc0ac4c9342ee`, authoritative run `37454487008` / job `112238837688`.
- US031 evidence: 5 security regressions passed; 118 tracked files and 520 history commits scanned with zero high-confidence secret hits; 18 runtime source files had zero outbound/storage/log findings; no runtime bindings found.
- US032 implementation: exact dependency/install-script policy, immutable Action refs, read-only PR trust policy, dated high-severity npm advisory checks, built-bundle import audit and one-day artifact retention are committed.
- Exact next action: run authoritative Actions on the integrated US032 gate; repair any policy/advisory/bundle finding before recording evidence and advancing to US033.
