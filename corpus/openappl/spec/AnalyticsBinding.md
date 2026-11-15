# AnalyticsBinding

**Level:** `section` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [AnalyticsBinding in Part 1](../ontology/AnalyticsBinding.md)

[P4 DONE] Binds an EventStream's analytics store + declares rollups. References a `bigLoadProvidersSettings` clickhouse store BY NAME (engine MUST be clickhouse) and lists the windowed aggregations. Codegen emits a raw MergeTree table + a materialized-view→AggregatingMergeTree per rollup, maintained incrementally on insert.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | yes |  |  |  | Name of the bigLoadProvidersSettings store (engine clickhouse) the analytics rollups are written to. |
| `table` | `String` | no |  |  |  | The ClickHouse table the raw analytics inserts land in. Defaults to the stream name + `_analytics`. |
| `rollups` | [`AnalyticsRollup`](./AnalyticsRollup.md)[] | no |  |  |  | Windowed aggregation definitions (AnalyticsRollup[]) materialized over the stream (density, supply/demand, KPIs). |

## Constraints

Property rules:

- `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `rollups` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
