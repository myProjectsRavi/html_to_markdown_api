import assert from "node:assert/strict";

const PREFIX = "https://github.com/myProjectsRavi/html_to_markdown_api/issues/2#issuecomment-";
function commentProof(proof) {
  assert.ok(proof && typeof proof === "object", "owner comment evidence required");
  assert.equal(proof.author, "myProjectsRavi");
  assert.ok(typeof proof.issue_comment_url === "string" &&
    proof.issue_comment_url.startsWith(PREFIX) &&
    /^[1-9][0-9]*$/u.test(proof.issue_comment_url.slice(PREFIX.length)),
    "a real issue comment permalink is required");
  assert.ok(typeof proof.confirmed_at === "string" &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/u.test(proof.confirmed_at) &&
    Number.isFinite(Date.parse(proof.confirmed_at)),
    "valid UTC confirmation timestamp required");
}
function publicContact(value) {
  if (typeof value !== "string" || value.length < 5 || value.length > 200) return false;
  if (/[\s<>"'\\]/u.test(value) || value.includes(String.fromCharCode(96))) return false;
  if (value.includes("://")) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname.length > 3 &&
        !url.username && !url.password && !url.search && !url.hash;
    } catch { return false; }
  }
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/u.test(value);
}
// Shape validation does not authenticate the referenced GitHub comment. The
// operator must independently verify its author and the actual Studio category.
export function evaluateOwnerConfirmations(listing) {
  const category = listing.product?.category;
  const support = listing.product?.support;
  assert.ok(category && support, "category and support fields required");
  const categoryRecorded = category.status === "CONFIRMED_BY_OWNER";
  if (categoryRecorded) {
    assert.ok(typeof category.value === "string" && category.value.length >= 2 &&
      category.value.length <= 80 && /^[\p{L}\p{N} .,&+/()-]+$/u.test(category.value));
    commentProof(category.confirmation);
    assert.equal(category.confirmation.observed_in_rapidapi_studio, true);
  } else {
    assert.equal(category.status, "REQUIRES_OWNER_VERIFICATION");
    assert.equal(category.value, null);
    assert.ok(category.confirmation == null);
  }
  const supportRecorded = support.status === "CONFIRMED_BY_OWNER";
  if (supportRecorded) {
    assert.ok(publicContact(support.contact), "public support email or HTTPS URL required");
    commentProof(support.confirmation);
    assert.equal(support.confirmation.approved_for_public_listing, true);
  } else {
    assert.equal(support.status, "REQUIRES_OWNER_CONFIRMATION");
    assert.equal(support.contact, null);
    assert.ok(support.confirmation == null);
  }
  const unresolved = [];
  if (!categoryRecorded) unresolved.push("exact_marketplace_category");
  if (!supportRecorded) unresolved.push("owner_support_contact");
  return {
    status: unresolved.length ? "BLOCKED_PENDING_OWNER_CONFIRMATIONS" :
      "RECORDED_INPUTS_REQUIRE_LIVE_SOURCE_VERIFICATION",
    unresolved,
    categoryRecorded, supportRecorded,
    canAutomaticallyCloseStory: false,
    authorizesPublication: false,
    authorizesPaidPlans: false
  };
}

/**
 * Verify that the review-facing listing agrees with the machine-recorded
 * category/support decisions. This checks representation consistency only:
 * authenticated GitHub owner comments and the actual RapidAPI Studio dropdown
 * must still be independently reviewed before US039 may close.
 */
export function assertListingCopyMatchesConfirmations(listing, markdown) {
  assert.equal(typeof markdown, "string", "listing Markdown is required");
  const fields = [
    ["Category", listing.product.category, "value", "CONFIRMED_BY_OWNER"],
    ["Support contact", listing.product.support, "contact", "CONFIRMED_BY_OWNER"]
  ];
  for (const [label, recorded, key, confirmedState] of fields) {
    const prefix = `**${label}:** `;
    const rows = markdown.split(/\r?\n/u).filter(row => row.startsWith(prefix));
    assert.equal(rows.length, 1, `${label} must have exactly one listing field`);
    const shown = rows[0].slice(prefix.length).trim();
    if (recorded.status === confirmedState) {
      assert.equal(shown, recorded[key], `${label} in listing differs from approved record`);
    } else {
      assert.ok(shown.startsWith("OWNER ACTION REQUIRED."),
        `${label} must show an explicit pending-decision placeholder`);
    }
  }
}
