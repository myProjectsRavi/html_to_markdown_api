import { afterEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "../src/config";
import { createWorker } from "../src/index";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;
const FIRST_SEED = 1;
const LAST_SEED = 10_000;
const REPLAY_SEED = 4_242;
const MAX_HTML_BYTES = 4_096;
const GENERATOR_VERSION = "us030-grammar-v1";
const encoder = new TextEncoder();

type GeneratedCase = {
  html: string;
  removedCanary: string;
  seed: number;
};

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

function pick<T>(next: () => number, values: readonly T[]): T {
  return values[next() % values.length]!;
}

function textToken(next: () => number, seed: number): string {
  const atoms = [
    "alpha",
    "beta",
    "gamma",
    "&#38;",
    "&amp;",
    "&#x1F600;",
    "<",
    ">",
    "\u00a0",
    "\n",
    "\t",
  ] as const;
  return `${pick(next, atoms)}-${seed}-${next() % 997}`;
}

function href(next: () => number, seed: number): string {
  const urls = [
    `https://example.test/${seed}?q=${next() % 101}`,
    `/relative/${seed}`,
    `mailto:user${seed}@example.test`,
    `javascript:alert(${seed})`,
    `data:text/plain,${seed}`,
    `https://example.test/a%20b#s${seed}`,
  ] as const;
  return pick(next, urls);
}

function node(next: () => number, seed: number, depth: number): string {
  const value = textToken(next, seed);
  if (depth >= 4) return value;

  switch (next() % 10) {
    case 0:
      return `<p>${value}</p>`;
    case 1:
      return `<div> ${node(next, seed, depth + 1)} </div>`;
    case 2:
      return `<strong>${value}</strong><em>${textToken(next, seed)}</em>`;
    case 3:
      return `<a href="${href(next, seed)}">${value}</a>`;
    case 4:
      return `<ul><li>${node(next, seed, depth + 1)}</li><li>${value}</li></ul>`;
    case 5:
      return `<blockquote>${node(next, seed, depth + 1)}</blockquote>`;
    case 6:
      return `<pre><code>${value}\n${textToken(next, seed)}</code></pre>`;
    case 7:
      return `<span data-x="${seed}">${value}</span>`;
    case 8:
      return `<table><tr><th>h</th><th>s</th></tr><tr><td>${value}</td><td>${seed}</td></tr></table>`;
    default:
      return `<section>${node(next, seed, depth + 1)}<br>${value}`;
  }
}

export function generateCase(seed: number): GeneratedCase {
  const next = rng(seed);
  const removedCanary = `REMOVED_SUBTREE_${seed}_${next()}`;
  const whitespace = pick(next, ["", " ", "\n", "\t", "\r\n"] as const);
  let html =
    whitespace +
    node(next, seed, 0) +
    `<script>${removedCanary}</script>` +
    `<style>.x::after{content:"${removedCanary}"}</style>` +
    whitespace;

  if ((next() & 3) === 0) html += `<!-- malformed-${seed}`;
  if (encoder.encode(html).byteLength > MAX_HTML_BYTES) {
    html = `<p>${seed}</p><script>${removedCanary}</script>`;
  }

  expect(encoder.encode(html).byteLength).toBeLessThanOrEqual(MAX_HTML_BYTES);
  return { html, removedCanary, seed };
}

async function convert(path: string, html: string): Promise<Response> {
  return createWorker().fetch(
    new Request("https://example.test" + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Proxy-Secret": SECRET,
      },
      body: JSON.stringify({ html }),
    }),
    ENV,
  );
}

async function snapshot(path: string, item: GeneratedCase): Promise<{
  status: number;
  body: string;
}> {
  const response = await convert(path, item.html);
  return { status: response.status, body: await response.text() };
}

function assertSuccessBody(path: string, item: GeneratedCase, body: string): void {
  const payload = JSON.parse(body) as {
    markdown?: string;
    text?: string;
    stats?: { input_bytes?: number; output_chars?: number };
  };
  const output = path === ENDPOINTS.markdown ? payload.markdown : payload.text;
  expect(output).toBeTypeOf("string");
  expect(output).not.toContain(item.removedCanary);
  expect(payload.stats?.input_bytes).toBe(encoder.encode(item.html).byteLength);
  expect(payload.stats?.output_chars).toBe(Array.from(output ?? "").length);
}

describe("US030 deterministic property and fuzz campaign", () => {
  afterEach(() => vi.restoreAllMocks());

  it("replays seed 4242 exactly from generator version " + GENERATOR_VERSION, () => {
    const first = generateCase(REPLAY_SEED);
    const second = generateCase(REPLAY_SEED);
    expect(second).toEqual(first);
    expect(first.seed).toBe(REPLAY_SEED);
  });

  it("runs seeds 1-10000 deterministically without egress", async () => {
    const fetchTrap = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("US030_NETWORK_TRAP");
    });

    for (let seed = FIRST_SEED; seed <= LAST_SEED; seed += 1) {
      const item = generateCase(seed);
      expect(generateCase(seed)).toEqual(item);

      for (const path of [ENDPOINTS.markdown, ENDPOINTS.text]) {
        const first = await snapshot(path, item);
        const second = await snapshot(path, item);
        expect(second, `seed ${seed} ${path} repeat`).toEqual(first);
        expect([200, 422], `seed ${seed} ${path} documented status`).toContain(first.status);

        if (first.status === 200) {
          assertSuccessBody(path, item, first.body);
        } else {
          const payload = JSON.parse(first.body) as { error?: { code?: string } };
          expect(["input_too_complex", "output_too_large"]).toContain(payload.error?.code);
          expect(first.body).not.toContain(item.removedCanary);
        }
      }
    }

    expect(fetchTrap).not.toHaveBeenCalled();
  }, 180_000);
});
