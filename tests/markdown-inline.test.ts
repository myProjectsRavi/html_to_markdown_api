import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";

const render=(html:string)=>renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

describe("US014 inline formatting",()=>{
  it("renders nested formatting",()=>expect(render("<p><strong>bold <em>and italic</em></strong></p>")).toBe("**bold *and italic***"));
  it("supports aliases and strike",()=>expect(render("<p><b>b</b> <i>i</i> <del>d</del> <s>s</s></p>")).toBe("**b** *i* ~~d~~ ~~s~~"));
  it("moves edge whitespace outside delimiters",()=>expect(render("<p><em> x </em></p>")).toBe("*x*"));
  it("drops empty formatting wrappers",()=>expect(render("<p>a<strong></strong>b<em> </em>c</p>")).toBe("ab c"));
  it("escapes literal markdown-sensitive text",()=>expect(render("<p>[x] \\ &lt;tag&gt;</p>")).toBe("\\[x\\] \\\\ \\<tag\\>"));
  it("preserves plain Unicode words",()=>expect(render("<p><strong>తెలుగు</strong> café العربية</p>")).toBe("**తెలుగు** café العربية"));
  it("keeps entity-derived script syntax inert",()=>expect(render("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>")).toBe("\\<script\\>alert(1)\\</script\\>"));
});
