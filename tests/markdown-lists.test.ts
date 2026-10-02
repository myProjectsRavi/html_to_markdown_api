import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";
const render=(html:string)=>renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));
describe("US015 lists",()=>{
  it("renders ordered start and continuation",()=>expect(render("<ol start=\"10\"><li>ten</li><li><p>eleven</p><p>more</p></li></ol>")).toBe("10. ten\n11. eleven\n\n    more"));
  it("renders three nested levels",()=>expect(render("<ul><li>a<ul><li>b<ol><li>c</li></ol></li></ul></li></ul>")).toBe("- a\n  - b\n    1. c"));
  it("renders mixed lists",()=>expect(render("<ol><li>a<ul><li>b</li></ul></li><li>c</li></ol>")).toBe("1. a\n   - b\n2. c"));
  it("falls invalid start back to one",()=>expect(render("<ol start=\"nope\"><li>a</li></ol>")).toBe("1. a"));
  it("keeps sibling content outside list",()=>expect(render("<ul><li>a</li></ul><p>after</p>")).toBe("- a\n\nafter"));
  it("keeps code placeholder readable inside list",()=>expect(render("<ul><li><code>x()</code></li></ul>")).toBe("- x()"));
  it("renders orphan li as readable block fallback",()=>expect(render("<li>orphan</li>")).toBe("orphan"));
});
