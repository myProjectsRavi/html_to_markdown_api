import { LIMITS } from "../config";

export type TargetUse = "link" | "image";

export type TargetReason =
  | "ok_http"
  | "ok_https"
  | "ok_mailto"
  | "ok_fragment"
  | "ok_query"
  | "ok_relative"
  | "empty"
  | "too_long"
  | "boundary_whitespace"
  | "control_character"
  | "backslash"
  | "network_path"
  | "encoded_control"
  | "encoded_backslash"
  | "encoded_network_path"
  | "encoded_scheme"
  | "unsafe_scheme"
  | "invalid_http"
  | "http_credentials"
  | "invalid_mailto"
  | "image_mailto"
  | "image_fragment"
  | "image_query";

export interface TargetClassification {
  readonly safe: boolean;
  readonly reason: TargetReason;
}

const UTF8 = new TextEncoder();
const RAW_SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):/u;
const ASCII_CONTROL = /[\u0000-\u001F\u007F-\u009F]/u;
const ASCII_WHITESPACE = /[\t\n\f\r ]/u;

function result(safe: boolean, reason: TargetReason): TargetClassification {
  return { safe, reason };
}

function inspectPercentObfuscatedPrefix(value: string): TargetReason | null {
  const boundary = value.search(/[/?#]/u);
  const prefix = boundary >= 0 ? value.slice(0, boundary) : value;
  let decoded = "";
  let sawEncoded = false;

  for (let index = 0; index < prefix.length; index += 1) {
    const current = prefix[index]!;
    if (
      current === "%" &&
      index + 2 < prefix.length &&
      /^[0-9A-Fa-f]{2}$/u.test(prefix.slice(index + 1, index + 3))
    ) {
      sawEncoded = true;
      const code = Number.parseInt(prefix.slice(index + 1, index + 3), 16);
      index += 2;
      if ((code <= 0x1f) || (code >= 0x7f && code <= 0x9f)) return "encoded_control";
      if (code === 0x5c) return "encoded_backslash";
      decoded += code <= 0x7f ? String.fromCharCode(code) : "�";
      continue;
    }
    decoded += current;
  }

  if (!sawEncoded) return null;
  if (decoded.startsWith("//")) return "encoded_network_path";
  if (RAW_SCHEME.test(decoded)) return "encoded_scheme";
  return null;
}

function classifyHttp(value: string, scheme: "http" | "https"): TargetClassification {
  if (!new RegExp(`^${scheme}:\\/\\/`, "iu").test(value)) return result(false, "invalid_http");

  try {
    const parsed = new URL(value);
    if (parsed.protocol.toLowerCase() !== `${scheme}:` || parsed.hostname.length === 0) {
      return result(false, "invalid_http");
    }
    if (parsed.username.length > 0 || parsed.password.length > 0) {
      return result(false, "http_credentials");
    }
    return result(true, scheme === "http" ? "ok_http" : "ok_https");
  } catch {
    return result(false, "invalid_http");
  }
}

function classifyMailto(value: string, use: TargetUse): TargetClassification {
  if (use === "image") return result(false, "image_mailto");
  const remainder = value.slice(value.indexOf(":") + 1);
  if (remainder.length === 0 || remainder.startsWith("//") || ASCII_WHITESPACE.test(remainder)) {
    return result(false, "invalid_mailto");
  }
  return result(true, "ok_mailto");
}

/**
 * Pure URL/reference classifier for renderer use. It performs no resolution,
 * DNS, fetching, or repeated percent decoding.
 */
export function classifyTarget(value: string, use: TargetUse = "link"): TargetClassification {
  if (value.length === 0) return result(false, "empty");
  if (UTF8.encode(value).byteLength > LIMITS.urlBytes) return result(false, "too_long");
  if (value.trim() !== value) return result(false, "boundary_whitespace");
  if (ASCII_CONTROL.test(value)) return result(false, "control_character");
  if (value.includes("\\")) return result(false, "backslash");
  if (value.startsWith("//")) return result(false, "network_path");

  const obfuscated = inspectPercentObfuscatedPrefix(value);
  if (obfuscated) return result(false, obfuscated);

  const rawScheme = value.match(RAW_SCHEME)?.[1]?.toLowerCase();
  if (rawScheme === "http" || rawScheme === "https") return classifyHttp(value, rawScheme);
  if (rawScheme === "mailto") return classifyMailto(value, use);
  if (rawScheme) return result(false, "unsafe_scheme");

  if (value.startsWith("#")) {
    return use === "image" ? result(false, "image_fragment") : result(true, "ok_fragment");
  }
  if (value.startsWith("?")) {
    return use === "image" ? result(false, "image_query") : result(true, "ok_query");
  }

  return result(true, "ok_relative");
}

export function isSafeTarget(value: string, use: TargetUse = "link"): boolean {
  return classifyTarget(value, use).safe;
}
