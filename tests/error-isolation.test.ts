import { describe, expect, it, vi } from "vitest";
import { ENDPOINTS, RESPONSE_HEADERS } from "../src/config";
import { createWorker } from "../src/index";

const SECRET = "synthetic-proxy-secret-0123456789abcdef";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Proxy-Secret": SECRET,
} as const;

type WorkerLike = ReturnType<typeof createWorker>;

function request(
  path: string,
  options: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
  } = {},
): Request {
  const headers = new Headers(options.headers ?? DEFAULT_HEADERS);
  return new Request("https://example.test" + path, {
    method: options.method ?? "POST",
    headers,
    body: options.body === undefined ? JSON.stringify({ html: "<p>ok</p>" }) : options.body,
  });
}

async function call(
  worker: WorkerLike,
  path: string,
  options: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit | null;
    env?: { readonly RAPIDAPI_PROXY_SECRET?: string };
  } = {},
): Promise<Response> {
  return worker.fetch(
    request(path, options),
    options.env ?? ENV,
  );
}

async function expectError(response: Response, status: number, code: string): Promise<void> {
  expect(response.status).toBe(status);
  const body = await response.json() as { error?: { code?: string; message?: string } };
  expect(body.error?.code).toBe(code);
  expect(body.error?.message).toBeTypeOf("string");
}

function securityHeaderSnapshot(response: Response): Record<string, string | null> {
  return {
    contentType: response.headers.get("Content-Type"),
    cacheControl: response.headers.get("Cache-Control"),
    nosniff: response.headers.get("X-Content-Type-Options"),
  };
}

describe("US028 stable error precedence and stateless requests", () => {
  it("applies the documented validation precedence when problems overlap", async () => {
    const worker = createWorker();

    await expectError(
      await call(worker, "/missing", {
        method: "PUT",
        headers: { "Content-Type": "text/plain" },
        body: "bad",
        env: {},
      }),
      404,
      "not_found",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        method: "GET",
        headers: { "Content-Type": "text/plain" },
        body: null,
        env: {},
      }),
      405,
      "method_not_allowed",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        headers: {
          "Content-Type": "text/plain",
          "X-RapidAPI-Proxy-Secret": "wrong",
        },
        body: "bad",
        env: {},
      }),
      503,
      "service_unavailable",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        headers: {
          "Content-Type": "text/plain",
          "X-RapidAPI-Proxy-Secret": "wrong",
        },
        body: "bad",
      }),
      403,
      "forbidden",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        headers: {
          "Content-Type": "text/plain",
          "X-RapidAPI-Proxy-Secret": SECRET,
        },
        body: "x".repeat(800_001),
      }),
      415,
      "unsupported_media_type",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        body: " ".repeat(800_001),
      }),
      413,
      "input_too_large",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        body: Uint8Array.from([0xff]),
      }),
      400,
      "invalid_json",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, { body: "{not-json" }),
      400,
      "invalid_json",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        body: JSON.stringify({ html: "x".repeat(131_073), extra: true }),
      }),
      400,
      "invalid_request",
    );

    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        body: JSON.stringify({ html: "x".repeat(131_073) }),
      }),
      413,
      "input_too_large",
    );

    const tooDeep = "<div>".repeat(65) + "x" + "</div>".repeat(65);
    await expectError(
      await call(worker, ENDPOINTS.markdown, {
        body: JSON.stringify({ html: tooDeep }),
      }),
      422,
      "input_too_complex",
    );
  });

  it("returns the same fixed envelope and security headers on both endpoints", async () => {
    const worker = createWorker();
    const responses = await Promise.all(
      [ENDPOINTS.markdown, ENDPOINTS.text].map((path) =>
        call(worker, path, { body: "{bad-json" })),
    );

    const bodies = await Promise.all(responses.map((response) => response.clone().text()));
    expect(responses.map((response) => response.status)).toEqual([400, 400]);
    expect(bodies[0]).toBe(bodies[1]);

    const expectedHeaders = {
      contentType: RESPONSE_HEADERS.contentType,
      cacheControl: RESPONSE_HEADERS.cacheControl,
      nosniff: RESPONSE_HEADERS.xContentTypeOptions,
    };
    expect(securityHeaderSnapshot(responses[0]!)).toEqual(expectedHeaders);
    expect(securityHeaderSnapshot(responses[1]!)).toEqual(expectedHeaders);
  });

  it("contains unexpected exceptions at the business-route boundary as fixed 500s", async () => {
    const canary = "UNEXPECTED_STACK_INPUT_CANARY";
    const worker = createWorker({
      convert: () => {
        throw new Error(canary);
      },
    });
    const spies = (["log", "info", "warn", "error"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );

    try {
      const response = await call(worker, ENDPOINTS.markdown, {
        body: JSON.stringify({ html: "<p>" + canary + "</p>" }),
      });
      expect(response.status).toBe(500);
      const body = await response.text();
      expect(JSON.parse(body)).toEqual({
        error: {
          code: "internal_error",
          message: "An internal error occurred.",
        },
      });
      expect(body).not.toContain(canary);
      expect(body).not.toContain("Error");
      expect(spies.flatMap((spy) => spy.mock.calls).flat().map(String).join("\n"))
        .not.toContain(canary);
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });

  it("records the controlled 503 server-configuration case", async () => {
    const response = await call(createWorker(), ENDPOINTS.text, {
      env: {},
      body: JSON.stringify({ html: "<p>never-read</p>" }),
    });
    await expectError(response, 503, "service_unavailable");
  });

  it("isolates 100 concurrent mixed requests and drops prohibited canaries", async () => {
    const worker = createWorker();
    const cases = Array.from({ length: 100 }, (_, index) => ({
      path: index % 2 === 0 ? ENDPOINTS.markdown : ENDPOINTS.text,
      visible: `visible-canary-${index.toString().padStart(3, "0")}`,
      dropped: `dropped-canary-${index.toString().padStart(3, "0")}`,
    }));

    const responses = await Promise.all(cases.map((item) =>
      call(worker, item.path, {
        body: JSON.stringify({
          html: `<p>${item.visible}</p><script>${item.dropped}</script>`,
        }),
      }),
    ));

    for (let index = 0; index < cases.length; index += 1) {
      const item = cases[index]!;
      const response = responses[index]!;
      expect(response.status).toBe(200);
      const payload = await response.json() as {
        markdown?: string;
        text?: string;
        stats: { output_chars: number };
      };
      const output = payload.markdown ?? payload.text ?? "";
      expect(output).toBe(item.visible);
      expect(output).not.toContain(item.dropped);
      expect(payload.stats.output_chars).toBe(Array.from(output).length);
    }
  });

  it("recovers cleanly after malformed and complexity-failing requests", async () => {
    const worker = createWorker();

    await expectError(
      await call(worker, ENDPOINTS.text, { body: "{broken" }),
      400,
      "invalid_json",
    );
    const tooDeep = "<div>".repeat(65) + "boom" + "</div>".repeat(65);
    await expectError(
      await call(worker, ENDPOINTS.text, {
        body: JSON.stringify({ html: tooDeep }),
      }),
      422,
      "input_too_complex",
    );

    const response = await call(worker, ENDPOINTS.text, {
      body: JSON.stringify({ html: "<p>after-failure-canary</p>" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      text: "after-failure-canary",
      stats: {
        input_bytes: new TextEncoder().encode("<p>after-failure-canary</p>").byteLength,
        output_chars: Array.from("after-failure-canary").length,
      },
    });
  });
});
