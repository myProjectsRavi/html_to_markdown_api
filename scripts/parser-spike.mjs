import { performance } from "node:perf_hooks";
import { Parser, parseDocument } from "htmlparser2";
import { parse as parse5 } from "parse5";

const versions = { htmlparser2: "12.0.0", parse5: "8.0.1" };
const sizes = [1024, 16 * 1024, 64 * 1024, 128 * 1024];

function sample(bytes) {
  const unit = "<p>A&amp;B <b>x</b></p>";
  return unit.repeat(Math.ceil(bytes / unit.length)).slice(0, bytes);
}

function medianMs(fn, input, rounds = 7) {
  const values = [];
  for (let i = 0; i < rounds; i += 1) {
    const start = performance.now();
    fn(input);
    values.push(performance.now() - start);
  }
  values.sort((a, b) => a - b);
  return Number(values[Math.floor(values.length / 2)].toFixed(3));
}

function htmlparser2Stop(input, limit) {
  let events = 0;
  const stop = new Error("US009_LIMIT");
  const bump = () => {
    events += 1;
    if (events > limit) throw stop;
  };
  const parser = new Parser(
    { onopentag: bump, ontext: bump, onclosetag: bump },
    { decodeEntities: true },
  );
  try {
    parser.end(input);
    return { stopped: false, events };
  } catch (error) {
    if (error === stop) return { stopped: true, events };
    throw error;
  }
}

function textHtmlparser2(html) {
  const doc = parseDocument(html, { decodeEntities: true });
  const out = [];
  const stack = [...doc.children].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (node?.type === "text") out.push(node.data);
    if (node && "children" in node && Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        stack.push(node.children[i]);
      }
    }
  }
  return out.join("");
}

function textParse5(html) {
  const doc = parse5(html);
  const out = [];
  const stack = [...(doc.childNodes ?? [])].reverse();
  while (stack.length > 0) {
    const node = stack.pop();
    if (node?.nodeName === "#text") out.push(node.value);
    if (node?.childNodes) {
      for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
        stack.push(node.childNodes[i]);
      }
    }
  }
  return out.join("");
}

const malformedInput = "<p>a<div>b</p>c";
const entityInput = "<div>A&amp;B&nbsp;&#x1F600;</div>";
const deepInput = "<div>".repeat(2000) + "x" + "</div>".repeat(2000);
const hugeAttribute = '<div data-x="' + "x".repeat(65536) + '">ok</div>';
const stopInput = "<div>x</div>".repeat(10000);

const results = {
  versions,
  runtime: process.version,
  representative_ms: Object.fromEntries(
    sizes.map((size) => [
      size,
      {
        htmlparser2: medianMs(parseDocument, sample(size)),
        parse5: medianMs(parse5, sample(size)),
      },
    ]),
  ),
  entities: {
    htmlparser2: textHtmlparser2(entityInput),
    parse5: textParse5(entityInput),
  },
  malformed: {
    input: malformedInput,
    htmlparser2_text: textHtmlparser2(malformedInput),
    parse5_text: textParse5(malformedInput),
  },
  deep_2000_ms: {
    htmlparser2: medianMs(parseDocument, deepInput, 5),
    parse5: medianMs(parse5, deepInput, 5),
  },
  huge_attribute_65536_ms: {
    htmlparser2: medianMs(parseDocument, hugeAttribute, 5),
    parse5: medianMs(parse5, hugeAttribute, 5),
  },
  early_stop: {
    htmlparser2: htmlparser2Stop(stopInput, 100),
    parse5: {
      stopped: false,
      reason:
        "The compared parse5 parse() API returns only after constructing its tree; it exposes no callback boundary equivalent to htmlparser2 Parser events for this adapter.",
    },
  },
};

console.log(JSON.stringify(results, null, 2));
if (!results.early_stop.htmlparser2.stopped) process.exitCode = 1;
