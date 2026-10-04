export const ENDPOINTS = {
  health: "/health",
  markdown: "/v1/html/markdown",
  text: "/v1/html/text",
} as const;

export const RESPONSE_HEADERS = {
  contentType: "application/json; charset=utf-8",
  cacheControl: "no-store",
  xContentTypeOptions: "nosniff",
} as const;

export const LIMITS = {
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
} as const;

export const VALIDATION_PRECEDENCE = [
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
] as const;

export interface ConversionRequest {
  readonly html: string;
}

export interface ConversionStats {
  readonly input_bytes: number;
  readonly output_chars: number;
}

export interface MarkdownSuccess {
  readonly markdown: string;
  readonly stats: ConversionStats;
}

export interface TextSuccess {
  readonly text: string;
  readonly stats: ConversionStats;
}

export interface SuccessByPath {
  readonly "/v1/html/markdown": MarkdownSuccess;
  readonly "/v1/html/text": TextSuccess;
}

export type ConversionPath = keyof SuccessByPath;
export type SuccessFor<P extends ConversionPath> = SuccessByPath[P];

export const CONTRACT_EXAMPLES = {
  hello: {
    request: {
      html: "<article><h1>Hello</h1><p>World</p></article>",
    } satisfies ConversionRequest,
    markdown: {
      markdown: "# Hello\n\nWorld",
      stats: { input_bytes: 45, output_chars: 14 },
    } satisfies MarkdownSuccess,
    text: {
      text: "Hello\n\nWorld",
      stats: { input_bytes: 45, output_chars: 12 },
    } satisfies TextSuccess,
  },
  empty: {
    request: { html: "" } satisfies ConversionRequest,
    markdown: {
      markdown: "",
      stats: { input_bytes: 0, output_chars: 0 },
    } satisfies MarkdownSuccess,
    text: {
      text: "",
      stats: { input_bytes: 0, output_chars: 0 },
    } satisfies TextSuccess,
  },
} as const;
