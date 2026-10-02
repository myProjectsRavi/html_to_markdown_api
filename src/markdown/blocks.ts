import type { CleanElement, CleanNode, CleanRoot } from "../html/clean";

const BLOCK_ELEMENTS = new Set([
  "article", "aside", "div", "footer", "header", "main", "nav", "section", "p",
  "h1", "h2", "h3", "h4", "h5", "h6", "hr", "pre", "ul", "ol", "li", "blockquote", "details", "summary",
]);

function escapeLiteralText(value: string): string {
  return value
    .replace(/\\/gu, "\\\\")
    .replace(/([\[\]<>])/gu, "\\$1");
}

function escapeBlockLeadingText(value: string): string {
  return escapeLiteralText(value).replace(/^(\s*)(#{1,6}(?=\s|$)|>|[-+*](?=\s)|\d+[.)](?=\s))/u, "$1\\$2");
}

function formatted(node: CleanElement, marker: string): string {
  const body = node.children.map(inlineText).join("");
  const leading = body.match(/^\s*/u)?.[0] ?? "";
  const trailing = body.match(/\s*$/u)?.[0] ?? "";
  const core = body.slice(leading.length, body.length - trailing.length);
  if (!core) return body;
  return `${leading}${marker}${core}${marker}${trailing}`;
}

function inlineText(node: CleanNode): string {
  if (node.kind === "text") return escapeBlockLeadingText(node.value);
  if (node.name === "br") return "  \n";
  if (node.name === "pre" || node.name === "code") {
    return node.children.map((child) => child.kind === "text" ? child.value : inlineText(child)).join("");
  }
  if (node.name === "strong" || node.name === "b") return formatted(node, "**");
  if (node.name === "em" || node.name === "i") return formatted(node, "*");
  if (node.name === "s" || node.name === "del") return formatted(node, "~~");
  return node.children.map(inlineText).join("");
}


function attribute(node: CleanElement, name: string): string | undefined {
  return node.attributes.find(([key]) => key === name)?.[1];
}

function renderList(root: CleanElement): string {
  type ListTask = { readonly list: CleanElement; readonly indent: string };
  const lines: string[] = [];
  const stack: Array<ListTask | { readonly line: string }> = [{ list: root, indent: "" }];

  while (stack.length > 0) {
    const task = stack.pop()!;
    if ("line" in task) {
      lines.push(task.line);
      continue;
    }

    const items = task.list.children.filter(
      (child): child is CleanElement => child.kind === "element" && child.name === "li",
    );
    const rawStart = attribute(task.list, "start");
    const parsedStart = rawStart !== undefined && /^-?\d+$/u.test(rawStart) ? Number(rawStart) : 1;
    const start = Number.isSafeInteger(parsedStart) && parsedStart >= -999999 && parsedStart <= 999999 ? parsedStart : 1;

    for (let index = items.length - 1; index >= 0; index -= 1) {
      const item = items[index]!;
      const marker = task.list.name === "ol" ? `${start + index}. ` : "- ";
      const continuation = task.indent + " ".repeat(marker.length);
      const nested = item.children.filter(
        (child): child is CleanElement =>
          child.kind === "element" && (child.name === "ul" || child.name === "ol"),
      );
      const contentNodes = item.children.filter(
        (child) => !(child.kind === "element" && (child.name === "ul" || child.name === "ol")),
      );

      const blocks: string[] = [];
      let inline = "";
      const flushInline = () => {
        const value = inline.trim();
        if (value) blocks.push(value);
        inline = "";
      };
      for (const child of contentNodes) {
        if (child.kind === "element" && BLOCK_ELEMENTS.has(child.name) && child.name !== "li") {
          flushInline();
          const rendered = elementBlock(child);
          if (rendered) blocks.push(rendered);
        } else {
          inline += inlineText(child);
        }
      }
      flushInline();

      for (let n = nested.length - 1; n >= 0; n -= 1) {
        stack.push({ list: nested[n]!, indent: continuation });
      }

      const normalized = blocks.length > 0 ? blocks : [""];
      for (let b = normalized.length - 1; b >= 0; b -= 1) {
        const blockLines = normalized[b]!.split("\n");
        for (let l = blockLines.length - 1; l >= 0; l -= 1) {
          const prefix = b === 0 && l === 0 ? task.indent + marker : continuation;
          stack.push({ line: prefix + blockLines[l]! });
        }
        if (b > 0) stack.push({ line: continuation.trimEnd() });
      }
    }
  }
  return lines.join("\n");
}

function renderContainer(node: CleanElement): string {
  return renderContainer(node);
}

function renderBlockquote(node: CleanElement): string {
  const body = renderContainer(node);
  if (!body) return "";
  return body.split("\n").map((line) => line.length > 0 ? `> ${line}` : ">").join("\n");
}

function elementBlock(node: CleanElement): string {
  if (/^h[1-6]$/.test(node.name)) {
    const level = Number(node.name[1]);
    const body = node.children.map(inlineText).join("").trim();
    return body ? `${"#".repeat(level)} ${body}` : "";
  }
  if (node.name === "hr") return "---";
  if (node.name === "blockquote") return renderBlockquote(node);
  if (node.name === "details") return renderContainer(node);
  if (node.name === "summary") return node.children.map(inlineText).join("").trim();
  if (node.name === "ul" || node.name === "ol") return renderList(node);
  if (node.name === "li") return node.children.map((child) => child.kind === "element" && BLOCK_ELEMENTS.has(child.name) ? elementBlock(child) : inlineText(child)).filter(Boolean).join("\n\n");
  if (node.name === "pre") return node.children.map((child) => child.kind === "text" ? child.value : inlineText(child)).join("").replace(/[ \t]+$/u, "");
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
