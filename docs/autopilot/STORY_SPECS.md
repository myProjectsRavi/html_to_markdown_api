# Durable blueprint story specifications

Source: HTML_Markdown_API_Implementation_Blueprint.docx, v1.0, 27 September 2026.
This repository copy exists so scheduled agents can recover story requirements without depending on chat attachment availability. The source text below is extracted from blueprint pages 13-35.

<PARSED TEXT FOR PAGE: 13 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 13
Implementation stories 001 and 002
US001 Establish the repository and checkpoint ledger
E01 / F01 | Prerequisite: None | Initial status: TODO
User outcome As the owner, I need a verified work branch and durable backlog so another agent can resume without 
touching unrelated work.
Implementation Confirm repository existence, owner and allowed branch. Inspect all repository instructions and 
current files. Create the work branch from the approved starting revision. Add all 44 story records, STATE.md and a 
state-schema validator under docs/autopilot and scripts. Record source-document version and the starting SHA.
Acceptance The validator accepts the initial backlog, rejects a missing ID, dependency cycle and DONE entry without 
evidence. A clean checkout can locate the next story without chat history. Git diff proves no protected-branch or 
unrelated-file edits.
Evidence Run the state validator and its negative fixtures. Record git status, branch and remote HEAD in US001.md, 
with credentials removed.
Boundary Do not create a repository under a guessed account. If repository access is unavailable, retain a local seed 
and mark remote initialization blocked.
US002 Install the hourly execution contract
E01 / F01 | Prerequisite: US001 | Initial status: TODO
User outcome As the owner, I need one active story per scheduled run and reliable resumption after interruption.
Implementation Configure the authorized agent launcher, its hourly trigger, branch lock and timeout. Add the handoff 
prompt, allowed-branch guard and startup state reconciliation. Make an interrupted synthetic run resumable. Install a 
minimal TypeScript build, lockfile and Workers test harness so subsequent stories have reproducible checks.
Acceptance Two triggers are observed; until then this story remains VALIDATING. Overlapping triggers do not edit 
concurrently. A killed fixture run resumes the same story. Wrong-branch execution exits before mutation. A minimal 
Worker test runs in sandbox or Actions.
Evidence Record scheduler IDs, run times, branch checks and resumed checkpoint evidence. Capture runtime and 
package versions. Never place runner tokens in reports.
Boundary If no coding-agent runner is connected, do not claim a cron schedule implements code. Leave runner setup 
blocked and specify the missing capability.

<PARSED TEXT FOR PAGE: 14 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 14
Implementation stories 003 and 004
US003 Freeze the machine readable API contract
E01 / F02 | Prerequisite: US002 | Initial status: TODO
User outcome As an integrator, I need stable request and response shapes before implementation starts.
Implementation Create typed request, success and error models in src/config.ts and src/errors.ts. Add a contract 
decision record with counting rules, validation precedence, endpoint names, response headers and numeric ceilings. 
Start openapi.yaml from this specification without undocumented options.
Acceptance Type-level examples distinguish markdown and text responses. The Hello example calculates 45 input 
bytes and outputs 14 and 12 scalars. Every documented error has one HTTP status and fixed message. Empty input has 
zero counts.
Evidence Run typecheck and a small contract test that independently computes example counts, including one emoji 
with four UTF-8 bytes and one scalar.
Boundary Do not copy the uploaded example’s incorrect input count. Contract changes later require an explicit 
decision and updated fixtures.
US004 Create the canonical synthetic fixture corpus
E01 / F02 | Prerequisite: US003 | Initial status: TODO
User outcome As a maintainer, I need reviewed expected outputs so regressions are detected independently of 
implementation.
Implementation Create tests/fixtures with JSON records containing ID, category, HTML, expected Markdown, 
expected text and status where applicable. Include at least 40 initial small fixtures spanning blocks, inline marks, URLs, 
code, tables, whitespace, entities and removed content. Generate boundary fixtures from scripts rather than 
committing megabytes.
Acceptance Fixture schema rejects missing expected fields and duplicate IDs. Hand-reviewed fixtures include nesting 
and adjacent block boundaries, Unicode, unsafe targets and malformed HTML. No customer or third-party scraped 
content appears in the corpus.
Evidence Run the fixture validator and list category coverage in US004.md. Keep expected values literal, not calculated 
by the converter being tested.
Boundary The corpus may expand later. Do not assert every renderer test passes before renderers exist; record 
pending implementation separately from fixture-validation results.

<PARSED TEXT FOR PAGE: 15 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 15
Implementation stories 005 and 006
US005 Implement exact routing and response headers
E02 / F03 | Prerequisite: US004 | Initial status: TODO
User outcome As an API consumer, I need predictable routes and methods with a small health endpoint.
Implementation Implement src/index.ts and thin route modules. Enforce case-sensitive exact paths, 404 and 405 
envelopes, Allow headers and the public health response. Apply no-store, nosniff and JSON content type centrally, 
including errors. Override framework HEAD, trailing-slash or redirect defaults that conflict.
Acceptance GET /health returns exactly the public status object. Wrong case and trailing slash return 404. HEAD and 
OPTIONS on known paths return 405. Unknown paths remain 404 even with a valid secret. Query values never appear 
in body or logs.
Evidence Run table-driven Request-to-Response tests inside the Workers harness for the route-method matrix and 
headers.
Boundary Conversion routes may use a typed internal placeholder until integration, but must not return fabricated 
conversion success. Do not expose a diagnostics endpoint.
US006 Authenticate RapidAPI origin requests
E02 / F03 | Prerequisite: US005 | Initial status: TODO
User outcome As the owner, I need business routes to reject direct requests without the gateway secret.
Implementation Implement src/auth/rapidapi.ts using RAPIDAPI_PROXY_SECRET. Validate configuration, cap supplied 
credential length and use a supported reviewed comparison approach. Authenticate before body consumption. Store 
the development test secret only in test configuration; production values use secret bindings.
Acceptance Missing, incorrect, prefix-only, suffix-only, oversized and duplicate/coalesced credentials fail with 403. 
Missing server configuration returns 503. Correct secret proceeds. A stream spy proves rejected authentication never 
invokes body reading. Health remains public.
Evidence Run auth integration tests including a request with a customer X-RapidAPI-Key but no proxy secret. Review 
log capture for both fake and actual secret patterns.
Boundary Do not trust subscription or user headers as authentication. Do not add an API key database or report 
constant-time guarantees without a supported primitive and review.

<PARSED TEXT FOR PAGE: 16 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 16
Implementation stories 007 and 008
US007 Read request bodies within a hard bound
E02 / F04 | Prerequisite: US006 | Initial status: TODO
User outcome As the operator, I need oversized requests stopped before memory grows with the entire body.
Implementation Implement src/http/body.ts with Content-Type and Content-Encoding checks, Content-Length early 
rejection and counted ReadableStream consumption. Cancel once actual bytes exceed 800000. Decode UTF-8 strictly 
after bounded collection. Propagate cancellation and map malformed bodies to fixed errors.
Acceptance Exactly 800000 raw bytes can reach JSON validation; one more returns 413. Missing or false Content￾Length does not bypass the cap. Unsupported encodings return 415. Split multibyte UTF-8 sequences decode correctly;
invalid sequences return 400. The reader is cancelled on overflow.
Evidence Use custom chunk streams with one-byte chunks, oversized chunks and early disconnects. Assert allocation 
strategy is bounded and body text never enters logs.
Boundary Do not call request.json() or request.text() on an unbounded stream. Infrastructure may reject some 
malformed transport inputs before the Worker; distinguish those outcomes.
US008 Validate JSON and decoded HTML precisely
E02 / F04 | Prerequisite: US007 | Initial status: TODO
User outcome As an integrator, I need consistent errors for invalid envelopes and accurate HTML size limits.
Implementation Parse bounded JSON and require an object with only a string html property. Reject unpaired UTF-16 
surrogates, arrays, null, extra fields and non-string values. Measure decoded HTML with TextEncoder before 
normalization. Document native JSON duplicate-key behavior as last value wins; do not introduce a second homemade
JSON parser.
Acceptance Absent html yields missing_html; null or number yields invalid_request. Empty string succeeds 
downstream. ASCII and multibyte strings at 131072 UTF-8 bytes pass this layer; plus one fails. Escaped JSON forms 
count decoded HTML bytes. Emoji and combining marks retain their defined counts.
Evidence Run JSON schema and boundary tests with raw-body and HTML-byte ceilings exercised independently. 
Include whitespace-only HTML and a duplicate html key fixture.
Boundary Do not treat JSON string length as UTF-8 size. Accepted envelope validation does not guarantee later 
complexity or output limits will pass.

<PARSED TEXT FOR PAGE: 17 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 17
Implementation stories 009 and 010
US009 Select a parser with measured evidence
E03 / F05 | Prerequisite: US008 | Initial status: TODO
User outcome As a maintainer, I need a parser that fits Workers and exposes enforceable limits.
Implementation Build temporary adapters for at least two established candidates using the pinned Worker test 
runtime. Compare bundle size, early-stop behavior, entity handling, broken HTML, depth, huge attributes and 
representative 1–128 KiB inputs. Read dependency licenses and current security advisories. Select one and remove 
unused production dependencies.
Acceptance The chosen parser imports in Workers without native modules, network calls or a browser DOM. It stops 
when the adapter rejects complexity. The decision names known malformed-HTML differences and memory risks. No 
parser is chosen solely from familiarity or a microbenchmark on tiny text.
Evidence Preserve the benchmark harness, candidate versions, lockfiles or version table, results and selection rationale
in docs/decisions/parser.md.
Boundary This is a bounded selection spike. If neither candidate can enforce safe limits, checkpoint findings and 
continue this story; do not quietly accept unbounded parsing.
US010 Build the bounded parser adapter
E03 / F05 | Prerequisite: US009 | Initial status: TODO
User outcome As the operator, I need malicious structure rejected during parsing rather than after full allocation.
Implementation Implement src/html/parse.ts and limits.ts around parser events. Count all events and open depth, 
validate attributes before retention and retain at most the configured node budget. Use iterative traversal and 
bounded stacks. Track skipped subtrees without constructing them. Normalize parser failures into typed limit or 
internal errors.
Acceptance Each event, node, depth and attribute limit has exact-boundary and plus-one tests. Deep discarded 
script/template content still consumes relevant parse budgets. Long malformed tags cannot force unbounded retained
memory. An exception ends parsing and cannot produce partial 200 output.
Evidence Run targeted adversarial fixtures plus Workers integration. Include parser-stop spies, allocation reasoning 
and the smallest reproducer for each limit.
Boundary A timer cannot preempt synchronous JavaScript parsing. Do not use Promise.race as a substitute for 
structural bounds or claim a hard CPU cutoff in application code.

<PARSED TEXT FOR PAGE: 18 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 18
Implementation stories 011 and 012
US011 Normalize safe content into a shared tree
E03 / F06 | Prerequisite: US010 | Initial status: TODO
User outcome As a consumer, I need active and non-content subtrees excluded consistently from both outputs.
Implementation Implement clean.ts with allowlisted retained attributes and explicit subtree-drop rules. Keep text 
nodes and structural tags required by the two renderers. Decode entities once through the parser. Remove comments,
doctypes and prohibited content, including SVG/MathML and form controls as specified.
Acceptance Script/style/template text never appears. Unsupported custom tags preserve safe children without raw 
tags. Mixed-case tags and malformed closures follow the pinned parser decision. Attributes such as onclick, style, 
srcset and data-* never reach writers. Nested removed content does not leak.
Evidence Compare normalized-tree fixtures, then inspect the same fixtures through temporary text extraction. Record 
decisions for any parser-specific recovery cases.
Boundary Do not remove header/footer/nav as article extraction. Do not evaluate CSS, hidden attributes, scripts or 
DOM layout. Normalization is not a sanitizer service.
US012 Preserve Unicode and normalize whitespace
E03 / F06 | Prerequisite: US011 | Initial status: TODO
User outcome As an international user, I need my writing preserved while layout whitespace becomes predictable.
Implementation Add shared text helpers that normalize CRLF/CR, collapse HTML ASCII whitespace outside pre/code 
and preserve non-breaking spaces, combining marks and right-to-left text. Represent block separation structurally 
instead of global regular-expression replacements. Treat pre/code content as protected segments.
Acceptance Fixtures for Hindi, Telugu, Arabic, emoji, combining marks, entities, tabs and mixed line endings preserve 
expected text. Adjacent inline words do not join accidentally. Entity-encoded ampersands decode once only. Script￾removal boundaries do not introduce executable or raw fallback content.
Evidence Run exact text-helper tests and Unicode scalar-count tests. Include &amp;lt; as a fixture proving there is no 
second entity decode.
Boundary Do not lowercase, transliterate, apply Unicode compatibility normalization or strip invisible characters from 
content. URL validation has its own stricter policy.

<PARSED TEXT FOR PAGE: 19 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 19
Implementation stories 013 and 014
US013 Render Markdown blocks
E04 / F07 | Prerequisite: US012 | Initial status: TODO
User outcome As a customer, I need headings and paragraphs that preserve document structure.
Implementation Implement the bounded Markdown writer for h1–h6, p, structural containers, br and hr. Separate 
logical blocks with two LF characters and trim only generated outer separators. Add block-leading punctuation 
escaping for ordinary text. Ensure containers do not multiply blank lines.
Acceptance Exact fixtures cover every heading level, adjacent and nested blocks, empty wrappers, repeated br and hr 
between paragraphs. br renders a hard break. Input text resembling a heading remains text when it was not an h 
element. No source tag is emitted.
Evidence Run block fixtures through the Workers harness and a pinned test-only Markdown renderer to compare 
intended structure.
Boundary Do not add smart title detection or CSS layout rules. Retain pre/code placeholders as typed nodes until their 
dedicated stories.
US014 Render inline formatting and literal text
E04 / F07 | Prerequisite: US013 | Initial status: TODO
User outcome As a customer, I need readable emphasis without accidental links or broken delimiters.
Implementation Implement strong/b, em/i and s/del plus context-aware literal escaping. Normalize redundant 
identical wrappers. Move edge whitespace outside formatting delimiters and discard empty wrappers. Escape 
brackets, backslashes and angle brackets correctly without double escaping output already emitted by structural 
nodes.
Acceptance Nested formatting, punctuation-adjacent emphasis, empty tags, whitespace-only emphasis and literal 
Markdown text have exact outputs. Entity-derived <script> is inert text in the downstream-rendering test. Escaping 
does not alter plain Unicode words.
Evidence Run inline fixtures and renderer-AST assertions for nested delimiter cases. Keep literal expected Markdown 
plus expected rendered text where ambiguity exists.
Boundary Do not solve delimiter failures by disabling all formatting or by serializing raw HTML. If a combination cannot
represent formatting safely, use documented readable text fallback.

<PARSED TEXT FOR PAGE: 20 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 20
Implementation stories 015 and 016
US015 Render ordered and nested lists
E04 / F08 | Prerequisite: US014 | Initial status: TODO
User outcome As a customer, I need list hierarchy to survive conversion.
Implementation Add iterative list rendering with marker-width-aware continuation indentation. Support ol start within
the documented range, nested ul/ol, paragraphs within items and empty items. Ignore reversed and li value as 
specified. Bound recursion through the shared tree-depth limit.
Acceptance Fixtures cover two-digit ordered markers, three nested levels, multi-paragraph items, mixed lists and a 
code placeholder inside a list. A start of 10 preserves correct continuation indentation. Invalid start values fall back to 
1. Sibling content remains outside the list.
Evidence Run exact fixture assertions and renderer structure checks proving nesting and item counts match supported 
input.
Boundary Do not renumber from browser styling or implement CSS counters. Cases with orphan li follow a 
documented readable block fallback.
US016 Render quotes and disclosure fallback
E04 / F08 | Prerequisite: US015 | Initial status: TODO
User outcome As a customer, I need quoted and collapsed content included in reading order.
Implementation Add line-aware blockquote rendering and details/summary fallback. Apply quote prefixes after 
rendering contained blocks so blank lines, nested lists and code fences remain inside the quote. Preserve summary 
once, then body content in source order.
Acceptance Nested blockquotes retain depth; quoted blank lines cannot terminate the quote unexpectedly. A list 
followed by a paragraph inside a quote renders correctly. details without summary and nested details preserve text 
without invented labels.
Evidence Run quote/disclosure fixtures and downstream structural checks for containment and duplicate text.
Boundary Do not hide details body because it was collapsed in a browser. Do not add interactive HTML or invent an 
expandable Markdown widget.

<PARSED TEXT FOR PAGE: 21 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 21
Implementation stories 017 and 018
US017 Render safe inline code spans
E04 / F09 | Prerequisite: US016 | Initial status: TODO
User outcome As a developer customer, I need code containing backticks and punctuation preserved.
Implementation Implement the CommonMark-compatible backtick delimiter algorithm and padding rules. Normalize 
inline code newlines to spaces. Preserve literal punctuation and avoid ordinary escaping inside code spans. Handle 
empty and all-space code with explicit canonical cases.
Acceptance Fixtures include one or several backtick runs, leading/trailing spaces, only backticks, all spaces, emoji and 
Markdown punctuation. The rendered code text matches the documented normalized source. Runtime remains linear 
in code length.
Evidence Assert exact fences and independently parse the Markdown result in tests. Include long adversarial backtick 
runs and confirm output ceilings apply.
Boundary Do not apply fenced-block rules to inline code or use a fixed single backtick delimiter for every input.
US018 Render fenced preformatted blocks
E04 / F09 | Prerequisite: US017 | Initial status: TODO
User outcome As a developer customer, I need pasted source code to retain whitespace and not break surrounding 
Markdown.
Implementation Implement fenced pre rendering with fences longer than contained backtick runs. Preserve internal 
and trailing newline semantics; use an explicit synthetic separator only where needed before the closing fence. Parse a
language label only from the approved child-code class pattern. Integrate code blocks in lists and quotes.
Acceptance Test CRLF normalization, blank first/last lines, no final newline, tabs, embedded triple fences and malicious
language classes. Renderer checks recover expected code text under the documented Markdown newline behavior. 
Fence selection and writer accounting remain bounded.
Evidence Run code fixtures, nested-list/quote regression checks and output-limit boundaries caused by fences.
Boundary Markdown renderers can normalize terminal code-block newlines; document that serialization distinction. 
Do not claim byte-identical round trips through arbitrary renderers or add syntax highlighting.

<PARSED TEXT FOR PAGE: 22 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 22
Implementation stories 019 and 020
US019 Classify link and image targets
E05 / F10 | Prerequisite: US018 | Initial status: TODO
User outcome As an integrator, I need unsafe or ambiguous schemes removed without losing visible content.
Implementation Implement a pure URL classifier with entity-decoded input, the scheme allowlist, relative-reference 
policy, control and backslash rejection, host and credential checks, and the 2048-byte limit. Add bounded validation of 
percent-obfuscated prefixes without modifying valid relative path escapes.
Acceptance Allow HTTP(S), mailto links, fragments, query references and normal paths. Reject mixed-case javascript, 
data, vbscript, file, // hosts, control-obfuscated schemes, credential-bearing HTTP and encoded colon tricks. Mailto 
never qualifies as an image source.
Evidence Use a table of at least 60 target fixtures with classification reason codes for tests only. Check linear handling 
of long percent sequences.
Boundary Do not resolve against a fabricated base URL. Do not perform DNS, fetching or arbitrary repeated percent 
decoding. Error reasons must not echo targets publicly.
US020 Serialize Markdown links safely
E05 / F10 | Prerequisite: US019 | Initial status: TODO
User outcome As a customer, I need accepted links that remain syntactically correct in Markdown.
Implementation Build destination and label serializers separately. Encode dangerous destination delimiters while 
preserving valid percent triplets. Apply the classifier before serialization. Preserve visible children for unsafe targets; 
flatten inner actionable links. Ignore title attributes.
Acceptance Brackets and backslashes in labels cannot escape the link. URLs containing spaces, parentheses, quotes 
and angle brackets produce exactly one intended link. Unsafe href produces visible text without a destination. Relative 
links remain relative, including query and fragment suffixes.
Evidence Run exact URL fixtures and inspect downstream renderer link targets. Include a label containing Markdown 
image syntax and an encoded control target.
Boundary Do not rely on a downstream renderer to reject an unsafe scheme. Consumer rendering still needs separate 
sanitization and an appropriate URL policy.

<PARSED TEXT FOR PAGE: 23 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 23
Implementation stories 021 and 022
US021 Render images without resource access
E05 / F11 | Prerequisite: US020 | Initial status: TODO
User outcome As a customer, I need image references or useful alt text without downloads.
Implementation Implement img using the image-specific URL classifier and escaped alt labels. A safe src emits an 
image even with empty alt; an unsafe/missing src emits meaningful alt text or nothing. Ignore srcset, event attributes, 
style, dimensions and titles. Apply output budgeting to alt and destination expansion.
Acceptance Fixtures cover safe absolute and relative src, fragment policy, empty alt, bracket/backslash alt, data URIs 
and JavaScript targets. Invalid src cannot become an active link. A failing network stub proves no fetch for any source 
or source-set candidate.
Evidence Run image fixtures and egress-trap tests in Workers. Review final Markdown AST for the exact image 
destination and alt text.
Boundary Do not embed base64, probe media types, download dimensions or require image availability to complete 
conversion.
US022 Render simple rectangular tables
E05 / F11 | Prerequisite: US021 | Initial status: TODO
User outcome As a customer, I need small ordinary tables converted without losing the first data row.
Implementation Implement table shape detection across thead/tbody/tfoot in source order. For uniform non-nested 
rows with no effective spans, render GFM tables. Use an all-th first row as header; otherwise insert empty headers. 
Flatten cell text, escape pipes and apply row/column/cell limits.
Acceptance Fixtures cover headerless tables, empty cells, a one-cell table, explicit sections, embedded pipes and 
Unicode. Headerless input retains all rows. Table limits accept exact boundaries and reject plus one. Ignored 
formatting does not drop cell text.
Evidence Run exact table outputs and a GFM test-renderer check for column and row counts. Record header policy in 
docs.
Boundary Do not guess a header by boldness, content or CSS. Do not emit raw table HTML as a compatibility shortcut.

<PARSED TEXT FOR PAGE: 24 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 24
Implementation stories 023 and 024
US023 Degrade complex tables predictably
E05 / F12 | Prerequisite: US022 | Initial status: TODO
User outcome As a customer, I need irregular tables to remain readable instead of causing failures.
Implementation Implement text-row fallback for uneven widths, spans and nested tables. Preserve each visible cell’s 
text once and nested blocks in source order. Use a typed fallback path that respects the same writer budgets as 
ordinary content. Distinguish unsupported shape from complexity-limit violation.
Acceptance Rowspan/colspan and uneven rows use the documented separators. A nested table neither duplicates nor 
drops its text. Huge dimensions still return 422. Malformed closing tags follow the parser decision without throwing. A 
complex table followed by text maintains its boundary.
Evidence Run hand-reviewed irregular table fixtures and text-occurrence counts for unique cell canaries.
Boundary Do not expand spanned cells, reconstruct browser layout or replace limit errors with unbounded text 
fallback.
US024 Close Markdown fallback and composition gaps
E05 / F12 | Prerequisite: US023 | Initial status: TODO
User outcome As an integrator, I need mixed real-world fragments to follow one predictable output contract.
Implementation Integrate unsupported-element fallback, ordinary header/footer/nav content and all Markdown 
nodes. Add combination fixtures with links in lists, images in quotes, code near tables, details containing lists and 
unknown custom tags around block children. Use final structural separator normalization.
Acceptance No unsupported tag becomes raw HTML. Text appears in source order once, except deliberately dropped 
subtrees. Every mixed fixture has exact output and bounded conversion. A plain-text input resembling HTML-escaped 
markup remains literal after Markdown rendering.
Evidence Run the full Markdown fixture subset and renderer-structure checks. Review generated Markdown from 
representative article and code examples.
Boundary Do not introduce article extraction, language models or heuristics to make aesthetically preferred output. V1
choices must remain deterministic.

<PARSED TEXT FOR PAGE: 25 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 25
Implementation stories 025 and 026
US025 Render clean text blocks and inline content
E06 / F13 | Prerequisite: US024 | Initial status: TODO
User outcome As an indexing customer, I need readable text without generated Markdown syntax.
Implementation Implement src/html/text.ts directly over the shared normalized tree. Handle headings, paragraphs, 
inline marks, line breaks, horizontal separators and ordinary containers. Preserve literal user punctuation and 
protected code text. Reuse separator tokens, not Markdown stripping.
Acceptance Bold and headings add no markup delimiters. Literal * and < characters in text remain. Adjacent inline text 
has correct spacing; nested blocks have stable blank lines. Removed script/style text is absent. Empty HTML returns an 
empty string.
Evidence Run exact text fixtures and a test demonstrating why Markdown stripping would incorrectly change a literal 
punctuation sample.
Boundary Do not require plain-text output to be safe for innerHTML. It is a JSON string for text handling; integration 
docs must show safe insertion.
US026 Render structured content as clean text
E06 / F13 | Prerequisite: US025 | Initial status: TODO
User outcome As an ETL customer, I need lists, tables and code represented without invisible data loss.
Implementation Add text policies for nested lists, quotes, links, images, details, pre/code and simple or complex 
tables. Use item newlines with two-space nesting indentation, tab-delimited table cells and no appended link URLs. 
Preserve meaningful image alt and source code whitespace.
Acceptance Nested list structure is readable with no generated bullet syntax. Link visible text survives unsafe href. 
Table cell tabs/newlines are normalized so separators remain unambiguous. Span fallback and nested tables preserve 
each text token once. Pre whitespace remains untouched.
Evidence Run exact structured-text fixtures and cross-renderer tests confirming both writers drop the same prohibited 
subtrees.
Boundary Do not implement text by stripping the finished Markdown. Do not add semantic headings, inferred labels or
URLs absent from visible text.

<PARSED TEXT FOR PAGE: 26 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 26
Implementation stories 027 and 028
US027 Enforce bounded output and factual statistics
E06 / F14 | Prerequisite: US026 | Initial status: TODO
User outcome As the operator, I need escaping and nesting expansion to remain bounded.
Implementation Complete the shared writer with incremental scalar and UTF-8 counters before appending chunks. 
Include generated delimiters, indentation and separators in the budget. Integrate both routes and compute final stats 
from the actual final string. Avoid repeated whole-string concatenation or recounting after every character.
Acceptance Exactly allowed output succeeds and one more scalar or byte fails with 422. Deep quote/list expansion and
escaping amplification cannot bypass limits. Emoji counts differ correctly between bytes and scalars. No partial result is
returned after a writer exception.
Evidence Run writer unit boundaries, route integration fixtures and expansion attacks. Assert independent final 
counters agree with incremental accounting.
Boundary Do not silently clip text or use JavaScript string.length as output_chars. JSON escaping expansion is bounded 
by the already bounded result and must be included in memory review.
US028 Finalize error precedence and stateless requests
E06 / F14 | Prerequisite: US027 | Initial status: TODO
User outcome As a consumer, I need stable failures and no cross-request data leakage.
Implementation Wire typed parse, body and writer failures into fixed error responses. Catch unexpected exceptions 
only at the route boundary. Add concurrent and sequential request-isolation tests with unique synthetic canaries. 
Audit globals and cleanup paths after malformed input and limit failures.
Acceptance When multiple problems exist, the documented validation order determines the error. No stack, input, 
output or canary leaks into another response or log. A valid request succeeds after a failing request. Both endpoints 
share exact error envelopes and security headers.
Evidence Run failure-injection tests and at least 100 mixed requests in the Worker harness. Record every expected 
status, including 500 and 503 injection cases.
Boundary Do not describe infrastructure timeouts or Worker resource-limit responses as controlled application JSON. 
Keep known platform differences in the integration guide.

<PARSED TEXT FOR PAGE: 27 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 27
Implementation stories 029 and 030
US029 Complete the supported behavior regression suite
E07 / F15 | Prerequisite: US028 | Initial status: TODO
User outcome As the owner, I need evidence covering every promised conversion rule.
Implementation Expand the corpus to at least 120 reviewed fixtures, with both endpoint expectations wherever 
meaningful. Build a requirements-to-fixtures map. Include every source test category, all newly specified fallback 
decisions, error statuses and each hard-limit boundary. Keep fixture names descriptive and stable.
Acceptance Every rule in the contract maps to at least one positive and one relevant negative or boundary case. No 
fixture is skipped to obtain a pass. Route tests cover the integrated handler, not only helpers. Expected output changes
have a reviewed reason.
Evidence Run the complete offline regression suite from a clean checkout. Save test counts, exit status and exact SHA 
in VALIDATION.md.
Boundary Fixture count is a minimum coverage discipline, not evidence of zero bugs by itself. Do not replace 
meaningful assertions with snapshots nobody reviewed.
US030 Add reproducible property and fuzz tests
E07 / F15 | Prerequisite: US029 | Initial status: TODO
User outcome As the operator, I need malformed input exploration beyond hand-picked examples.
Implementation Create a deterministic grammar-based generator for tags, entities, URLs, whitespace and bounded 
nesting. Run 10000 seeded cases per full CI campaign with per-case size caps and an overall job timeout. Minimize 
failing seeds and promote them to regression fixtures.
Acceptance For every generated case, conversion either succeeds within bounds or returns a documented error; it 
never hangs or escapes the harness. Repeating an input yields the same result. Counters match outputs. Removed 
subtrees never leak their synthetic markers. Network traps stay untouched.
Evidence Record seed range, generator version, runtime, total cases and any minimized failures. Verify replay of one 
saved case from a fresh checkout.
Boundary Do not assert conversion idempotence by feeding Markdown back as HTML; it is not the same 
transformation. Fuzzing remains entirely synthetic and offline.

<PARSED TEXT FOR PAGE: 28 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 28
Implementation stories 031 and 032
US031 Audit security and privacy behavior
E07 / F16 | Prerequisite: US030 | Initial status: TODO
User outcome As the owner, I need verified controls for the actual supported threat model.
Implementation Run a focused source and artifact review for raw HTML fallback, URL scheme bypass, unsafe regex, 
unbounded recursion, secret handling and log leakage. Inject synthetic content and credential canaries. Run 
Markdown consumer tests with raw HTML enabled to expose accidental passthrough. Audit runtime imports and 
outbound primitives.
Acceptance All identified defects are fixed with regression tests. No prohibited content appears in responses, logs or CI
artifacts. No runtime network or storage call exists or executes. An injected parser exception cannot reveal content. 
Findings distinguish API controls from downstream rendering responsibilities.
Evidence Create SECURITY_REVIEW.md with file-level findings, reproductions, fixes and remaining scoped limitations. 
Run the security suite and secret scan on tracked files and relevant history.
Boundary Do not call the API an XSS firewall or a certified enterprise security product. Security approval is limited to 
inspected code and test evidence.
US032 Harden dependencies and CI permissions
E07 / F16 | Prerequisite: US031 | Initial status: TODO
User outcome As the maintainer, I need repeatable validation without exposing deployment credentials to untrusted 
code.
Implementation Pin dependencies, lockfile, runtime and GitHub Actions revisions. Separate read-only PR checks from 
protected deploy jobs. Audit dependency licenses, advisories, install scripts and transitive runtime packages. Add 
secret scanning and a bundle/import check. Configure finite timeouts and artifact retention.
Acceptance A fork or untrusted PR cannot read secrets or deploy. No pull_request_target path executes untrusted 
code with credentials. Rebuilding from lockfile yields expected artifacts. Known critical/high vulnerabilities are 
resolved; any other finding has a reviewed impact decision before release.
Evidence Run CI permission review, dependency audit with dated advisory data and a clean install/build. Record when 
advisory access is unavailable as a blocked freshness check.
Boundary Online dependency/advisory retrieval may occur in sandbox or Actions setup; the deterministic conversion 
test suite itself must remain offline. Do not weaken checks to avoid network failures.

<PARSED TEXT FOR PAGE: 29 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 29
Implementation stories 033 and 034
US033 Measure the complete conversion pipeline
E08 / F17 | Prerequisite: US032 | Initial status: TODO
User outcome As the owner, I need reproducible performance evidence before selling an input limit.
Implementation Implement bench generators and the measurement protocol from the performance section. Measure
both endpoints across all families and sizes with accepted/rejected labels. Include JSON processing, parser, 
normalization, serialization, bundle size and available memory evidence. Keep 256 KiB experimental configuration 
isolated.
Acceptance Results contain warmup/sample counts, p50/p95/p99/max, failures, revision, versions and method. No 
error fast path is mixed into a successful-conversion distribution. Full 128 KiB ordinary fixtures are actually accepted 
where their other limits permit. Outliers are investigated.
Evidence Run three sandbox benchmark processes and export machine-readable results plus BENCHMARKS.md. CI 
reproduces the same corpus without promising identical wall times.
Boundary No local timing is represented as production CPU. If profiling cannot measure a quantity, state unavailable 
rather than filling an estimate into a pass column.
US034 Remove measured performance bottlenecks
E08 / F17 | Prerequisite: US033 | Initial status: TODO
User outcome As the owner, I need safe headroom within the free runtime budget.
Implementation Profile the slowest supported fixtures. Fix measured repeated scans, quadratic concatenation, 
duplicate entity work or unnecessary tree retention. Re-run targeted correctness and the full benchmark corpus after 
each material optimization. Validate bundle and memory targets. Keep limits conservative.
Acceptance No correctness fixture regresses. Every claimed improvement includes comparable before/after 
measurements and sample counts. The release configuration remains 128 KiB. If local evidence is insufficient or 
already exceeds budget, this story stays open for a smaller reviewed ceiling or parser change.
Evidence Attach profiles, exact revisions and benchmark deltas. Explain any threshold change in a decision record and 
update OpenAPI and tests together.
Boundary Do not remove protections, skip malformed cases or buy infrastructure to make the benchmark green. Do 
not expand to 256 KiB as an incidental optimization.

<PARSED TEXT FOR PAGE: 30 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 30
Implementation stories 035 and 036
US035 Define the free account capacity envelope
E08 / F18 | Prerequisite: US034 | Initial status: TODO
User outcome As the owner, I need plan limits that do not overpromise a shared daily allowance.
Implementation Inventory account-wide daily request commitments using authorized aggregate data. Prepare a 
capacity worksheet with this API’s proposed reserve, other APIs, health checks, staging traffic, expected customers and
burst assumptions. Verify current RapidAPI hard quota and rate-control options before configuring a listing.
Acceptance The worksheet uses account-wide daily capacity rather than a per-API assumption. Monthly plan totals are
converted into both average and worst-case daily bursts. A rejected or unauthenticated request’s capacity impact is 
included. An explicit launch decision addresses unsupported bursts.
Evidence Record dated platform references and sanitized capacity calculations. Keep proposed pricing separate from 
verified platform settings.
Boundary Do not fabricate existing account usage. If access is absent, document input fields and block paid launch 
rather than declare unused capacity.
US036 Configure privacy safe operational visibility
E08 / F18 | Prerequisite: US035 | Initial status: TODO
User outcome As the operator, I need error and resource signals without storing submitted content.
Implementation Disable request/response body logging, framework request loggers and automatic sensitive traces. 
Prefer built-in aggregate metrics. If application metrics are needed, allow only constant route IDs, status, coarse size 
buckets and error class. Use staging-only synthetic observability for platform CPU validation and record the production 
observability setting.
Acceptance Canary requests and injected errors produce no HTML, output, secret, URL query or personal data in 
accessible logs. Metrics distinguish validation errors from internal/resource failures. Logging failures cannot fail 
conversion. Production configuration has no external telemetry sink or payload persistence.
Evidence Capture sanitized configuration and canary search results. Note platform-owned logging beyond the 
backend’s control and avoid claims about RapidAPI retention.
Boundary CPU time must come from platform telemetry or a stated measurement source; an ordinary duration field is 
not CPU. Do not add an analytics database.

<PARSED TEXT FOR PAGE: 31 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 31
Implementation stories 037 and 038
US037 Complete and validate OpenAPI
E09 / F19 | Prerequisite: US036 | Initial status: TODO
User outcome As an integrator, I need a machine-readable description matching the deployed behavior.
Implementation Complete openapi.yaml with all three paths, schema constraints, response examples, status codes, 
limits and authentication descriptions. Separate customer-facing RapidAPI headers from the private origin proxy 
credential. Add a contract test that exercises examples and checks response shapes against the specification.
Acceptance An OpenAPI validator passes. Generated examples use factual byte/scalar counts, not copied placeholders.
No URL-fetch endpoint or hidden option exists. Every implemented error and limit is described. The real proxy secret is
absent from the public specification.
Evidence Run spec lint, schema validation and route-to-spec checks in Actions or sandbox. Record the tested code SHA
and spec revision.
Boundary Do not imply clients should set the origin proxy secret when calling RapidAPI. If a spec version is 
incompatible with marketplace import, adapt after checking current requirements.
US038 Write and execute integration examples
E09 / F19 | Prerequisite: US037 | Initial status: TODO
User outcome As a paying customer, I need a successful first request and clear troubleshooting.
Implementation Write README and examples for curl, JavaScript fetch and Python, using environment placeholders 
for customer credentials. Explain UTF-8 byte limits, Unicode output counts, deterministic scope, relative links, fallback 
behavior and no-store processing. Include fixed errors and safe text/Markdown rendering guidance.
Acceptance All examples execute from sandbox or Actions against the local Worker with test credentials and expected 
outputs. The docs distinguish local origin tests from RapidAPI calls. No sample leaks a secret, suggests URL fetching or 
promises browser-equivalent rendering. Retry guidance excludes 4xx validation errors.
Evidence Add automated example smoke tests and record outputs with synthetic data. Confirm the shortest quickstart
contains one valid request and its exact response.
Boundary Do not require a website, separate SDK package or paid tooling. Avoid screenshots as the sole integration 
instruction.

<PARSED TEXT FOR PAGE: 32 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 32
Implementation stories 039 and 040
US039 Prepare the RapidAPI product draft
E09 / F20 | Prerequisite: US038 | Initial status: TODO
User outcome As the owner, I need an honest listing that explains why someone would pay for a small utility.
Implementation Prepare listing title, short description, endpoint examples, tag suggestions, limitations, privacy 
wording, support contact placeholder and plan configuration checklist. Carry the source pricing only as an experiment: 
Free 1000, PRO 25000 at $4.99, ULTRA 100000 at $14.99, MEGA 500000 at $39.99 monthly. Reconcile these with 
US035 before activation.
Acceptance Draft claims match tested capabilities. Plans specify hard monthly limits and no initial overage, subject to 
platform support. No zero-bug, unlimited, fastest, guaranteed earnings, zero platform logging or enterprise-SLA claim 
appears. Support details and marketplace category are confirmed rather than invented.
Evidence Save a reviewable listing document and the proposed plan table. Cross-check every advertised capability 
against a fixture or release gate.
Boundary This story prepares a draft, not a public listing or paid subscription activation. Actual publication requires the
release decision in US044.
US040 Prepare staging ingress and secret configuration
E09 / F20 | Prerequisite: US039 | Initial status: TODO
User outcome As the operator, I need an origin configuration that fails closed and can be tested before publication.
Implementation Create isolated staging and production configuration using an existing authorized Cloudflare account. 
Choose an existing domain/route if available; otherwise document workers.dev exposure. Disable preview URLs and, 
for custom-domain production, workers.dev. Install secrets through protected bindings. Prepare a scoped deployment 
credential.
Acceptance Authorized staging accepts the configured proxy secret and rejects missing/incorrect secrets before 
parsing. No unused public alias bypasses authentication. Config inspection shows no database, queue, cron, storage or 
external service bindings. No new domain or paid service is purchased.
Evidence Run a small synthetic curl smoke from sandbox or Actions and record deployment version, config hash and 
auth results. If credentials are missing, retain a deployable configuration and mark staging validation blocked.
Boundary Do not place the secret in URLs, shell traces or committed environment files. WAF rules are optional defense
and cannot replace application authentication.

<PARSED TEXT FOR PAGE: 33 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 33
Implementation stories 041 and 042
US041 Assemble exact revision release validation
E10 / F21 | Prerequisite: US040 | Initial status: TODO
User outcome As the owner, I need one authoritative release run tying every gate to the same code.
Implementation Build a protected release-candidate workflow that checks out an immutable SHA, installs from 
lockfile, runs typecheck, lint, tests, security checks, deterministic fuzzing, examples, bundle build and contract checks. 
Produce a manifest of source SHA, lock hash, config hash and bundle hash. Deploy only an authorized candidate to 
staging for CPU sampling.
Acceptance Every required job points to the same candidate. Fresh staging evidence meets the platform CPU targets 
and no resource-limit errors occur in the quota-bounded matrix. Missing telemetry blocks the CPU claim. A red, 
skipped or cancelled required job cannot produce a ready manifest.
Evidence Save CI run URLs, hashes, sample counts and sanitized telemetry summaries in RELEASE.md. Read actual job 
conclusions; do not infer success from workflow dispatch.
Boundary Test runners remain sandbox or Actions. Do not change the candidate after collecting evidence; any code or 
runtime-config change invalidates affected release gates.
US042 Rehearse deployment and rollback
E10 / F21 | Prerequisite: US041 | Initial status: TODO
User outcome As the owner, I need to restore the last known good artifact quickly after a bad release.
Implementation Write deploy and rollback runbooks using immutable Worker versions. On staging, deploy candidate 
A, deploy a controlled candidate B, restore A and run the same synthetic health, auth and conversion smokes. Record 
the previous version and verify that secret/config changes are handled separately from code rollback.
Acceptance Rollback restores the expected bundle and behavior, not just an old label. The procedure needs no 
customer content or database migration. A missing previous version has an explicit first-release recovery plan to 
disable public listing or restore the prepublication candidate.
Evidence Record version IDs, command exit statuses, elapsed recovery time and exact smoke outputs. Rehearse only 
on the authorized staging target.
Boundary Do not assume code rollback restores secret values or platform routes. Do not introduce a production 
incident merely to test recovery.

<PARSED TEXT FOR PAGE: 34 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 34
Implementation stories 043 and 044
US043 Review the production readiness packet
E10 / F22 | Prerequisite: US042 | Initial status: TODO
User outcome As the owner, I need an evidence-backed release decision before customers subscribe.
Implementation Review every mandatory story, known issue, decision, source diff, secret scan, performance result, 
contract and listing draft. Confirm no unresolved defect in the supported contract, no unaudited dependency change 
and no missing operational access. Produce the release gate matrix with exact candidate identifiers and remaining 
external actions.
Acceptance All technical gates must be PASS with evidence to close this story; any BLOCKED gate keeps it open. No 
waiver converts a failed security, privacy, correctness or resource-safety gate to PASS. Plan capacity and ingress 
tradeoffs have owner decisions. The packet distinguishes publishing-ready from already published.
Evidence Write RELEASE.md and a concise owner review summary naming the candidate SHA, bundle hash, staging 
version and any account action still required.
Boundary Prepare all reviewable artifacts before requesting the final deployment/publication authorization. Do not 
ask the owner to approve an unbuilt or untested proposal.
US044 Publish the approved candidate and close delivery
E10 / F22 | Prerequisite: US043 | Initial status: TODO
User outcome As the owner, I need the approved version exposed through RapidAPI and verified end to end.
Implementation After existing authorization is confirmed or final approval is received, deploy the exact candidate, set 
the gateway origin and proxy secret, activate the approved plan settings and publish the listing. Run synthetic health, 
valid conversions, invalid auth and validation-error smokes from sandbox or Actions through appropriate origin and 
marketplace paths.
Acceptance The published version and configuration match the approved manifest. RapidAPI customer credentials 
work through the gateway; direct origin requests without its secret fail. Listing examples and quotas match the 
approved settings. No duplicate listing is created if a prior run partially completed.
Evidence Record publication URL, Worker version, final SHA, sanitized smoke results and owner approval reference. 
Mark all stories DONE only after actual evidence. Set state COMPLETE and leave future scheduled runs read-only.
Boundary If deployment or marketplace access is missing, report PUBLISHING_READY with US044 BLOCKED. Do not 
report published or fabricate a live smoke; preserve the prepared packet for resumption.

<PARSED TEXT FOR PAGE: 35 / 39>

HTML TO MARKDOWN AND CLEAN TEXT API | IMPLEMENTATION BLUEPRINT
Ravi • Version 1.0 • 27 September 2026 | 35
Command contract and validation provenance
US002 establishes the first commands; later stories implement the remaining commands before depending on them. 
Use pinned local package binaries through npm scripts, never unpinned npx downloads during a validation run. All 
commands run in the sandbox or GitHub Actions. A command listed here is not a claim that it has already been 
executed.
Command Required behavior
npm ci Install exactly the reviewed lockfile; log versions, not secrets.
npm run typecheck Strict TypeScript checking; fail on unresolved types.
npm run lint Static checks including forbidden runtime imports and unsafe patterns.
npm run test:unit Pure helpers and exact fixtures; offline.
npm run test:integration Actual Worker handler, routing, streams and isolation.
npm run test:security URL attacks, egress traps, content/secret canaries and bounds.
npm run test:property Fixed-seed malformed-input campaign and replay.
npm run test:examples Execute curl, JS and Python examples with synthetic credentials.
npm run check:contract OpenAPI lint, examples and route/schema consistency.
npm run check:state Backlog dependencies, valid status transitions and evidence fields.
npm run build Worker dry-run bundle and manifest generation.
npm run bench Repeatable local pipeline measurements with JSON results.
npm run verify All deterministic local gates in the required order.
Evidence record template
Story: USnnn
Implementation SHA: <immutable SHA>
Environment: sandbox or GitHub Actions with runtime versions
Command: <exact command without secret arguments>
Exit status and conclusion: <observed value>
Assertions: <counts and named acceptance criteria>
Evidence: <repository paths or CI run and artifact identifiers>
Review: <failure mode inspected and outcome>
Limitations: <unmeasured items or platform differences>
Next action: <none only when DONE>
Dependency setup and advisory lookups may need network access from the approved runner. Unit, integration and 
fuzz suites must use local fixtures with outbound access trapped. Authorized staging/production curl smokes are a 
separate phase and must never be mixed into a claim that the deterministic suite runs offline.
For an authenticated curl smoke, inject the secret through a protected temporary header file with restricted 
permissions and remove it on exit. Disable shell tracing; never use verbose curl with credentials in an uploaded log. 
Capture status and a synthetic response only. Do not send real customer data to staging.

