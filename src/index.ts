import { authenticateRapidApi, type AuthEnv } from "./auth/rapidapi";
import { ENDPOINTS } from "./config";
import { readBoundedJsonBody } from "./http/body";
import { errorResponse } from "./http/response";
import { validateConversionRequest } from "./http/request";
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

    const validated = validateConversionRequest(body.text);
    if (!validated.ok) {
      return validated.response;
    }

    // Parser/rendering stories own the next stage. Reaching the controlled
    // placeholder proves the bounded JSON envelope and HTML byte checks passed.
    void validated.request;
    void validated.inputBytes;
    return conversionPlaceholderResponse();
  },
};
