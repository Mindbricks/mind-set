# SheetLayout

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SheetLayout in Part 1](../ontology/SheetLayout.md)

The layout of an exported xlsx worksheet around the data table. It covers a title block, where the table starts, header styling, freeze pane and auto filter, column widths, a totals row of real formulas, and `cells` - the free area where any address takes any MScript.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript for a title written in the first cell of the start column, two rows above the header (the row between stays empty), bold and larger; `rows` in scope. Leave empty for no title. |
| `startCell` | `String` | no |  |  |  | Where the header row starts, e.g. `B3`. Defaults to `A1` (or `A3` when a title is set). |
| `headerStyle` | `SheetHeaderStyles` | no | `"bold"` | `none`, `bold` |  | One of the SheetHeaderStyles values. |
| `freezeHeader` | `Boolean` | no | `true` |  |  | Freeze the rows above and including the header so it stays visible while scrolling. Default true. |
| `autoFilter` | `Boolean` | no | `true` |  |  | Put an Excel auto filter on the header row. Default true. |
| `columnWidths` | `SheetColumnWidths` | no | `"auto"` | `auto`, `none` |  | One of the SheetColumnWidths values; a column's own `width` overrides it. |
| `totals` | [`SheetTotal`](./SheetTotal.md)[] | no |  |  |  | Totals-row cells written directly under the table as formulas over the column's data range. |
| `cells` | [`SheetCell`](./SheetCell.md)[] | no |  |  |  | The free area: any cell, any MScript. Report metadata, a generated-by line, a filter summary, a note - whatever the layout needs and the table does not carry. |

## Constraints

Property rules:

- `headerStyle`, `columnWidths` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `totals` must have distinct names (`column`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `cells` must have distinct names (`address`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
