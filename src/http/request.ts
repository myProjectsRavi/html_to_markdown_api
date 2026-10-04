import { LIMITS, type ConversionRequest } from "../config";
import { errorResponse } from "./response";

export type ValidatedConversionRequest =
  | {
      readonly ok: true;
      readonly request: ConversionRequest;
      readonly inputBytes: number;
    }
  | {
      readonly ok: false;
      readonly response: Response;
    };

function hasUnpairedSurrogate(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);

    if (unit >= 0xd800 && unit <= 0xdbff) {
      if (index + 1 >= value.length) return true;
      const next = value.charCodeAt(index + 1);
      if (next < 0xdc00 || next > 0xdfff) return true;
      index += 1;
      continue;
    }

    if (unit >= 0xdc00 && unit <= 0xdfff) return true;
  }

  return false;
}

/**
 * Parses the already bounded, strictly decoded JSON text from US007.
 *
 * JSON.parse is deliberately used directly. Native JSON semantics therefore
 * apply to duplicate object keys: the last value wins. US008 does not add a
 * second parser solely to detect duplicates.
 */
export function validateConversionRequest(
  text: string,
): ValidatedConversionRequest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, response: errorResponse("invalid_json") };
  }

  if (
    parsed === null ||
    Array.isArray(parsed) ||
    typeof parsed !== "object"
  ) {
    return { ok: false, response: errorResponse("invalid_request") };
  }

  const record = parsed as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, "html")) {
    return { ok: false, response: errorResponse("missing_html") };
  }

  const keys = Object.keys(record);
  if (keys.length !== 1 || typeof record.html !== "string") {
    return { ok: false, response: errorResponse("invalid_request") };
  }

  const html = record.html;
  if (hasUnpairedSurrogate(html)) {
    return { ok: false, response: errorResponse("invalid_request") };
  }

  const inputBytes = new TextEncoder().encode(html).byteLength;
  if (inputBytes > LIMITS.decodedHtmlBytes) {
    return { ok: false, response: errorResponse("input_too_large") };
  }

  return {
    ok: true,
    request: { html },
    inputBytes,
  };
}
