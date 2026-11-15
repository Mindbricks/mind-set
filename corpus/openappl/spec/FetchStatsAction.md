# FetchStatsAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FetchStatsAction in Part 1](../ontology/FetchStatsAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

An action used to compute inline aggregate statistics (e.g., count, min, max, sum) from a data object. Ideal for Business APIs that need quick numerical insights tied to context. Use for simple stat enrichment for single or multiple bindings; for complex use cases, consider dedicated stat APIs or BFF services. Note that this action collects the stat values from elastc search using aggregations features.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the data object from which statistical metrics will be aggregated. Can be a local or foreign object. |
| `matchValue` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression for the value to match on the target object. Typically references a foreign key like `this.projectId`. |
| `localKey` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `targetObject` | The property of the target object to be matched against — `id`, or any indexed field. There is NO compile-time default: the stats query adds its match term only when BOTH `matchValue` and `localKey` are set (an authored `matchValue` with an empty `localKey` is silently dropped). Validation REFUSES the blueprint with FETCH_MATCH_VALUE_WITHOUT_LOCAL_KEY (ERROR). An MScript slot is EMPTY when no language source in it carries anything: an absent slot, `null`, and the untouched multilanguage envelope the authoring panel scaffolds (`{ "js": null, "java": null, ... }`) all count as empty, so a section you have not authored yet is never refused. |
| `whereClause` | [`MScript`](./MScript.md) | no |  |  | MScript kind `mquery` | Optional MScript query for compound stat filters or joins. It does NOT replace the match logic — the generated stats query MERGES them: the whereClause is evaluated first and the `localKey: matchValue` term is added on top (AND semantics; on a shared key the match term wins). Leave `matchValue` empty when the whereClause alone should scope the stats. |
| `stats` | `String`[] | no |  |  | format [noSpace](./value-formats.md#nospace) | An array of stat operations like `count`, `sum(price)`, `min(quantity)`, or `max(score)`. Each must be a valid SQL-style aggregate expression. |
| `bucketBy` | [`PropRefer`](./PropRefer.md) | no |  |  | names a [DataProperty](./DataProperty.md) from `targetObject` | Optional property reference to group the scoped items and calculate the stat(s) in buckets as an array. Keep null to have a total single reseult. The array result can be collated with main or any other data list in fyrther actions. |

## Constraints

Property rules:

- `targetObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `stats` must be in the [`noSpace`](./value-formats.md#nospace) format. (`INVALID_NO_SPACE`)
- `targetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- `localKey`, `bucketBy` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)

## Example

Use for quick inline aggregate metrics tied to the current context — counts, sums, min/max — optionally bucketed by a field, computed from Elasticsearch aggregations without a dedicated stats API.

```json
{
  "name": "projectTaskStats",
  "description": "Compute open-task counts and total estimated hours for the project in context.",
  "targetObject": "task",
  "matchValue": { "js": "this.projectId" },
  "localKey": "projectId",
  "stats": [
    "count",
    "sum(estimatedHours)",
    "max(priority)"
  ],
  "bucketBy": "status",
  "contextPropertyName": "taskStats",
  "writeToResponse": true
}
```
