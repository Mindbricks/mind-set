---
title: FileToDataAction
---

# FileToDataAction

Parses a tabular file (an uploaded spreadsheet, a csv or tsv export, a JSON array or an ndjson dump) into an array of row objects keyed by data-model property names. It is the import twin of [`DataToFileAction`](./data-to-file-action.md): every supported format is a header row plus records, so a spreadsheet, a csv and an ndjson dump share one contract, and the rows it produces are what an [`UpsertBulkCrudAction`](./upsert-bulk-crud-action.md) (or a [`CreateBulkCrudAction`](./create-bulk-crud-action.md)) writes.

## When to use it

- Import a product list, a price update or a customer sheet from Excel into a DataObject.
- Load a csv exported from another system, mapping its headers onto your properties.
- Enrich existing rows from a spreadsheet (parse here, then `UpsertBulkCrudAction` with `matchMode: update`).
- Validate a file against the data model and report the rejected rows back to the uploader.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `fileSource` | `MScript` | yes | Resolves to the file: a `Buffer`, a base64 string (xlsx) or utf8 text (text formats), a bucket reference `{ bucket, storageKey }` as returned by a bucket upload route (read in process through the bucket layer, Remote and Native buckets), or, for json / ndjson, an already-parsed array or object such as a request parameter carrying the records. |
| `inputFormat` | `TabularFormats` | no | `csv`, `tsv`, `xlsx`, `json` or `ndjson`. Defaults to `xlsx`. |
| `targetObject` | `DataObjectName` | no | The DataObject the rows are bound to. With it, every header is matched to a property (explicit `columns` first, then a case- and space-insensitive name match) and every cell is coerced to the property's type: numbers, booleans (`yes`/`no`/`1`/`0`), dates (ISO text or spreadsheet serials), enums (case-insensitive, canonical spelling written), arrays (`;`-, `|`- or `,`-separated, or a JSON array). Without it the rows come back keyed by header, untyped. |
| `columns` | `TabularColumnMap[]` | no | Explicit bindings. `{ property, header }` reads the named header into the property, and for json the header may be a dot / index path into the record (`address.city`, `lines[0].qty`); `{ property, value }` computes the property from the whole row with `row` (the parsed file row keyed by header), `rowIndex` and `existing` (null here) in scope; `valueMap` translates raw cells before coercion (`{ "Sr": "senior" }`, exact then case-insensitive, unmapped values pass through). Properties without an entry bind automatically by name, top-level keys only. |
| `sheetName` | `String` | no | xlsx only: the worksheet to read. Defaults to the first worksheet. |
| `headerRow` | `Integer` | no | 1-based header row; rows above it are ignored. Defaults to 1. |
| `delimiter` | `String` | no | csv only: the field delimiter when it is not a comma (`;` for locale exports). |
| `recordPath` | `String` | no | json / ndjson: dot path to the record array inside a wrapper (`data.orders`). Default: the root array, then a root-level `rows` / `items` / `data` / `records` / `results` array, then the root object as one record. A file with several entity lists is several actions with different paths. |
| `range` | `String` | no | xlsx: the cell block holding the table (`B3:H200`) when the sheet carries a title block or side notes; the header row is the first row of the range. |
| `rowFilter` | `MScript` | no | Per RAW row, before binding: `row` and `rowIndex` in scope; false skips the row silently (counted in `skipped`, not `rejected`). |
| `rowTransform` | `MScript` | no | Per RAW row, before binding: returns the row to bind instead. Rename or merge keys, flatten, split a cell, build a composite key: the free hand for shapes the column map cannot express. |
| `afterParse` | `MScript` | no | Once, after every row is parsed: `rows`, `rejected`, `total` in scope; returns the rows to keep. Deduplicate, sort, aggregate lines into one record. |
| `maxRows` | `Integer` | no | A file with more data rows is refused with a typed 400 before any row is parsed. |
| `errorRowHandling` | `ErrorRowHandlings` | no | `collect` (default): a row that fails coercion or validation is skipped and listed under `rejected`. `fail`: the action throws a typed 400 on the first bad row. |

### Result

`this.<contextPropertyName>` holds:

```json
{
  "rows": [ { "sku": "A-1", "price": 12.5, "name": "Widget" } ],
  "rejected": [ { "rowIndex": 3, "reasons": ["price: \"abc\" is not a number"], "row": { "SKU": "A-4", "Unit Price": "abc" } } ],
  "total": 4,
  "skipped": 0
}
```

`rowIndex` is the 0-based data row (the header row is not counted). Columns the service fills itself (`id`, a property with a server default, a session-fed column, the tenant column) are never demanded from the file, even when the property is required. A required property whose column is absent from the file is simply left out of the row rather than rejecting it: an enrichment sheet legitimately carries a subset of the columns, an update never touches an absent column, and an insert of such a row is refused by the database and reported by the writer. `required` bites only on a present but empty cell.

### Example

```json
{
  "name": "parseProductSheet",
  "fileSource": { "js": "{ bucket: 'imports', storageKey: this.storageKey }" },
  "inputFormat": "xlsx",
  "targetObject": "product",
  "sheetName": "Products",
  "columns": [
    { "property": "sku", "header": "SKU" },
    { "property": "price", "header": "Unit Price" },
    { "property": "name", "value": { "js": "String(row['Product Name']).trim()" } }
  ],
  "errorRowHandling": "collect",
  "contextPropertyName": "parsedProducts"
}
```

The typical import api is a `create` (or `get` with `forcePOSTMethod`) api that takes the bucket `storageKey` as a request parameter, runs this action, then an `UpsertBulkCrudAction` over `this.parsedProducts.rows`, and answers with both summaries.

## Behaviour

1. Resolves `fileSource` to bytes. A bucket reference is read in process through the bucket layer (the service must declare a Remote or Native bucket).
2. Parses the file: for xlsx, formulas give their result, rich text its plain text, and date cells stay dates; the text formats follow RFC 4180 csv, with a byte-order mark tolerated.
3. Runs `rowTransform` and `rowFilter` on each raw row, then binds headers (or paths) to properties, applies `valueMap`, and coerces every cell; a row with any failing cell is rejected with every reason. A nested object landing on a text property is a rejection reason, not a silent stringify.
4. Runs the computed `columns` per accepted row and coerces their results the same way.
5. Runs `afterParse` over the accepted rows and returns `{ rows, rejected, total, skipped }`.

### json and ndjson

Keys are the headers. `{ "unitPrice": 12 }` binds to `unitPrice` automatically; a differently named key needs a column entry, exactly like a spreadsheet header. Nesting is always an explicit declaration through a path header; `recordPath` reaches the array inside a wrapper document; ndjson applies the same rules per line, and a line that is not an object is rejected with its line number. Because an already-parsed value is accepted as `fileSource`, a request parameter of type `Object` with `isArray` and `fileSource: this.items` is a complete no-file import api.

### Implementation coverage

A compiler refuses a construct it does not implement for the service's language, so a `FileToDataAction` is available only where the compiler for that language supports the tabular actions.
