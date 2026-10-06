import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const directory = ".github/workflows";
const paths = readdirSync(directory)
  .filter((name) => /\.ya?ml$/u.test(name))
  .sort()
  .map((name) => join(directory, name));

const findings = [];
const summaries = [];

for (const path of paths) {
  const content = readFileSync(path, "utf8");
  const actionRefs = [...content.matchAll(/\buses:\s*([^\s#]+)/gu)].map((match) => match[1]);
  const mutable = actionRefs.filter((ref) => !/@[0-9a-f]{40}$/u.test(ref));
  for (const ref of mutable) findings.push(`${path}: mutable action ref ${ref}`);

  if (/^\s*pull_request_target\s*:/mu.test(content)) {
    findings.push(`${path}: pull_request_target is prohibited`);
  }
  if (/\$\{\{\s*secrets\./u.test(content)) {
    findings.push(`${path}: workflow references repository/environment secrets`);
  }

  const permissions = content.match(/^permissions:\s*\n((?:^[ \t]+.*\n?)*)/mu)?.[1] ?? "";
  if (!/^\s*contents:\s*read\s*$/mu.test(permissions)) {
    findings.push(`${path}: top-level permissions must include contents: read`);
  }
  if (/^\s{2,}[A-Za-z0-9_-]+:\s*(?:write|read-all|write-all)\s*$/mu.test(permissions.replace(/^\s*contents:\s*read\s*$/mu, ""))) {
    findings.push(`${path}: additional write/broad top-level permission found`);
  }

  const jobHeaders = [...content.matchAll(/^  ([A-Za-z0-9_-]+):\s*$/gmu)];
  for (let index = 0; index < jobHeaders.length; index += 1) {
    const start = jobHeaders[index].index ?? 0;
    const end = index + 1 < jobHeaders.length ? (jobHeaders[index + 1].index ?? content.length) : content.length;
    const block = content.slice(start, end);
    const name = jobHeaders[index][1];
    if (!/^\s{4}timeout-minutes:\s*\d+\s*$/mu.test(block)) {
      findings.push(`${path}: job ${name} has no finite timeout-minutes`);
    }
  }

  for (const line of content.split("\n")) {
    if (/wrangler\s+deploy/u.test(line) && !/--dry-run/u.test(line)) {
      findings.push(`${path}: non-dry-run deployment command is prohibited in validation workflows`);
    }
  }

  if (/actions\/upload-artifact@/u.test(content)) {
    const retention = Number(content.match(/retention-days:\s*(\d+)/u)?.[1] ?? "NaN");
    if (!Number.isFinite(retention) || retention < 1 || retention > 7) {
      findings.push(`${path}: artifact retention must be 1-7 days`);
    }
  }

  const pullRequest = /^\s{2}pull_request\s*:/mu.test(content);
  summaries.push({
    path,
    pull_request: pullRequest,
    action_refs: actionRefs,
    secrets_referenced: /\$\{\{\s*secrets\./u.test(content),
    pull_request_target: /^\s*pull_request_target\s*:/mu.test(content),
  });
}

if (findings.length) {
  console.error(JSON.stringify({ findings, workflows: summaries }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  workflows: summaries,
  findings: 0,
  deployment_path_present: false,
  untrusted_pr_policy: "read-only validation only; no secrets and no deployment command",
}, null, 2));
