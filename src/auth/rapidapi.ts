import { errorResponse } from "../http/response";

export interface AuthEnv {
  readonly RAPIDAPI_PROXY_SECRET?: string;
}

export async function authenticateRapidApi(
  request: Request,
  env: AuthEnv,
): Promise<Response | null> {
  const expected = env.RAPIDAPI_PROXY_SECRET;
  if (typeof expected !== "string" || expected.length < 16 || expected.length > 512 || expected.includes(",")) {
    return errorResponse("service_unavailable");
  }

  const supplied = request.headers.get("X-RapidAPI-Proxy-Secret");
  if (supplied === null || supplied.length === 0 || supplied.length > 512 || supplied.includes(",")) {
    return errorResponse("forbidden");
  }

  const encode = (value: string) => new TextEncoder().encode(value);
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encode(supplied)),
    crypto.subtle.digest("SHA-256", encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index]! ^ b[index]!;
  return difference === 0 ? null : errorResponse("forbidden");
}
