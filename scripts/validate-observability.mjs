import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(readFileSync("wrangler.jsonc", "utf8"));
const findings = [];

if (config.observability?.enabled !== false) findings.push("production observability.enabled must be false");
if (config.env?.staging?.observability?.enabled !== true) findings.push("staging observability must be explicitly enabled");
if (config.env?.staging?.observability?.head_sampling_rate !== 1) findings.push("staging head_sampling_rate must be 1");

for (const key of ["tail_consumers", "analytics_engine_datasets", "logfwdr", "logpush", "traces"]) {
  if (Object.prototype.hasOwnProperty.call(config, key)) findings.push("external/persistent telemetry key present: " + key);
}

function walk(path) {
  const files = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (/\.ts$/u.test(entry) && !/\.d\.ts$/u.test(entry)) files.push(full);
  }
  return files;
}

const sourceFiles = walk("src");
for (const path of sourceFiles) {
  const content = readFileSync(path, "utf8");
  if (/\bconsole\.(?:log|info|warn|error|debug)\s*\(/u.test(content)) {
    findings.push(path + ": production console logging found");
  }
}

if (findings.length) {
  console.error(JSON.stringify({ findings }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  production_workers_logs: "disabled",
  staging_workers_logs: "enabled-synthetic-only",
  staging_head_sampling_rate: 1,
  source_files_scanned: sourceFiles.length,
  production_console_log_calls: 0,
  external_telemetry_sinks: 0
}, null, 2));
