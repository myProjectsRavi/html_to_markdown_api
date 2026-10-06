# Performance Benchmarks

US033 measures the current release pipeline with a fixed, synthetic, offline corpus. These measurements are engineering evidence for this repository revision, not a claim about Cloudflare production CPU time or global latency.

## Corpus

Generator version: `us033-corpus-v1`.

Families: plain text, entity-heavy text, link-heavy HTML, bounded nested HTML, tabular HTML, and malformed-but-parseable HTML. Each family is generated at approximately 1 KiB, 16 KiB, 64 KiB and the release-boundary 128 KiB class. Actual UTF-8 HTML bytes are recorded for every cell.

The ordinary 128 KiB check uses a bounded one-text-node document and must return HTTP 200 from both conversion endpoints. A separate 256 KiB experiment must return the documented 413 response and is never mixed into accepted-path latency statistics.

## Measurement method

Each benchmark process uses three warmups and fifteen recorded samples per measured cell. Three independent Node processes execute the same corpus in CI. Every record reports p50, p95, p99, minimum, maximum and mean milliseconds plus accepted/rejected disposition.

The benchmark measures:

- end-to-end authenticated Worker request handling for both `/v1/html-to-markdown` and `/v1/html-to-text`, including bounded body reading, JSON parsing/validation, conversion, JSON response creation and response-body consumption;
- JSON parse/request validation;
- HTML parser;
- clean-tree plus shared-text normalization;
- Markdown serialization;
- clean-text serialization.

Successful and rejected endpoint results are labeled separately. Rejected fast paths are not presented as successful conversion latency.

## Environment and limits

CI pins Node 22.22.2 and npm 10.9.7. The result artifact records revision, run index, platform/architecture, bundle bytes and process RSS/heap snapshots. Node process memory is explicitly **not** production Worker isolate memory; production-isolate memory remains unavailable unless separately measured on the target platform.

The conversion corpus never performs network I/O. The CI workflow uploads machine-readable JSON only for one day.

## Interpretation

Local/CI wall-clock timing includes host scheduling and Node/Vitest overhead. It is useful for same-method before/after comparisons and outlier discovery, not for promising Cloudflare CPU milliseconds. US034 must use the same corpus and sample method when claiming any optimization delta.
