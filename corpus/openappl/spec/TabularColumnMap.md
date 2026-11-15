# TabularColumnMap

**Level:** `subsection` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [TabularColumnMap in Part 1](../ontology/TabularColumnMap.md)

**Name:** an instance is named by `property`.

One column of a tabular import or export. On a FileToDataAction it binds a file column to a data-model property: `header` names the column in the file (defaults to the property name), and `value` optionally computes the property from the whole file row instead (`row`, `rowIndex` and `existing` in scope). On a DataToFileAction it names one output column: `header` is the column title, `property` copies a row key, and `value` computes the cell from `item` (the row).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `property` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | The data-model property this column maps to (import) or copies (export). Optional on export when `value` is given. |
| `header` | `String` | no |  |  |  | The column title in the file. Import: the header cell to read, defaulting to the property name. Export: the header cell to write, defaulting to the property name. |
| `value` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript computing the cell. Import scope: `row` (the parsed file row keyed by header), `rowIndex`, and `existing` (null on parse; the matched stored row inside an UpsertBulkCrudAction compute policy). Export scope: `item` (the row being written). |
| `valueMap` | `Any` | no |  |  |  | Import only. A dictionary from the raw file value to the property value, applied before type coercion: `{ "Sr": "senior", "Jr": "junior", "Aktif": true }`. Matched exactly first, then case-insensitively on the trimmed text; a value with no entry passes through unchanged (use a `value` MScript when an unmapped value must be rejected). |
| `format` | `String` | no |  |  |  | Export only, xlsx: the Excel number / date format applied to the column's cells, e.g. `#,##0.00`, `0%`, `yyyy-mm-dd`, `dd.mm.yyyy hh:mm`. |
| `width` | `Integer` | no |  |  |  | Export only, xlsx: the column width in characters. Overrides `sheetLayout.columnWidths` for this column. |

## Constraints

Property rules:

- `property` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
