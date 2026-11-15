# FileToDataAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FileToDataAction in Part 1](../ontology/FileToDataAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Parses a tabular file into an array of row objects keyed by data-model property names, and stores `{ rows, rejected, total }` in the action's context property. The file may be an uploaded spreadsheet, a csv or tsv export, a JSON array or an ndjson dump. `fileSource` resolves to the file bytes (a Buffer, a base64 or utf8 string) or to a bucket reference `{ bucket, storageKey }` returned by a bucket upload route, which the action reads in process. When `targetObject` names a DataObject, every column is bound to a property by header (or by the `columns` map), each cell is coerced to the property's type (numbers, booleans, dates, enums, arrays) and validated (required, enum membership), and a cell that cannot be coerced rejects its row. The rows are the input of an UpsertBulkCrudAction (`objects: this.<contextPropertyName>.rows`), the import twin of DataToFileAction. Language lanes: implemented by the nodejs, java and dotnet generators; golang and rust emit a typed 501 and python raises NotImplementedError, and a design on such a service gets the TABULAR_ACTION_NOT_PORTED warning.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `fileSource` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript resolving to the file to parse: a Buffer, a base64 string, a utf8 text string, or a bucket reference `{ bucket, storageKey }` (a Remote/Native bucket of this service, read in process through the bucket layer's readBucketObject). |
| `inputFormat` | `TabularFormats` | no | `"xlsx"` | `csv`, `tsv`, `xlsx`, `json`, `ndjson` |  | The tabular format of the file, one of the TabularFormats values. Defaults to xlsx. |
| `targetObject` | [`DataObjectName`](./DataObjectName.md) | no |  |  | names a [DataObject](./DataObject.md) | The DataObject whose properties the rows are bound to and validated against. Without it the rows are returned as parsed, keyed by header, with no coercion. |
| `sheetName` | `String` | no |  |  |  | xlsx only: the worksheet to read. Defaults to the first worksheet. |
| `headerRow` | `Integer` | no | `1` |  |  | 1-based index of the header row; rows above it are ignored. Defaults to 1. |
| `delimiter` | `String` | no |  |  |  | csv only: the field delimiter when it is not a comma (e.g. `;` for locale csv exports). |
| `recordPath` | `String` | no |  |  |  | json / ndjson: the dot path to the array of records inside a wrapper document, e.g. `data.orders` or `payload.items`. Without it the root array is used, then a root-level `rows`, `items` or `data` array; a single root object becomes one record. Nested values inside a record are reached from `columns[].header` with the same dot / index syntax (`address.city`, `lines[0].qty`). |
| `range` | `String` | no |  |  |  | xlsx: the cell range holding the table, e.g. `B3:H200`, when the sheet carries a title block or side notes. The header row is the first row of the range (`headerRow` is then relative to it). Without it the whole sheet is read. |
| `columns` | [`TabularColumnMap`](./TabularColumnMap.md)[] | no |  |  |  | Explicit column bindings. A property without an entry is bound automatically from the header with the same name (case-insensitive); an entry with `header` renames, an entry with `value` computes the property from the whole row. |
| `rowFilter` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript boolean evaluated per RAW row before binding, with `row` (the raw record keyed by header / key) and `rowIndex` in scope. A false result skips the row silently (counted in `skipped`, never in `rejected`): a subtotal line, a comment row, an inactive flag. |
| `rowTransform` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript evaluated per RAW row before binding, with `row` and `rowIndex` in scope; its result REPLACES the raw row. The free hand for a shape the column map cannot express: rename or merge keys, flatten a nested record, split one cell into several, build a composite key. Return the same object when nothing changes. |
| `afterParse` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript evaluated ONCE after every row is parsed, with `rows` (the accepted, typed rows), `rejected` and `total` in scope. Its result replaces `rows`: deduplicate, sort, aggregate several lines into one record, or drop what an earlier row already covered. The context property still carries `rejected` and `total` unchanged. |
| `maxRows` | `Integer` | no |  |  |  | Hard cap on the number of data rows read; a file with more rows is rejected with a typed 400 before any row is parsed. |
| `errorRowHandling` | `ErrorRowHandlings` | no | `"collect"` | `collect`, `fail` |  | collect (default): a row that fails coercion or validation is skipped and listed under `rejected`. fail: the action throws a typed 400 on the first bad row. |

## Constraints

Property rules:

- `fileSource` must be present. (`REQUIRED_FIELD_MISSING`)
- `inputFormat`, `errorRowHandling` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `targetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `columns` must have distinct names (`property`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service or project. |
| `FILE_TO_DATA_COLUMN_PROPERTY_REQUIRED` | error | A FileToDataAction column must name the data-model property it binds (property is required on import). |
| `FILE_TO_DATA_DELIMITER_IGNORED` | warning | delimiter is read only for inputFormat 'csv'; it is ignored for '…'. |
| `FILE_TO_DATA_HEADER_ROW_INVALID` | error | headerRow is 1-based; the smallest valid value is 1. |
| `FILE_TO_DATA_MAX_ROWS_INVALID` | error | maxRows must be a positive number of data rows (or null for no cap). |
| `FILE_TO_DATA_NO_TARGET_OBJECT` | warning | No targetObject: the rows are returned as parsed, keyed by the file headers, with no type coercion or validation. |
| `FILE_TO_DATA_RANGE_IGNORED` | warning | range is read only for inputFormat 'xlsx'; it is ignored for '…'. |
| `FILE_TO_DATA_RANGE_INVALID` | error | range must be a cell range like B3:H200 (got "…"). |
| `FILE_TO_DATA_RECORD_PATH_IGNORED` | warning | recordPath is read only for inputFormat 'json' / 'ndjson'; it is ignored for '…'. |
| `FILE_TO_DATA_SHEET_NAME_IGNORED` | warning | sheetName is read only for inputFormat 'xlsx'; it is ignored for '…'. |
| `FILE_TO_DATA_SOURCE_REQUIRED` | error | FileToDataAction.fileSource is required — an MScript resolving to the file bytes (Buffer, base64 or text string) or a bucket reference { bucket, storageKey }. |
| `FILE_TO_DATA_UNKNOWN_COLUMN_PROPERTY` | error | Property "…" does not exist on DataObject "…". |

## Example

Use to import a spreadsheet or csv into a data object: upload the file to a bucket, pass its storageKey to the api, parse it with this action and write the rows with an UpsertBulkCrudAction.

```json
{
  "name": "parseProductSheet",
  "description": "Read the uploaded xlsx into product rows validated against the Product object.",
  "fileSource": { "js": "{ bucket: 'imports', storageKey: this.storageKey }" },
  "inputFormat": "xlsx",
  "targetObject": "product",
  "sheetName": "Products",
  "columns": [
    {
      "property": "sku",
      "header": "SKU"
    },
    {
      "property": "price",
      "header": "Unit Price"
    },
    {
      "property": "name",
      "value": { "js": "String(row['Product Name']).trim()" }
    }
  ],
  "errorRowHandling": "collect",
  "contextPropertyName": "parsedProducts"
}
```
