import { LIMITS } from "../config";

export const PARSER_LIMITS = {
  tokenizerEvents: LIMITS.tokenizerEvents,
  retainedNodes: LIMITS.retainedNodes,
  openElementDepth: LIMITS.openElementDepth,
  attributesPerElement: LIMITS.attributesPerElement,
  attributeNameScalars: LIMITS.attributeNameScalars,
  attributeValueBytes: LIMITS.attributeValueBytes,
} as const;

export type ParserLimitName = keyof typeof PARSER_LIMITS;

export class ParserLimitError extends Error {
  readonly code = "input_too_complex" as const;

  constructor(readonly limit: ParserLimitName) {
    super("Input exceeds the supported complexity limit.");
    this.name = "ParserLimitError";
  }
}

function exceed(limit: ParserLimitName): never {
  throw new ParserLimitError(limit);
}

export class ParserBudget {
  private events = 0;
  private retainedNodes = 0;
  private depth = 0;

  event(): void {
    this.events += 1;
    if (this.events > PARSER_LIMITS.tokenizerEvents) exceed("tokenizerEvents");
  }

  openElement(): void {
    this.depth += 1;
    if (this.depth > PARSER_LIMITS.openElementDepth) exceed("openElementDepth");
  }

  closeElement(): void {
    if (this.depth > 0) this.depth -= 1;
  }

  retainNode(): void {
    this.retainedNodes += 1;
    if (this.retainedNodes > PARSER_LIMITS.retainedNodes) exceed("retainedNodes");
  }

  attributes(entries: ReadonlyArray<readonly [string, string]>): void {
    if (entries.length > PARSER_LIMITS.attributesPerElement) exceed("attributesPerElement");

    const encoder = new TextEncoder();
    for (const [name, value] of entries) {
      if ([...name].length > PARSER_LIMITS.attributeNameScalars) exceed("attributeNameScalars");
      if (encoder.encode(value).byteLength > PARSER_LIMITS.attributeValueBytes) exceed("attributeValueBytes");
    }
  }
}
