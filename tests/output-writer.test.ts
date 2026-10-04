import { describe, expect, it } from "vitest";
import { LIMITS } from "../src/config";
import {
  BoundedOutputWriter,
  OutputLimitError,
  OUTPUT_LIMITS,
  writeJoinedBounded,
} from "../src/output/writer";

describe("US027 bounded output writer", () => {
  it("admits exactly the configured scalar and byte ceilings", () => {
    const ascii = new BoundedOutputWriter();
    ascii.append("a".repeat(LIMITS.outputScalars));
    expect(ascii.snapshot()).toEqual({
      value: "a".repeat(LIMITS.outputScalars),
      scalars: LIMITS.outputScalars,
      bytes: LIMITS.outputScalars,
    });

    const emoji = new BoundedOutputWriter();
    emoji.append("😀".repeat(LIMITS.outputScalars));
    expect(emoji.snapshot().scalars).toBe(LIMITS.outputScalars);
    expect(emoji.snapshot().bytes).toBe(LIMITS.outputBytes);
  });

  it("rejects one scalar beyond the configured ceiling without partial append", () => {
    const writer = new BoundedOutputWriter();
    writer.append("a".repeat(LIMITS.outputScalars));
    const before = writer.snapshot();

    expect(() => writer.append("b")).toThrow(OutputLimitError);
    expect(writer.snapshot()).toEqual(before);
  });

  it("rejects one UTF-8 byte beyond a byte-only boundary", () => {
    const writer = new BoundedOutputWriter({ scalars: 10, bytes: 4 });
    writer.append("éé");
    expect(writer.snapshot()).toEqual({ value: "éé", scalars: 2, bytes: 4 });
    expect(() => writer.append("a")).toThrow(OutputLimitError);
  });

  it("counts emoji as one scalar and four bytes", () => {
    const writer = new BoundedOutputWriter({ scalars: 1, bytes: 4 });
    writer.append("😀");
    expect(writer.snapshot()).toEqual({ value: "😀", scalars: 1, bytes: 4 });
  });

  it("charges generated separators before retaining them", () => {
    const output = writeJoinedBounded(["a", "b"], "\n\n", { scalars: 4, bytes: 4 });
    expect(output).toEqual({ value: "a\n\nb", scalars: 4, bytes: 4 });
    expect(() => writeJoinedBounded(["a", "b"], "\n\n", { scalars: 3, bytes: 4 }))
      .toThrow(OutputLimitError);
  });

  it("freezes the production limits to the public contract", () => {
    expect(OUTPUT_LIMITS).toEqual({
      scalars: LIMITS.outputScalars,
      bytes: LIMITS.outputBytes,
    });
  });
});
