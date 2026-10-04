const UTF8 = new TextEncoder();
const SAFE_DESTINATION_ASCII = /^[A-Za-z0-9._~:/?#@!$&*+,;=\-]$/u;
const HEX = /^[0-9A-Fa-f]{2}$/u;

function percentEncode(value: string): string {
  let out = "";
  for (const byte of UTF8.encode(value)) out += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
  return out;
}

/**
 * Serialize one already-classified target for a Markdown angle destination.
 * Valid existing percent triplets are retained byte-for-byte; unsafe Markdown
 * delimiters and non-ASCII code points are encoded deterministically.
 */
export function serializeLinkDestination(value: string): string {
  let output = "";
  for (let index = 0; index < value.length;) {
    if (value[index] === "%" && index + 2 < value.length && HEX.test(value.slice(index + 1, index + 3))) {
      output += value.slice(index, index + 3);
      index += 3;
      continue;
    }

    const codePoint = value.codePointAt(index)!;
    const char = String.fromCodePoint(codePoint);
    index += char.length;
    if (char.length === 1 && SAFE_DESTINATION_ASCII.test(char)) output += char;
    else output += percentEncode(char);
  }
  return output;
}

/**
 * Make a rendered inline label safe inside [ ... ] without double escaping
 * deliberate backslash escapes already emitted by the literal-text renderer.
 */
export function serializeLinkLabel(renderedLabel: string): string {
  let output = "";
  for (let index = 0; index < renderedLabel.length; index += 1) {
    const char = renderedLabel[index]!;
    if (char === "\\") {
      if (index + 1 < renderedLabel.length) {
        output += char + renderedLabel[index + 1]!;
        index += 1;
      } else {
        output += "\\\\";
      }
      continue;
    }
    if (char === "[" || char === "]" || char === "<" || char === ">") {
      output += "\\" + char;
      continue;
    }
    output += char;
  }
  return output;
}
