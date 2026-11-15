# AggregateItem

**Level:** `subsection` · **Family:** [DataView](./families.md#dataview) (domain `BFFService`)

**Specification:** [AggregateItem in Part 2](../spec/AggregateItem.md)

Defines a single mathematical operation to apply to a group of records within a ViewStat. Supports standard operations like sum, average, min, max, and count. Each AggregateItem targets a specific field in the child object and may apply additional filters. It is particularly useful when multiple grouped metrics are required from the same set of joined records, such as 'count of failed orders' vs. 'sum of successful order values'.

## Contained in

- [ViewStat](./ViewStat.md) as `aggList` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `aggField` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>stats._currentAsset_.childObject`)

## Referenced by

No property of another pattern names this pattern.
