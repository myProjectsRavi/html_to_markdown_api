import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = "dist";
if (!existsSync(root)) throw new Error("dist does not exist; run the reviewed build first");

function walk(path) {
  const output = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

const files = walk(root);
const jsFiles = files.filter((path) => /\.(?:m?js|cjs)$/u.test(path));
if (jsFiles.length === 0) throw new Error("No JavaScript Worker bundle found in dist");

const findings = [];
let totalBytes = 0;
for (const path of files) totalBytes += statSync(path).size;

for (const path of jsFiles) {
  const content = readFileSync(path, "utf8");
  const checks = [
    ["node-system-import", /(?:from\s*["']node:|require\s*\(\s*["']node:)/u],
    ["network-module", /(?:from\s*["'](?:https?|net|tls|dns)["']|require\s*\(\s*["'](?:https?|net|tls|dns)["'])/u],
    ["filesystem-module", /(?:from\s*["'](?:fs|child_process)["']|require\s*\(\s*["'](?:fs|child_process)["'])/u],
    ["browser-egress", /\b(?:XMLHttpRequest|WebSocket|sendBeacon)\b/u],
    ["persistent-binding", /\b(?:KVNamespace|R2Bucket|D1Database|DurableObjectNamespace)\b/u],
  ];
  for (const [kind, pattern] of checks) {
    if (pattern.test(content)) findings.push({ path, kind });
  }
}

if (findings.length) {
  console.error(JSON.stringify({ findings, totalBytes, jsFiles }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  files: files.length,
  javascript_files: jsFiles,
  total_bundle_bytes: totalBytes,
  forbidden_import_or_primitive_findings: 0,
}, null, 2));
