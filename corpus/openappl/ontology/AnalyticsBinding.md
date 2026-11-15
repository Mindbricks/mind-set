# AnalyticsBinding

**Level:** `section` · **Family:** [EventStream](./families.md#eventstream) (domain `Service`)

**Specification:** [AnalyticsBinding in Part 2](../spec/AnalyticsBinding.md)

[P4 DONE] Binds an EventStream's analytics store + declares rollups. References a `bigLoadProvidersSettings` clickhouse store BY NAME (engine MUST be clickhouse) and lists the windowed aggregations. Codegen emits a raw MergeTree table + a materialized-view→AggregatingMergeTree per rollup, maintained incrementally on insert.

## Contained in

- [EventStream](./EventStream.md) as `analytics`

Blueprint paths:

- `services.eventStreams.analytics`

## Contains

- `rollups`: [AnalyticsRollup](./AnalyticsRollup.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
