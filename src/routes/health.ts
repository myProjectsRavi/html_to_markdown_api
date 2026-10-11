import { jsonResponse } from "../http/response";

export function healthResponse(): Response {
  return jsonResponse({ status: "ok" });
}
