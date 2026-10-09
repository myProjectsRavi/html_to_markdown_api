import { readFileSync } from "node:fs";

const path = process.argv[2] ?? "docs/capacity/free-account-envelope.json";
const data = JSON.parse(readFileSync(path, "utf8"));

function fail(message) {
  console.error(message);
  process.exit(1);
}
function closeEnough(a, b) {
  return Math.abs(a - b) < 0.011;
}

if (data.schema_version !== 1 || data.story !== "US035") fail("unexpected capacity schema/story");
const cf = data.verified_platform_limits?.cloudflare_workers_free;
if (cf?.requests_per_account_per_day !== 100000) fail("verified Cloudflare free daily request limit mismatch");
if (cf?.cpu_ms_per_invocation !== 10 || cf?.memory_mb_per_isolate !== 128) fail("verified Cloudflare resource snapshot mismatch");

const rapid = data.verified_platform_limits?.rapidapi;
if (!rapid?.hard_limit_supported) fail("RapidAPI hard-limit support must be recorded");
for (const unit of ["second","minute","hour"]) {
  if (!rapid.plan_rate_limit_units?.includes(unit)) fail("missing RapidAPI rate-limit unit: " + unit);
}

for (const scenario of data.monthly_plan_stress_scenarios ?? []) {
  const expectedAverage = scenario.monthly_requests / 30;
  if (!closeEnough(scenario.average_daily_requests, expectedAverage)) fail("bad 30-day average: " + scenario.label);
  if (scenario.worst_case_single_day_requests !== scenario.monthly_requests) fail("worst-day monthly burst must retain full quota: " + scenario.label);
}

const inputs = data.account_wide_inputs ?? {};
const requiredInputs = [
  "other_workers_reserved_requests_per_day",
  "staging_reserved_requests_per_day",
  "health_check_requests_per_day",
  "expected_customer_requests_per_day",
  "rejected_or_unauthenticated_requests_per_day",
];
const missing = requiredInputs.filter((key) => inputs[key] == null);
if (missing.length > 0) {
  if (data.capacity_accounting?.computed_available_requests_per_day !== null) fail("available capacity must remain null while account inputs are missing");
  if (data.launch_decision?.paid_launch !== "BLOCKED_PENDING_ACCOUNT_WIDE_USAGE") fail("paid launch must be blocked while account inputs are missing");
} else {
  const cap = cf.requests_per_account_per_day;
  const safety = data.proposal?.safety_reserve_requests_per_day ?? 0;
  const used = requiredInputs.reduce((sum, key) => sum + Number(inputs[key]), 0);
  const available = cap - safety - used;
  if (data.capacity_accounting?.computed_available_requests_per_day !== available) fail("computed available capacity mismatch");
}

if (!data.capacity_accounting?.all_worker_invocations_consume_cloudflare_daily_request_budget) fail("all Worker invocations must count");
if (!data.capacity_accounting?.direct_origin_403_requests_consume_cloudflare_daily_request_budget) fail("direct-origin rejects must count");

console.log(JSON.stringify({
  story: data.story,
  snapshot_date: data.snapshot_date,
  missing_account_inputs: missing,
  paid_launch: data.launch_decision?.paid_launch,
  cloudflare_daily_cap: cf.requests_per_account_per_day,
  scenarios_checked: data.monthly_plan_stress_scenarios.length
}, null, 2));
