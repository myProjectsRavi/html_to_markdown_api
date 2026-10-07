const UTF8 = new TextEncoder();
const SAFE_DESTINATION_PUNCTUATION = "._~:/?#@!$&*+,;=-";

function isAsciiAlphaNumeric(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a)
  );
}

function isHexCodeUnit(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x46) ||
    (code >= 0x61 && code <= 0x66)
  );
}

function isSafeDestinationAscii(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return isAsciiAlphaNumeric(code) || SAFE_DESTINATION_PUNCTUATION.includes(char);
}

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
    if (
      value.charCodeAt(index) === 0x25 &&
      index + 2 < value.length &&
      isHexCodeUnit(value.charCodeAt(index + 1)) &&
      isHexCodeUnit(value.charCodeAt(index + 2))
    ) {
      output += value[index]! + value[index + 1]! + value[index + 2]!;
      index += 3;
      continue;
    }

    const codePoint = value.codePointAt(index)!;
    const char = String.fromCodePoint(codePoint);
    index += char.length;
    if (isSafeDestinationAscii(char)) output += char;
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
