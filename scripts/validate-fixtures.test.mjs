#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { validateFixtureDocument } from "./validate-fixtures.mjs";

const canonical = JSON.parse(
  fs.readFileSync(path.resolve("tests/fixtures/corpus.json"), "utf8"),
);

function expectFailure(name, mutate, expectedText) {
  const copy = structuredClone(canonical);
  mutate(copy);
  try {
    validateFixtureDocument(copy);
    console.error(`FAIL ${name}: validator accepted invalid corpus`);
    process.exit(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes(expectedText)) {
      console.error(`FAIL ${name}: unexpected error: ${message}`);
      process.exit(1);
    }
    console.log(`PASS ${name}`);
  }
}

expectFailure(
  "missing-expected-field",
  (copy) => {
    delete copy.records[0].expected_markdown;
  },
  "missing required field expected_markdown",
);

expectFailure(
  "duplicate-id",
  (copy) => {
    copy.records[1].id = copy.records[0].id;
  },
  "duplicate fixture id",
);

expectFailure(
  "external-provenance-metadata",
  (copy) => {
    copy.records[0].source_url = "https://example.invalid/source";
  },
  "prohibited external/customer provenance metadata",
);

const result = validateFixtureDocument(canonical);
if (result.count < 40) {
  console.error("FAIL canonical-count");
  process.exit(1);
}
console.log(`PASS canonical count=${result.count}`);
