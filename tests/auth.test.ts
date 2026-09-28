import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { authenticateRapidApi, type AuthEnv } from "../src/auth/rapidapi";

const TEST_SECRET = "synthetic-proxy-secret-0123456789abcdef";
const BAD_SECRET = "synthetic-wrong-secret-0123456789abcdef";
const BUSINESS_PATHS = ["/v1/html/markdown", "/v1/html/text"] as const;

function request(
  path: string,
  headers: HeadersInit = {},
  body: BodyInit | null = "{\"html\":\"<p>x</p>\"}",
): Request {
  return new Request(`https://example.test${path}`, {
    method: "POST",
    headers,
    body,
  });
}

async function expectError(
  response: Response,
  status: number,
  code: string,
): Promise<void> {
  expect(response.status).toBe(status);
  const value = (await response.json()) as { error?: { code?: string } };
  expect(value.error?.code).toBe(code);
}

class BodySpyRequest extends Request {
  reads = 0;

  override get body(): ReadableStream<Uint8Array> | null {
    this.reads += 1;
    return super.body;
  }

  override text(): Promise<string> {
    this.reads += 1;
    return Promise.reject(new Error("body text must not be read"));
  }

  override json(): Promise<unknown> {
    this.reads += 1;
    return Promise.reject(new Error("body json must not be read"));
  }

  override arrayBuffer(): Promise<ArrayBuffer> {
    this.reads += 1;
    return Promise.reject(new Error("body arrayBuffer must not be read"));
  }

  override blob(): Promise<Blob> {
    this.reads += 1;
    return Promise.reject(new Error("body blob must not be read"));
  }

  override formData(): Promise<FormData> {
    this.reads += 1;
    return Promise.reject(new Error("body formData must not be read"));
  }
}

describe("US006 RapidAPI proxy authentication", () => {
  it("keeps health public even when server auth configuration is missing", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/health"),
      {},
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns 503 when the server proxy secret is missing or invalid", async () => {
    for (const env of [
      {},
      { RAPIDAPI_PROXY_SECRET: "" },
      { RAPIDAPI_PROXY_SECRET: "x".repeat(513) },
      { RAPIDAPI_PROXY_SECRET: "invalid,coalesced" },
    ] satisfies readonly AuthEnv[]) {
      const response = await worker.fetch(
        request("/v1/html/markdown", {
          "X-RapidAPI-Proxy-Secret": TEST_SECRET,
        }),
        env,
      );
      await expectError(response, 503, "service_unavailable");
    }
  });

  it("rejects missing, wrong, prefix-only, suffix-only and oversized credentials", async () => {
    const env: AuthEnv = { RAPIDAPI_PROXY_SECRET: TEST_SECRET };
    const badHeaders: readonly HeadersInit[] = [
      {},
      { "X-RapidAPI-Proxy-Secret": BAD_SECRET },
      { "X-RapidAPI-Proxy-Secret": TEST_SECRET.slice(0, -1) },
      { "X-RapidAPI-Proxy-Secret": TEST_SECRET.slice(1) },
      { "X-RapidAPI-Proxy-Secret": "x".repeat(513) },
    ];

    for (const path of BUSINESS_PATHS) {
      for (const headers of badHeaders) {
        const response = await worker.fetch(request(path, headers), env);
        await expectError(response, 403, "forbidden");
      }
    }
  });

  it("rejects duplicate/coalesced proxy credentials", async () => {
    const headers = new Headers();
    headers.append("X-RapidAPI-Proxy-Secret", TEST_SECRET);
    headers.append("X-RapidAPI-Proxy-Secret", TEST_SECRET);

    const response = await worker.fetch(
      request("/v1/html/markdown", headers),
      { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
    );
    await expectError(response, 403, "forbidden");
  });

  it("does not trust a customer X-RapidAPI-Key without the proxy secret", async () => {
    const response = await worker.fetch(
      request("/v1/html/text", {
        "X-RapidAPI-Key": "synthetic-customer-key",
      }),
      { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
    );
    await expectError(response, 403, "forbidden");
  });

  it("accepts the exact proxy secret and lets the business route continue", async () => {
    const auth = await authenticateRapidApi(
      request("/v1/html/markdown", {
        "X-RapidAPI-Proxy-Secret": TEST_SECRET,
      }),
      { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
    );
    expect(auth).toBeNull();

    const response = await worker.fetch(
      request("/v1/html/markdown", {
        "X-RapidAPI-Proxy-Secret": TEST_SECRET,
      }),
      { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
    );

    // US005's controlled non-success placeholder proves routing continued
    // beyond authentication without fabricating a conversion result.
    await expectError(response, 503, "service_unavailable");
  });

  it("rejects authentication before any request-body consumption", async () => {
    const spied = new BodySpyRequest(
      "https://example.test/v1/html/markdown",
      {
        method: "POST",
        headers: {
          "X-RapidAPI-Proxy-Secret": BAD_SECRET,
        },
        body: "{\"html\":\"sensitive synthetic payload\"}",
      },
    );

    expect(spied.reads).toBe(0);
    const response = await worker.fetch(spied, {
      RAPIDAPI_PROXY_SECRET: TEST_SECRET,
    });
    await expectError(response, 403, "forbidden");
    expect(spied.reads).toBe(0);
  });

  it("does not log supplied or configured secret patterns", async () => {
    const methods = ["log", "info", "warn", "error"] as const;
    const spies = methods.map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );

    try {
      await worker.fetch(
        request("/v1/html/markdown", {
          "X-RapidAPI-Proxy-Secret": BAD_SECRET,
        }),
        { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
      );
      await worker.fetch(
        request("/v1/html/markdown", {
          "X-RapidAPI-Proxy-Secret": TEST_SECRET,
        }),
        { RAPIDAPI_PROXY_SECRET: TEST_SECRET },
      );

      const rendered = spies
        .flatMap((spy) => spy.mock.calls)
        .flat()
        .map(String)
        .join("\n");
      expect(rendered).not.toContain(TEST_SECRET);
      expect(rendered).not.toContain(BAD_SECRET);
      expect(rendered).toBe("");
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
});
