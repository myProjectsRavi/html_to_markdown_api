import { describe, expect, it, vi } from "vitest";
import { LIMITS } from "../src/config";
import { classifyTarget, type TargetReason, type TargetUse } from "../src/markdown/url";

type Fixture = readonly [string, TargetUse, boolean, TargetReason];

const cases: readonly Fixture[] = [
  ["https://example.com", "link", true, "ok_https"],
  ["HTTPS://example.com/a", "link", true, "ok_https"],
  ["https://example.com/a?b=c#d", "link", true, "ok_https"],
  ["https://example.com/a b", "link", true, "ok_https"],
  ["https://xn--bcher-kva.example/", "link", true, "ok_https"],
  ["https://[::1]/", "link", true, "ok_https"],
  ["http://example.com", "link", true, "ok_http"],
  ["HTTP://example.com:8080/a", "link", true, "ok_http"],
  ["mailto:user@example.com", "link", true, "ok_mailto"],
  ["MAILTO:user+tag@example.com?subject=x", "link", true, "ok_mailto"],
  ["#section", "link", true, "ok_fragment"],
  ["#", "link", true, "ok_fragment"],
  ["?q=x", "link", true, "ok_query"],
  ["?", "link", true, "ok_query"],
  ["/docs/page", "link", true, "ok_relative"],
  ["/a:b", "link", true, "ok_relative"],
  ["./docs/page", "link", true, "ok_relative"],
  ["../docs/page", "link", true, "ok_relative"],
  ["docs/page", "link", true, "ok_relative"],
  ["docs/a%3Ab.html", "link", true, "ok_relative"],
  ["a/b:c", "link", true, "ok_relative"],
  ["image.png", "image", true, "ok_relative"],
  ["/images/a.png", "image", true, "ok_relative"],
  ["https://example.com/a.png", "image", true, "ok_https"],
  ["http://example.com/a.png", "image", true, "ok_http"],
  ["", "link", false, "empty"],
  [" ", "link", false, "boundary_whitespace"],
  [" https://example.com", "link", false, "boundary_whitespace"],
  ["https://example.com ", "link", false, "boundary_whitespace"],
  ["\t/docs", "link", false, "boundary_whitespace"],
  ["java\nscript:alert(1)", "link", false, "control_character"],
  ["https://example.com/\u0000x", "link", false, "control_character"],
  ["C:\\temp\\x", "link", false, "backslash"],
  ["https://example.com\\evil", "link", false, "backslash"],
  ["//example.com/x", "link", false, "network_path"],
  ["///example.com/x", "link", false, "network_path"],
  ["javascript:alert(1)", "link", false, "unsafe_scheme"],
  ["JaVaScRiPt:alert(1)", "link", false, "unsafe_scheme"],
  ["data:text/html,x", "link", false, "unsafe_scheme"],
  ["vbscript:msgbox(1)", "link", false, "unsafe_scheme"],
  ["file:///etc/passwd", "link", false, "unsafe_scheme"],
  ["ftp://example.com/x", "link", false, "unsafe_scheme"],
  ["blob:https://example.com/id", "link", false, "unsafe_scheme"],
  ["tel:+15551212", "link", false, "unsafe_scheme"],
  ["custom:thing", "link", false, "unsafe_scheme"],
  ["C:/windows", "link", false, "unsafe_scheme"],
  ["javascript%3Aalert(1)", "link", false, "encoded_scheme"],
  ["java%73cript:alert(1)", "link", false, "encoded_scheme"],
  ["%6Aavascript:alert(1)", "link", false, "encoded_scheme"],
  ["https%3A//example.com", "link", false, "encoded_scheme"],
  ["foo%3Abar", "link", false, "encoded_scheme"],
  ["java%0Ascript:alert(1)", "link", false, "encoded_control"],
  ["java%09script:alert(1)", "link", false, "encoded_control"],
  ["foo%5Cbar", "link", false, "encoded_backslash"],
  ["%2F%2Fevil.example", "link", false, "encoded_network_path"],
  ["%2f%2fevil.example/x", "link", false, "encoded_network_path"],
  ["http:example.com", "link", false, "invalid_http"],
  ["https:/example.com", "link", false, "invalid_http"],
  ["https:example.com", "link", false, "invalid_http"],
  ["https://", "link", false, "invalid_http"],
  ["https://user@example.com", "link", false, "http_credentials"],
  ["http://user:pass@example.com", "link", false, "http_credentials"],
  ["mailto:", "link", false, "invalid_mailto"],
  ["mailto://user@example.com", "link", false, "invalid_mailto"],
  ["mailto:user name@example.com", "link", false, "invalid_mailto"],
  ["mailto:user@example.com", "image", false, "image_mailto"],
  ["MAILTO:user@example.com", "image", false, "image_mailto"],
  ["#sprite", "image", false, "image_fragment"],
  ["?image=1", "image", false, "image_query"],
  ["javascript:alert(1)", "image", false, "unsafe_scheme"],
  ["data:image/png;base64,AAAA", "image", false, "unsafe_scheme"],
  ["vbscript:x", "image", false, "unsafe_scheme"],
  ["file:///tmp/x.png", "image", false, "unsafe_scheme"],
  ["//cdn.example.com/x.png", "image", false, "network_path"],
] as const;

describe("US019 URL target classifier", () => {
  it("keeps a literal table of at least 60 reason-coded fixtures", () => {
    expect(cases.length).toBeGreaterThanOrEqual(60);
    for (const [target, use, safe, reason] of cases) {
      expect(classifyTarget(target, use)).toEqual({ safe, reason });
    }
  });

  it("enforces the 2048-byte target limit exactly", () => {
    const exact = "a".repeat(LIMITS.urlBytes);
    expect(classifyTarget(exact)).toEqual({ safe: true, reason: "ok_relative" });
    expect(classifyTarget(exact + "a")).toEqual({ safe: false, reason: "too_long" });
    const multibyte = "😀".repeat(Math.floor(LIMITS.urlBytes / 4));
    expect(classifyTarget(multibyte)).toEqual({ safe: true, reason: "ok_relative" });
    expect(classifyTarget(multibyte + "a")).toEqual({ safe: false, reason: "too_long" });
  });

  it("handles long percent sequences in one bounded pass", () => {
    const target = "path/" + "%41".repeat(600);
    expect(new TextEncoder().encode(target).byteLength).toBeLessThanOrEqual(LIMITS.urlBytes);
    expect(classifyTarget(target)).toEqual({ safe: true, reason: "ok_relative" });
  });

  it("does not repeatedly decode percent escapes", () => {
    expect(classifyTarget("javascript%253Aalert(1)"))
      .toEqual({ safe: true, reason: "ok_relative" });
  });

  it("never performs network access", () => {
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("egress trap"));
    for (const [target, use] of cases) classifyTarget(target, use);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
