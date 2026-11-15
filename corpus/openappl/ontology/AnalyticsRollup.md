# AnalyticsRollup

**Level:** `subsection` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [AnalyticsRollup in Part 2](../spec/AnalyticsRollup.md)

[P4 DONE] One windowed aggregation materialized over an EventStream into the ClickHouse analytics store as a materialized-view→AggregatingMergeTree. `window` lowers to a CH time-bucket fn; `aggregations` support count() and avg|sum|min|max(<numericField>); `groupBy` fields become extra key columns.

## Contained in

- [AnalyticsBinding](./AnalyticsBinding.md) as `rollups` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
