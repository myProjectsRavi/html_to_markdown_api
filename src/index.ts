import { ENDPOINTS } from "./config";
import { errorResponse } from "./http/response";
import { conversionPlaceholderResponse } from "./routes/conversion";
import { healthResponse } from "./routes/health";

type KnownPath =
  | typeof ENDPOINTS.health
  | typeof ENDPOINTS.markdown
  | typeof ENDPOINTS.text;

function allowedMethod(path: KnownPath): "GET" | "POST" {
  return path === ENDPOINTS.health ? "GET" : "POST";
}

function isKnownPath(path: string): path is KnownPath {
  return (
    path === ENDPOINTS.health ||
    path === ENDPOINTS.markdown ||
    path === ENDPOINTS.text
  );
}

export default {
  fetch(request: Request): Response {
    const path = new URL(request.url).pathname;

    if (!isKnownPath(path)) {
      return errorResponse("not_found");
    }

    const allow = allowedMethod(path);
    if (request.method !== allow) {
      return errorResponse("method_not_allowed", { Allow: allow });
    }

    if (path === ENDPOINTS.health) {
      return healthResponse();
    }

    return conversionPlaceholderResponse();
  },
};
