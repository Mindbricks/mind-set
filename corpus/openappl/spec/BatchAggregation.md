# BatchAggregation

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [BatchAggregation in Part 1](../ontology/BatchAggregation.md)

Aggregation spec for a BatchTransformSpec — the group-by keys and the aggregate functions applied over each group before the result is written.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `groupBy` | `String`[] | no |  |  |  | Ordered list of field names to group rows by (e.g. ['tenantId','day']). |
| `agg` | `String`[] | no |  |  |  | List of aggregate expressions applied per group (e.g. ['count','sum:amount']). Kept as String entries in v1. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
