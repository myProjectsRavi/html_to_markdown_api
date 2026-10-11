import { authenticateRapidApi, type AuthEnv } from "./auth/rapidapi";
import { ENDPOINTS, type ConversionPath } from "./config";
import { ParserLimitError } from "./html/limits";
import { readBoundedJsonBody } from "./http/body";
import { errorResponse } from "./http/response";
import { validateConversionRequest } from "./http/request";
import { MarkdownTableLimitError } from "./markdown/table";
import { OutputLimitError } from "./output/writer";
import { conversionResponse } from "./routes/conversion";
import { healthResponse } from "./routes/health";

type KnownPath =
  | typeof ENDPOINTS.health
  | typeof ENDPOINTS.markdown
  | typeof ENDPOINTS.text;

type ConversionExecutor = typeof conversionResponse;

export interface WorkerDependencies {
  readonly convert?: ConversionExecutor;
}

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

function routeFailure(error: unknown): Response {
  if (error instanceof ParserLimitError || error instanceof MarkdownTableLimitError) {
    return errorResponse("input_too_complex");
  }
  if (error instanceof OutputLimitError) {
    return errorResponse("output_too_large");
  }
  return errorResponse("internal_error");
}

export function createWorker(dependencies: WorkerDependencies = {}) {
  const convert = dependencies.convert ?? conversionResponse;

  return {
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

      // The business-route boundary is the only generic exception boundary.
      // Earlier validation stages return their fixed responses in precedence
      // order; typed conversion failures are mapped here without exposing
      // exception text, stacks, input, or partial output.
      try {
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

        return convert(
          path as ConversionPath,
          validated.request.html,
          validated.inputBytes,
        );
      } catch (error) {
        return routeFailure(error);
      }
    },
  };
}

export default createWorker();
