import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText, renderCleanText } from "../src/html/text";

const render = (html: string) =>
  renderCleanText(normalizeSharedText(cleanParsedTree(parseHtml(html))));

describe("US025 clean text blocks and inline content", () => {
  it("renders headings and bold or italic content without Markdown delimiters", () => {
    expect(render("<h1>Title</h1><p>Hello <strong>bold</strong> and <em>soft</em>.</p>"))
      .toBe("Title\n\nHello bold and soft.");
  });

  it("preserves literal user punctuation including stars and angle characters", () => {
    expect(render("<p>*literal* &lt;tag&gt; 1 &lt; 2</p>"))
      .toBe("*literal* <tag> 1 < 2");
  });

  it("keeps adjacent inline text spacing from the normalized shared tree", () => {
    expect(render("<p>Hello <span>wide</span> <b>world</b>!</p>"))
      .toBe("Hello wide world!");
  });

  it("uses LF for br and stable blank lines for nested blocks", () => {
    expect(render("<section> lead <div><p>A<br>B</p><section><h2>C</h2></section></div> tail </section>"))
      .toBe("lead\n\nA\nB\n\nC\n\ntail");
  });

  it("treats hr as a structural separator without generated visible syntax", () => {
    expect(render("<p>A</p><hr><p>B</p>")).toBe("A\n\nB");
  });

  it("preserves protected code punctuation and whitespace", () => {
    expect(render("<p>Before <code>*x* &lt;y&gt;</code></p><pre>  a\t b\r\n c </pre>"))
      .toBe("Before *x* <y>\n\n  a\t b\n c ");
  });

  it("drops script and style text through the shared clean tree", () => {
    expect(render("<p>Before</p><script>DROP</script><style>DROP2</style><p>After</p>"))
      .toBe("Before\n\nAfter");
  });

  it("returns an empty string for empty or removed-only HTML", () => {
    expect(render("")).toBe("");
    expect(render("<script>only</script>")).toBe("");
  });

  it("demonstrates why clean text cannot be implemented by stripping Markdown", () => {
    const source = "<p>*keep these stars* and &lt;literal&gt;</p>";
    const direct = render(source);
    const naiveMarkdownStrip = direct.replace(/[*_~`#>]/gu, "");
    expect(direct).toBe("*keep these stars* and <literal>");
    expect(naiveMarkdownStrip).not.toBe(direct);
  });
});
