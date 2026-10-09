import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";

const render=(html:string)=>renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

function parseSingleCodeSpan(markdown:string): string {
  const open=markdown.match(/^`+/u)?.[0] ?? "";
  expect(open.length).toBeGreaterThan(0);
  expect(markdown.endsWith(open)).toBe(true);
  let body=markdown.slice(open.length,-open.length).replace(/\n/gu," ");
  if (body.startsWith(" ") && body.endsWith(" ") && !/^ +$/u.test(body)) body=body.slice(1,-1);
  return body;
}

describe("US017 inline code",()=>{
  it("renders ordinary code with canonical padding",()=>{
    const md=render("<p><code>x()</code></p>");
    expect(md).toBe("` x() `");
    expect(parseSingleCodeSpan(md)).toBe("x()");
  });
  it("uses a delimiter longer than contained backtick runs",()=>{
    const md=render("<p><code>a`b</code></p>");
    expect(md).toBe("`` a`b ``");
    expect(parseSingleCodeSpan(md)).toBe("a`b");
  });
  it("normalizes inline code newlines to spaces",()=>{
    const md=render("<p><code>a\nb</code></p>");
    expect(parseSingleCodeSpan(md)).toBe("a b");
  });
  it("preserves leading and trailing spaces via padding rules",()=>{
    const md=render("<p><code> x </code></p>");
    expect(parseSingleCodeSpan(md)).toBe(" x ");
  });
  it("preserves all-space code explicitly",()=>{
    const md=render("<p><code>   </code></p>");
    expect(md).toBe("`   `");
    expect(parseSingleCodeSpan(md)).toBe("   ");
  });
  it("drops an empty code wrapper canonically",()=>expect(render("<p>a<code></code>b</p>")).toBe("ab"));
  it("does not escape punctuation or Unicode inside code",()=>{
    const md=render("<p><code>[x] \\ &lt;y&gt; 😀 తెలుగు</code></p>");
    expect(parseSingleCodeSpan(md)).toBe("[x] \\ <y> 😀 తెలుగు");
  });
  it("handles only-backtick content and long runs linearly",()=>{
    const ticks="`".repeat(1024);
    const md=render(`<p><code>${ticks}</code></p>`);
    const open=md.match(/^`+/u)?.[0] ?? "";
    expect(open.length).toBe(1025);
    expect(parseSingleCodeSpan(md)).toBe(ticks);
    expect(md.length).toBe(1024 + 2 * 1025 + 2);
  });
});
