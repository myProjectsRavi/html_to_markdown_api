# Complex Markdown table fallback

US023 defines a deterministic readable fallback for table shapes that are not eligible for the US022 GFM-table path.

- Top-level table rows are separated by a single LF.
- Top-level cells are separated by ` | `.
- Nested table rows inside a cell are separated by ` ; `.
- Nested table cells and block boundaries inside a cell are separated by ` / `.
- Literal source pipes are escaped as `\|` so they remain distinguishable from generated cell separators.
- Visible cell text is emitted in source order exactly once. Spanned cells are not expanded and browser layout is not reconstructed.
- Unsupported shape enters this fallback path. Row/column/total-cell limit violations remain typed `MarkdownTableLimitError` failures and never downgrade to fallback text.
- No raw table HTML is emitted.
