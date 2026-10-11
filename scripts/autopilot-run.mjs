#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const EXPECTED_BRANCH = "autopilot/html-markdown-v1";
const args = new Set(process.argv.slice(2));
const branchArg = process.argv.find((arg) => arg.startsWith("--branch="));
const branch = branchArg?.slice("--branch=".length) ?? process.env.AUTOPILOT_BRANCH ?? "";
const runtimeDir = path.resolve(process.env.AUTOPILOT_RUNTIME_DIR ?? ".autopilot-runtime");
const lockDir = path.join(runtimeDir, "lock");
const checkpointPath = path.join(runtimeDir, "checkpoint.json");

function stop(code, message) {
  console.error(message);
  process.exit(code);
}

if (branch !== EXPECTED_BRANCH) {
  stop(64, `BRANCH_GUARD: expected ${EXPECTED_BRANCH}, got ${branch || "<empty>"}`);
}

const backlog = JSON.parse(fs.readFileSync("docs/autopilot/BACKLOG.json", "utf8"));
const active = backlog.stories.find((story) =>
  ["IN_PROGRESS", "VALIDATING", "BLOCKED"].includes(story.status),
);
const byId = new Map(backlog.stories.map((story) => [story.id, story]));
const next = active ?? backlog.stories.find(
  (story) =>
    story.status === "TODO" &&
    story.depends_on.every((dependency) => byId.get(dependency)?.status === "DONE"),
);

if (!next) stop(65, "STATE_RECONCILE: no active or eligible story");

fs.mkdirSync(runtimeDir, { recursive: true });
try {
  fs.mkdirSync(lockDir);
} catch (error) {
  if (error && error.code === "EEXIST") {
    stop(75, "LOCK_HELD: another runner owns the repository/branch runtime lock");
  }
  throw error;
}

let lockReleased = false;
function releaseLock() {
  if (lockReleased) return;
  lockReleased = true;
  fs.rmSync(lockDir, { recursive: true, force: true });
}
process.on("exit", releaseLock);
process.on("SIGINT", () => {
  releaseLock();
  process.exit(130);
});
process.on("SIGTERM", () => {
  releaseLock();
  process.exit(143);
});

let resumed = false;
if (fs.existsSync(checkpointPath)) {
  const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, "utf8"));
  if (checkpoint.story_id === next.id && checkpoint.complete !== true) {
    resumed = true;
    console.log(`RESUME ${next.id} from ${checkpoint.phase}`);
  }
}

const checkpoint = {
  story_id: next.id,
  phase: resumed ? "RESUMED" : "STARTED",
  complete: false,
};
fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2) + "\n");

if (args.has("--interrupt-after-checkpoint")) {
  console.error(`INTERRUPTED ${next.id} after durable checkpoint`);
  releaseLock();
  process.exit(130);
}

const holdMs = Number.parseInt(process.env.AUTOPILOT_HOLD_LOCK_MS ?? "0", 10);
if (Number.isFinite(holdMs) && holdMs > 0) {
  await new Promise((resolve) => setTimeout(resolve, holdMs));
}

console.log(`READY ${next.id} (${next.status})`);
releaseLock();
