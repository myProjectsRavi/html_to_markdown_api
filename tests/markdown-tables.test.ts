import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/config";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";
import { MarkdownTableLimitError } from "../src/markdown/table";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function splitGfmRow(line: string): string[] {
  const trimmed = line.trim();
  expect(trimmed.startsWith("|")).toBe(true);
  expect(trimmed.endsWith("|")).toBe(true);

  const cells: string[] = [];
  let current = "";
  let escaped = false;
  for (const ch of trimmed.slice(1, -1)) {
    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }
    if (ch === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function renderGfmStructure(markdown: string): { columns: number; dataRows: number } {
  const lines = markdown.split("\n");
  expect(lines.length).toBeGreaterThanOrEqual(2);
  const header = splitGfmRow(lines[0]!);
  const separator = splitGfmRow(lines[1]!);
  expect(separator).toHaveLength(header.length);
  for (const cell of separator) expect(cell).toBe("---");

  const data = lines.slice(2).map(splitGfmRow);
  for (const row of data) expect(row).toHaveLength(header.length);
  return { columns: header.length, dataRows: data.length };
}

describe("US022 simple rectangular tables", () => {
  it("uses an all-th first row as the GFM header", () => {
    const md = render("<table><tr><th>Name</th><th>Age</th></tr><tr><td>A</td><td>1</td></tr></table>");
    expect(md).toBe("| Name | Age |\n| --- | --- |\n| A | 1 |");
    expect(renderGfmStructure(md)).toEqual({ columns: 2, dataRows: 1 });
  });

  it("inserts empty headers and retains every headerless data row", () => {
    const md = render("<table><tr><td>A</td><td>1</td></tr><tr><td>B</td><td>2</td></tr></table>");
    expect(md).toBe("|  |  |\n| --- | --- |\n| A | 1 |\n| B | 2 |");
    expect(renderGfmStructure(md)).toEqual({ columns: 2, dataRows: 2 });
  });

  it("preserves empty cells and a one-cell table", () => {
    const md = render("<table><tr><td></td></tr></table>");
    expect(md).toBe("|  |\n| --- |\n|  |");
    expect(renderGfmStructure(md)).toEqual({ columns: 1, dataRows: 1 });
  });

  it("collects thead, tbody and tfoot rows in source order", () => {
    const md = render("<table><thead><tr><th>K</th></tr></thead><tbody><tr><td>Body</td></tr></tbody><tfoot><tr><td>Foot</td></tr></tfoot></table>");
    expect(md).toBe("| K |\n| --- |\n| Body |\n| Foot |");
    expect(renderGfmStructure(md)).toEqual({ columns: 1, dataRows: 2 });
  });

  it("escapes embedded pipes and preserves Unicode", () => {
    const md = render("<table><tr><td>తెలుగు | A</td><td>مرحبا</td></tr></table>");
    expect(md).toBe("|  |  |\n| --- | --- |\n| తెలుగు \\| A | مرحبا |");
    expect(renderGfmStructure(md)).toEqual({ columns: 2, dataRows: 1 });
  });

  it("flattens ignored inline formatting without dropping cell text", () => {
    expect(render("<table><tr><td><strong>A</strong><em>B</em><span>C</span></td></tr></table>"))
      .toBe("|  |\n| --- |\n| ABC |");
  });

  it("accepts the exact row and total-cell boundaries", () => {
    // Empty cells keep this fixture below the earlier parser retained-node
    // ceiling while still exercising all 6,400 table cells.
    const cellRow = "<tr>" + "<td></td>".repeat(LIMITS.tableCellsPerRow) + "</tr>";
    const html = "<table>" + cellRow.repeat(LIMITS.tableRows) + "</table>";
    const md = render(html);
    expect(renderGfmStructure(md)).toEqual({
      columns: LIMITS.tableCellsPerRow,
      dataRows: LIMITS.tableRows,
    });
  });

  it("rejects one row and one column beyond their limits", () => {
    const tooManyRows = "<table>" + "<tr><td>x</td></tr>".repeat(LIMITS.tableRows + 1) + "</table>";
    expect(() => render(tooManyRows)).toThrow(MarkdownTableLimitError);

    const tooManyColumns = "<table><tr>" + "<td>x</td>".repeat(LIMITS.tableCellsPerRow + 1) + "</tr></table>";
    expect(() => render(tooManyColumns)).toThrow(MarkdownTableLimitError);
  });

  it("rejects one cell beyond the total-cell limit", () => {
    const fullRow = "<tr>" + "<td></td>".repeat(LIMITS.tableCellsPerRow) + "</tr>";
    const lastRow = "<tr>" + "<td></td>".repeat(LIMITS.tableCellsPerRow + 1) + "</tr>";
    const html = "<table>" + fullRow.repeat(LIMITS.tableRows - 1) + lastRow + "</table>";
    expect(() => render(html)).toThrowError(
      expect.objectContaining({ name: "MarkdownTableLimitError", limit: "cells" }),
    );
  });
});
