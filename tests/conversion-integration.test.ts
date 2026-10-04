import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { CONTRACT_EXAMPLES, ENDPOINTS } from "../src/config";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;

async function convert(path: string, html: string): Promise<Response> {
  return worker.fetch(
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

function expansionAttack(leaves = 4300): string {
  const depth = 30;
  let html = "";
  for (let index = 0; index < depth; index += 1) html += "<ul><li>n";
  html += "<ul>" + "<li>x</li>".repeat(leaves) + "</ul>";
  for (let index = 0; index < depth; index += 1) html += "</li></ul>";
  return html;
}

describe("US027 integrated bounded conversion", () => {
  it("serves the frozen Markdown and text examples with factual stats", async () => {
    const html = CONTRACT_EXAMPLES.hello.request.html;

    const markdown = await convert(ENDPOINTS.markdown, html);
    expect(markdown.status).toBe(200);
    expect(await markdown.json()).toEqual(CONTRACT_EXAMPLES.hello.markdown);

    const text = await convert(ENDPOINTS.text, html);
    expect(text.status).toBe(200);
    expect(await text.json()).toEqual(CONTRACT_EXAMPLES.hello.text);
  });

  it("computes output_chars from Unicode scalars rather than UTF-16 units", async () => {
    for (const path of [ENDPOINTS.markdown, ENDPOINTS.text]) {
      const response = await convert(path, "<p>😀</p>");
      expect(response.status).toBe(200);
      const value = await response.json() as {
        markdown?: string;
        text?: string;
        stats: { input_bytes: number; output_chars: number };
      };
      const output = value.markdown ?? value.text ?? "";
      expect(output).toBe("😀");
      expect(value.stats).toEqual({ input_bytes: 11, output_chars: 1 });
      expect(Array.from(output).length).toBe(value.stats.output_chars);
      expect(output.length).toBe(2);
    }
  });

  it("returns 422 with no partial success when nesting expansion exceeds the output budget", async () => {
    const html = expansionAttack();
    expect(new TextEncoder().encode(html).byteLength).toBeLessThan(131_072);

    for (const path of [ENDPOINTS.markdown, ENDPOINTS.text]) {
      const response = await convert(path, html);
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({
        error: {
          code: "output_too_large",
          message: "Output exceeds the supported limit.",
        },
      });
    }
  });

  it("returns empty success for empty input with zero output counters", async () => {
    for (const path of [ENDPOINTS.markdown, ENDPOINTS.text]) {
      const response = await convert(path, "");
      expect(response.status).toBe(200);
      const value = await response.json() as Record<string, unknown>;
      expect(value.stats).toEqual({ input_bytes: 0, output_chars: 0 });
      expect(value[path === ENDPOINTS.markdown ? "markdown" : "text"]).toBe("");
    }
  });
});
