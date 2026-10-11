import { RESPONSE_HEADERS } from "../config";
import {
  ERROR_DEFINITIONS,
  type ErrorCode,
  type ErrorEnvelope,
} from "../errors";

export function jsonResponse(
  value: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", RESPONSE_HEADERS.contentType);
  headers.set("Cache-Control", RESPONSE_HEADERS.cacheControl);
  headers.set("X-Content-Type-Options", RESPONSE_HEADERS.xContentTypeOptions);

  return new Response(JSON.stringify(value), {
    ...init,
    headers,
  });
}

export function errorResponse<C extends ErrorCode>(
  code: C,
  headers?: HeadersInit,
): Response {
  const definition = ERROR_DEFINITIONS[code];
  const body = {
    error: {
      code,
      message: definition.message,
    },
  } as ErrorEnvelope<C>;

  return jsonResponse(body, {
    status: definition.status,
    headers,
  });
}
