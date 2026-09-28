# Implementing-agent handoff

Work only in `myProjectsRavi/html_to_markdown_api` on `autopilot/html-markdown-v1`. Never modify or merge `main`.

At the start of every run:
- Read `docs/autopilot/STORY_SPECS.md` first for the complete source-derived US001-US044 requirements. The uploaded blueprint remains the original source, but scheduled execution must not depend on chat attachment availability.
- Read repository instructions, `STATE.md`, `BACKLOG.json`, `VALIDATION.md`, current story evidence, `LOCK_PROTOCOL.md`, `RUN_LOCK.json`, actual branch HEAD, recent commits, open PRs, and current CI.
- Resume an `IN_PROGRESS`, `VALIDATING` or `BLOCKED` story before selecting the lowest-numbered eligible TODO. Work on exactly one numbered story in the run.
- Automation timestamps are not progress. Progress means a durable repository checkpoint, advancing authoritative CI for the active story, or a concrete blocker recorded in state.
- If an eligible story exists, the lock is released/expired, no relevant CI is active, and no real external blocker exists, the run must implement/checkpoint that story rather than return a status-only response.
- Acquire the remote repository/branch lock using `LOCK_PROTOCOL.md` before every mutation. The lease is 20 minutes; checkpoint/release before minute 15 rather than holding it during long waits.
- Use only sandbox or GitHub Actions for tests. Authorized curl smokes may use synthetic data. Never fabricate test, CI, benchmark, deployment or publication results.
- Diagnose failures inside the current story. Never weaken a required check or change scope merely to make a test pass.
- Push without force, record immutable implementation/tested SHAs and observed CI, and make lock release the final repository mutation of every owning run.
- Transient GitHub, CI, network, context or message-delivery failures never disable the schedule.

External scheduler contract:
- Primary story runner: exact hourly schedule at minute 15, Asia/Kolkata.
- Recovery watchdog: exact hourly schedule at minute 45, Asia/Kolkata.
- The staggering creates an approximately 30-minute development/recovery opportunity while each individual automation remains hourly.
- The watchdog is read-only only when there is fresh durable progress, active relevant CI, or a valid unexpired owner. A fired-but-no-op primary run is a recovery failure and must be resumed immediately.
- When all US001-US044 are DONE, scheduled runs become read-only completion checks.
