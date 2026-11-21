# FileToDataAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FileToDataAction in Part 2](../spec/FileToDataAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Parses a tabular file into an array of row objects keyed by data-model property names, and stores `{ rows, rejected, total }` in the action's context property. The file may be an uploaded spreadsheet, a csv or tsv export, a JSON array or an ndjson dump. `fileSource` resolves to the file bytes (a Buffer, a base64 or utf8 string) or to a bucket reference `{ bucket, storageKey }` returned by a bucket upload route, which the action reads in process. When `targetObject` names a DataObject, every column is bound to a property by header (or by the `columns` map), each cell is coerced to the property's type (numbers, booleans, dates, enums, arrays) and validated (required, enum membership), and a cell that cannot be coerced rejects its row. The rows are the input of an UpsertBulkCrudAction (`objects: this.<contextPropertyName>.rows`), the import twin of DataToFileAction. The nodejs, java, dotnet and rust generators support this action. The validator emits TABULAR_ACTION_NOT_PORTED for golang and python while their port verification is pending.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fileToDataActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fileToDataActions`
- `services.businessLogic.actions.fileToDataActions`

## Contains

- `columns`: [TabularColumnMap](./TabularColumnMap.md), a list

## References

- `targetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
