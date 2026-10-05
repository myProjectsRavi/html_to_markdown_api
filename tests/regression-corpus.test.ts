import { describe, expect, it } from "vitest";
import corpusDocument from "./fixtures/corpus.json";
import { ENDPOINTS } from "../src/config";
import { createWorker } from "../src/index";

type Fixture = {
  id: string;
  html: string;
  expected_markdown: string;
  expected_text: string;
  expected_status?: number;
};

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const fixtures = (corpusDocument as { records: Fixture[] }).records;

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
    { RAPIDAPI_PROXY_SECRET: SECRET },
  );
}

describe("US029 canonical regression corpus", () => {
  it("contains at least 120 reviewed synthetic fixtures", () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(120);
  });

  it("matches both integrated conversion endpoints for every success fixture", async () => {
    for (const fixture of fixtures) {
      const expectedStatus = fixture.expected_status ?? 200;
      const markdownResponse = await convert(ENDPOINTS.markdown, fixture.html);
      const textResponse = await convert(ENDPOINTS.text, fixture.html);
      expect.soft(markdownResponse.status, fixture.id + " markdown status").toBe(expectedStatus);
      expect.soft(textResponse.status, fixture.id + " text status").toBe(expectedStatus);
      if (expectedStatus !== 200) continue;

      const markdownPayload = await markdownResponse.json() as {
        markdown: string;
        stats: { input_bytes: number; output_chars: number };
      };
      const textPayload = await textResponse.json() as {
        text: string;
        stats: { input_bytes: number; output_chars: number };
      };

      expect.soft(markdownPayload.markdown, fixture.id + " markdown").toBe(fixture.expected_markdown);
      expect.soft(textPayload.text, fixture.id + " text").toBe(fixture.expected_text);
      const inputBytes = new TextEncoder().encode(fixture.html).byteLength;
      expect.soft(markdownPayload.stats.input_bytes, fixture.id + " markdown input bytes").toBe(inputBytes);
      expect.soft(textPayload.stats.input_bytes, fixture.id + " text input bytes").toBe(inputBytes);
      expect.soft(markdownPayload.stats.output_chars, fixture.id + " markdown chars")
        .toBe(Array.from(markdownPayload.markdown).length);
      expect.soft(textPayload.stats.output_chars, fixture.id + " text chars")
        .toBe(Array.from(textPayload.text).length);
    }
  });
});
