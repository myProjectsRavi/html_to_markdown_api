import { mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { ENDPOINTS } from "../src/config";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText, renderCleanTextOutput } from "../src/html/text";
import { validateConversionRequest } from "../src/http/request";
import { createWorker } from "../src/index";
import { renderMarkdownOutput } from "../src/markdown/blocks";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;
const UTF8 = new TextEncoder();
const WARMUP = Number(process.env.BENCH_WARMUP ?? "3");
const SAMPLES = Number(process.env.BENCH_SAMPLES ?? "15");
const RUN_INDEX = Number(process.env.BENCH_RUN_INDEX ?? "0");
const OUTPUT = process.env.BENCH_OUTPUT ?? ".bench/local.json";
const REVISION = process.env.GITHUB_SHA ?? "local";
const SIZE_SPECS = [
  ["1KiB", 1_024],
  ["16KiB", 16_384],
  ["64KiB", 65_536],
  ["128KiB", 131_000],
] as const;

type Family = "plain" | "entities" | "links" | "nested" | "table" | "malformed";
type Endpoint = typeof ENDPOINTS.markdown | typeof ENDPOINTS.text;
type Timing = { p50_ms: number; p95_ms: number; p99_ms: number; max_ms: number; min_ms: number; mean_ms: number };
type RecordItem = {
  family: Family;
  size_label: string;
  target_html_bytes: number;
  actual_html_bytes: number;
  stage: string;
  endpoint?: Endpoint;
  disposition: "accepted" | "rejected" | "stage-only";
  status?: number;
  timing?: Timing;
  sample_count: number;
  warmup_count: number;
  error?: string;
};

function bytes(value: string): number {
  return UTF8.encode(value).byteLength;
}

function fillText(prefix: string, token: string, suffix: string, target: number): string {
  const fixed = bytes(prefix) + bytes(suffix);
  if (fixed > target) return prefix + suffix;
  const tokenBytes = bytes(token);
  const count = Math.max(0, Math.floor((target - fixed) / tokenBytes));
  let body = token.repeat(count);
  while (bytes(prefix + body + "x" + suffix) <= target) body += "x";
  return prefix + body + suffix;
}

function linkCorpus(target: number): string {
  const prefix = "<article>";
  const suffix = "</article>";
  const fillerOpen = "<span>";
  const fillerClose = "</span>";
  const chunk = '<a href="https://example.test/resource">link alpha beta gamma delta epsilon</a>';
  let body = "";
  while (bytes(prefix + body + chunk + fillerOpen + fillerClose + suffix) <= target) body += chunk;
  return fillText(prefix + body + fillerOpen, "x", fillerClose + suffix, target);
}

function tableCorpus(target: number): string {
  const rows = target <= 1_024 ? 4 : target <= 16_384 ? 24 : target <= 65_536 ? 80 : 180;
  const columns = target <= 1_024 ? 3 : 8;
  const cells = rows * columns;
  const build = (cellLength: number) => {
    const value = "t".repeat(Math.max(1, cellLength));
    let output = "<table><tbody>";
    for (let row = 0; row < rows; row += 1) {
      output += "<tr>";
      for (let column = 0; column < columns; column += 1) output += `<td>${value}</td>`;
      output += "</tr>";
    }
    return output + "</tbody></table>";
  };
  const base = build(1);
  let cellLength = Math.max(1, Math.floor((target - bytes(base)) / cells) + 1);
  let html = build(cellLength);
  while (bytes(html) > target && cellLength > 1) html = build(--cellLength);
  return html;
}

function corpus(family: Family, target: number): string {
  switch (family) {
    case "plain":
      return fillText("<article><p>", "alpha beta gamma delta ", "</p></article>", target);
    case "entities":
      return fillText("<p>", "A &amp; B &#38; C &#x1F600; ", "</p>", target);
    case "links":
      return linkCorpus(target);
    case "nested": {
      const depth = 24;
      return fillText("<section>".repeat(depth) + "<p>", "nested alpha beta ", "</p>" + "</section>".repeat(depth), target);
    }
    case "table":
      return tableCorpus(target);
    case "malformed":
      return fillText("<main>", "<div><span>malformed</div>", "</main>", target);
  }
}

function percentile(sorted: readonly number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1));
  return sorted[index]!;
}

function summarize(samples: readonly number[]): Timing {
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, value) => sum + value, 0) / Math.max(1, sorted.length);
  const round = (value: number) => Number(value.toFixed(4));
  return {
    p50_ms: round(percentile(sorted, 0.50)),
    p95_ms: round(percentile(sorted, 0.95)),
    p99_ms: round(percentile(sorted, 0.99)),
    max_ms: round(sorted.at(-1) ?? 0),
    min_ms: round(sorted[0] ?? 0),
    mean_ms: round(mean),
  };
}

function timeSync(fn: () => void): Timing {
  for (let index = 0; index < WARMUP; index += 1) fn();
  const values: number[] = [];
  for (let index = 0; index < SAMPLES; index += 1) {
    const start = performance.now();
    fn();
    values.push(performance.now() - start);
  }
  return summarize(values);
}

async function invoke(path: Endpoint, html: string): Promise<{ status: number; body: string }> {
  const response = await createWorker().fetch(
    new Request("https://benchmark.test" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Proxy-Secret": SECRET,
      },
      body: JSON.stringify({ html }),
    }),
    ENV,
  );
  return { status: response.status, body: await response.text() };
}

async function timeEndpoint(path: Endpoint, html: string): Promise<{ timing: Timing; status: number }> {
  let status = -1;
  for (let index = 0; index < WARMUP; index += 1) {
    const result = await invoke(path, html);
    status = result.status;
  }
  const values: number[] = [];
  for (let index = 0; index < SAMPLES; index += 1) {
    const start = performance.now();
    const result = await invoke(path, html);
    values.push(performance.now() - start);
    if (status !== -1) expect(result.status).toBe(status);
    status = result.status;
    expect([200, 413, 422]).toContain(result.status);
  }
  return { timing: summarize(values), status };
}

function bundleBytes(path = "dist"): number | null {
  try {
    let total = 0;
    const stack = [path];
    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const entry of readdirSync(current)) {
        const full = join(current, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) stack.push(full);
        else total += stat.size;
      }
    }
    return total;
  } catch {
    return null;
  }
}

describe("US033 fixed performance corpus", () => {
  it("measures both endpoints and pipeline stages without network", async () => {
    expect(Number.isInteger(WARMUP) && WARMUP >= 1).toBe(true);
    expect(Number.isInteger(SAMPLES) && SAMPLES >= 5).toBe(true);

    const memoryStart = process.memoryUsage();
    const records: RecordItem[] = [];
    const families: Family[] = ["plain", "entities", "links", "nested", "table", "malformed"];

    for (const family of families) {
      for (const [sizeLabel, target] of SIZE_SPECS) {
        const html = corpus(family, target);
        const actual = bytes(html);
        expect(actual).toBeLessThanOrEqual(target);

        const jsonText = JSON.stringify({ html });
        records.push({
          family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
          stage: "json_parse_validate", disposition: "stage-only", sample_count: SAMPLES, warmup_count: WARMUP,
          timing: timeSync(() => { validateConversionRequest(jsonText); }),
        });

        let normalized: ReturnType<typeof normalizeSharedText> | null = null;
        try {
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "parser", disposition: "stage-only", sample_count: SAMPLES, warmup_count: WARMUP,
            timing: timeSync(() => { parseHtml(html); }),
          });
          const parsed = parseHtml(html);
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "clean_normalize", disposition: "stage-only", sample_count: SAMPLES, warmup_count: WARMUP,
            timing: timeSync(() => { normalizeSharedText(cleanParsedTree(parsed)); }),
          });
          normalized = normalizeSharedText(cleanParsedTree(parsed));
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "serialize_markdown", endpoint: ENDPOINTS.markdown, disposition: "stage-only",
            sample_count: SAMPLES, warmup_count: WARMUP,
            timing: timeSync(() => { renderMarkdownOutput(normalized!); }),
          });
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "serialize_text", endpoint: ENDPOINTS.text, disposition: "stage-only",
            sample_count: SAMPLES, warmup_count: WARMUP,
            timing: timeSync(() => { renderCleanTextOutput(normalized!); }),
          });
        } catch (error) {
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "pipeline_stage_rejected", disposition: "rejected", sample_count: 0, warmup_count: 0,
            error: error instanceof Error ? error.name : "unknown_error",
          });
        }

        for (const endpoint of [ENDPOINTS.markdown, ENDPOINTS.text] as const) {
          const total = await timeEndpoint(endpoint, html);
          records.push({
            family, size_label: sizeLabel, target_html_bytes: target, actual_html_bytes: actual,
            stage: "endpoint_total", endpoint,
            disposition: total.status === 200 ? "accepted" : "rejected",
            status: total.status, timing: total.timing, sample_count: SAMPLES, warmup_count: WARMUP,
          });
        }
      }
    }

    // The release limit remains 128 KiB. An ordinary one-text-node fixture must be accepted.
    const ordinary128 = corpus("plain", 131_000);
    for (const endpoint of [ENDPOINTS.markdown, ENDPOINTS.text] as const) {
      expect((await invoke(endpoint, ordinary128)).status).toBe(200);
    }

    // Experimental 256 KiB is isolated from accepted-path latency distributions.
    const experimental256 = "<p>" + "x".repeat(262_144) + "</p>";
    const experimental: Array<{ endpoint: Endpoint; status: number }> = [];
    for (const endpoint of [ENDPOINTS.markdown, ENDPOINTS.text] as const) {
      const result = await invoke(endpoint, experimental256);
      expect(result.status).toBe(413);
      experimental.push({ endpoint, status: result.status });
    }

    const memoryEnd = process.memoryUsage();
    const result = {
      schema_version: 1,
      story: "US033",
      revision: REVISION,
      run_index: RUN_INDEX,
      generator_version: "us033-corpus-v1",
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      warmup_count: WARMUP,
      sample_count: SAMPLES,
      process_memory_bytes: {
        start_rss: memoryStart.rss,
        end_rss: memoryEnd.rss,
        start_heap_used: memoryStart.heapUsed,
        end_heap_used: memoryEnd.heapUsed,
        note: "Node benchmark-process memory, not production Worker isolate memory",
      },
      bundle_bytes: bundleBytes(),
      experimental_256kib: experimental,
      records,
    };

    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + "\n", "utf8");

    const totals = records
      .filter((item) => item.stage === "endpoint_total" && item.timing)
      .sort((a, b) => (b.timing?.p95_ms ?? 0) - (a.timing?.p95_ms ?? 0))
      .slice(0, 12)
      .map((item) => ({
        family: item.family, size: item.size_label, endpoint: item.endpoint,
        disposition: item.disposition, status: item.status, p50_ms: item.timing!.p50_ms,
        p95_ms: item.timing!.p95_ms, p99_ms: item.timing!.p99_ms, max_ms: item.timing!.max_ms,
      }));
    const stages = records
      .filter((item) => item.stage !== "endpoint_total" && item.timing)
      .sort((a, b) => (b.timing?.p95_ms ?? 0) - (a.timing?.p95_ms ?? 0))
      .slice(0, 12)
      .map((item) => ({
        family: item.family, size: item.size_label, stage: item.stage,
        p95_ms: item.timing!.p95_ms, max_ms: item.timing!.max_ms,
      }));

    console.log("US033_TOP_TOTAL=" + JSON.stringify(totals));
    console.log("US033_TOP_STAGES=" + JSON.stringify(stages));
    console.log("US033_RESULT_FILE=" + OUTPUT);
  }, 240_000);
});
