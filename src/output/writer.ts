import { LIMITS } from "../config";

const UTF8 = new TextEncoder();

export interface OutputLimits {
  readonly scalars: number;
  readonly bytes: number;
}

export interface BoundedOutput {
  readonly value: string;
  readonly scalars: number;
  readonly bytes: number;
}

export const OUTPUT_LIMITS: OutputLimits = {
  scalars: LIMITS.outputScalars,
  bytes: LIMITS.outputBytes,
};

export class OutputLimitError extends Error {
  readonly code = "output_too_large" as const;

  constructor() {
    super("Generated output exceeds the configured limit.");
    this.name = "OutputLimitError";
  }
}

/**
 * Append-only output accumulator.
 *
 * Every chunk is measured before it becomes retained output. Generated
 * delimiters, indentation and separators therefore consume the same budget as
 * user-visible text. A rejected append leaves the prior writer state intact.
 */
export class BoundedOutputWriter {
  private readonly chunks: string[] = [];
  private scalarCount = 0;
  private byteCount = 0;

  constructor(readonly limits: OutputLimits = OUTPUT_LIMITS) {}

  append(chunk: string): void {
    if (chunk.length === 0) return;

    const addedScalars = Array.from(chunk).length;
    const addedBytes = UTF8.encode(chunk).byteLength;
    if (
      addedScalars > this.limits.scalars - this.scalarCount ||
      addedBytes > this.limits.bytes - this.byteCount
    ) {
      throw new OutputLimitError();
    }

    this.chunks.push(chunk);
    this.scalarCount += addedScalars;
    this.byteCount += addedBytes;
  }

  snapshot(): BoundedOutput {
    return {
      value: this.chunks.join(""),
      scalars: this.scalarCount,
      bytes: this.byteCount,
    };
  }
}

export function writeJoinedBounded(
  parts: readonly string[],
  separator: string,
  limits: OutputLimits = OUTPUT_LIMITS,
): BoundedOutput {
  const writer = new BoundedOutputWriter(limits);
  let wrote = false;
  for (const part of parts) {
    if (part.length === 0) continue;
    if (wrote) writer.append(separator);
    writer.append(part);
    wrote = true;
  }
  return writer.snapshot();
}
