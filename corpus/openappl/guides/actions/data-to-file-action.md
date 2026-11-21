---
title: DataToFileAction
---

# DataToFileAction

Serialises a context value into a file (CSV, JSON, TXT, ...) and stores it on the filesystem, optionally signalling the controller to send it back as a download. Use it to export workflow data as a downloadable file.

For PDF rendering, use [`RenderPdfAction`](./render-pdf-action.md): `DataToFileAction` writes text formats plus one binary spreadsheet format, `xlsx`.

## When to use it

- Build a CSV export of a list result and offer it as a download.
- Persist a JSON snapshot of computed context for later attachment to a [`SendMailAction`](./send-mail-action.md).
- Generate a plain-text or Markdown artefact from rendered template output.
- For richer formatting (templates, layout) use [`RenderDataAction`](./render-data-action.md) first to produce the body string, then `DataToFileAction` to write it.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `inputData` | `MScript` | no | Expression that resolves to the file body. VERBATIM mode: a pre-rendered string (raw objects are auto-stringified as pretty-printed JSON, two-space indent). ROWS mode: an array of row objects, or `{ sheets: [{ name, rows }] }` for a multi-sheet xlsx. Leave it EMPTY on a `list` api to export the api's own list result (see ROWS mode below); on any other api an empty `inputData` is refused at design time. |
| `outputFormat` | `FileFormats` | yes | The file extension and content type. Supported: `json`, `xml`, `csv`, `tsv`, `txt`, `html`, `md`, `yaml`, `yml`, `svg`, `rtf`, `log`, `tex`, `xlsx`, `ndjson`. VERBATIM mode writes the input as UTF-8 text in any format; ROWS mode serializes rows and admits only the tabular formats `csv`, `tsv`, `xlsx`, `json`, `ndjson`. |
| `sendToClient` | `Boolean` | yes | When true, the controller is signalled to send the file as a downloadable attachment in the response. When false, the file is generated for internal use only (e.g. as an email attachment). |
| `columns` | `TabularColumnMap[]` | no | ROWS mode: the output columns in order. `{ header, property }` copies a row key under the header; `{ header, value }` computes the cell from `item` (the row); `format` (`#,##0.00`, `yyyy-mm-dd`) and `width` style the xlsx column. Empty means every key of the rows becomes a column. |
| `fileName` | `MScript` | no | The download / stored file name without extension, `rows` in scope (`` `stock-${new Date().toISOString().slice(0,10)}` ``). Defaults to the context property name. The temp file is always uniquely named per request and removed after the download. |
| `rowFilter` | `MScript` | no | ROWS mode: per row, `item` in scope; false leaves the row out. The condition the list api's where clause could not express. |
| `beforeWrite` | `MScript` | no | ROWS mode: once, after the column projection, `rows` (keyed by output header) in scope; returns the rows to write. Sort, group, add a manual summary row, reshape. |
| `sheetLayout` | `SheetLayout` | no | xlsx: `title` (MScript), `startCell` (`B3`), `headerStyle` (`bold` / `none`), `freezeHeader`, `autoFilter`, `columnWidths` (`auto` / `none`), `totals` (`[{ column, fn: sum\|count\|avg\|min\|max, label }]`, real formulas under the table) and `cells` (`[{ address, value: MScript }]`, the free area: any cell, any expression, `rows` in scope). |
| `textOptions` | `TabularTextOptions` | no | csv / tsv / json / ndjson: `delimiter` (`;` for a Turkish or German Excel), `includeHeader`, `bom` (Excel needs it to read non-ASCII csv), `jsonWrapper` (`data` gives `{ "data": [...] }`), `pretty`. |
| `sheetName` | `String` | no | ROWS mode, xlsx: the worksheet name for a plain-array input. Defaults to the context property name. |
| `maxRows` | `Integer` | no | ROWS mode: a hard cap on the rows written; extra rows are dropped. |

> Note: PDF is **not** in the `FileFormats` enum and is not a `DataToFileAction` format: use [`RenderPdfAction`](./render-pdf-action.md) instead.

### ROWS mode (tabular import/export)

ROWS mode is taken when `columns` is declared, when the format is rows-only
(`xlsx`, `ndjson`), or when `inputData` is empty. The rows are serialized by
the service itself: RFC 4180 csv/tsv with a header row, a JSON
array, one JSON object per line for ndjson, or an xlsx workbook for xlsx.

**The one-declaration table export.** On a `list` api an empty `inputData`
exports the api's own list result: the rows the api's select / where /
order and the caller's filter parameters produced (`this.<pluralDataName>`).
The api owns the query and the access scoping (an `accessPrivate` object is
owner-scoped exactly as on the list), the action owns the file:

```json
{
  "name": "exportEmployees",
  "outputFormat": "csv",
  "sendToClient": true,
  "contextPropertyName": "employees",
  "columns": [
    { "property": "fullName", "header": "Full Name" },
    { "property": "email", "header": "E-Mail" },
    { "header": "Joined", "value": { "js": "new Date(item.createdAt).toISOString().slice(0, 10)" } }
  ]
}
```

Place the action in `afterMainListOperation` or later, where the rows exist.
The rows honour the api's pagination; set the list's page size, or `maxRows`,
to the export size you want. Design-time validation refuses an empty
`inputData` on a non-list api (`DATA_TO_FILE_INPUT_REQUIRED`) and a
non-tabular format in ROWS mode (`DATA_TO_FILE_FORMAT_NOT_TABULAR`).

The import direction is [`FileToDataAction`](./file-to-data-action.md) +
[`UpsertBulkCrudAction`](./upsert-bulk-crud-action.md). A compiler whose tabular support is not yet verified for its target language keeps the `TABULAR_ACTION_NOT_PORTED` advisory.

### `xlsx` output

Unlike every other format, `xlsx` does not write `inputData` as text: a
spreadsheet is a binary ZIP container, so the action builds a
workbook and writes binary bytes instead. `inputData` must resolve to one of
two shapes:

- **`Array<object>`**: one worksheet; columns are the union of keys across
  every row object.
- **`{ sheets: [{ name?, rows }] }`**: one worksheet per entry, named `name`
  (falling back to `Sheet1`, `Sheet2`, ...) with `rows` as above.

Any other shape (a string, a bare object with no `sheets` array, `null`, ...)
is rejected with `400` before any file is written. The response's
`Content-Type` is
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

The spreadsheet library is added automatically by the compiler whenever a
project declares an `xlsx` `DataToFileAction`: do not add it to
`serviceBasics.packages` yourself; an explicit entry for a compiler-managed
dependency is refused with `FRAMEWORK_MANAGED_NPM_PACKAGE`.

```json
{
  "name": "exportMasterData",
  "writeToResponse": false,
  "contextPropertyName": "masterWorkbook",
  "inputData": { "js": "({ sheets: [{ name: 'Master Data', rows: this.rows }] })" },
  "outputFormat": "xlsx",
  "sendToClient": true
}
```

## Behaviour

The action:

1. Evaluates `inputData`. If it is not a string, falls back to pretty-printed JSON (two-space indent) of the value.
2. Builds a filename of `<contextPropertyName>.<outputFormat>` (falling back to `<name>.<outputFormat>`).
3. Ensures a temporary directory on the service's local disk exists and writes the file there with UTF-8 encoding.
4. When `sendToClient: true`, attaches a `_fileDownload` marker to the context (`{ filePath, filename, mimeType }`); the controller picks this up at response time and streams the file as an attachment.

   The controller builds the response headers through a shared RFC 6266 builder, which matters because `filename` here comes from an MScript expression and is therefore request- and DB-derived:

   - `Content-Disposition` is sent as BOTH halves: an ASCII-only `filename="..."` for pre-RFC-5987 clients and a percent-encoded `filename*=UTF-8''...` carrying the real name. Path segments are reduced to a basename, `"`, `\`, `;` and `=` are dropped from the ASCII half, bidirectional formatting controls are removed, and a long name is truncated with its EXTENSION kept.
   - `mimeType` is passed through a media-type allowlist rather than reflected: anything that is not a printable-ASCII `type/subtype` (with validated parameters) falls back to `application/octet-stream`.

   Neither is something the action's author has to do; it is stated here because the `filename` you compose is client-visible and may be client-derived.
5. Returns the file path. The path is stored on `this.<contextPropertyName>` for use by later actions (e.g. attaching to email).

The file is written to local disk: it is **not** uploaded to a `RemoteBucket` or `DbBucket`. To persist it, follow up with a bucket upload action.

## Example

CSV export of a fetched list. Because `RenderDataAction` only supports `${key}` flat-key interpolation, build the body inline with an MScript `.map` + `.join` via `AddToContextAction`, then feed the string to `DataToFileAction`:

```json
"addToContextActions": [
  {
    "name": "buildCsvBody",
    "writeToResponse": false,
    "context": [
      {
        "contextName":  "csvBody",
        "contextValue": { "js": "'id,name,total\\n' + this.rows.map(r => r.id + ',' + r.name + ',' + r.total).join('\\n')" }
      }
    ]
  }
],
"dataToFileActions": [
  {
    "name": "exportRowsCsv",
    "writeToResponse": false,
    "contextPropertyName": "rowsCsv",
    "inputData": { "js": "this.csvBody" },
    "outputFormat": "csv",
    "sendToClient": true
  }
]
```

Internal-only JSON snapshot for an email attachment:

```json
{
  "name": "snapshotForEmail",
  "writeToResponse": false,
  "contextPropertyName": "auditSnapshot",
  "inputData": { "js": "this.audit" },
  "outputFormat": "json",
  "sendToClient": false
}
```

## Errors

- A failed write (permissions, disk full) throws and aborts the workflow.
- An unsupported `outputFormat` is rejected at project-validation time.

## See also

- [`RenderDataAction`](./render-data-action.md): produce the body string from a template
- [`RenderPdfAction`](./render-pdf-action.md): PDF output
- [`SendMailAction`](./send-mail-action.md): attach the generated file
- [`FileFormats` enum source](../../spec/DataToFileAction.md)
