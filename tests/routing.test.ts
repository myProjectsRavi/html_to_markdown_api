import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const SECURITY_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

type RouteCase = {
  readonly name: string;
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly body?: unknown;
  readonly allow?: "GET" | "POST";
};

const cases: readonly RouteCase[] = [
  { name: "public health", method: "GET", path: "/health", status: 200, body: { status: "ok" } },
  { name: "health rejects POST", method: "POST", path: "/health", status: 405, allow: "GET" },
  { name: "health rejects HEAD", method: "HEAD", path: "/health", status: 405, allow: "GET" },
  { name: "health rejects OPTIONS", method: "OPTIONS", path: "/health", status: 405, allow: "GET" },
  { name: "markdown route accepts only POST and uses non-success placeholder", method: "POST", path: "/v1/html/markdown", status: 503 },
  { name: "text route accepts only POST and uses non-success placeholder", method: "POST", path: "/v1/html/text", status: 503 },
  { name: "markdown rejects GET", method: "GET", path: "/v1/html/markdown", status: 405, allow: "POST" },
  { name: "markdown rejects HEAD", method: "HEAD", path: "/v1/html/markdown", status: 405, allow: "POST" },
  { name: "markdown rejects OPTIONS", method: "OPTIONS", path: "/v1/html/markdown", status: 405, allow: "POST" },
  { name: "text rejects GET", method: "GET", path: "/v1/html/text", status: 405, allow: "POST" },
  { name: "wrong case is unknown", method: "GET", path: "/Health", status: 404 },
  { name: "health trailing slash is unknown", method: "GET", path: "/health/", status: 404 },
  { name: "conversion trailing slash is unknown", method: "POST", path: "/v1/html/markdown/", status: 404 },
  { name: "unknown path GET", method: "GET", path: "/unknown", status: 404 },
  { name: "unknown path POST", method: "POST", path: "/unknown", status: 404 },
];

async function call(
  method: string,
  path: string,
  headers?: HeadersInit,
): Promise<Response> {
  return exports.default.fetch(
    new Request(`https://example.test${path}`, { method, headers }),
  );
}

describe("US005 exact route and method matrix", () => {
  for (const routeCase of cases) {
    it(routeCase.name, async () => {
      const response = await call(routeCase.method, routeCase.path);

      expect(response.status).toBe(routeCase.status);
      for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        expect(response.headers.get(name)).toBe(value);
      }

      if (routeCase.allow) {
        expect(response.headers.get("allow")).toBe(routeCase.allow);
      } else {
        expect(response.headers.has("allow")).toBe(false);
      }

      if (routeCase.body !== undefined) {
        expect(await response.json()).toEqual(routeCase.body);
      }
    });
  }

  it("uses fixed 404 and 405 JSON envelopes", async () => {
    const missing = await call("GET", "/not-here");
    expect(await missing.json()).toEqual({
      error: { code: "not_found", message: "Resource not found." },
    });

    const wrongMethod = await call("OPTIONS", "/v1/html/text");
    expect(await wrongMethod.json()).toEqual({
      error: { code: "method_not_allowed", message: "Method not allowed." },
    });
  });

  it("keeps unknown paths at 404 even when a gateway-secret-looking header is present", async () => {
    const response = await call("POST", "/unknown", {
      "X-RapidAPI-Proxy-Secret": "synthetic-valid-looking-secret",
    });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "Resource not found." },
    });
  });

  it("does not fabricate conversion success before conversion integration", async () => {
    for (const path of ["/v1/html/markdown", "/v1/html/text"]) {
      const response = await call("POST", path);
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        error: {
          code: "service_unavailable",
          message: "Service configuration is unavailable.",
        },
      });
    }
  });

  it("ignores query parameters for routing and never echoes query values", async () => {
    const secretNeedle = "query-value-must-not-leak";
    const health = await call("GET", `/health?debug=${encodeURIComponent(secretNeedle)}`);
    expect(health.status).toBe(200);
    const healthBody = await health.text();
    expect(healthBody).toBe('{"status":"ok"}');
    expect(healthBody).not.toContain(secretNeedle);

    const missing = await call("GET", `/unknown?debug=${encodeURIComponent(secretNeedle)}`);
    expect(missing.status).toBe(404);
    const missingBody = await missing.text();
    expect(missingBody).not.toContain(secretNeedle);
  });
});
