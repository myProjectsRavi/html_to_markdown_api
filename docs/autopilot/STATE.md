# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E03 Parser and normalization
- Current Feature: F06 Shared normalization
- Current Story: US012 Preserve Unicode and normalize whitespace
- Phase: DONE
- Prerequisite US011 tested SHA: `3a7efd7e5bd39773ba6543c3666e2ee33b714ed4`
- US012 implementation checkpoints: `src/html/text.ts` at `2fb92d1118e627dd681d71cbfcef7b06818c2558`; exact text-helper tests at `098c2595e7daa9ea85091f24ca9e0a731eb9f1b8`; validation wiring at `b21be6c17b58a60a149c87722d5aa8621845f3a1`; corrected no-second-decode assertion at `d3251667d0eba59208223224253dee01707b0399`.
- US012 tested SHA: `6deb6997945b5cf5c2e2dfabc8a5dcfe8bd42cd3`.
- Durable evidence: `docs/autopilot/evidence/US012.md`.
- Authoritative validation: GitHub Actions run `36729200912`, job `109933975411`, conclusion `success`.
- Blocker category: none.
- Blocker: none.
- Exact next action: in the next distinct run, select US013 as the lowest eligible TODO after acquiring the canonical lock. Do not start US013 in this run.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.
