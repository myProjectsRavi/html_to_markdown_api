# Performance Benchmarks

US033 measures the current release pipeline with a fixed, synthetic, offline corpus. These measurements are engineering evidence for this repository revision, not a claim about Cloudflare production CPU time or global latency.

## Corpus

Generator version: `us033-corpus-v1`.

Families: plain text, entity-heavy text, link-heavy HTML, bounded nested HTML, tabular HTML, and malformed-but-parseable HTML. Each family is generated at approximately 1 KiB, 16 KiB, 64 KiB and the release-boundary 128 KiB class. Actual UTF-8 HTML bytes are recorded for every cell.

The ordinary 128 KiB check uses a bounded one-text-node document and must return HTTP 200 from both conversion endpoints. A separate 256 KiB experiment must return the documented 413 response and is never mixed into accepted-path latency statistics.

## Measurement method

Each benchmark process uses three warmups and fifteen recorded samples per measured cell. Three independent Node processes execute the same corpus in CI. Every record reports p50, p95, p99, minimum, maximum and mean milliseconds plus accepted/rejected disposition.

The benchmark measures:

- end-to-end authenticated Worker request handling for both `/v1/html/markdown` and `/v1/html/text`, including bounded body reading, JSON parsing/validation, conversion, JSON response creation and response-body consumption;
- JSON parse/request validation;
- HTML parser;
- clean-tree plus shared-text normalization;
- Markdown serialization;
- clean-text serialization.

Successful and rejected endpoint results are labeled separately. Rejected fast paths are not presented as successful conversion latency.

## Environment and limits

CI pins Node 22.22.2 and npm 10.9.7. The result artifact records revision, run index, platform/architecture, bundle bytes and process RSS/heap snapshots. Node process memory is explicitly **not** production Worker isolate memory; production-isolate memory remains unavailable unless separately measured on the target platform.

The conversion corpus never performs network I/O. The CI workflow uploads machine-readable JSON with a seven-day retention window.

## Interpretation

Local/CI wall-clock timing includes host scheduling and Node/Vitest overhead. It is useful for same-method before/after comparisons and outlier discovery, not for promising Cloudflare CPU milliseconds. US034 must use the same corpus and sample method when claiming any optimization delta.


## US033 recorded baseline

Tested code SHA: `be2405909ddbfec0c6af04d6f698296cfe41336a`. Dedicated benchmark run `37639809115` completed successfully and retained three machine-readable result files in artifact `11490769524`.

The stable hotspot is link-heavy 128 KiB Markdown. Across the three independent processes, p50 was 15.1424 / 15.1868 / 15.3049 ms and p95 was 16.6969 / 17.1757 / 16.7327 ms. Markdown serialization for that cell had p95 10.1429 / 10.2277 / 10.0969 ms. This is the primary US034 optimization target.

All ordinary 128 KiB acceptance checks passed. Complexity-limited 128 KiB entity-heavy and malformed families were labelled 422 rejections rather than mixed into successful conversion timing. The isolated 256 KiB checks returned 413 for both endpoints in every run.

A single 1 KiB Markdown sample in process 3 reached 11.7789 ms while its median stayed 0.5949 ms; repeat processes did not reproduce the spike. It is retained as host scheduling noise and is not discarded or interpreted as production CPU.


## US034 optimization delta

Optimized code SHA: `5b0c5bdd1fda6c7c667aa6ee8149638abc214db8`. Benchmark run `37640854298` reused the exact US033 corpus, three-process layout, three warmups and fifteen samples.

For link-heavy 128 KiB Markdown, end-to-end p50 improved from 15.1424/15.1868/15.3049 ms to 13.8379/13.6643/13.9614 ms. End-to-end p95 improved from 16.6969/17.1757/16.7327 ms to 15.1043/16.0542/16.4611 ms.

The dominant Markdown serialization stage improved from p95 10.1429/10.2277/10.0969 ms to 8.2600/9.5775/9.1488 ms, a matched-process reduction of 18.56%/6.36%/9.39%.

The optimization removes repeated regex/slice/TextEncoder allocation work from the hot URL serialization/classification path. It does not change the 128 KiB limit, safety policy, or request semantics. These figures remain local/CI wall-clock evidence, not production CPU guarantees.
