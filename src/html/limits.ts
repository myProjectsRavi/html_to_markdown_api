import { LIMITS } from "../config";

export interface ParserLimits {
  readonly tokenizerEvents: number;
  readonly retainedNodes: number;
  readonly openElementDepth: number;
  readonly attributesPerElement: number;
  readonly attributeNameScalars: number;
  readonly attributeValueBytes: number;
}

export const PARSER_LIMITS: ParserLimits = {
  tokenizerEvents: LIMITS.tokenizerEvents,
  retainedNodes: LIMITS.retainedNodes,
  openElementDepth: LIMITS.openElementDepth,
  attributesPerElement: LIMITS.attributesPerElement,
  attributeNameScalars: LIMITS.attributeNameScalars,
  attributeValueBytes: LIMITS.attributeValueBytes,
};

export type ParserLimitName = keyof ParserLimits;

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

export interface ParserBudgetSnapshot {
  readonly events: number;
  readonly retainedNodes: number;
  readonly depth: number;
  readonly attributesInCurrentElement: number;
}

export class ParserBudget {
  private events = 0;
  private retainedNodes = 0;
  private depth = 0;
  private attributesInCurrentElement = 0;
  private readonly encoder = new TextEncoder();

  constructor(readonly limits: ParserLimits = PARSER_LIMITS) {}

  event(): void {
    this.events += 1;
    if (this.events > this.limits.tokenizerEvents) {
      exceed("tokenizerEvents");
    }
  }

  beginElement(): void {
    this.depth += 1;
    this.attributesInCurrentElement = 0;
    if (this.depth > this.limits.openElementDepth) {
      exceed("openElementDepth");
    }
  }

  endElement(): void {
    if (this.depth > 0) this.depth -= 1;
    this.attributesInCurrentElement = 0;
  }

  retainNode(): void {
    this.retainedNodes += 1;
    if (this.retainedNodes > this.limits.retainedNodes) {
      exceed("retainedNodes");
    }
  }

  attribute(name: string, value: string): void {
    this.attributesInCurrentElement += 1;
    if (this.attributesInCurrentElement > this.limits.attributesPerElement) {
      exceed("attributesPerElement");
    }

    if (Array.from(name).length > this.limits.attributeNameScalars) {
      exceed("attributeNameScalars");
    }

    if (this.encoder.encode(value).byteLength > this.limits.attributeValueBytes) {
      exceed("attributeValueBytes");
    }
  }

  snapshot(): ParserBudgetSnapshot {
    return {
      events: this.events,
      retainedNodes: this.retainedNodes,
      depth: this.depth,
      attributesInCurrentElement: this.attributesInCurrentElement,
    };
  }
}
