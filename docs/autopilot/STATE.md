# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E03 Parser and normalization
- Current Feature: F06 Shared normalization
- Current Story: US012 Preserve Unicode and normalize whitespace
- Phase: BLOCKED
- Prerequisite US011 tested SHA: `3a7efd7e5bd39773ba6543c3666e2ee33b714ed4`
- Blocker category: connector-safety.
- Blocker: this run safely reclaimed and verified the expired US012 lock at `187318b380f02cdcce5d32c1faebc861124e2444`. The first non-lock implementation mutation, creation of `src/html/text.ts`, was rejected by connector safety before any source change landed.
- Exact unfinished checkpoint: implement shared Unicode-safe text helpers for CRLF/CR to LF normalization, HTML ASCII whitespace collapse outside pre/code, protected pre/code segments, and Unicode scalar counting; add exact US012 fixtures/tests and wire them into `verify:current`.
- Exact next action: after this run releases the lock, reacquire US012 and retry the implementation mutation. Do not start US013.
- Uncommitted status: no local working tree is used; rejected source content did not land.
