# DataToFileAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [DataToFileAction in Part 1](../ontology/DataToFileAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Converts a given input into a downloadable file such as CSV, JSON, or XLSX. Two modes: VERBATIM writes a pre-rendered string from `inputData` as text; ROWS serializes structured rows—an array of objects from `inputData`, or, when `inputData` is empty on a `list` api, the api's own list result—into csv, tsv, xlsx, json or ndjson, selecting and computing output columns through `columns`. The ROWS mode with an empty `inputData` is the one-declaration table export: the list api's select/where/order and the caller's filter parameters decide the rows, the action decides the file. PDF is not a DataToFileAction format - use RenderPdfAction instead. The nodejs, java, dotnet, rust and python generators support ROWS mode and XLSX export. The validator emits TABULAR_ACTION_NOT_PORTED for golang while its port verification is pending.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `inputData` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression that resolves to the content to save. In VERBATIM mode (no `columns`, a text format) it is a pre-rendered string—such as a rendered CSV, JSON string, or HTML body; a raw object is JSON-stringified. In ROWS mode it resolves to structured ROWS: an array of objects (keys become columns) or `{ sheets: [{ name, rows }] }` for a multi-sheet xlsx. ROWS mode is taken when `columns` is declared, when the format is `xlsx` or `ndjson`, or when `inputData` is left empty: an empty `inputData` on a `list` api exports the api's own list result (`this.<pluralDataName>`, i.e. the rows the api's select/where/order and the caller's filter parameters produced), which is the one-declaration table export. |
| `outputFormat` | `FileFormats` | yes |  | 15 values, see [FileFormats](#fileformats) |  | The format of the file to be generated, one of the `FileFormats` enum values (e.g. `json`, `csv`, `xlsx`). In VERBATIM mode every format writes the input as utf8 text. In ROWS mode only the tabular formats are valid—`csv`, `tsv`, `xlsx`, `json`, `ndjson`—and the generated service serializes the rows itself (RFC 4180 csv/tsv with a header row, one exceljs worksheet per sheet, a JSON array, or one JSON object per line). For PDF use RenderPdfAction instead. |
| `sendToClient` | `Boolean` | yes |  |  |  | If true, the generated file will be sent to the client as a downloadable attachment in the API response. If false, the file is only generated internally. |
| `fileName` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript for the download / stored file name (without the extension, which follows `outputFormat`), with `rows` (the rows about to be written) in scope, e.g. `` `stock-${new Date().toISOString().slice(0,10)}` ``. Defaults to the action's context property name. The temp file the action writes is always uniquely named per request, whatever the download name. |
| `columns` | [`TabularColumnMap`](./TabularColumnMap.md)[] | no |  |  |  | ROWS mode column selection, in output order. Each entry names the output `header` and either a row `property` to copy or a `value` MScript computed per row with `item` (the row) in scope, e.g. a formatted date or a joined label. Leave empty to emit every key of the rows as its own column. |
| `rowFilter` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | ROWS mode: an MScript boolean evaluated per row with `item` in scope; rows answering false are left out of the file. The place for a condition the list api's where clause cannot express. |
| `beforeWrite` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | ROWS mode: an MScript evaluated ONCE after the column projection, with `rows` (the projected rows, keyed by output header) in scope; its result replaces the rows written. Sort, group, add a manual summary row, or reshape freely. |
| `sheetName` | `String` | no |  |  |  | ROWS mode, xlsx only: the worksheet name when the rows are a plain array (a `{ sheets }` input names its own sheets). Defaults to the action's context property name. |
| `sheetLayout` | [`SheetLayout`](./SheetLayout.md) | no |  |  |  | ROWS mode, xlsx only: how the table is laid out on the worksheet - title, start cell, header style, freeze / filter, widths, a totals row, and `cells`, the free area for any address and any MScript. |
| `textOptions` | [`TabularTextOptions`](./TabularTextOptions.md) | no |  |  |  | ROWS mode, csv / tsv / json / ndjson: delimiter, header row, BOM (Excel opens a UTF-8 csv with Turkish text correctly only with a BOM), json wrapper key and pretty printing. |
| `maxRows` | `Integer` | no |  |  |  | ROWS mode: a hard cap on the number of rows written; extra rows are dropped and the truncation is logged. Protects the service from an unbounded export. Null means no cap beyond the api's own pagination. |

## Allowed values

### FileFormats

`json`, `xml`, `csv`, `tsv`, `txt`, `html`, `md`, `yaml`, `yml`, `svg`, `rtf`, `log`, `tex`, `xlsx`, `ndjson`

## Constraints

Property rules:

- `outputFormat`, `sendToClient` must be present. (`REQUIRED_FIELD_MISSING`)
- `outputFormat` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `columns` must have distinct names (`property`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_TO_FILE_COLUMN_SOURCE_REQUIRED` | error | An export column needs a source: a row property to copy or a value MScript computed from item. |
| `DATA_TO_FILE_FORMAT_NOT_TABULAR` | error | outputFormat '…' cannot serialize structured rows. |
| `DATA_TO_FILE_INPUT_REQUIRED` | error |  |
| `DATA_TO_FILE_MAX_ROWS_IGNORED` | warning | maxRows applies to ROWS mode only; a verbatim string is written whole. |
| `DATA_TO_FILE_MAX_ROWS_INVALID` | error | maxRows must be a positive number of rows (or null for no cap). |
| `DATA_TO_FILE_SHEET_LAYOUT_IGNORED` | warning | sheetLayout applies to outputFormat 'xlsx' only; it is ignored for '…'. |
| `DATA_TO_FILE_SHEET_NAME_IGNORED` | warning | sheetName applies to ROWS mode xlsx output only; it is ignored here. |
| `DATA_TO_FILE_TEXT_OPTIONS_IGNORED` | warning | textOptions applies to the text formats (csv, tsv, json, ndjson) only; it is ignored for xlsx. |
| `DATA_TO_FILE_TOTALS_COLUMN_UNKNOWN` | error | Totals column "…" is neither an output header nor a source property of the declared columns (…). |

## Example

Use to turn a pre-rendered string (or object) into a downloadable text-based file (CSV, JSON, etc.) and optionally stream it straight to the client. For PDFs use RenderPdfAction instead.

```json
{
  "name": "exportOrdersCsv",
  "description": "Export the queried orders as a CSV download.",
  "inputData": { "js": "this.ordersCsvString" },
  "outputFormat": "csv",
  "sendToClient": true
}
```
