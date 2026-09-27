#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const script = path.resolve("scripts/autopilot-run.mjs");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "html-md-runner-"));

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

const wrongDir = path.join(root, "wrong");
const wrong = run(["--branch=main"], { AUTOPILOT_RUNTIME_DIR: wrongDir });
if (wrong.status !== 64 || fs.existsSync(wrongDir)) {
  console.error("wrong-branch guard failed", wrong.stdout, wrong.stderr);
  process.exit(1);
}
console.log("PASS wrong-branch-before-mutation");

const resumeDir = path.join(root, "resume");
const interrupted = run(
  ["--branch=autopilot/html-markdown-v1", "--interrupt-after-checkpoint"],
  { AUTOPILOT_RUNTIME_DIR: resumeDir },
);
if (interrupted.status !== 130) {
  console.error("synthetic interruption did not exit 130", interrupted.stdout, interrupted.stderr);
  process.exit(1);
}
const resume = run(["--branch=autopilot/html-markdown-v1"], {
  AUTOPILOT_RUNTIME_DIR: resumeDir,
});
if (resume.status !== 0 || !resume.stdout.includes("RESUME US002")) {
  console.error("interrupted run did not resume US002", resume.stdout, resume.stderr);
  process.exit(1);
}
console.log("PASS interrupted-run-resumes-same-story");

const overlapDir = path.join(root, "overlap");
fs.mkdirSync(overlapDir, { recursive: true });
const first = spawn(process.execPath, [script, "--branch=autopilot/html-markdown-v1"], {
  cwd: process.cwd(),
  env: { ...process.env, AUTOPILOT_RUNTIME_DIR: overlapDir, AUTOPILOT_HOLD_LOCK_MS: "1200" },
  stdio: ["ignore", "pipe", "pipe"],
});
const lockPath = path.join(overlapDir, "lock");
const deadline = Date.now() + 3000;
while (!fs.existsSync(lockPath) && Date.now() < deadline) {
  await new Promise((resolve) => setTimeout(resolve, 25));
}
if (!fs.existsSync(lockPath)) {
  first.kill("SIGTERM");
  console.error("first runner never acquired lock");
  process.exit(1);
}
const second = run(["--branch=autopilot/html-markdown-v1"], {
  AUTOPILOT_RUNTIME_DIR: overlapDir,
});
if (second.status !== 75 || !second.stderr.includes("LOCK_HELD")) {
  first.kill("SIGTERM");
  console.error("overlapping runner was not rejected", second.stdout, second.stderr);
  process.exit(1);
}
const firstExit = await new Promise((resolve) => first.on("exit", resolve));
if (firstExit !== 0) {
  console.error("lock holder did not exit cleanly", firstExit);
  process.exit(1);
}
console.log("PASS overlapping-run-rejected");
