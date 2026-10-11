import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Worker bootstrap", () => {
  it("executes the module Worker inside workerd", async () => {
    const response = await exports.default.fetch(
      new Request("https://example.test/health"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
