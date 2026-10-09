import { afterEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "../src/config";
import { createWorker } from "../src/index";

const SECRET = "synthetic-observability-secret-036";
const ENV = { RAPIDAPI_PROXY_SECRET: SECRET } as const;
const METHODS = ["log", "info", "warn", "error"] as const;

function consoleSpies(throwOnCall = false) {
  return METHODS.map((method) =>
    vi.spyOn(console, method).mockImplementation((..._args: unknown[]) => {
      if (throwOnCall) throw new Error("OBSERVABILITY_LOGGER_FAILURE_CANARY_036");
    }),
  );
}

async function call(path: string, body: string, worker = createWorker()): Promise<Response> {
  return worker.fetch(
    new Request("https://example.test" + path, {
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

describe("US036 privacy-safe operational visibility", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not emit input, output, secret or query canaries to application console", async () => {
    const inputCanary = "OBS_INPUT_CANARY_036";
    const queryCanary = "OBS_QUERY_CANARY_036";
    const spies = consoleSpies();

    const response = await call(
      ENDPOINTS.markdown + "?trace=" + queryCanary,
      JSON.stringify({ html: "<p>" + inputCanary + "</p>" }),
    );
    expect(response.status).toBe(200);
    const payload = await response.text();
    expect(payload).toContain(inputCanary);

    const logText = spies.flatMap((spy) => spy.mock.calls).flat().map(String).join("\n");
    expect(logText).toBe("");
    expect(logText).not.toContain(inputCanary);
    expect(logText).not.toContain(queryCanary);
    expect(logText).not.toContain(SECRET);
    expect(logText).not.toContain(payload);
  });

  it("keeps validation failures silent and fixed", async () => {
    const spies = consoleSpies();
    const response = await call(
      ENDPOINTS.text + "?personal=OBS_PII_QUERY_036",
      JSON.stringify({ html: null, extra: "OBS_PRIVATE_036" }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "invalid_request",
        message: "Request does not match the supported schema.",
      },
    });
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });

  it("contains injected internal errors without logging the exception canary", async () => {
    const errorCanary = "OBS_INTERNAL_EXCEPTION_036";
    const spies = consoleSpies();
    const worker = createWorker({
      convert: () => {
        throw new Error(errorCanary);
      },
    });

    const response = await call(
      ENDPOINTS.markdown,
      JSON.stringify({ html: "<p>safe synthetic input</p>" }),
      worker,
    );
    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toBe('{"error":{"code":"internal_error","message":"An internal error occurred."}}');
    expect(body).not.toContain(errorCanary);
    expect(spies.flatMap((spy) => spy.mock.calls).flat().map(String).join("\n")).not.toContain(errorCanary);
  });

  it("conversion cannot fail because a console logger is broken when no logger is invoked", async () => {
    const spies = consoleSpies(true);
    const response = await call(
      ENDPOINTS.text,
      JSON.stringify({ html: "<p>synthetic</p>" }),
    );
    expect(response.status).toBe(200);
    expect(spies.every((spy) => spy.mock.calls.length === 0)).toBe(true);
  });
});
