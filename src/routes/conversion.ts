import { ENDPOINTS, type ConversionPath } from "../config";
import { cleanParsedTree } from "../html/clean";
import { parseHtml } from "../html/parse";
import { normalizeSharedText, renderCleanTextOutput } from "../html/text";
import { jsonResponse } from "../http/response";
import { renderMarkdownOutput } from "../markdown/blocks";

export function conversionResponse(
  path: ConversionPath,
  html: string,
  inputBytes: number,
): Response {
  const normalized = normalizeSharedText(cleanParsedTree(parseHtml(html)));

  if (path === ENDPOINTS.markdown) {
    const output = renderMarkdownOutput(normalized);
    return jsonResponse({
      markdown: output.value,
      stats: {
        input_bytes: inputBytes,
        output_chars: output.scalars,
      },
    });
  }

  const output = renderCleanTextOutput(normalized);
  return jsonResponse({
    text: output.value,
    stats: {
      input_bytes: inputBytes,
      output_chars: output.scalars,
    },
  });
}
