import { errorResponse } from "../http/response";

/**
 * US005 route placeholder.
 *
 * Conversion success is deliberately unavailable until authentication,
 * body validation, parsing and rendering stories are integrated. Returning
 * a controlled error prevents this routing story from fabricating success.
 */
export function conversionPlaceholderResponse(): Response {
  return errorResponse("service_unavailable");
}
