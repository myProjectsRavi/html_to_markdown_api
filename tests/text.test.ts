import { describe, expect, it } from "vitest";
import { cleanParsedTree } from "../src/html/clean";
import { parseHtml } from "../src/html/parse";
import {
  collapseHtmlAsciiWhitespace,
  countUnicodeScalars,
  normalizeLineEndings,
  normalizeSharedText,
} from "../src/html/text";

function normalized(html: string) {
  return normalizeSharedText(cleanParsedTree(parseHtml(html)));
}

function textValues(root: ReturnType<typeof normalized>): string[] {
  const values: string[] = [];
  const stack = [...root.children].reverse();
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.kind === "text") {
      values.push(node.value);
    } else {
      for (let index = node.children.length - 1; index >= 0; index -= 1) {
        stack.push(node.children[index]!);
      }
    }
  }
  return values;
}

describe("US012 Unicode-safe text normalization", () => {
  it("normalizes CRLF and CR to LF without changing other Unicode", () => {
    expect(normalizeLineEndings("A\r\nB\rC\nతెలుగు🙂")).toBe("A\nB\nC\nతెలుగు🙂");
  });

  it("collapses only HTML ASCII whitespace outside protected content", () => {
    expect(collapseHtmlAsciiWhitespace("a\t \n\fb\u00a0c")).toBe("a b\u00a0c");
    expect(collapseHtmlAsciiWhitespace("e\u0301  العربية  हिन्दी  తెలుగు")).toBe(
      "e\u0301 العربية हिन्दी తెలుగు",
    );
  });

  it("preserves pre/code whitespace while normalizing their line endings", () => {
    const tree = normalized("<p>A\t  B</p><pre>x\t  y\r\nz\r<code>  q\t r  </code></pre>");
    expect(textValues(tree)).toEqual(["A B", "x\t  y\nz\n", "  q\t r  "]);
  });

  it("preserves NBSP, combining marks, RTL text and emoji exactly", () => {
    const source = "हिन्दी\u00a0తెలుగు e\u0301 العربية 👩🏽‍💻";
    expect(textValues(normalized("<p>" + source + "</p>"))).toEqual([source]);
  });

  it("keeps inline separation instead of accidentally joining words", () => {
    expect(textValues(normalized("<p>Hello <strong>wide</strong> world</p>")))
      .toEqual(["Hello ", "wide", " world"]);
  });

  it("does not decode entities a second time", () => {
    expect(textValues(normalized("<p>&amp;lt; &amp; &lt;</p>")))
      .toEqual(["&lt; & <"]);
  });

  it("drops script content without raw or executable fallback", () => {
    const tree = normalized("<p>safe <script>alert(1)</script> text</p>");
    expect(textValues(tree)).toEqual(["safe ", " text"]);
    expect(JSON.stringify(tree)).not.toContain("alert");
    expect(JSON.stringify(tree)).not.toContain("script");
  });

  it("counts Unicode scalars rather than UTF-16 code units", () => {
    expect(countUnicodeScalars("A🙂e\u0301తెలుగు")).toBe(Array.from("A🙂e\u0301తెలుగు").length);
    expect(countUnicodeScalars("🙂")).toBe(1);
    expect("🙂".length).toBe(2);
  });
});
