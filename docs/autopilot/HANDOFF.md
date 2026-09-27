# Implementing-agent handoff

Work only in `myProjectsRavi/html_to_markdown_api` on `autopilot/html-markdown-v1`. Never modify or merge `main`.

At the start of every run:
- Read the complete blueprint, repository instructions, `STATE.md`, `BACKLOG.json`, `VALIDATION.md`, current story evidence, `RUN_LOCK.json`, actual branch HEAD, recent commits, open PRs and CI for that exact revision.
- Acquire the remote repository/branch lock using `LOCK_PROTOCOL.md` before any mutation.
- Resume an `IN_PROGRESS`, `VALIDATING` or `BLOCKED` story before selecting the lowest-numbered eligible TODO. Work on exactly one numbered story in the run.
- Use only sandbox or GitHub Actions for tests. Authorized curl smokes may use synthetic data. Never fabricate test, CI, benchmark, deployment or publication results.
- Diagnose failures inside the current story. Never weaken a required check or change scope merely to make a test pass.
- Reserve enough run budget to checkpoint durable state. By approximately minute 50 of an hourly launcher slot, stop expanding scope and record the exact next action.
- Push without force, record immutable implementation/tested SHAs and observed CI, then release the lock.
- Transient GitHub, CI, network or context failures never disable the schedule.

External scheduler contract:
- Primary story runner: exact hourly schedule at minute 17, Asia/Kolkata.
- Watchdog: exact hourly schedule at minute 47, Asia/Kolkata, producing an effective approximately 30-minute opportunity to resume stalled work while each individual task remains hourly.
- The watchdog is not a concurrent second writer: if a current run or fresh progress exists, it stays read-only.
- When all US001-US044 are DONE, scheduled runs become read-only completion checks.
