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
  "article", "aside", "div", "footer", "header", "main", "nav", "section", "p",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "pre",
]);

function protectedText(node: CleanNode): string {
  if (node.kind === "text") return node.value;
  if (node.name === "br") return "\n";
  return node.children.map(protectedText).join("");
}

function cleanInlineText(node: CleanNode): string {
  if (node.kind === "text") return node.value;
  if (node.name === "br") return "\n";
  if (node.name === "pre" || node.name === "code") return protectedText(node);
  return node.children.map(cleanInlineText).join("");
}

function cleanTextBlock(node: CleanElement): string {
  if (node.name === "hr") return "";
  if (node.name === "pre") return protectedText(node);

  if (
    node.name === "p" ||
    /^h[1-6]$/u.test(node.name)
  ) {
    return node.children.map(cleanInlineText).join("").trim();
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
