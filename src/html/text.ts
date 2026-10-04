import type { CleanElement, CleanNode, CleanRoot } from "./clean";

const HTML_ASCII_WHITESPACE = /[\t\n\f\r ]+/g;

export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export function collapseHtmlAsciiWhitespace(value: string): string {
  return normalizeLineEndings(value).replace(HTML_ASCII_WHITESPACE, " ");
}

export function countUnicodeScalars(value: string): number {
  return Array.from(value).length;
}

function isProtectedElement(node: CleanNode): node is CleanElement {
  return node.kind === "element" && (node.name === "pre" || node.name === "code");
}

/**
 * Normalize text in the shared renderer tree without Unicode normalization.
 * HTML ASCII whitespace collapses only outside pre/code. Protected content
 * receives line-ending normalization only, preserving tabs and spaces.
 */
export function normalizeSharedText(root: CleanRoot): CleanRoot {
  const output: CleanRoot = { kind: "root", children: [] };
  type Frame = {
    source: { readonly children: CleanNode[] };
    target: { children: CleanNode[] };
    index: number;
    protectedText: boolean;
  };
  const stack: Frame[] = [{
    source: root,
    target: output,
    index: 0,
    protectedText: false,
  }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;
    if (frame.index >= frame.source.children.length) {
      stack.pop();
      continue;
    }

    const node = frame.source.children[frame.index++]!;
    if (node.kind === "text") {
      frame.target.children.push({
        kind: "text",
        value: frame.protectedText
          ? normalizeLineEndings(node.value)
          : collapseHtmlAsciiWhitespace(node.value),
      });
      continue;
    }

    const copy: CleanElement = {
      kind: "element",
      name: node.name,
      attributes: node.attributes,
      children: [],
    };
    frame.target.children.push(copy);
    stack.push({
      source: node,
      target: copy,
      index: 0,
      protectedText: frame.protectedText || isProtectedElement(node),
    });
  }

  return output;
}


const CLEAN_TEXT_BLOCK_ELEMENTS = new Set([
  "article", "aside", "blockquote", "details", "div", "footer", "header", "li", "main",
  "nav", "ol", "section", "summary", "table", "ul", "p",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "pre",
]);

function attribute(node: CleanElement, name: string): string | undefined {
  return node.attributes.find(([key]) => key === name)?.[1];
}

function protectedText(node: CleanNode): string {
  if (node.kind === "text") return node.value;
  if (node.name === "br") return "\n";
  return node.children.map(protectedText).join("");
}

function cleanInlineText(node: CleanNode): string {
  if (node.kind === "text") return node.value;
  if (node.name === "br") return "\n";
  if (node.name === "img") return attribute(node, "alt") ?? "";
  if (node.name === "pre" || node.name === "code") return protectedText(node);
  return node.children.map(cleanInlineText).join("");
}

function cellText(nodes: readonly CleanNode[]): string {
  const pieces: string[] = [];
  const stack: CleanNode[] = [...nodes].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "text") {
      pieces.push(node.value);
      continue;
    }
    if (node.name === "br") {
      pieces.push(" ");
      continue;
    }
    if (node.name === "img") {
      const alt = attribute(node, "alt");
      if (alt) pieces.push(alt);
      continue;
    }
    if (node.name === "table") {
      const nested = renderCleanTable(node).replace(/[\t\n]+/gu, " ").trim();
      if (nested) pieces.push(" " + nested + " ");
      continue;
    }
    if (node.name === "pre" || node.name === "code") {
      pieces.push(protectedText(node));
      continue;
    }
    const blockish = CLEAN_TEXT_BLOCK_ELEMENTS.has(node.name);
    if (blockish) pieces.push(" ");
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
    if (blockish) pieces.push(" ");
  }
  return pieces.join("").replace(/[\t\n\f\r ]+/gu, " ").trim();
}

function directTableRows(table: CleanElement): CleanElement[] {
  const rows: CleanElement[] = [];
  for (const child of table.children) {
    if (child.kind !== "element") continue;
    if (child.name === "tr") {
      rows.push(child);
      continue;
    }
    if (child.name === "thead" || child.name === "tbody" || child.name === "tfoot") {
      for (const sectionChild of child.children) {
        if (sectionChild.kind === "element" && sectionChild.name === "tr") rows.push(sectionChild);
      }
    }
  }
  return rows;
}

function renderCleanTable(table: CleanElement): string {
  const rows = directTableRows(table);
  if (rows.length === 0) return cellText(table.children);

  return rows.map((row) => {
    const cells = row.children.filter(
      (child): child is CleanElement =>
        child.kind === "element" && (child.name === "td" || child.name === "th"),
    );
    return cells.length > 0 ? cells.map((cell) => cellText(cell.children)).join("\t") : cellText(row.children);
  }).join("\n");
}

function renderList(list: CleanElement, depth = 0): string {
  const lines: string[] = [];
  const items = list.children.filter(
    (child): child is CleanElement => child.kind === "element" && child.name === "li",
  );

  for (const item of items) {
    const contentNodes = item.children.filter(
      (child) => !(child.kind === "element" && (child.name === "ul" || child.name === "ol")),
    );
    const content = cleanTextContainer(contentNodes);
    if (content) {
      for (const line of content.split("\n")) lines.push("  ".repeat(depth) + line);
    }
    for (const child of item.children) {
      if (child.kind === "element" && (child.name === "ul" || child.name === "ol")) {
        const nested = renderList(child, depth + 1);
        if (nested) lines.push(nested);
      }
    }
  }

  return lines.join("\n");
}

function edgeIsProtected(node: CleanNode, side: "start" | "end"): boolean {
  if (node.kind === "text") return false;
  if (node.name === "code" || node.name === "pre") return true;
  const ordered = side === "start" ? node.children : [...node.children].reverse();
  for (const child of ordered) {
    if (cleanInlineText(child).length === 0) continue;
    return edgeIsProtected(child, side);
  }
  return false;
}

function renderInlineBlock(children: readonly CleanNode[]): string {
  const rendered = children.map(cleanInlineText);
  let first = rendered.findIndex((value) => value.length > 0);
  if (first < 0) return "";
  let last = rendered.length - 1;
  while (last >= first && rendered[last]!.length === 0) last -= 1;

  if (!edgeIsProtected(children[first]!, "start")) rendered[first] = rendered[first]!.trimStart();
  if (!edgeIsProtected(children[last]!, "end")) rendered[last] = rendered[last]!.trimEnd();
  return rendered.slice(first, last + 1).join("");
}

function cleanTextBlock(node: CleanElement): string {
  if (node.name === "hr") return "";
  if (node.name === "pre") return protectedText(node);
  if (node.name === "ul" || node.name === "ol") return renderList(node);
  if (node.name === "table") return renderCleanTable(node);
  if (node.name === "blockquote" || node.name === "details") return cleanTextContainer(node.children);
  if (node.name === "summary") return renderInlineBlock(node.children);
  if (node.name === "li") return cleanTextContainer(node.children);

  if (node.name === "p" || /^h[1-6]$/u.test(node.name)) {
    return renderInlineBlock(node.children);
  }

  return cleanTextContainer(node.children);
}

function cleanTextContainer(children: readonly CleanNode[]): string {
  const parts: string[] = [];
  let inline = "";

  const flushInline = () => {
    const value = inline.trim();
    if (value) parts.push(value);
    inline = "";
  };

  for (const child of children) {
    if (child.kind === "element" && CLEAN_TEXT_BLOCK_ELEMENTS.has(child.name)) {
      flushInline();
      const rendered = cleanTextBlock(child);
      if (rendered) parts.push(rendered);
    } else {
      inline += cleanInlineText(child);
    }
  }
  flushInline();
  return parts.join("\n\n");
}

/**
 * Render V1 clean text directly from the shared normalized tree.
 *
 * This path deliberately does not render Markdown first and strip syntax.
 * Literal user punctuation is data and therefore survives unchanged.
 */
export function renderCleanText(root: CleanRoot): string {
  return cleanTextContainer(root.children);
}
