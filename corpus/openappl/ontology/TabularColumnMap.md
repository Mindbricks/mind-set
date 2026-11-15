# TabularColumnMap

**Level:** `subsection` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [TabularColumnMap in Part 2](../spec/TabularColumnMap.md)

One column of a tabular import or export. On a FileToDataAction it binds a file column to a data-model property: `header` names the column in the file (defaults to the property name), and `value` optionally computes the property from the whole file row instead (`row`, `rowIndex` and `existing` in scope). On a DataToFileAction it names one output column: `header` is the column title, `property` copies a row key, and `value` computes the cell from `item` (the row).

## Contained in

- [DataToFileAction](./DataToFileAction.md) as `columns` (a list)
- [FileToDataAction](./FileToDataAction.md) as `columns` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
