import { LIMITS } from "../config";
import type { CleanElement, CleanNode } from "../html/clean";

export type MarkdownTableLimitName = "rows" | "columns" | "cells";

export class MarkdownTableLimitError extends Error {
  readonly code = "input_too_complex" as const;

  constructor(readonly limit: MarkdownTableLimitName) {
    super("Table exceeds the supported complexity limit.");
    this.name = "MarkdownTableLimitError";
  }
}

const SECTION_NAMES = new Set(["thead", "tbody", "tfoot"]);
const BLOCKISH_CELL_ELEMENTS = new Set([
  "article", "aside", "blockquote", "details", "div", "footer", "header", "li",
  "main", "nav", "ol", "p", "pre", "section", "summary", "ul",
  "h1", "h2", "h3", "h4", "h5", "h6",
]);

function attribute(node: CleanElement, name: string): string | undefined {
  return node.attributes.find(([key]) => key === name)?.[1];
}

function isWhitespaceText(node: CleanNode): boolean {
  return node.kind === "text" && /^[\t\n\f\r ]*$/u.test(node.value);
}

function collectRows(table: CleanElement): CleanElement[] | null {
  const rows: CleanElement[] = [];

  for (const child of table.children) {
    if (isWhitespaceText(child)) continue;
    if (child.kind !== "element") return null;

    if (child.name === "tr") {
      rows.push(child);
      continue;
    }

    if (!SECTION_NAMES.has(child.name)) return null;
    for (const sectionChild of child.children) {
      if (isWhitespaceText(sectionChild)) continue;
      if (sectionChild.kind !== "element" || sectionChild.name !== "tr") return null;
      rows.push(sectionChild);
    }
  }

  return rows;
}

function collectCells(row: CleanElement): CleanElement[] | null {
  const cells: CleanElement[] = [];
  for (const child of row.children) {
    if (isWhitespaceText(child)) continue;
    if (child.kind !== "element" || (child.name !== "td" && child.name !== "th")) return null;
    cells.push(child);
  }
  return cells;
}

function hasEffectiveSpan(cell: CleanElement): boolean {
  for (const name of ["colspan", "rowspan"] as const) {
    const value = attribute(cell, name);
    if (value !== undefined && value.trim() !== "1") return true;
  }
  return false;
}

function containsNestedTable(cell: CleanElement): boolean {
  const stack: CleanNode[] = [...cell.children].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "text") continue;
    if (node.name === "table") return true;
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
  }
  return false;
}

function flattenCellText(cell: CleanElement): string {
  const output: string[] = [];
  const stack: CleanNode[] = [...cell.children].reverse();

  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "text") {
      output.push(node.value);
      continue;
    }

    if (node.name === "br") {
      output.push(" ");
      continue;
    }

    if (node.name === "img") {
      const alt = attribute(node, "alt");
      if (alt) output.push(alt);
      continue;
    }

    if (BLOCKISH_CELL_ELEMENTS.has(node.name)) output.push(" ");
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
  }

  return output.join("").replace(/[\t\n\f\r ]+/gu, " ").trim();
}

function escapeCell(value: string): string {
  return value
    .replace(/\\/gu, "\\\\")
    .replace(/\|/gu, "\\|");
}

function rowMarkdown(cells: readonly string[]): string {
  return `| ${cells.join(" | ")} |`;
}

/**
 * Render only the US022 simple rectangular-table subset.
 * Unsupported/complex shape returns null so US023 can own the fallback policy.
 */
export function renderSimpleGfmTable(table: CleanElement): string | null {
  const rows = collectRows(table);
  if (!rows || rows.length === 0) return null;
  if (rows.length > LIMITS.tableRows) throw new MarkdownTableLimitError("rows");

  const cellRows: CleanElement[][] = [];
  let totalCells = 0;
  let width: number | null = null;

  for (const row of rows) {
    const cells = collectCells(row);
    if (!cells || cells.length === 0) return null;

    totalCells += cells.length;
    if (totalCells > LIMITS.tableCellsPerTable) throw new MarkdownTableLimitError("cells");
    if (cells.length > LIMITS.tableCellsPerRow) throw new MarkdownTableLimitError("columns");

    if (width === null) width = cells.length;
    else if (cells.length !== width) return null;

    for (const cell of cells) {
      if (hasEffectiveSpan(cell) || containsNestedTable(cell)) return null;
    }
    cellRows.push(cells);
  }

  if (width === null || width === 0) return null;

  const renderedRows = cellRows.map((cells) =>
    cells.map((cell) => escapeCell(flattenCellText(cell))),
  );
  const firstIsHeader = cellRows[0]!.every((cell) => cell.name === "th");
  const header = firstIsHeader ? renderedRows[0]! : Array<string>(width).fill("");
  const dataRows = firstIsHeader ? renderedRows.slice(1) : renderedRows;
  const separator = Array<string>(width).fill("---");

  return [
    rowMarkdown(header),
    rowMarkdown(separator),
    ...dataRows.map(rowMarkdown),
  ].join("\n");
}
