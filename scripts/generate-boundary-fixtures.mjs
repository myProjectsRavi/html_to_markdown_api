#!/usr/bin/env node
const LIMITS = {
  rawJsonBodyBytes: 800_000,
  decodedHtmlBytes: 131_072,
};

export function makeDecodedHtmlBoundaryFixtures() {
  return {
    exact: "a".repeat(LIMITS.decodedHtmlBytes),
    plusOne: "a".repeat(LIMITS.decodedHtmlBytes + 1),
  };
}

export function makeRawBodyBoundaryFixtures() {
  const prefix = '{"html":"';
  const suffix = '"}';
  const exactPayloadBytes = LIMITS.rawJsonBodyBytes - prefix.length - suffix.length;
  return {
    exact: prefix + "a".repeat(exactPayloadBytes) + suffix,
    plusOne: prefix + "a".repeat(exactPayloadBytes + 1) + suffix,
  };
}

if (process.argv.includes("--self-test")) {
  const encoder = new TextEncoder();
  const html = makeDecodedHtmlBoundaryFixtures();
  const body = makeRawBodyBoundaryFixtures();

  if (encoder.encode(html.exact).byteLength !== LIMITS.decodedHtmlBytes) {
    throw new Error("decoded HTML exact boundary generation failed");
  }
  if (encoder.encode(html.plusOne).byteLength !== LIMITS.decodedHtmlBytes + 1) {
    throw new Error("decoded HTML plus-one generation failed");
  }
  if (encoder.encode(body.exact).byteLength !== LIMITS.rawJsonBodyBytes) {
    throw new Error("raw body exact boundary generation failed");
  }
  if (encoder.encode(body.plusOne).byteLength !== LIMITS.rawJsonBodyBytes + 1) {
    throw new Error("raw body plus-one generation failed");
  }

  console.log(
    `BOUNDARY_OK html=${LIMITS.decodedHtmlBytes}/${LIMITS.decodedHtmlBytes + 1} raw=${LIMITS.rawJsonBodyBytes}/${LIMITS.rawJsonBodyBytes + 1}`,
  );
}
