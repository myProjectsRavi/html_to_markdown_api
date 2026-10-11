import { describe, expect, it } from "vitest";
import {
  CONTRACT_EXAMPLES,
  ENDPOINTS,
  LIMITS,
  RESPONSE_HEADERS,
  VALIDATION_PRECEDENCE,
  type MarkdownSuccess,
  type SuccessFor,
  type TextSuccess,
} from "../src/config";
import { ERROR_DEFINITIONS, type ErrorCode } from "../src/errors";

type Assert<T extends true> = T;
type IsFalse<T extends false> = T;

type MarkdownPathIsMarkdown = Assert<
  SuccessFor<"/v1/html/markdown"> extends MarkdownSuccess ? true : false
>;
type TextPathIsText = Assert<
  SuccessFor<"/v1/html/text"> extends TextSuccess ? true : false
>;
type MarkdownDoesNotExposeText = IsFalse<
  "text" extends keyof SuccessFor<"/v1/html/markdown"> ? true : false
>;
type TextDoesNotExposeMarkdown = IsFalse<
  "markdown" extends keyof SuccessFor<"/v1/html/text"> ? true : false
>;

void (0 as unknown as MarkdownPathIsMarkdown);
void (0 as unknown as TextPathIsText);
void (0 as unknown as MarkdownDoesNotExposeText);
void (0 as unknown as TextDoesNotExposeMarkdown);

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function scalarCount(value: string): number {
  return Array.from(value).length;
}

describe("US003 machine-readable contract", () => {
  it("independently verifies canonical and empty counts", () => {
    const hello = CONTRACT_EXAMPLES.hello;
    expect(utf8Bytes(hello.request.html)).toBe(45);
    expect(scalarCount(hello.markdown.markdown)).toBe(14);
    expect(scalarCount(hello.text.text)).toBe(12);

    const empty = CONTRACT_EXAMPLES.empty;
    expect(utf8Bytes(empty.request.html)).toBe(0);
    expect(scalarCount(empty.markdown.markdown)).toBe(0);
    expect(scalarCount(empty.text.text)).toBe(0);
  });

  it("counts one supplementary-plane emoji as four UTF-8 bytes and one scalar", () => {
    expect(utf8Bytes("😀")).toBe(4);
    expect(scalarCount("😀")).toBe(1);
  });

  it("freezes endpoint, header and launch-limit constants", () => {
    expect(ENDPOINTS).toEqual({
      health: "/health",
      markdown: "/v1/html/markdown",
      text: "/v1/html/text",
    });
    expect(RESPONSE_HEADERS).toEqual({
      contentType: "application/json; charset=utf-8",
      cacheControl: "no-store",
      xContentTypeOptions: "nosniff",
    });
    expect(LIMITS).toEqual({
      rawJsonBodyBytes: 800_000,
      decodedHtmlBytes: 131_072,
      tokenizerEvents: 20_000,
      retainedNodes: 10_000,
      openElementDepth: 64,
      attributesPerElement: 64,
      attributeNameScalars: 256,
      attributeValueBytes: 8_192,
      urlBytes: 2_048,
      tableRows: 200,
      tableCellsPerRow: 32,
      tableCellsPerTable: 6_400,
      outputScalars: 262_144,
      outputBytes: 1_048_576,
    });
    expect(VALIDATION_PRECEDENCE).toEqual([
      "path_and_method",
      "server_configuration",
      "authentication",
      "content_type_and_encoding",
      "bounded_raw_body",
      "strict_utf8",
      "json_parse",
      "request_shape",
      "decoded_html_limits",
      "parse_and_convert",
    ]);
  });

  it("assigns every documented error one fixed status and message", () => {
    const expected: Record<ErrorCode, readonly [number, string]> = {
      invalid_json: [400, "Request body must be valid UTF-8 JSON."],
      missing_html: [400, "The html property is required."],
      invalid_request: [400, "Request does not match the supported schema."],
      forbidden: [403, "Request is not authorized."],
      not_found: [404, "Resource not found."],
      method_not_allowed: [405, "Method not allowed."],
      input_too_large: [413, "Input exceeds the supported limit."],
      unsupported_media_type: [415, "Request media type or encoding is not supported."],
      input_too_complex: [422, "Input exceeds the supported complexity limit."],
      output_too_large: [422, "Output exceeds the supported limit."],
      internal_error: [500, "An internal error occurred."],
      service_unavailable: [503, "Service configuration is unavailable."],
    };

    expect(Object.keys(ERROR_DEFINITIONS).sort()).toEqual(Object.keys(expected).sort());
    for (const code of Object.keys(expected) as ErrorCode[]) {
      expect([
        ERROR_DEFINITIONS[code].status,
        ERROR_DEFINITIONS[code].message,
      ]).toEqual(expected[code]);
    }
  });
});
