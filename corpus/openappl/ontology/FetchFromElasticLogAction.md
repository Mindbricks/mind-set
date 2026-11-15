# FetchFromElasticLogAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FetchFromElasticLogAction in Part 2](../spec/FetchFromElasticLogAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

BusinessApiAction that queries a declared ElasticLog by name with an Elasticsearch search body and writes the hits to the action context. Compiles to a direct call to the generated queryESLog_<logName> helper. The context property receives a normalized ENVELOPE — `{ items, aggregations, total }` and nothing else: `items` is the matching lines (each hit's `_source`), `aggregations` is the response's aggregation result verbatim (null when the body asks for none), and `total` is the total hit count — so a single line is read as `this.<contextPropertyName>.items[0]?.<field>` and a rollup as `this.<contextPropertyName>.aggregations.<name>.buckets`, never `this.<contextPropertyName>.<field>`, which is undefined by construction (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fetchFromElasticLogActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fetchFromElasticLogActions`
- `services.businessLogic.actions.fetchFromElasticLogActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
