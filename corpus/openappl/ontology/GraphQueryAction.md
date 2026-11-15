# GraphQueryAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [GraphQueryAction in Part 2](../spec/GraphQueryAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Runs a parameterized graph traversal and writes mapped records to the action context. BusinessApiAction that runs a parameterized graph traversal against a service's Bolt driver pool and writes the mapped records to the action context (docs/ADR-graph-database-layer.md §8a — peer of FetchFromElasticLogAction). Compiles to a direct `runGraphQuery` call (inline Cypher) or the generated `runNamedGraphQueryResult` dispatcher (a declared query). `query` resolves to either a declared service.graphLayer.queries[].name (the `named:<name>` form or a bare name) or an inline Cypher string; `params` is an MScript expression evaluating to the parameter object. The context property receives a normalized ENVELOPE — `{ records, total, ok, status }` and nothing else: `records` / `total` are the mapped rows, and `ok` / `status` say whether the query RAN (`ok: false` with `status` `unavailable` or `error` is an outage, not a zero-row answer, so a permission decision reads `ok` first) — so a single record is read as `this.<contextPropertyName>.records[0]?.<field>`, never `this.<contextPropertyName>.<field>`, which is undefined by construction (CONTEXT_ENVELOPE_MEMBER_UNDEFINED).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `graphQueryActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.graphQueryActions`
- `services.businessLogic.actions.graphQueryActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
