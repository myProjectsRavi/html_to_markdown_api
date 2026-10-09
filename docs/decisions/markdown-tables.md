# Markdown table policy

## US022 simple rectangular tables

The Markdown writer emits a GFM table only when the retained HTML table is rectangular, contains at least one row and at least one cell per row, has no nested table, and has no effective rowspan or colspan. A literal span value of `1` is treated as non-spanning; other retained span values are left for the US023 fallback policy.

Rows are collected from direct `tr` children and from `thead`, `tbody`, and `tfoot` in source order.

Header policy is structural:

- If every cell in the first source row is `th`, that row becomes the GFM header and is not duplicated as data.
- Otherwise the writer inserts an empty GFM header row and preserves every source row as data.
- Bold text, CSS, content shape, and other presentation hints never cause header inference.

Cell formatting is flattened to readable text for this simple-table representation. Pipes are escaped so they cannot alter the GFM column count.

The configured table limits are enforced before serialization: `tableRows = 200`, `tableCellsPerRow = 32`, and `tableCellsPerTable = 6400`.

Complex or unsupported table shapes are intentionally not defined here. US023 owns their readable fallback behavior. Raw table HTML is never emitted as a compatibility shortcut.
