import { describe, expect, it } from "vitest";
import {
  PARSER_LIMITS,
  ParserBudget,
  ParserLimitError,
} from "../src/html/limits";

function expectLimit(
  action: () => void,
  limit: keyof typeof PARSER_LIMITS,
): void {
  expect(action).toThrowError(ParserLimitError);
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ParserLimitError);
    expect((error as ParserLimitError).limit).toBe(limit);
  }
}

describe("US010 ParserBudget exact boundaries", () => {
  it("accepts the tokenizer-event boundary and rejects plus one", () => {
    const budget = new ParserBudget();
    for (let i = 0; i < PARSER_LIMITS.tokenizerEvents; i += 1) {
      budget.event();
    }
    expect(budget.snapshot().events).toBe(PARSER_LIMITS.tokenizerEvents);
    expectLimit(() => budget.event(), "tokenizerEvents");
  });

  it("accepts the retained-node boundary and rejects plus one", () => {
    const budget = new ParserBudget();
    for (let i = 0; i < PARSER_LIMITS.retainedNodes; i += 1) {
      budget.retainNode();
    }
    expect(budget.snapshot().retainedNodes).toBe(PARSER_LIMITS.retainedNodes);
    expectLimit(() => budget.retainNode(), "retainedNodes");
  });

  it("accepts the depth boundary and rejects plus one", () => {
    const budget = new ParserBudget();
    for (let i = 0; i < PARSER_LIMITS.openElementDepth; i += 1) {
      budget.beginElement();
    }
    expect(budget.snapshot().depth).toBe(PARSER_LIMITS.openElementDepth);
    expectLimit(() => budget.beginElement(), "openElementDepth");
  });

  it("accepts the per-element attribute boundary and rejects plus one", () => {
    const budget = new ParserBudget();
    budget.beginElement();
    for (let i = 0; i < PARSER_LIMITS.attributesPerElement; i += 1) {
      budget.attribute(`a${i}`, "");
    }
    expect(budget.snapshot().attributesInCurrentElement).toBe(
      PARSER_LIMITS.attributesPerElement,
    );
    expectLimit(() => budget.attribute("overflow", ""), "attributesPerElement");
  });

  it("measures attribute names in Unicode scalars", () => {
    const accepted = new ParserBudget();
    accepted.beginElement();
    accepted.attribute("😀".repeat(PARSER_LIMITS.attributeNameScalars), "");

    const rejected = new ParserBudget();
    rejected.beginElement();
    expectLimit(
      () =>
        rejected.attribute(
          "😀".repeat(PARSER_LIMITS.attributeNameScalars + 1),
          "",
        ),
      "attributeNameScalars",
    );
  });

  it("measures attribute values in UTF-8 bytes", () => {
    const exact = "é".repeat(PARSER_LIMITS.attributeValueBytes / 2);
    const accepted = new ParserBudget();
    accepted.beginElement();
    accepted.attribute("x", exact);

    const rejected = new ParserBudget();
    rejected.beginElement();
    expectLimit(
      () => rejected.attribute("x", exact + "a"),
      "attributeValueBytes",
    );
  });
});
