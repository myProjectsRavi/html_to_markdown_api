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
