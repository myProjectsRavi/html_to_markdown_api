import { LIMITS } from "../config";
import { errorResponse } from "./response";

export const MAX_RAW_BODY_BYTES = LIMITS.rawJsonBodyBytes;

export type BoundedBodyResult =
  | {
      readonly ok: true;
      readonly text: string;
      readonly bytes: number;
    }
  | {
      readonly ok: false;
      readonly response: Response;
    };

function supportedContentType(value: string | null): boolean {
  if (value === null) return false;

  const parts = value.split(";").map((part) => part.trim());
  if (parts[0]?.toLowerCase() !== "application/json") return false;
  if (parts.length === 1) return true;
  if (parts.length !== 2) return false;

  const parameter = parts[1]!;
  const separator = parameter.indexOf("=");
  if (separator < 0) return false;

  const name = parameter.slice(0, separator).trim().toLowerCase();
  let charset = parameter.slice(separator + 1).trim().toLowerCase();
  if (
    charset.length >= 2 &&
    charset.startsWith('"') &&
    charset.endsWith('"')
  ) {
    charset = charset.slice(1, -1);
  }

  return name === "charset" && charset === "utf-8";
}

function supportedContentEncoding(value: string | null): boolean {
  if (value === null || value.trim() === "") return true;
  return value.trim().toLowerCase() === "identity";
}

function declaredLengthExceedsLimit(value: string | null): boolean {
  if (value === null) return false;
  const trimmed = value.trim();

  // A malformed or false Content-Length is never trusted as a bypass.
  // Actual streamed bytes are always counted below.
  if (!/^\d+$/.test(trimmed)) return false;

  try {
    return BigInt(trimmed) > BigInt(MAX_RAW_BODY_BYTES);
  } catch {
    return false;
  }
}

async function cancelQuietly(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  reason: string,
): Promise<void> {
  try {
    await reader.cancel(reason);
  } catch {
    // The source may already be errored/disconnected. The controlled HTTP
    // response remains fixed and never includes the transport exception.
  }
}

function decodeStrictUtf8(chunks: readonly Uint8Array[], total: number): string {
  let bytes: Uint8Array;

  if (total === 0) {
    bytes = new Uint8Array(0);
  } else if (chunks.length === 1) {
    bytes = chunks[0]!;
  } else {
    bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function readBoundedJsonBody(
  request: Request,
): Promise<BoundedBodyResult> {
  if (!supportedContentType(request.headers.get("Content-Type"))) {
    return { ok: false, response: errorResponse("unsupported_media_type") };
  }

  if (!supportedContentEncoding(request.headers.get("Content-Encoding"))) {
    return { ok: false, response: errorResponse("unsupported_media_type") };
  }

  if (declaredLengthExceedsLimit(request.headers.get("Content-Length"))) {
    return { ok: false, response: errorResponse("input_too_large") };
  }

  if (request.body === null) {
    return { ok: true, text: "", bytes: 0 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      let item: ReadableStreamReadResult<Uint8Array>;
      try {
        item = await reader.read();
      } catch {
        await cancelQuietly(reader, "body_read_error");
        return { ok: false, response: errorResponse("invalid_json") };
      }

      if (item.done) break;

      const chunk = item.value;
      if (chunk.byteLength > MAX_RAW_BODY_BYTES - total) {
        await cancelQuietly(reader, "input_too_large");
        return { ok: false, response: errorResponse("input_too_large") };
      }

      total += chunk.byteLength;

      // Copy only after the cap check so an oversized source buffer is never
      // retained. The total retained chunk bytes can never exceed the cap.
      if (chunk.byteLength > 0) {
        chunks.push(chunk.slice());
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // No externally visible effect; the stream may already be errored.
    }
  }

  try {
    return {
      ok: true,
      text: decodeStrictUtf8(chunks, total),
      bytes: total,
    };
  } catch {
    return { ok: false, response: errorResponse("invalid_json") };
  }
}
