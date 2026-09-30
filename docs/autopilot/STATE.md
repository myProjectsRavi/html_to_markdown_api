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
- Blocker category: connector safety mutation rejection.
- Blocker: the narrow US012 test correction was rejected by connector safety after the lock was acquired.
- Exact unfinished checkpoint: authoritative run `36680192891` failed only the no-second-decode assertion because htmlparser2 emitted the correct text across adjacent text nodes. Update that assertion to compare `textValues(...).join("")` with `"&lt; & <"`, then run authoritative validation.
- Exact next action: after reclaiming the released/expired lock, apply only the narrow US012 assertion correction above and revalidate. Do not start US013.
- Uncommitted status: no local working tree is used; all durable changes are GitHub commits.
