# US029 requirements-to-fixtures map

This map ties the supported contract to reviewed synthetic fixtures and existing hard-boundary tests. The corpus is synthetic-only and now contains exactly 120 stable fixture IDs.

| Requirement family | Positive fixtures | Negative / boundary evidence |
| --- | --- | --- |
| Headings, paragraphs, containers, breaks, rules | F001-F010, F063-F068, F078 | F014, F077; tests/markdown-blocks.test.ts |
| Inline strong/emphasis/strike/literal escaping | F011-F016, F069-F080 | F014, F077, F079-F080; tests/markdown-inline.test.ts |
| Safe/unsafe links and URL classification | F017-F028, F081-F086 | F021-F022, F024-F025, F027-F028, F085-F086; tests/markdown-url-classifier.test.ts |
| Inline and fenced code | F029-F036, F087-F092 | F031-F032, F035, F088-F089; tests/markdown-code-inline.test.ts and tests/markdown-code-blocks.test.ts |
| Simple and complex tables | F037-F040, F117-F119 | F040; tests/markdown-tables.test.ts and tests/markdown-table-fallback.test.ts |
| Whitespace and entity normalization | F041-F046, F093-F098 | mixed-line-ending/entity regression tests in tests/text.test.ts |
| Removed/prohibited subtrees and controls | F047-F054, F099-F104 | all listed removed fixtures are negative leak checks; tests/clean.test.ts |
| Malformed HTML and parser recovery | F055-F056, F120 | tests/parser.test.ts and tests/parser-budget.test.ts |
| Lists, nesting, quote/details composition | F007-F010, F057-F058, F062, F111-F116 | tests/markdown-lists.test.ts, tests/markdown-quotes.test.ts, tests/markdown-composition.test.ts |
| Unicode, RTL, combining marks, emoji | F043, F045, F059-F061, F090, F096, F098, F105-F110 | tests/text.test.ts |
| Request/body/auth/routing precedence | integrated route suites | tests/routing.test.ts, tests/auth.test.ts, tests/body.test.ts, tests/request.test.ts, tests/error-isolation.test.ts |
| Parser event/node/depth/attribute hard limits | generated boundary fixtures | tests/parser-budget.test.ts plus scripts/generate-boundary-fixtures.mjs |
| Output scalar/byte hard limits and expansion | generated boundary fixtures | tests/output-writer.test.ts and tests/conversion-integration.test.ts |
| 500/503 and cross-request isolation | integrated Worker harness | tests/error-isolation.test.ts, including 100 mixed requests |

The minimum count is a coverage discipline, not a zero-bug claim. Expected outputs remain literal reviewed values; the regression runner never derives expected values from the converter under test.
