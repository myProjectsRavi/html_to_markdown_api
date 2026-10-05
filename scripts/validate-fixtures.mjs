#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REQUIRED_CATEGORIES = [
  "blocks",
  "inline",
  "urls",
  "code",
  "tables",
  "whitespace",
  "entities",
  "removed",
];

export const REQUIRED_REVIEW_TAGS = [
  "nesting",
  "adjacent-blocks",
  "unicode",
  "unsafe-target",
  "malformed-html",
];

const REQUIRED_FIELDS = [
  "id",
  "category",
  "html",
  "expected_markdown",
  "expected_text",
];

function fail(message) {
  throw new Error(message);
}

export function validateFixtureDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    fail("fixture document must be an object");
  }
  if (document.schema_version !== 1) {
    fail("fixture schema_version must be 1");
  }
  if (document.provenance !== "synthetic-only") {
    fail("fixture provenance must be synthetic-only");
  }
  if (!Array.isArray(document.records) || document.records.length < 120) {
    fail("fixture corpus must contain at least 120 records");
  }

  const ids = new Set();
  const categories = new Set();
  const tags = new Set();

  for (const [index, record] of document.records.entries()) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      fail(`fixture at index ${index} must be an object`);
    }
    for (const field of REQUIRED_FIELDS) {
      if (!(field in record)) {
        fail(`fixture at index ${index} is missing required field ${field}`);
      }
      if (typeof record[field] !== "string") {
        fail(`fixture ${record.id ?? index} field ${field} must be a string`);
      }
    }
    if (!/^F\d{3}$/.test(record.id)) {
      fail(`fixture id ${record.id} must match F###`);
    }
    if (ids.has(record.id)) {
      fail(`duplicate fixture id: ${record.id}`);
    }
    ids.add(record.id);
    categories.add(record.category);

    if (record.expected_status !== undefined) {
      if (!Number.isInteger(record.expected_status) || record.expected_status < 100 || record.expected_status > 599) {
        fail(`fixture ${record.id} expected_status must be an integer HTTP status`);
      }
    }
    if (record.tags !== undefined) {
      if (!Array.isArray(record.tags) || record.tags.some((tag) => typeof tag !== "string" || tag.length === 0)) {
        fail(`fixture ${record.id} tags must be non-empty strings`);
      }
      for (const tag of record.tags) tags.add(tag);
    }
    if ("source_url" in record || "customer_id" in record || "scraped_from" in record) {
      fail(`fixture ${record.id} contains prohibited external/customer provenance metadata`);
    }
  }

  for (const category of REQUIRED_CATEGORIES) {
    if (!categories.has(category)) fail(`missing required fixture category: ${category}`);
  }
  for (const tag of REQUIRED_REVIEW_TAGS) {
    if (!tags.has(tag)) fail(`missing required hand-review coverage tag: ${tag}`);
  }

  return {
    count: document.records.length,
    categories: [...categories].sort(),
    category_counts: Object.fromEntries(
      [...categories].sort().map((category) => [
        category,
        document.records.filter((record) => record.category === category).length,
      ]),
    ),
    review_tags: REQUIRED_REVIEW_TAGS.filter((tag) => tags.has(tag)),
  };
}

export function readAndValidateFixtureFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return validateFixtureDocument(parsed);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const filePath = path.resolve(process.argv[2] ?? "tests/fixtures/corpus.json");
  const result = readAndValidateFixtureFile(filePath);
  console.log(`FIXTURES_OK count=${result.count}`);
  for (const category of Object.keys(result.category_counts)) {
    console.log(`CATEGORY ${category}=${result.category_counts[category]}`);
  }
  console.log(`REVIEW_TAGS ${result.review_tags.join(",")}`);
}
