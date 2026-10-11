import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";
const render=(html:string)=>renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));
describe("US016 quotes and disclosure",()=>{
  it("retains nested quote depth",()=>expect(render("<blockquote><p>a</p><blockquote><p>b</p></blockquote></blockquote>")).toBe("> a\n>\n> > b"));
  it("keeps blank lines inside quote",()=>expect(render("<blockquote><p>a</p><p>b</p></blockquote>")).toBe("> a\n>\n> b"));
  it("keeps a list and following paragraph inside quote",()=>expect(render("<blockquote><ul><li>a</li><li>b</li></ul><p>after</p></blockquote>")).toBe("> - a\n> - b\n>\n> after"));
  it("renders details summary once then body",()=>expect(render("<details><summary>Title</summary><p>Body</p></details>")).toBe("Title\n\nBody"));
  it("renders details without summary without invented text",()=>expect(render("<details><p>Body</p></details>")).toBe("Body"));
  it("preserves nested details text in source order",()=>expect(render("<details><summary>A</summary><p>x</p><details><summary>B</summary><p>y</p></details><p>z</p></details>")).toBe("A\n\nx\n\nB\n\ny\n\nz"));
});
