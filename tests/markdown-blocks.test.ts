import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";

function render(html: string): string {
  return renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));
}

describe("US013 Markdown block rendering", () => {
  it("renders every heading level", () => {
    expect(render("<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h5>E</h5><h6>F</h6>"))
      .toBe("# A\n\n## B\n\n### C\n\n#### D\n\n##### E\n\n###### F");
  });

  it("separates adjacent and nested blocks without multiplying blank lines", () => {
    expect(render("<div><p>one</p><section><p>two</p></section></div><p>three</p>"))
      .toBe("one\n\ntwo\n\nthree");
  });

  it("drops empty wrappers and trims only generated outer separators", () => {
    expect(render("<div><p></p><section></section><p> x </p></div>")).toBe("x");
  });

  it("renders br as a Markdown hard break", () => {
    expect(render("<p>a<br>b</p>")).toBe("a  \nb");
  });

  it("renders repeated br and hr predictably between paragraphs", () => {
    expect(render("<p>a<br><br>b</p><hr><hr><p>c</p>"))
      .toBe("a  \n  \nb\n\n---\n\n---\n\nc");
  });

  it("escapes block-leading Markdown punctuation from ordinary text", () => {
    expect(render("<p># not a heading</p><p>> not a quote</p><p>- not a list</p><p>1. not a list</p>"))
      .toBe("\\# not a heading\n\n\\> not a quote\n\n\\- not a list\n\n\\1. not a list");
  });

  it("does not emit source tags", () => {
    const out = render("<article><header><h2>Title</h2></header><main><p>Body</p></main></article>");
    expect(out).toBe("## Title\n\nBody");
    expect(out).not.toMatch(/<\/?[a-z]/i);
  });

  it("composes dedicated fenced pre rendering without regressing surrounding blocks", () => {
    expect(render("<p>before</p><pre>  x\n y </pre><p>after</p>"))
      .toBe("before\n\n```\n  x\n y \n```\n\nafter");
  });
});
