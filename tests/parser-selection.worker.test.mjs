import { describe, expect, it, vi } from "vitest";
import { Parser } from "htmlparser2";
import { parse as parse5 } from "parse5";

function stopAfter(input, limit) {
  let events = 0;
  const sentinel = new Error("LIMIT");
  const bump = () => {
    events += 1;
    if (events > limit) throw sentinel;
  };
  const parser = new Parser(
    { onopentag: bump, ontext: bump, onclosetag: bump },
    { decodeEntities: true },
  );

  try {
    parser.end(input);
    return { stopped: false, events };
  } catch (error) {
    if (error !== sentinel) throw error;
    return { stopped: true, events };
  }
}

describe("US009 parser candidates in pinned workerd", () => {
  it("imports and executes both candidates without browser DOM or network", () => {
    expect("document" in globalThis).toBe(false);

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() => Promise.reject(new Error("network forbidden")));

    try {
      const hp = new Parser({}, { decodeEntities: true });
      hp.end("<p>A&amp;B</p>");
      const p5 = parse5("<p>A&amp;B</p>");
      expect(p5.nodeName).toBe("#document");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("stops htmlparser2 from its event callback before consuming all events", () => {
    const result = stopAfter("<div>x</div>".repeat(10000), 100);
    expect(result).toEqual({ stopped: true, events: 101 });
  });

  it("decodes representative entities in both candidates", () => {
    const input = "<p>A&amp;B&nbsp;&#x1F600;</p>";
    let htmlparser2Text = "";
    const hp = new Parser(
      { ontext(text) { htmlparser2Text += text; } },
      { decodeEntities: true },
    );
    hp.end(input);

    const doc = parse5(input);
    const html = doc.childNodes.find((node) => node.nodeName === "html");
    const body = html?.childNodes?.find((node) => node.nodeName === "body");
    const paragraph = body?.childNodes?.find((node) => node.nodeName === "p");
    const parse5Text = paragraph?.childNodes?.find(
      (node) => node.nodeName === "#text",
    )?.value;

    expect(htmlparser2Text).toBe("A&B\u00a0😀");
    expect(parse5Text).toBe("A&B\u00a0😀");
  });
});
