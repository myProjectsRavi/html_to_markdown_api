# Dependency and CI hardening

US032 keeps validation reproducible and prevents untrusted code from receiving deployment capability.

## Trust boundaries

- Pull-request validation is read-only with top-level `contents: read`.
- No workflow uses `pull_request_target`.
- Validation workflows reference no GitHub `secrets.*` values.
- No production deployment job exists in this repository at this stage. Validation may execute `wrangler deploy --dry-run` only. A future production deploy must be a separate protected workflow/environment and is outside US032.
- Checkout does not persist credentials.
- All GitHub Actions references are pinned to full immutable commit SHAs.
- Every job has a finite timeout.

## Dependency policy

- `package.json` dependency and devDependency specifications are exact versions.
- Node and npm are pinned by `engines`, `packageManager`, and CI.
- `npm ci` rebuilds strictly from the reviewed lockfile.
- Runtime transitive packages must retain version, license and integrity metadata.
- Runtime dependencies may not execute install scripts.
- The reviewed dev-only install-script packages are `esbuild@0.28.1`, `fsevents@2.3.3`, and `workerd@1.20260925.1`. Any version/package change fails the policy gate until reviewed.
- CI runs dated npm advisory checks at high severity for the full dependency graph and the production graph. Advisory retrieval is intentionally outside the deterministic conversion test suite.

## Artifact and bundle policy

The Worker is dry-run built before bundle auditing. The bundle audit fails on Node/system networking or filesystem imports, browser egress primitives, or persistent Cloudflare binding types. The audited dry-run bundle is retained for one day in the branch validation workflow so a specific build can be inspected without creating a long-lived artifact store.

Security and secret scanning from US031 remains part of `verify:current`.
