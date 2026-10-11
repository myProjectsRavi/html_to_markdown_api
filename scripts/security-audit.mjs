import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SECRET_PATTERNS = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ["github-pat", /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g],
  ["slack-token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ["stripe-live-secret", /\bsk_live_[A-Za-z0-9]{20,}\b/g],
];

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function scan(label, content) {
  const hits = [];
  for (const [name, pattern] of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      hits.push({ label, pattern: name, sample: match[0].slice(0, 12) + "…" });
    }
  }
  return hits;
}

const tracked = git("ls-files", "-z").split("\0").filter(Boolean);
const trackedHits = [];
for (const path of tracked) {
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  trackedHits.push(...scan(path, content));
}

const shallow = git("rev-parse", "--is-shallow-repository").trim();
if (shallow !== "false") {
  throw new Error("Security history scan requires a full checkout (fetch-depth: 0).");
}
const history = git("log", "-p", "--all", "--no-color", "--format=fuller");
const historyHits = scan("git-history", history);

const sourcePaths = tracked.filter((path) => path.startsWith("src/") && path.endsWith(".ts"));
const runtimeFindings = [];
for (const path of sourcePaths) {
  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/from\s+["'](?:node:|fs(?:\/|["'])|net(?:["'])|tls(?:["'])|http(?:["'])|https(?:["'])|dns(?:["'])|child_process(?:["']))/u.test(trimmed)) {
      runtimeFindings.push({ path, line: index + 1, kind: "runtime-system-import", text: trimmed });
    }
    if (/\bglobalThis\.fetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\s*\(|navigator\.sendBeacon/u.test(trimmed)) {
      runtimeFindings.push({ path, line: index + 1, kind: "outbound-primitive", text: trimmed });
    }
    if (/\bcaches\.|\bKVNamespace\b|\bR2Bucket\b|\bD1Database\b|\bDurableObject\b|\bindexedDB\b|\blocalStorage\b/u.test(trimmed)) {
      runtimeFindings.push({ path, line: index + 1, kind: "storage-primitive", text: trimmed });
    }
    if (/\bconsole\.(?:log|info|warn|error|debug)\s*\(/u.test(trimmed)) {
      runtimeFindings.push({ path, line: index + 1, kind: "runtime-log", text: trimmed });
    }
    if (/\bfetch\s*\(/u.test(trimmed) && !/^async fetch\(request: Request, env: AuthEnv\): Promise<Response> \{$/u.test(trimmed)) {
      runtimeFindings.push({ path, line: index + 1, kind: "outbound-fetch", text: trimmed });
    }
  });
}

const wrangler = readFileSync("wrangler.jsonc", "utf8");
const bindingKeywords = [
  "kv_namespaces", "r2_buckets", "d1_databases", "durable_objects",
  "services", "queues", "vectorize", "browser", "ai",
];
const configuredBindings = bindingKeywords.filter((keyword) =>
  new RegExp(`["']?${keyword}["']?\\s*:`, "u").test(wrangler),
);

if (trackedHits.length || historyHits.length || runtimeFindings.length || configuredBindings.length) {
  console.error(JSON.stringify({ trackedHits, historyHits, runtimeFindings, configuredBindings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  tracked_files_scanned: tracked.length,
  history_commits_scanned: Number(git("rev-list", "--all", "--count").trim()),
  high_confidence_secret_hits: 0,
  runtime_source_files_scanned: sourcePaths.length,
  runtime_outbound_or_storage_findings: 0,
  configured_runtime_bindings: 0,
}, null, 2));
