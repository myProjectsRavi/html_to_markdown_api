# Markdown composition policy

US024 closes the V1 composition contract without adding content heuristics.

- Structural blocks are joined with exactly two generated LF characters. Separator normalization happens at block joins, never by rewriting the finished Markdown string, so protected code whitespace is not modified.
- Unknown/custom HTML elements remain transparent wrappers at the shared-clean-tree stage. Their safe children continue in source order; source tags and attributes are never emitted.
- Header, footer, nav, main, article, aside, section and div content are ordinary structural containers. No article extraction or importance heuristic is applied.
- Existing Markdown node policies remain authoritative when nodes are nested: links in lists, images in quotes, code around tables, and lists inside details retain the same escaping and safety rules as standalone nodes.
- Prohibited subtrees remain dropped by the shared clean tree.
- Entity-decoded source text that merely resembles HTML is escaped as literal Markdown text; it is not reparsed as markup.
