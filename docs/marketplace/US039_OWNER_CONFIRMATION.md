# US039 owner-confirmation procedure

US039 remains **BLOCKED** until two actual owner decisions appear in [Issue #2](https://github.com/myProjectsRavi/html_to_markdown_api/issues/2). A created issue, a repository URL or test fixture is **not** proof of consent.

1. The owner comments with an explicitly approved **public monitored support contact** (public email or approved HTTPS support issue tracker) and authorizes publishing that contact. Do not commit credentials or private contacts.
2. The owner copies the **exact current RapidAPI Studio category** from the selection list and confirms that it was observed, not inferred from general documentation.
3. Obtain the permalink of the owner's comment. Verify through the GitHub connector that its author is `myProjectsRavi` and the content actually confirms the claimed contact and category. A URL string in repository JSON cannot authenticate itself.
4. Update `docs/marketplace/US039_LISTING_DRAFT.json` and `US039_RAPIDAPI_LISTING.md`: set the relevant category/support status to `CONFIRMED_BY_OWNER`, provide the confirmed value, and include matching `confirmation` metadata.
5. Run `npm run test:listing` and the entire exact-SHA CI gate. Re-verify the GitHub source and actual RapidAPI Studio category before marking US039 DONE. Only then advance to US040.

Category `confirmation` fields: `author`, `issue_comment_url`, `confirmed_at` (UTC ISO8601) and `observed_in_rapidapi_studio: true`.

Support `confirmation` fields: `author`, `issue_comment_url`, `confirmed_at` (UTC ISO8601) and `approved_for_public_listing: true`.

The issue permalink must point to issue #2 in this repository, ending with `#issuecomment-<numeric id>`. The script validates metadata shape and deliberately **does not** assert that the comment is authentic or that a Studio category exists. The independent live verification remains mandatory.

Both fields can be recorded independently; incomplete or inconsistent combinations fail safely. Synthetic positive/negative cases are in `scripts/test-us039-approval.mjs`. Their mock values are not real owner decisions.

**No promotion implied.** Regardless of recorded category/support, the validator requires `published=false`, `plans_activated=false` and `owner_approved=false` in the draft, with independent US035 capacity/rate-limit and US044 release gates still blocked. Pricing hypotheses are not published or enabled.
