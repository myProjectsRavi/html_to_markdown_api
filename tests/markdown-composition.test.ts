import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/config";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import { normalizeSharedText } from "../src/html/text";
import { renderMarkdownBlocks } from "../src/markdown/blocks";

const render = (html: string) =>
  renderMarkdownBlocks(normalizeSharedText(cleanParsedTree(parseHtml(html))));

describe("US024 Markdown composition", () => {
  it("composes links inside lists without activating unsafe targets", () => {
    expect(render('<ul><li>See <a href="/docs">docs</a></li><li><a href="javascript:bad">Unsafe</a></li></ul>'))
      .toBe("- See [docs](</docs>)\n- Unsafe");
  });

  it("composes images inside quotes", () => {
    expect(render('<blockquote><p>Look <img src="/a.png" alt="A"></p></blockquote>'))
      .toBe("> Look ![A](</a.png>)");
  });

  it("keeps code, tables and following inline code structurally separated", () => {
    const md = render('<pre><code class="language-js">const x=1;</code></pre><table><tr><td>A</td></tr></table><p><code>x</code></p>');
    expect(md).toBe("```js\nconst x=1;\n```\n\n|  |\n| --- |\n| A |\n\n` x `");
  });

  it("composes details containing a list deterministically", () => {
    expect(render("<details><summary>More</summary><ul><li>One</li><li>Two</li></ul></details>"))
      .toBe("More\n\n- One\n- Two");
  });

  it("keeps unknown custom tags transparent around block children", () => {
    const md = render("<x-shell><p>A</p><x-inner><h2>B</h2></x-inner></x-shell><footer>C</footer>");
    expect(md).toBe("A\n\n## B\n\nC");
    expect(md).not.toMatch(/<\\/?x-/u);
  });

  it("keeps ordinary header nav main and footer content in source order once", () => {
    const md = render('<header><h1>T</h1></header><nav><a href="/n">N</a></nav><main><p>Body</p></main><footer>Foot</footer>');
    expect(md).toBe("# T\n\n[N](</n>)\n\nBody\n\nFoot");
    for (const token of ["T", "N", "Body", "Foot"]) {
      expect(md.split(token).length - 1).toBe(1);
    }
  });

  it("keeps HTML-looking escaped text literal instead of creating raw HTML", () => {
    expect(render("<p>&lt;b&gt;literal&lt;/b&gt; &amp; &lt;tag&gt;</p>"))
      .toBe("\\<b\\>literal\\</b\\> & \\<tag\\>");
  });

  it("drops prohibited subtrees while preserving surrounding composition", () => {
    expect(render("<article><p>Before</p><script>DROP_ME</script><style>DROP_STYLE</style><p>After</p></article>"))
      .toBe("Before\n\nAfter");
  });

  it("renders a representative mixed article with stable separators", () => {
    const html = '<article><header><h1>Guide</h1></header><p>Read <a href="/start">start</a>.</p><blockquote><p><img src="/tip.png" alt="Tip"> now</p></blockquote><details><summary>Code</summary><pre>  a\n b</pre></details><footer>End</footer></article>';
    const md = render(html);
    expect(md).toBe("# Guide\n\nRead [start](</start>).\n\n> ![Tip](</tip.png>) now\n\nCode\n\n```\n  a\n b\n```\n\nEnd");
    expect(Array.from(md).length).toBeLessThanOrEqual(LIMITS.outputScalars);
    expect(new TextEncoder().encode(md).byteLength).toBeLessThanOrEqual(LIMITS.outputBytes);
  });
});
