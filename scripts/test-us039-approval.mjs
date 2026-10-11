import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateOwnerConfirmations, assertListingCopyMatchesConfirmations } from "./lib/us039-approval.mjs";

const base = JSON.parse(readFileSync("docs/marketplace/US039_LISTING_DRAFT.json", "utf8"));
const copy = () => structuredClone(base);
const listingMarkdown = readFileSync("docs/marketplace/US039_RAPIDAPI_LISTING.md", "utf8");
assertListingCopyMatchesConfirmations(base, listingMarkdown);
function replaceListingField(markdown, label, value) {
  const prefix = `**${label}:** `;
  const lines = markdown.split("\\n");
  const index = lines.findIndex(line => line.startsWith(prefix));
  assert.ok(index >= 0, `${label} must exist in the fixture`);
  lines[index] = prefix + value;
  return lines.join("\\n");
}

const proof = {
  author: "myProjectsRavi",
  issue_comment_url: "https://github.com/myProjectsRavi/html_to_markdown_api/issues/2#issuecomment-123",
  confirmed_at: "2026-10-11T12:00:00Z"
};
function category(data) {
  data.product.category.status = "CONFIRMED_BY_OWNER";
  data.product.category.value = "SYNTHETIC CATEGORY ONLY";
  data.product.category.confirmation = { ...proof, observed_in_rapidapi_studio: true };
}
function support(data) {
  data.product.support.status = "CONFIRMED_BY_OWNER";
  data.product.support.contact = "https://github.com/myProjectsRavi/html_to_markdown_api/issues";
  data.product.support.confirmation = { ...proof, approved_for_public_listing: true };
}
const first = evaluateOwnerConfirmations(copy());
assert.equal(first.status, "BLOCKED_PENDING_OWNER_CONFIRMATIONS");
assert.deepEqual(first.unresolved, ["exact_marketplace_category", "owner_support_contact"]);
const partial = copy();
category(partial);
assert.deepEqual(evaluateOwnerConfirmations(partial).unresolved, ["owner_support_contact"]);
const other = copy();
support(other);
assert.deepEqual(evaluateOwnerConfirmations(other).unresolved, ["exact_marketplace_category"]);
const both = copy();
category(both); support(both);
const reviewed = evaluateOwnerConfirmations(both);
assert.equal(reviewed.status, "RECORDED_INPUTS_REQUIRE_LIVE_SOURCE_VERIFICATION");
assert.equal(reviewed.canAutomaticallyCloseStory, false);
assert.equal(reviewed.authorizesPublication, false);
assert.equal(reviewed.authorizesPaidPlans, false);
// A recorded owner confirmation must appear verbatim in the human listing.
const categoryDraft = copy(); category(categoryDraft);
const categoryCopy = replaceListingField(listingMarkdown, "Category", categoryDraft.product.category.value);
assertListingCopyMatchesConfirmations(categoryDraft, categoryCopy);
const supportDraft = copy(); support(supportDraft);
const supportCopy = replaceListingField(listingMarkdown, "Support contact", supportDraft.product.support.contact);
assertListingCopyMatchesConfirmations(supportDraft, supportCopy);
const consistentCopy = replaceListingField(categoryCopy, "Support contact", supportDraft.product.support.contact);
assertListingCopyMatchesConfirmations(both, consistentCopy);
function rejectsCopy(data, markdown) {
  assert.throws(() => assertListingCopyMatchesConfirmations(data, markdown));
}
rejectsCopy(categoryDraft, listingMarkdown); // stale category placeholder
rejectsCopy(supportDraft, listingMarkdown); // stale support placeholder
rejectsCopy(both, categoryCopy); // support confirmation missing from copy
rejectsCopy(both, supportCopy); // category confirmation missing from copy
rejectsCopy(base, replaceListingField(listingMarkdown, "Category", "Unverified category"));
rejectsCopy(both, replaceListingField(consistentCopy, "Support contact", "https://example.com/wrong"));
rejectsCopy(base, listingMarkdown.replace("**Category:** ", "**Category removed:** "));
rejectsCopy(base, listingMarkdown + "\\n**Support contact:** OWNER ACTION REQUIRED. Duplicate.\\n");

function rejects(mutator) {
  const input = copy(); mutator(input);
  assert.throws(() => evaluateOwnerConfirmations(input));
}
rejects(d=>{d.product.category.value="GUESS";});
rejects(d=>{category(d);d.product.category.confirmation.author="unknown";});
rejects(d=>{category(d);d.product.category.confirmation.observed_in_rapidapi_studio=false;});
rejects(d=>{category(d);d.product.category.confirmation.issue_comment_url="https://invalid.example";});
rejects(d=>{d.product.support.contact="fake@example.com";});
rejects(d=>{support(d);d.product.support.confirmation.approved_for_public_listing=false;});
rejects(d=>{support(d);d.product.support.contact="http://insecure.example/";});
rejects(d=>{support(d);d.product.support.contact="https://user:password@example.com/";});
rejects(d=>{support(d);d.product.support.contact="https://example.com/?key=secret";});
rejects(d=>{support(d);d.product.support.contact="https://user@example.com";});
rejects(d=>{support(d);d.product.support.contact="email@example.com/path";});
console.log("US039_APPROVAL_GATE_RESULT=" + JSON.stringify({
  baseline:first.status, synthetic_recorded:reviewed.status, negative_cases:11, listing_copy_negative_cases:8,
  recorded_inputs_are_not_authenticated: true, automatic_closure:false,
  publication:false, paid_activation:false
}));
