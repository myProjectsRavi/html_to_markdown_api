import { ENDPOINTS, type ConversionPath } from "../config";
import { cleanParsedTree } from "../html/clean";
import { ParserLimitError } from "../html/limits";
import { parseHtml } from "../html/parse";
import { normalizeSharedText, renderCleanTextOutput } from "../html/text";
import { errorResponse, jsonResponse } from "../http/response";
import { renderMarkdownOutput } from "../markdown/blocks";
import { MarkdownTableLimitError } from "../markdown/table";
import { OutputLimitError } from "../output/writer";

export function conversionResponse(
  path: ConversionPath,
  html: string,
  inputBytes: number,
): Response {
  try {
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
  } catch (error) {
    if (error instanceof ParserLimitError || error instanceof MarkdownTableLimitError) {
      return errorResponse("input_too_complex");
    }
    if (error instanceof OutputLimitError) {
      return errorResponse("output_too_large");
    }
    return errorResponse("internal_error");
  }
}
