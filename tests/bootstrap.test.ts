import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("US002 Worker bootstrap", () => {
  it("executes the module Worker inside workerd", async () => {
    const response = await exports.default.fetch(
      new Request("https://example.test/bootstrap"),
    );

    expect(response.status).toBe(501);
    expect(await response.json()).toEqual({
      error: {
        code: "not_implemented",
        message: "Conversion routes are not implemented yet.",
      },
    });
  });
});
