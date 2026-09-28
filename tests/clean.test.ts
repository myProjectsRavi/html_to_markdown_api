import { describe, expect, it } from "vitest";
import { cleanParsedTree, extractCleanText } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";

function clean(html: string) {
  return cleanParsedTree(parseHtml(html));
}

describe("US011 shared safe-content normalization", () => {
  it("drops active and non-content subtrees without leaking nested text", () => {
    const tree = clean(
      "<main>before" +
        "<script><b>script-secret</b></script>" +
        "<style>.x{content:'style-secret'}</style>" +
        "<template><p>template-secret</p></template>" +
        "<svg><text>svg-secret</text></svg>" +
        "<math><mi>math-secret</mi></math>" +
        "<iframe>frame-secret</iframe>" +
        "<object>object-secret</object>" +
        "after</main>",
    );

    expect(extractCleanText(tree)).toBe("beforeafter");
    expect(JSON.stringify(tree)).not.toMatch(/secret|script|style|template|svg|math|iframe|object/);
  });

  it("drops form controls as subtrees", () => {
    const tree = clean(
      "<form>keep" +
        "<input value='leak'>" +
        "<button>button-secret</button>" +
        "<select><option>option-secret</option></select>" +
        "<textarea>textarea-secret</textarea>" +
        "<datalist><option>data-secret</option></datalist>" +
        "<p>also keep</p></form>",
    );

    expect(extractCleanText(tree)).toBe("keepalso keep");
    expect(JSON.stringify(tree)).not.toMatch(/secret|input|button|select|textarea|datalist/);
  });

  it("unwraps unsupported and custom tags while preserving safe children in source order", () => {
    const tree = clean("<x-card>A<blink>B<strong>C</strong></blink>D</x-card>");
    expect(extractCleanText(tree)).toBe("ABCD");
    expect(tree).toEqual({
      kind: "root",
      children: [
        { kind: "text", value: "A" },
        { kind: "text", value: "B" },
        {
          kind: "element",
          name: "strong",
          attributes: [],
          children: [{ kind: "text", value: "C" }],
        },
        { kind: "text", value: "D" },
      ],
    });
  });

  it("retains only renderer-required attributes", () => {
    const tree = clean(
      "<a href='/safe' title='t' onclick='x()' style='color:red' data-x='1'>link</a>" +
        "<img src='/i.png' alt='pic' title='i' srcset='evil 2x' onerror='x()'>" +
        "<ol start='10' reversed data-x='1'><li>x</li></ol>" +
        "<code class='language-ts' style='x'>let x</code>",
    );

    expect(tree.children[0]).toMatchObject({
      kind: "element",
      name: "a",
      attributes: [["href", "/safe"], ["title", "t"]],
    });
    expect(tree.children[1]).toMatchObject({
      kind: "element",
      name: "img",
      attributes: [["src", "/i.png"], ["alt", "pic"], ["title", "i"]],
    });
    expect(tree.children[2]).toMatchObject({
      kind: "element",
      name: "ol",
      attributes: [["start", "10"]],
    });
    expect(tree.children[3]).toMatchObject({
      kind: "element",
      name: "code",
      attributes: [["class", "language-ts"]],
    });
    expect(JSON.stringify(tree)).not.toMatch(/onclick|onerror|style|srcset|data-x|reversed/);
  });

  it("preserves header footer and nav rather than performing article extraction", () => {
    const tree = clean("<header>H</header><nav>N</nav><article>A</article><footer>F</footer>");
    expect(tree.children.map((node) => node.kind === "element" ? node.name : "#text"))
      .toEqual(["header", "nav", "article", "footer"]);
    expect(extractCleanText(tree)).toBe("HNAF");
  });

  it("uses parser-decoded entities exactly once", () => {
    const tree = clean("<p>&amp;lt; &amp; &lt;</p>");
    expect(extractCleanText(tree)).toBe("&lt; & <");
  });

  it("follows pinned parser mixed-case and malformed-close recovery", () => {
    const tree = clean("<DIV>A<CuStOm>B</DIV>C</CuStOm>");
    expect(tree).toEqual({
      kind: "root",
      children: [
        {
          kind: "element",
          name: "div",
          attributes: [],
          children: [
            { kind: "text", value: "A" },
            { kind: "text", value: "B" },
          ],
        },
        { kind: "text", value: "C" },
      ],
    });
    expect(extractCleanText(tree)).toBe("ABC");
  });

  it("does not evaluate hidden/style semantics", () => {
    const tree = clean("<p hidden style='display:none'>still content</p>");
    expect(extractCleanText(tree)).toBe("still content");
    expect(tree.children[0]).toMatchObject({
      kind: "element",
      name: "p",
      attributes: [],
    });
  });
});
