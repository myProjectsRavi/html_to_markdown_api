import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/config";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";
import { MarkdownTableLimitError } from "../src/markdown/table";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function occurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

describe("US023 complex table fallback", () => {
  it("uses documented cell and row separators for effective spans", () => {
    expect(render("<table><tr><td colspan=\"2\">A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>"))
      .toBe("A | B\nC | D");
  });

  it("keeps uneven rows readable without inventing cells", () => {
    expect(render("<table><tr><td>A</td><td>B</td></tr><tr><td>C</td></tr></table>"))
      .toBe("A | B\nC");
  });

  it("preserves nested blocks and nested-table canaries exactly once", () => {
    const md = render("<table><tr><td><p>OUTER_A</p><table><tr><td>INNER_B</td><td>INNER_C</td></tr></table><div>OUTER_D</div></td><td>TAIL_E</td></tr></table>");
    expect(md).toBe("OUTER_A / INNER_B / INNER_C / OUTER_D | TAIL_E");
    for (const canary of ["OUTER_A", "INNER_B", "INNER_C", "OUTER_D", "TAIL_E"]) {
      expect(occurrences(md, canary)).toBe(1);
    }
  });

  it("keeps a complex table boundary before following text", () => {
    expect(render("<table><tr><td rowspan=\"2\">A</td><td>B</td></tr><tr><td>C</td></tr></table><p>After</p>"))
      .toBe("A | B\nC\n\nAfter");
  });

  it("follows parser recovery for malformed closing tags without throwing", () => {
    const md = render("<table><tr><td>A<td>B</tr></table><p>After</p>");
    expect(md).toContain("A");
    expect(md).toContain("B");
    expect(md.endsWith("After")).toBe(true);
  });

  it("does not replace huge table dimensions with unbounded fallback", () => {
    const tooManyRows = "<table>" + "<tr><td></td></tr>".repeat(LIMITS.tableRows + 1) + "</table>";
    expect(() => render(tooManyRows)).toThrowError(
      expect.objectContaining({ name: "MarkdownTableLimitError", limit: "rows" }),
    );

    const tooManyColumns = "<table><tr>" + "<td></td>".repeat(LIMITS.tableCellsPerRow + 1) + "</tr></table>";
    expect(() => render(tooManyColumns)).toThrowError(
      expect.objectContaining({ name: "MarkdownTableLimitError", limit: "columns" }),
    );
  });

  it("keeps literal pipes distinguishable from fallback separators", () => {
    expect(render("<table><tr><td colspan=\"2\">A | B</td><td>C</td></tr></table>"))
      .toBe("A \\| B | C");
  });
});
