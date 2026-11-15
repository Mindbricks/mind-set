# AnalyticsRollup

**Level:** `subsection` · **Family:** [EventStream](../ontology/families.md#eventstream) (domain `Service`)

**Ontology:** [AnalyticsRollup in Part 1](../ontology/AnalyticsRollup.md)

**Name:** an instance is named by `name`.

[P4 DONE] One windowed aggregation materialized over an EventStream into the ClickHouse analytics store as a materialized-view→AggregatingMergeTree. `window` lowers to a CH time-bucket fn; `aggregations` support count() and avg|sum|min|max(<numericField>); `groupBy` fields become extra key columns.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Rollup identifier (the materialized view / target table suffix). Must be a valid codeName. |
| `window` | `String` | no |  |  |  | The time window for the aggregation, e.g. `1m`, `5m`, `1h`. Kept as String in v1. |
| `groupBy` | `String`[] | no |  |  |  | Names of the eventSchema fields the aggregation groups by (e.g. geoCell, region). A judged column (a classify cleaning rule's `targetColumn`, or its `<targetColumn>DecidedBy`) may be named too; any other name fails validation (ANALYTICS_ROLLUP_GROUPBY_UNKNOWN). |
| `aggregations` | `String`[] | no |  |  |  | The aggregation expressions (e.g. `count()`, `avg(speed)`). Kept as Strings in v1. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
