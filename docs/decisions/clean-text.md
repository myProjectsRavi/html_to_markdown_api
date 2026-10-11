# Clean text output policy

US025 defines clean text as a renderer over the shared normalized HTML tree, not as Markdown with syntax removed.

- Headings, paragraphs and ordinary structural containers produce readable text separated by stable generated blank-line separators.
- Inline formatting elements contribute only their visible child text; no Markdown delimiters are generated.
- `br` contributes a single LF. `hr` is a structural boundary and does not inject a visible Markdown rule.
- Literal user punctuation such as `*`, `_`, `<` and `>` remains data and is preserved.
- Protected code text retains its normalized line endings, tabs and spaces.
- Prohibited subtrees have already been removed by the shared clean-tree stage.
- Clean-text output is a JSON string for text processing. Consumers inserting it into a browser DOM must use a text sink such as `textContent`; they must not assign the returned string to `innerHTML`.

Structured policies for lists, quotes, images, links, details, tables and full pre/code behavior are completed by US026.
