# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E03 Parser and normalization
- Current Feature: F06 Shared normalization
- Current Story: US012 Preserve Unicode and normalize whitespace
- Phase: VALIDATING
- Prerequisite US011 tested SHA: `3a7efd7e5bd39773ba6543c3666e2ee33b714ed4`
- Durable implementation checkpoint: `src/html/text.ts` landed at `2fb92d1118e627dd681d71cbfcef7b06818c2558`; exact US012 text-helper tests landed at `098c2595e7daa9ea85091f24ca9e0a731eb9f1b8`.
- Validation wiring checkpoint: `package.json` includes `test:text` and `verify:current` invokes it at `b21be6c17b58a60a149c87722d5aa8621845f3a1`.
- Validation status: authoritative validation is pending for the wired US012 checkpoint; no passing result is claimed yet.
- Blocker category: none.
- Blocker: none.
- Exact unfinished checkpoint: inspect the authoritative GitHub Actions result for the wired US012 code; diagnose/fix failures inside US012, or if green create US012 evidence and reconcile BACKLOG/STATE to DONE.
- Exact next action: with the lock released, inspect terminal authoritative CI for US012 before any further mutation. Do not start US013.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.
