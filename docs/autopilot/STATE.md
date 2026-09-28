# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E03 Parser and normalization
- Current Feature: F05 Parser selection and bounded adapter
- Current Story: US010 Build the bounded parser adapter
- Phase: IN_PROGRESS
- Pre-story checkpoint: `098ff43a2c42cc8bc5dc299a3c312e6400b67050`
- Recovered implementation commit: `c1f237c2607a47db38a274390081d4b4375b3632` adds `src/html/limits.ts` with structural parser budgets.
- Selected parser: `htmlparser2@12.0.0`, from completed US009 evidence.
- Completed work: parser budget constants are wired to the frozen contract limits; typed `ParserLimitError` and counters exist for tokenizer events, retained nodes, open depth, attribute count, attribute-name Unicode scalars, and attribute-value UTF-8 bytes.
- Validation evidence: no US010 acceptance run is claimed yet.
- Blocker category: transient connector mutation safety check.
- Blocker: this run successfully claimed and verified the canonical US010 lock, but the attempted parser-budget boundary test file write was rejected by the connector safety layer. No test result is fabricated.
- Exact next action: reacquire the released US010 lock; add exact-boundary and plus-one tests for every existing `ParserBudget` limit; then add and lock only `htmlparser2@12.0.0`, implement `src/html/parse.ts` with event/depth/node/attribute enforcement and parser-stop behavior, add adversarial Workers tests, run authoritative Actions, and remain on US010 until all acceptance/evidence criteria pass.
