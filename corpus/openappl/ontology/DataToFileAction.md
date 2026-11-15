# DataToFileAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [DataToFileAction in Part 2](../spec/DataToFileAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Converts a given input into a downloadable file such as CSV, JSON, or XLSX. Two modes: VERBATIM writes a pre-rendered string from `inputData` as text; ROWS serializes structured rows—an array of objects from `inputData`, or, when `inputData` is empty on a `list` api, the api's own list result—into csv, tsv, xlsx, json or ndjson, selecting and computing output columns through `columns`. The ROWS mode with an empty `inputData` is the one-declaration table export: the list api's select/where/order and the caller's filter parameters decide the rows, the action decides the file. PDF is not a DataToFileAction format - use RenderPdfAction instead. ROWS mode, like the xlsx arm, is implemented by the nodejs, java and dotnet generators: golang and rust refuse it with a typed 501, python raises NotImplementedError, and the design gets the TABULAR_ACTION_NOT_PORTED warning.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `dataToFileActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.dataToFileActions`
- `services.businessLogic.actions.dataToFileActions`

## Contains

- `columns`: [TabularColumnMap](./TabularColumnMap.md), a list
- `sheetLayout`: [SheetLayout](./SheetLayout.md)
- `textOptions`: [TabularTextOptions](./TabularTextOptions.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
