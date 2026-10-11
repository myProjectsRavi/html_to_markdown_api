import { afterEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "../src/config";
import { ParserInternalError } from "../src/html/parse";
import { createWorker } from "../src/index";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;

async function convert(path: string, html: string, worker = createWorker()): Promise<Response> {
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

function outputOf(path: string, payload: { markdown?: string; text?: string }): string {
  return path === ENDPOINTS.markdown ? payload.markdown ?? "" : payload.text ?? "";
}

describe("US031 security and privacy regression suite", () => {
  afterEach(() => vi.restoreAllMocks());

  it("drops active subtrees and never emits raw source tags into Markdown", async () => {
    const dropped = "SECURITY_DROPPED_CANARY_031";
    const html =
      `<script>${dropped}</script><style>${dropped}</style>` +
      `<iframe>${dropped}</iframe><svg><text>${dropped}</text></svg>` +
      `<custom-tag onclick="alert(1)">visible</custom-tag>` +
      `<p>&lt;img src=x onerror=alert(1)&gt;</p>`;

    const markdownResponse = await convert(ENDPOINTS.markdown, html);
    expect(markdownResponse.status).toBe(200);
    const markdownPayload = await markdownResponse.json() as { markdown: string };
    expect(markdownPayload.markdown).not.toContain(dropped);
    expect(markdownPayload.markdown).not.toContain("<custom-tag");
    expect(markdownPayload.markdown).toContain("visible");
    expect(markdownPayload.markdown).toContain("\\<img src=x onerror=alert(1)\\>");
    // A raw-HTML-enabled Markdown consumer only sees unescaped tags as HTML.
    expect(markdownPayload.markdown).not.toMatch(/(?<!\\)<\/?[A-Za-z][^>]*>/u);

    const textResponse = await convert(ENDPOINTS.text, html);
    expect(textResponse.status).toBe(200);
    const textPayload = await textResponse.json() as { text: string };
    expect(textPayload.text).not.toContain(dropped);
    expect(textPayload.text).toContain("visible");
  });

  it("degrades unsafe and obfuscated link/image schemes to inert visible text", async () => {
    const unsafe = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      "j%61vascript:alert(1)",
      "javascript%3Aalert(1)",
      "data:text/html,boom",
      "//evil.test/path",
      "http://user:pass@evil.test/",
      "https:\\evil.test/path",
      "%2F%2Fevil.test/path",
    ];

    for (const target of unsafe) {
      const response = await convert(
        ENDPOINTS.markdown,
        `<a href="${target}">LINKCANARY</a><img src="${target}" alt="IMAGECANARY">`,
      );
      expect(response.status, target).toBe(200);
      const payload = await response.json() as { markdown: string };
      expect(payload.markdown, target).toContain("LINKCANARY");
      expect(payload.markdown, target).toContain("IMAGECANARY");
      expect(payload.markdown, target).not.toContain(`](<${target}`);
      expect(payload.markdown, target).not.toContain(`](<${target}>)`);
      expect(payload.markdown, target).not.toContain(`!["IMAGECANARY"](<${target}>)`);
    }
  });

  it("contains injected parser failures without response or console disclosure", async () => {
    const canary = "PARSER_EXCEPTION_SECRET_CANARY_031";
    const worker = createWorker({
      convert: () => {
        throw new ParserInternalError(new Error(canary));
      },
    });
    const spies = (["log", "info", "warn", "error"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );

    const response = await convert(
      ENDPOINTS.markdown,
      `<p>visible</p><script>${canary}</script>`,
      worker,
    );
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe('{"error":{"code":"internal_error","message":"An internal error occurred."}}');
    expect(body).not.toContain(canary);
    expect(spies.flatMap((spy) => spy.mock.calls).flat().map(String).join("\n")).not.toContain(canary);
  });

  it("performs conversion with no runtime egress and no application logging", async () => {
    const fetchTrap = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      throw new Error("SECURITY_EGRESS_TRAP_031");
    });
    const spies = (["log", "info", "warn", "error"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );

    const response = await convert(
      ENDPOINTS.markdown,
      '<p>offline</p><a href="https://example.test/path">link</a><img src="https://example.test/x.png" alt="x">',
    );
    expect(response.status).toBe(200);
    expect(fetchTrap).not.toHaveBeenCalled();
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it("rejects nesting beyond the bounded parser depth instead of recursing without limit", async () => {
    const html = "<div>".repeat(65) + "depth-canary" + "</div>".repeat(65);
    for (const path of [ENDPOINTS.markdown, ENDPOINTS.text]) {
      const response = await convert(path, html);
      expect(response.status).toBe(422);
      expect(await response.json()).toEqual({
        error: {
          code: "input_too_complex",
          message: "Input exceeds the supported complexity limit.",
        },
      });
    }
  });
});
