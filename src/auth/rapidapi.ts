import { errorResponse } from "../http/response";

export interface AuthEnv {
  readonly RAPIDAPI_PROXY_SECRET?: string;
}

const MAX_PROXY_SECRET_CHARS = 512;

function invalidConfiguredSecret(value: string | undefined): boolean {
  return (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > MAX_PROXY_SECRET_CHARS ||
    value.includes(",")
  );
}

function invalidSuppliedSecret(value: string | null): boolean {
  return (
    value === null ||
    value.length === 0 ||
    value.length > MAX_PROXY_SECRET_CHARS ||
    value.includes(",")
  );
}

/**
 * Compares fixed-length SHA-256 digests with a full byte scan.
 *
 * This avoids an early-exit plaintext string comparison, but no timing
 * guarantee is claimed for JavaScript execution or the surrounding runtime.
 */
async function sameSecret(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftDigest, rightDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);

  const leftBytes = new Uint8Array(leftDigest);
  const rightBytes = new Uint8Array(rightDigest);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index]! ^ rightBytes[index]!;
  }
  return difference === 0;
}

export async function authenticateRapidApi(
  request: Request,
  env: AuthEnv,
): Promise<Response | null> {
  const expected = env.RAPIDAPI_PROXY_SECRET;
  if (invalidConfiguredSecret(expected)) {
    return errorResponse("service_unavailable");
  }

  const supplied = request.headers.get("X-RapidAPI-Proxy-Secret");
  if (invalidSuppliedSecret(supplied)) {
    return errorResponse("forbidden");
  }

  return (await sameSecret(supplied, expected))
    ? null
    : errorResponse("forbidden");
}
