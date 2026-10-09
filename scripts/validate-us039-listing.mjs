import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import SwaggerParser from "@apidevtools/swagger-parser";

const data = JSON.parse(readFileSync("docs/marketplace/US039_LISTING_DRAFT.json", "utf8"));
const md = readFileSync("docs/marketplace/US039_RAPIDAPI_LISTING.md", "utf8");
const capacity = JSON.parse(readFileSync("docs/capacity/free-account-envelope.json", "utf8"));
const spec = await SwaggerParser.validate("openapi.yaml");
assert.equal(data.schema_version, 1);
assert.equal(data.story, "US039");
assert.equal(data.record_type, "unpublished_review_draft");
assert.equal(data.published, false);
assert.equal(data.plans_activated, false);
assert.equal(data.owner_approved, false);
assert.equal(data.approval_gates.product_visibility, "PRIVATE_DRAFT_ONLY");
assert.equal(data.product.category.status, "REQUIRES_OWNER_VERIFICATION");
assert.equal(data.product.category.value, null);
assert.equal(data.product.support.status, "REQUIRES_OWNER_CONFIRMATION");
assert.equal(data.product.support.contact, null);
for (const [gate, state] of Object.entries(data.approval_gates)) {
  if (gate !== "product_visibility") assert.equal(state, "BLOCKED", gate);
}
assert.ok(data.product.title && data.product.short_description && data.product.long_description);
assert.equal(data.endpoints.length, 3);
assert.deepEqual(data.endpoints.map(x => x.path).sort(), Object.keys(spec.paths).sort());
assert.equal(data.endpoints.filter(x=>x.method==="POST").length, 2);
for (const endpoint of data.endpoints) {
  assert.ok(spec.paths[endpoint.path]?.[endpoint.method.toLowerCase()], endpoint.path);
  assert.ok(existsSync(endpoint.evidence), endpoint.evidence);
}
for (const path of data.verified_claims.map(x=>x.evidence)) assert.ok(existsSync(path), path);
const evidenceMarkdown = data.endpoints.find(x=>x.path==="/v1/html/markdown");
const evidenceText = data.endpoints.find(x=>x.path==="/v1/html/text");
for (const entry of [evidenceMarkdown, evidenceText]) {
  assert.equal(entry.sample_request.html, "<article><h1>Hello</h1><p>World</p></article>");
  assert.equal(entry.sample_response.stats.input_bytes, 45);
}
assert.deepEqual(evidenceMarkdown.sample_response, spec.components.responses.MarkdownSuccess.content["application/json"].example);
assert.deepEqual(evidenceText.sample_response, spec.components.responses.TextSuccess.content["application/json"].example);
assert.deepEqual(data.limits, {
  raw_json_bytes: spec["x-limits"].raw_json_body_bytes,
  decoded_html_utf8_bytes: spec["x-limits"].decoded_html_bytes,
  output_scalars: spec["x-limits"].output_scalars,
  output_bytes: spec["x-limits"].output_bytes,
});
assert.equal(data.price_experiment.request_object, "Requests");
assert.equal(data.price_experiment.hard_monthly_quota, true);
assert.equal(data.price_experiment.overage_allowed, false);
assert.equal(data.price_experiment.subscription_activation, false);
assert.deepEqual(data.price_experiment.proposed_plans.map(x=>[x.name,x.monthly_usd,x.requests_per_month]), [
  ["FREE",0,1000],["PRO",4.99,25000],["ULTRA",14.99,100000],["MEGA",39.99,500000]
]);
for (const plan of data.price_experiment.proposed_plans) {
  assert.ok(Math.abs(plan.avg_per_day_30d - plan.requests_per_month/30) <= 0.011);
  assert.equal(plan.worst_case_requests_one_day, plan.requests_per_month);
}
assert.equal(capacity.launch_decision.paid_launch, "BLOCKED_PENDING_ACCOUNT_WIDE_USAGE");
assert.equal(data.capacity_gate.paid_launch, capacity.launch_decision.paid_launch);
assert.equal(data.capacity_gate.available_requests_per_day, null);
assert.equal(data.capacity_gate.worker_free_account_requests_per_day, capacity.verified_platform_limits.cloudflare_workers_free.requests_per_account_per_day);
assert.equal(data.capacity_gate.candidate_api_reserved_per_day, capacity.proposal.api_candidate_reserve_requests_per_day);
assert.equal(data.capacity_gate.safety_reserved_per_day, capacity.proposal.safety_reserve_requests_per_day);
assert.equal(data.capacity_gate.mega_exceeds_entire_free_day, true);
assert.ok(data.product.privacy_notice.includes("may retain operational metadata"));
assert.ok(md.includes("500,000") && md.includes("HARD quota"));
assert.ok(md.includes("No live changes were made."));
const prohibited = /\b(zero[- ]bug|guaranteed earnings|fastest|unlimited requests|enterprise[- ]SLA|zero platform logging)\b/i;
assert.ok(!prohibited.test(data.product.long_description+" "+data.product.short_description+" "+md));
for (const entry of data.references) if (entry.path) assert.ok(existsSync(entry.path), entry.path);
console.log("US039_LISTING_RESULT=" + JSON.stringify({
  status:"DRAFT_VALIDATED_PENDING_OWNER_CONFIRMATIONS",
  endpoints_checked:data.endpoints.length,claims_checked:data.verified_claims.length,
  plans_checked:data.price_experiment.proposed_plans.length,
  hard_monthly_quotas:true,overages:false,activated:false,paid_launch:data.capacity_gate.paid_launch,
  support_contact:"NOT_CONFIRMED",category:"NOT_CONFIRMED",published:false
}));
