import { describe, expect, it, vi } from "vitest";
import { LIMITS } from "../src/config";
import type { CleanRoot } from "../src/html/clean";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { MarkdownOutputLimitError, renderMarkdownBlocks } from "../src/markdown/blocks";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function parseSingleImage(markdown: string): { alt: string; destination: string } {
  expect(markdown.startsWith("![")).toBe(true);
  const marker = "](<";
  const split = markdown.indexOf(marker);
  expect(split).toBeGreaterThanOrEqual(2);
  expect(markdown.endsWith(">)")).toBe(true);
  const escapedAlt = markdown.slice(2, split);
  const encodedDestination = markdown.slice(split + marker.length, -2);
  const alt = escapedAlt
    .replace(/\\([\[\]<>\\])/gu, "$1");
  return { alt, destination: decodeURIComponent(encodedDestination) };
}

function imageRoot(alt: string, src: string): CleanRoot {
  return {
    kind: "root",
    children: [{
      kind: "element",
      name: "img",
      attributes: [["alt", alt], ["src", src]],
      children: [],
    }],
  };
}

describe("US021 image rendering", () => {
  it("emits safe absolute and relative image references", () => {
    const absolute = render('<p><img src="https://example.com/a.png" alt="A"></p>');
    expect(absolute).toBe("![A](<https://example.com/a.png>)");
    expect(parseSingleImage(absolute)).toEqual({ alt: "A", destination: "https://example.com/a.png" });

    const relative = render('<p><img src="../images/a b.png" alt="Relative"></p>');
    expect(relative).toBe("![Relative](<../images/a%20b.png>)");
    expect(parseSingleImage(relative)).toEqual({ alt: "Relative", destination: "../images/a b.png" });
  });

  it("emits a safe image even with empty alt text", () => {
    const md = render('<img src="/images/a.png" alt="">');
    expect(md).toBe("![](<\/images/a.png>)".replace("\/", "/"));
    expect(parseSingleImage(md)).toEqual({ alt: "", destination: "/images/a.png" });
  });

  it("escapes brackets, backslashes and angle syntax in alt text", () => {
    const md = render('<img src="/x.png" alt="a]b\\c &lt;x&gt;">');
    expect(md).toBe("![a\\]b\\\\c \\<x\\>](</x.png>)");
    expect(parseSingleImage(md)).toEqual({ alt: "a]b\\c <x>", destination: "/x.png" });
  });

  it("drops unsafe or image-disallowed destinations but preserves meaningful alt", () => {
    expect(render('<p><img src="javascript:alert(1)" alt="Unsafe"></p>')).toBe("Unsafe");
    expect(render('<p><img src="data:image/png;base64,AAAA" alt="Data"></p>')).toBe("Data");
    expect(render('<p><img src="#sprite" alt="Fragment"></p>')).toBe("Fragment");
    expect(render('<p><img src="?asset=1" alt="Query"></p>')).toBe("Query");
    expect(render('<p><img src="mailto:a@example.com" alt="Mail"></p>')).toBe("Mail");
  });

  it("emits nothing when an unsafe or missing source has no meaningful alt", () => {
    expect(render('<p>before<img src="javascript:x" alt="">after</p>')).toBe("beforeafter");
    expect(render('<p>before<img alt="">after</p>')).toBe("beforeafter");
  });

  it("ignores title, dimensions, style, events and srcset", () => {
    const md = render('<img src="/safe.png" alt="A" title="ignored" width="200" height="100" style="x" onerror="boom()" srcset="https://evil.example/x 2x">');
    expect(md).toBe("![A](</safe.png>)");
  });

  it("performs no fetch for src or srcset candidates", () => {
    const spy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("egress trap"));
    expect(render('<p><img src="https://example.com/a.png" srcset="https://example.com/b.png 2x" alt="A"></p>'))
      .toBe("![A](<https://example.com/a.png>)");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("applies output budgeting after alt and destination expansion", () => {
    const fixedScalars = Array.from("![](<\/x>)".replace("\/", "/")).length;
    const exactAlt = "a".repeat(LIMITS.outputScalars - fixedScalars);
    const exact = renderMarkdownBlocks(imageRoot(exactAlt, "/x"));
    expect(Array.from(exact)).toHaveLength(LIMITS.outputScalars);

    const tooLarge = "a".repeat(LIMITS.outputScalars - fixedScalars + 1);
    expect(() => renderMarkdownBlocks(imageRoot(tooLarge, "/x"))).toThrow(MarkdownOutputLimitError);
  });

  it("never converts an invalid image source into an active link", () => {
    const md = render('<p><img src="javascript:bad" alt="[click](https://evil.example)"></p>');
    expect(md).toBe("\\[click\\](https://evil.example)");
    expect(md.startsWith("[")).toBe(false);
  });
});
