# FetchStatsAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FetchStatsAction in Part 2](../spec/FetchStatsAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

An action used to compute inline aggregate statistics (e.g., count, min, max, sum) from a data object. Ideal for Business APIs that need quick numerical insights tied to context. Use for simple stat enrichment for single or multiple bindings; for complex use cases, consider dedicated stat APIs or BFF services. Note that this action collects the stat values from elastc search using aggregations features.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fetchStatsActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fetchStatsActions`
- `services.businessLogic.actions.fetchStatsActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `targetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `localKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `targetObject`)
- `bucketBy` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `targetObject`)

## Referenced by

No property of another pattern names this pattern.
