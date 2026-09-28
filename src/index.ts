import { authenticateRapidApi, type AuthEnv } from "./auth/rapidapi";
import { ENDPOINTS } from "./config";
import { readBoundedJsonBody } from "./http/body";
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
  async fetch(request: Request, env: AuthEnv): Promise<Response> {
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

    const authFailure = await authenticateRapidApi(request, env);
    if (authFailure !== null) {
      return authFailure;
    }

    const body = await readBoundedJsonBody(request);
    if (!body.ok) {
      return body.response;
    }

    // US008 owns JSON parsing and request-shape validation. Reaching this
    // placeholder proves US007 admitted a bounded, strictly decoded body.
    return conversionPlaceholderResponse();
  },
};
