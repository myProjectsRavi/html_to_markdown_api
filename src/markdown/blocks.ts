import type { CleanElement, CleanNode, CleanRoot } from "../html/clean";

const BLOCK_ELEMENTS = new Set([
  "article", "aside", "div", "footer", "header", "main", "nav", "section", "p",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr",
]);

function escapeBlockLeadingText(value: string): string {
  return value.replace(/^(\s*)(#{1,6}|>|[-+*](?=\s)|\d+[.)](?=\s))/u, "$1\\$2");
}

function inlineText(node: CleanNode): string {
  if (node.kind === "text") return escapeBlockLeadingText(node.value);
  if (node.name === "br") return "  \n";
  if (node.name === "pre" || node.name === "code") {
    return node.children.map(inlineText).join("");
  }
  return node.children.map(inlineText).join("");
}

function elementBlock(node: CleanElement): string {
  if (/^h[1-6]$/.test(node.name)) {
    const level = Number(node.name[1]);
    const body = node.children.map(inlineText).join("").trim();
    return body ? `${"#".repeat(level)} ${body}` : "";
  }
  if (node.name === "hr") return "---";
  if (node.name === "p") return node.children.map(inlineText).join("").trim();

  const parts: string[] = [];
  let inline = "";
  const flush = () => {
    const value = inline.trim();
    if (value) parts.push(value);
    inline = "";
  };
  for (const child of node.children) {
    if (child.kind === "element" && BLOCK_ELEMENTS.has(child.name)) {
      flush();
      const rendered = elementBlock(child);
      if (rendered) parts.push(rendered);
    } else {
      inline += inlineText(child);
    }
  }
  flush();
  return parts.join("\n\n");
}

/**
 * US013 bounded block renderer. The shared parser/clean tree is already bounded,
 * and this writer traverses only retained nodes. Later stories replace inline
 * placeholders with dedicated formatting/list/code/link renderers.
 */
export function renderMarkdownBlocks(root: CleanRoot): string {
  const parts: string[] = [];
  let inline = "";
  const flush = () => {
    const value = inline.trim();
    if (value) parts.push(value);
    inline = "";
  };
  for (const node of root.children) {
    if (node.kind === "element" && BLOCK_ELEMENTS.has(node.name)) {
      flush();
      const rendered = elementBlock(node);
      if (rendered) parts.push(rendered);
    } else {
      inline += inlineText(node);
    }
  }
  flush();
  return parts.join("\n\n");
}
