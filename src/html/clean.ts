import type { ParsedElement, ParsedNode, ParsedRoot } from "./parse";

export interface CleanRoot {
  readonly kind: "root";
  readonly children: CleanNode[];
}

export interface CleanElement {
  readonly kind: "element";
  readonly name: string;
  readonly attributes: ReadonlyArray<readonly [string, string]>;
  readonly children: CleanNode[];
}

export interface CleanText {
  readonly kind: "text";
  readonly value: string;
}

export type CleanNode = CleanElement | CleanText;

const RETAINED_ELEMENTS = new Set([
  "a", "article", "aside", "b", "blockquote", "br", "caption", "code",
  "del", "details", "div", "em", "footer", "h1", "h2", "h3", "h4", "h5",
  "h6", "header", "hr", "i", "img", "li", "main", "nav", "ol", "p", "pre",
  "s", "section", "span", "strong", "summary", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "ul",
]);

const DROP_SUBTREES = new Set([
  "head", "title",
  "script", "style", "template",
  "svg", "math",
  "iframe", "object", "embed",
  "input", "button", "select", "option", "optgroup", "textarea", "datalist",
]);

const RETAINED_ATTRIBUTES: Readonly<Record<string, ReadonlySet<string>>> = {
  a: new Set(["href", "title"]),
  code: new Set(["class"]),
  img: new Set(["alt", "src", "title"]),
  ol: new Set(["start"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

function cleanAttributes(
  element: ParsedElement,
): ReadonlyArray<readonly [string, string]> {
  const allowed = RETAINED_ATTRIBUTES[element.name];
  if (!allowed) return [];
  return element.attributes.filter(([name]) => allowed.has(name));
}

type Target = CleanRoot | CleanElement;

interface Frame {
  readonly source: ParsedRoot | ParsedElement;
  readonly target: Target;
  index: number;
}

function appendNode(target: Target, node: CleanNode): void {
  target.children.push(node);
}

/**
 * Convert the bounded parser tree into the renderer-facing shared tree.
 *
 * The parser already entity-decodes text exactly once. This stage deliberately
 * does not parse HTML, evaluate CSS/hidden state, or decode entities again.
 */
export function cleanParsedTree(root: ParsedRoot): CleanRoot {
  const cleanRoot: CleanRoot = { kind: "root", children: [] };
  const stack: Frame[] = [{ source: root, target: cleanRoot, index: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1]!;
    if (frame.index >= frame.source.children.length) {
      stack.pop();
      continue;
    }

    const node: ParsedNode = frame.source.children[frame.index++]!;

    if (node.kind === "text") {
      appendNode(frame.target, { kind: "text", value: node.value });
      continue;
    }

    // Comments and processing instructions (including doctypes) never enter
    // the renderer-facing tree.
    if (node.kind === "comment" || node.kind === "instruction") {
      continue;
    }

    if (DROP_SUBTREES.has(node.name)) {
      continue;
    }

    if (!RETAINED_ELEMENTS.has(node.name)) {
      // Unknown/custom elements are transparent wrappers: preserve their safe
      // children in source order without exposing the source tag or attrs.
      stack.push({ source: node, target: frame.target, index: 0 });
      continue;
    }

    const cleanElement: CleanElement = {
      kind: "element",
      name: node.name,
      attributes: cleanAttributes(node),
      children: [],
    };
    appendNode(frame.target, cleanElement);
    stack.push({ source: node, target: cleanElement, index: 0 });
  }

  return cleanRoot;
}

/** Temporary evidence helper for US011 only; renderers own whitespace later. */
export function extractCleanText(root: CleanRoot): string {
  let output = "";
  const stack: CleanNode[] = [...root.children].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "text") {
      output += node.value;
      continue;
    }
    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push(node.children[index]!);
    }
  }
  return output;
}
