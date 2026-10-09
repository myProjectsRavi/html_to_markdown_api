# Repository and branch lock protocol

Every implementation-capable run must serialize writes to `myProjectsRavi/html_to_markdown_api` branch `autopilot/html-markdown-v1`.

1. Read the branch ref, `STATE.md`, `BACKLOG.json`, `STORY_SPECS.md`, `VALIDATION.md`, and `RUN_LOCK.json`.
2. The canonical lease is **20 minutes**. It is deliberately shorter than the approximately 30-minute primary/watchdog staggering so an abandoned run can be recovered at the next opportunity.
3. If the lock is active and its 20-minute lease has not expired, perform no repository mutation. Read-only CI/status inspection is allowed.
4. To claim a released or verified-expired lock, update `RUN_LOCK.json` using the exact blob SHA just read. Record runner identity, story, observed pre-claim branch HEAD, acquisition time and lease. A concurrent update using the same old blob SHA must fail rather than overwrite the winner.
5. The claim is a Git commit. Re-read branch HEAD and inspect the claim commit. Continue only when the claim directly descends from the recorded `base_head` and changes only `RUN_LOCK.json`. If unexpected history intervened, release/reconcile instead of resetting or force-pushing.
6. A normal run must aim to finish its mutation/checkpoint phase within **15 minutes**. If useful work will continue beyond that point, either:
   - write a durable IN_PROGRESS/VALIDATING checkpoint and release the lock before waiting on long CI, or
   - refresh the lease before minute 15 by an optimistic update owned by the same runner, then verify the refresh commit exactly as a claim.
7. Do not hold the repository lock merely while waiting for GitHub Actions. A story may remain VALIDATING with the lock released; the next scheduled run may inspect terminal CI and reacquire the lock only if a mutation/finalization is required.
8. Every run that acquired/reclaimed/refreshed the lock must make lock release its **final repository mutation**, whether the story ends DONE, IN_PROGRESS, VALIDATING or BLOCKED. If the first release write fails transiently, retry one minimal release write immediately.
9. An expired active lock is a recovery condition, not a blocker. Re-read HEAD/state/CI, reclaim the same unfinished story, and continue it. Never skip to another story because a lease expired.
10. Never force-push, reset another runner's commit, or use the lock to bypass GitHub permissions.

The local `scripts/autopilot-run.mjs` lock is a deterministic test fixture for overlap behavior. The canonical cross-run lock is the optimistic GitHub update protocol above.
