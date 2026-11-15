# FetchFromElasticAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FetchFromElasticAction in Part 2](../spec/FetchFromElasticAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Fetches data object data from its elastic search index with a raw elastic search body, and stores a normalized ENVELOPE in the action's context property: `{ items, aggregations, total }`. `items` is the normalized hits array (each entry is the hit's `_source`, and top_hits style aggregations are normalized into it as well), `aggregations` is the elastic aggregation result or null, and `total` is the Elasticsearch total (`hits.total`, as a `{ value }` object or a bare number), falling back to the number of returned items only when the response carries no numeric total. The envelope is NOT unwrapped to a single hit, so a one-row lookup reads `this.<contextPropertyName>.items[0]?.<field>`; `this.<contextPropertyName>.<field>` is undefined by construction and is rejected at design time (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fetchFromElasticActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fetchFromElasticActions`
- `services.businessLogic.actions.fetchFromElasticActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `targetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
