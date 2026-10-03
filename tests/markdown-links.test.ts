import { describe, expect, it } from "vitest";
import type { CleanRoot } from "../src/html/clean";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";
import { serializeLinkDestination, serializeLinkLabel } from "../src/markdown/link";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function targetOf(markdown: string): string {
  const marker = "](<";
  const start = markdown.indexOf(marker);
  expect(start).toBeGreaterThan(0);
  const end = markdown.indexOf(">)", start + marker.length);
  expect(end).toBeGreaterThan(start);
  const encoded = markdown.slice(start + marker.length, end);
  return decodeURIComponent(encoded);
}

describe("US020 Markdown link serialization", () => {
  it("serializes accepted absolute and relative targets", () => {
    expect(render('<p><a href="https://example.com/a">Example</a></p>'))
      .toBe("[Example](<https://example.com/a>)");
    expect(render('<p><a href="../a?q=1#frag">Relative</a></p>'))
      .toBe("[Relative](<../a?q=1#frag>)");
    expect(render('<p><a href="#part">Fragment</a> <a href="?q=1">Query</a></p>'))
      .toBe("[Fragment](<#part>) [Query](<?q=1>)");
  });

  it("encodes dangerous destination delimiters into exactly one intended link", () => {
    const md = render('<p><a href="/a b(c)&quot;&lt;x&gt;">X</a></p>');
    expect(md).toBe("[X](</a%20b%28c%29%22%3Cx%3E>)");
    expect((md.match(/\]\(</gu) ?? [])).toHaveLength(1);
    expect(targetOf(md)).toBe('/a b(c)"<x>');
  });

  it("preserves valid percent triplets and encodes stray percent signs", () => {
    expect(serializeLinkDestination("/a%20b%2f")).toBe("/a%20b%2f");
    expect(serializeLinkDestination("/bad%zz")).toBe("/bad%25zz");
  });

  it("keeps label brackets and backslashes contained", () => {
    const md = render('<p><a href="/x">a]b\\c</a></p>');
    expect(md).toBe("[a\\]b\\\\c](</x>)");
    expect((md.match(/\]\(</gu) ?? [])).toHaveLength(1);
  });

  it("preserves visible text while dropping unsafe destinations", () => {
    expect(render('<p><a href="javascript:alert(1)">click</a></p>')).toBe("click");
    expect(render('<p><a href="java%0Ascript:alert(1)">encoded</a></p>')).toBe("encoded");
  });

  it("keeps Markdown image-looking label text inert inside the link label", () => {
    const md = render('<p><a href="/safe">![alt](javascript:bad)</a></p>');
    expect(md).toBe("[!\\[alt\\](javascript:bad)](</safe>)");
    expect((md.match(/!\[/gu) ?? [])).toHaveLength(0);
    expect(targetOf(md)).toBe("/safe");
  });

  it("ignores title attributes", () => {
    expect(render('<p><a href="/x" title="not emitted">x</a></p>')).toBe("[x](</x>)");
  });

  it("flattens inner actionable links in the shared tree", () => {
    const root: CleanRoot = {
      kind: "root",
      children: [{
        kind: "element",
        name: "p",
        attributes: [],
        children: [{
          kind: "element",
          name: "a",
          attributes: [["href", "/outer"]],
          children: [
            { kind: "text", value: "outer " },
            {
              kind: "element",
              name: "a",
              attributes: [["href", "/inner"]],
              children: [{ kind: "text", value: "inner" }],
            },
          ],
        }],
      }],
    };
    const md = renderMarkdownBlocks(root);
    expect(md).toBe("[outer inner](</outer>)");
    expect((md.match(/\]\(</gu) ?? [])).toHaveLength(1);
  });

  it("keeps label serialization idempotent for existing renderer escapes", () => {
    expect(serializeLinkLabel(String.raw`a\]b\\c`)).toBe(String.raw`a\]b\\c`);
  });
});
