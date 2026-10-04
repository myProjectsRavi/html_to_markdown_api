import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText, renderCleanText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";

const tree = (html: string) => normalizeSharedText(cleanParsedTree(parseHtml(html)));
const render = (html: string) => renderCleanText(tree(html));

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

describe("US026 structured clean text", () => {
  it("renders nested lists with two-space indentation and no generated bullets", () => {
    expect(render("<ul><li>A<ul><li>B<ol><li>C</li></ol></li></ul></li><li>D</li></ul>"))
      .toBe("A\n  B\n    C\nD");
  });

  it("keeps visible link text only and meaningful image alt text", () => {
    expect(render('<p><a href="javascript:bad">Unsafe link</a> <a href="/ok">Safe link</a> <img src="https://example.com/x.png" alt="Diagram"></p>'))
      .toBe("Unsafe link Safe link Diagram");
  });

  it("preserves protected pre and code whitespace", () => {
    expect(render("<pre>  alpha\t beta\r\n gamma </pre><p><code>  x\t y  </code></p>"))
      .toBe("  alpha\t beta\n gamma \n\n  x\t y");
  });

  it("uses tab-delimited cells and LF rows while normalizing cell separators", () => {
    expect(render("<table><tr><td>A\tB<br>C</td><td>D\nE</td></tr><tr><td>F</td><td>G</td></tr></table>"))
      .toBe("A B C\tD E\nF\tG");
  });

  it("preserves span fallback and nested-table visible tokens exactly once", () => {
    const value = render('<table><tr><td colspan="2">OUTER_A<table><tr><td>INNER_B</td><td>INNER_C</td></tr></table>OUTER_D</td><td>TAIL_E</td></tr></table>');
    expect(value).toBe("OUTER_A INNER_B INNER_C OUTER_D\tTAIL_E");
    for (const canary of ["OUTER_A", "INNER_B", "INNER_C", "OUTER_D", "TAIL_E"]) {
      expect(occurrences(value, canary)).toBe(1);
    }
  });

  it("includes quotes and details content in source order without invented labels", () => {
    expect(render("<blockquote><p>Quote</p><details><summary>Summary</summary><p>Body</p></details><p>After</p></blockquote>"))
      .toBe("Quote\n\nSummary\n\nBody\n\nAfter");
  });

  it("drops the same prohibited subtrees in both renderers", () => {
    const normalized = tree("<p>Before</p><script>DROP_SCRIPT</script><style>DROP_STYLE</style><p>After</p>");
    const text = renderCleanText(normalized);
    const markdown = renderMarkdownBlocks(normalized);
    for (const canary of ["DROP_SCRIPT", "DROP_STYLE"]) {
      expect(text).not.toContain(canary);
      expect(markdown).not.toContain(canary);
    }
    expect(text).toBe("Before\n\nAfter");
  });
});
