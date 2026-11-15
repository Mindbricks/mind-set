# ListRuntimeFilterSettings

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [ListRuntimeFilterSettings in Part 2](../spec/ListRuntimeFilterSettings.md)

Per-list-API runtime filter behavior. Four independent opt-in flags. The same block applies to DataObject-sourced and DataView-sourced lists (codegen compiles to SQL/ES per source).

## Contained in

- [ListOptions](./ListOptions.md) as `runtimeFilters`

## Contains

No other pattern: every property is a value or a reference.

## References

- `allowedFields` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)
- `allowedSortFields` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)
- `searchedFields` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
