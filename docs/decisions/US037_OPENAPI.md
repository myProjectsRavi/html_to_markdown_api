# US037 OpenAPI compatibility decision

Snapshot date: 2026-10-07

## Marketplace compatibility

RapidAPI's current Requests documentation identifies an OpenAPI 3.0.3 importer. RapidAPI's OpenAPI upload guidance recommends validating specifications before upload and documents local-reference import behavior.

References:
- https://docs.rapidapi.com/docs/requests
- https://docs.rapidapi.com/docs/adding-and-updating-openapi-documents

The public `openapi.yaml` is therefore OpenAPI 3.0.3. The earlier 3.1-only `const` schema constraints were replaced with 3.0-compatible single-value `enum` constraints.

## Authentication boundary

The public specification describes customer-facing RapidAPI marketplace headers separately from the Worker's private gateway-to-origin authentication. It does not ask marketplace clients to provide the private origin credential.

An OpenAPI operation-level security requirement is intentionally not used to model the origin control because it is not the customer's marketplace credential.

## Validator

US037 pins `@apidevtools/swagger-parser@13.1.0` as an exact dev dependency. The generated dependency graph was audited with `npm audit --audit-level=high` before adoption.

`npm run test:openapi` performs OpenAPI schema validation, semantic comparisons with runtime routes/limits/errors, factual example count checks, integrated success-example execution and router-error documentation checks.

## Scope

US037 changes documentation and test tooling only. It does not deploy or publish, does not add a URL-fetch endpoint, and does not add a runtime dependency.
