# FetchFromElasticAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FetchFromElasticAction in Part 1](../ontology/FetchFromElasticAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Fetches data object data from its elastic search index with a raw elastic search body, and stores a normalized ENVELOPE in the action's context property: `{ items, aggregations, total }`. `items` is the normalized hits array (each entry is the hit's `_source`, and top_hits style aggregations are normalized into it as well), `aggregations` is the elastic aggregation result or null, and `total` is the Elasticsearch total (`hits.total`, as a `{ value }` object or a bare number), falling back to the number of returned items only when the response carries no numeric total. The envelope is NOT unwrapped to a single hit, so a one-row lookup reads `this.<contextPropertyName>.items[0]?.<field>`; `this.<contextPropertyName>.<field>` is undefined by construction and is rejected at design time (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the name of the data object to make the fetch data from. Can reference to the main data object, a different data object in the same service or any service within the same OpenAPPL application. |
| `body` | [`MScript`](./MScript.md) | yes | `"{\n  // -----------------------------------------\n  // Pag…` |  | MScript kind `code` | An MScript expression which is evaluated a js object representing the elastic search api body. Note that this object uses elastics own operators and own query format not the abstract MScript query format. |

## Constraints

Property rules:

- `targetObject`, `body` must be present. (`REQUIRED_FIELD_MISSING`)
- `targetObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ELASTIC_BODY_USES_MQUERY` | error | FetchFromElasticAction.body is a RAW Elasticsearch search body, but this one uses MQuery operator… … — the abstract query layer's syntax, which Elasticsearch does not understand. |
| `ELASTIC_TARGET_REQUIRED` | error | FetchFromElasticAction.targetObject is required — specify the DataObject (ES index) to search. |

## Example

Use when you need a raw Elasticsearch query (aggregations, custom scoring, collapsing, etc.) that the abstract query layer can't express — returns normalized items plus the raw aggregations object for dashboards and analytics.

```json
{
  "name": "topCategoriesByRevenue",
  "description": "Aggregate order revenue grouped by category for the storefront dashboard.",
  "targetObject": "order",
  "body": { "js": "{ size: 0, query: { range: { createdAt: { gte: this.fromDate } } }, aggs: { byCategory: { terms: { field: 'categoryId', size: 10 }, aggs: { revenue: { sum: { field: 'totalAmount' } } } } } }" },
  "contextPropertyName": "categoryRevenue",
  "writeToResponse": true
}
```
