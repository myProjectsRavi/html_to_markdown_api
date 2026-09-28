import { describe, expect, it } from "vitest";
import worker from "../src/index";
import { LIMITS } from "../src/config";
import { validateConversionRequest } from "../src/http/request";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;

async function expectError(
  result: ReturnType<typeof validateConversionRequest>,
  status: number,
  code: string,
): Promise<void> {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.response.status).toBe(status);
  const value = (await result.response.json()) as {
    error?: { code?: string };
  };
  expect(value.error?.code).toBe(code);
}

function ok(text: string): Extract<
  ReturnType<typeof validateConversionRequest>,
  { ok: true }
> {
  const result = validateConversionRequest(text);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("expected validation success");
  return result;
}

async function call(body: string): Promise<Response> {
  return worker.fetch(
    new Request("https://example.test/v1/html/markdown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Proxy-Secret": SECRET,
      },
      body,
    }),
    ENV,
  );
}

describe("US008 precise JSON and decoded HTML validation", () => {
  it("maps malformed JSON to invalid_json", async () => {
    await expectError(validateConversionRequest("{"), 400, "invalid_json");
  });

  it("distinguishes missing html from invalid request shapes", async () => {
    await expectError(validateConversionRequest("{}"), 400, "missing_html");

    for (const text of [
      "null",
      "[]",
      '"text"',
      '{"html":null}',
      '{"html":123}',
      '{"html":"ok","extra":true}',
    ]) {
      await expectError(validateConversionRequest(text), 400, "invalid_request");
    }
  });

  it("accepts empty and whitespace-only html unchanged", () => {
    const empty = ok('{"html":""}');
    expect(empty.request.html).toBe("");
    expect(empty.inputBytes).toBe(0);

    const whitespaceHtml = "  \\n\\t";
    const whitespace = ok(JSON.stringify({ html: whitespaceHtml }));
    expect(whitespace.request.html).toBe(whitespaceHtml);
    expect(whitespace.inputBytes).toBe(4);
  });

  it("enforces the decoded HTML byte ceiling for ASCII independently of the raw-body cap", async () => {
    const exact = "a".repeat(LIMITS.decodedHtmlBytes);
    const accepted = ok(JSON.stringify({ html: exact }));
    expect(accepted.inputBytes).toBe(131_072);

    await expectError(
      validateConversionRequest(JSON.stringify({ html: exact + "a" })),
      413,
      "input_too_large",
    );
  });

  it("enforces the same byte ceiling for multibyte HTML", async () => {
    const exact = "é".repeat(LIMITS.decodedHtmlBytes / 2);
    const accepted = ok(JSON.stringify({ html: exact }));
    expect(accepted.inputBytes).toBe(131_072);

    await expectError(
      validateConversionRequest(JSON.stringify({ html: exact + "a" })),
      413,
      "input_too_large",
    );
  });

  it("counts escaped JSON after decoding rather than by source spelling", () => {
    const escaped = ok('{"html":"\\u00e9"}');
    expect(escaped.request.html).toBe("é");
    expect(escaped.inputBytes).toBe(2);
  });

  it("preserves emoji and combining marks while measuring UTF-8 bytes", () => {
    const html = "😀e\u0301";
    const result = ok(JSON.stringify({ html }));
    expect(result.request.html).toBe(html);
    expect(result.inputBytes).toBe(7);
  });

  it("rejects unpaired UTF-16 surrogates but accepts a valid pair", async () => {
    await expectError(
      validateConversionRequest('{"html":"\\ud800"}'),
      400,
      "invalid_request",
    );
    await expectError(
      validateConversionRequest('{"html":"\\udc00"}'),
      400,
      "invalid_request",
    );

    const paired = ok('{"html":"\\ud83d\\ude00"}');
    expect(paired.request.html).toBe("😀");
    expect(paired.inputBytes).toBe(4);
  });

  it("documents native duplicate-key behavior: the last html value wins", () => {
    const result = ok('{"html":"first","html":"second"}');
    expect(result.request.html).toBe("second");
    expect(result.inputBytes).toBe(6);
  });

  it("integrates envelope validation after auth/body and lets valid empty html proceed downstream", async () => {
    const missing = await call("{}");
    expect(missing.status).toBe(400);
    expect(await missing.json()).toEqual({
      error: {
        code: "missing_html",
        message: "The html property is required.",
      },
    });

    const invalid = await call('{"html":null}');
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({
      error: {
        code: "invalid_request",
        message: "Request does not match the supported schema.",
      },
    });

    for (const html of ["", "   "]) {
      const response = await call(JSON.stringify({ html }));
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: {
          code: "service_unavailable",
          message: "Service configuration is unavailable.",
        },
      });
    }
  });
});
