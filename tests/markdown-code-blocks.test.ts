import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/config";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { MarkdownOutputLimitError, renderMarkdownBlocks } from "../src/markdown/blocks";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function parseFence(markdown: string): { language: string; text: string; fenceLength: number } {
  const lines = markdown.split("\n");
  const opening = lines.shift() ?? "";
  const openMatch = opening.match(/^(`{3,})(.*)$/u);
  expect(openMatch).not.toBeNull();
  const fence = openMatch![1]!;
  const language = openMatch![2]!;
  expect(lines.pop()).toBe(fence);
  const text = lines.length === 0 ? "" : lines.join("\n") + "\n";
  return { language, text, fenceLength: fence.length };
}

describe("US018 fenced preformatted blocks", () => {
  it("serializes no-final-newline content with one synthetic separator", () => {
    const md = render("<pre><code class=\"language-ts\">const x = 1;</code></pre>");
    expect(md).toBe("```ts\nconst x = 1;\n```");
    expect(parseFence(md)).toEqual({ language: "ts", text: "const x = 1;\n", fenceLength: 3 });
  });

  it("normalizes CRLF while preserving tabs", () => {
    const md = render("<pre>\talpha\r\n\tbeta\r\n</pre>");
    expect(parseFence(md).text).toBe("\talpha\n\tbeta\n");
  });

  it("preserves blank first and last lines", () => {
    const md = render("<pre>\nalpha\n\n</pre>");
    expect(parseFence(md).text).toBe("\nalpha\n\n");
  });

  it("chooses a fence longer than embedded triple backticks", () => {
    const md = render("<pre>a```b</pre>");
    expect(md.startsWith("````\n")).toBe(true);
    expect(parseFence(md)).toEqual({ language: "", text: "a```b\n", fenceLength: 4 });
  });

  it("accepts only the approved child-code language class pattern", () => {
    expect(parseFence(render("<pre><code class=\"language-c++\">x</code></pre>")).language).toBe("c++");
    expect(parseFence(render("<pre><code class=\"language-js evil\">x</code></pre>")).language).toBe("");
    expect(parseFence(render("<pre><code class=\"lang-js\">x</code></pre>")).language).toBe("");
  });

  it("composes fenced blocks inside lists and quotes", () => {
    expect(render("<ul><li><pre>x\n</pre></li></ul>")).toBe("- ```\n  x\n  ```");
    expect(render("<blockquote><pre>x\n</pre></blockquote>")).toBe("> ```\n> x\n> ```");
  });

  it("keeps empty fenced blocks canonical", () => {
    const md = render("<pre></pre>");
    expect(md).toBe("```\n```");
    expect(parseFence(md).text).toBe("");
  });

  it("enforces the configured output scalar boundary before fence allocation", () => {
    const exactTicks = Math.floor((LIMITS.outputScalars - 4) / 3);
    const exact = render(`<pre>${"`".repeat(exactTicks)}</pre>`);
    expect(Array.from(exact)).toHaveLength(LIMITS.outputScalars);
    expect(() => render(`<pre>${"`".repeat(exactTicks + 1)}</pre>`))
      .toThrow(MarkdownOutputLimitError);
  });
});
