# Repository and branch lock protocol

Every implementation-capable run must serialize writes to `myProjectsRavi/html_to_markdown_api` branch `autopilot/html-markdown-v1`.

1. Read the branch ref, `STATE.md`, `BACKLOG.json`, and `RUN_LOCK.json`.
2. If the lock is active and its 55-minute lease has not expired, perform no repository mutation.
3. To claim a released or verified-stale lock, update `RUN_LOCK.json` using the exact blob SHA just read. The record contains runner identity, active story, observed pre-claim branch head, acquisition time and lease. A concurrent update using the same old blob SHA must fail rather than overwrite the winner.
4. The lock claim is itself a Git commit and therefore advances branch HEAD. After claiming, re-read the branch ref and inspect the claim commit. Continue only when that claim commit directly descends from the recorded `base_head` and the claim changed only the lock record. If unexpected history intervened, release/reconcile instead of resetting or force-pushing.
5. Treat the verified lock-claim commit as the new working base. Work on only the selected active story and begin checkpointing before the run budget is exhausted.
6. On successful checkpoint/push, release the lock in the final durable checkpoint. On context/network failure, the next runner may take over only after the lease expires and after verifying the branch and state.
7. Never force-push, reset another runner's commit, or use the lock to bypass GitHub permissions.

The local `scripts/autopilot-run.mjs` lock is a deterministic test fixture for overlap behavior. The canonical cross-run lock is the optimistic GitHub update protocol above.
