# SortByItem

**Level:** `subsection` · **Family:** [BusinessApiQuery](./families.md#businessapiquery) (domain `BusinessApi`)

**Specification:** [SortByItem in Part 2](../spec/SortByItem.md)

Sort clause configuration for list operations. Used by `ListOptions.listSortBy` (the static default order), `ListOptions.listOrderSets[].sortBy` (a selectable named order) and `SelectJoin.sortBy` (order over a joined object).

## Contained in

- [ListOptions](./ListOptions.md) as `listSortBy` (a list)
- [ListOrderSet](./ListOrderSet.md) as `sortBy` (a list)
- [SelectJoin](./SelectJoin.md) as `sortBy` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `property` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>apiOptions.dataObjectName`)

## Referenced by

No property of another pattern names this pattern.
