import { describe, expect, it, vi } from "vitest";
import { parseHtml, ParserInternalError } from "../src/html/parse";
import {
  PARSER_LIMITS,
  ParserLimitError,
  type ParserLimits,
} from "../src/html/limits";

function expectParserLimit(
  html: string,
  limit: keyof typeof PARSER_LIMITS,
  options: Parameters<typeof parseHtml>[1] = {},
): void {
  try {
    parseHtml(html, options);
    throw new Error("expected parser limit");
  } catch (error) {
    expect(error).toBeInstanceOf(ParserLimitError);
    expect((error as ParserLimitError).limit).toBe(limit);
  }
}

describe("US010 bounded htmlparser2 adapter", () => {
  it("retains a bounded low-level tree with decoded entities", () => {
    const tree = parseHtml(
      '<div data-x="1">A&amp;B<!--c--><span>😀</span></div>',
    );
    expect(tree.children).toHaveLength(1);
    const div = tree.children[0];
    expect(div?.kind).toBe("element");
    if (!div || div.kind !== "element") return;
    expect(div.name).toBe("div");
    expect(div.attributes).toEqual([["data-x", "1"]]);
    expect(div.children.map((node) => node.kind)).toEqual([
      "text",
      "text",
      "text",
      "comment",
      "element",
    ]);
  });

  it("accepts 64 open elements and rejects depth 65", () => {
    const exact =
      "<div>".repeat(PARSER_LIMITS.openElementDepth) +
      "x" +
      "</div>".repeat(PARSER_LIMITS.openElementDepth);
    expect(() => parseHtml(exact)).not.toThrow();

    expectParserLimit(
      "<div>".repeat(PARSER_LIMITS.openElementDepth + 1),
      "openElementDepth",
    );
  });

  it("accepts 64 attributes and rejects attribute 65 before node retention", () => {
    const attributes = Array.from(
      { length: PARSER_LIMITS.attributesPerElement },
      (_, index) => ` a${index}=""`,
    ).join("");
    expect(() => parseHtml(`<div${attributes}></div>`)).not.toThrow();

    expectParserLimit(
      `<div${attributes} overflow=""></div>`,
      "attributesPerElement",
    );
  });

  it("rejects overlong attribute names and UTF-8 attribute values", () => {
    expect(() =>
      parseHtml(
        `<div ${"a".repeat(PARSER_LIMITS.attributeNameScalars)}=""></div>`,
      ),
    ).not.toThrow();
    expectParserLimit(
      `<div ${"a".repeat(PARSER_LIMITS.attributeNameScalars + 1)}=""></div>`,
      "attributeNameScalars",
    );

    const exactValue = "é".repeat(PARSER_LIMITS.attributeValueBytes / 2);
    expect(() => parseHtml(`<div x="${exactValue}"></div>`)).not.toThrow();
    expectParserLimit(
      `<div x="${exactValue}a"></div>`,
      "attributeValueBytes",
    );
  });

  it("accepts exactly 10000 retained comment nodes and rejects plus one", () => {
    const exact = "<!---->".repeat(PARSER_LIMITS.retainedNodes);
    expect(parseHtml(exact).children).toHaveLength(PARSER_LIMITS.retainedNodes);
    expectParserLimit(exact + "<!---->", "retainedNodes");
  });

  it("accepts exactly 20000 open/close events and rejects event 20001", () => {
    const exact = "<i></i>".repeat(PARSER_LIMITS.tokenizerEvents / 2);
    expect(() => parseHtml(exact)).not.toThrow();
    expectParserLimit(exact + "x", "tokenizerEvents");
  });

  it("counts events and depth inside skipped template subtrees without retaining them", () => {
    const limits: ParserLimits = {
      ...PARSER_LIMITS,
      tokenizerEvents: 8,
      openElementDepth: 8,
      retainedNodes: 10,
    };
    const onLimit = vi.fn();

    expectParserLimit(
      "<template><div><span>x</span></div></template><p>ok</p>",
      "tokenizerEvents",
      {
        limits,
        skipElements: new Set(["template"]),
        onLimit,
      },
    );
    expect(onLimit).toHaveBeenCalledTimes(1);

    const retained = parseHtml(
      "<template><div><span>x</span></div></template><p>ok</p>",
      {
        skipElements: new Set(["template"]),
      },
    );
    expect(retained.children).toHaveLength(1);
    expect(retained.children[0]).toMatchObject({ kind: "element", name: "p" });
  });

  it("bounds malformed long-tag retention through attribute checks", () => {
    expectParserLimit(
      `<div ${"a".repeat(PARSER_LIMITS.attributeNameScalars + 1)}="x"`,
      "attributeNameScalars",
    );
  });

  it("wraps non-limit parser failures as ParserInternalError", () => {
    const internal = new ParserInternalError(new Error("synthetic"));
    expect(internal.code).toBe("internal_error");
    expect(internal.message).not.toContain("synthetic");
  });
});
