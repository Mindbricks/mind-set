# ParallelAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ParallelAction in Part 1](../ontology/ParallelAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a non-blocking execution group in which multiple actions are executed in parallel. Each action runs independently using the same input context. Parallel actions are useful for concurrent fetches, validations, or other side-effect-free logic. Warning: avoid parallel branches that mutate the same shared fields or the same database records without concurrency controls, because final state can become non-deterministic. This action can also include nested `ParallelAction` or `LoopAction` steps, enabling concurrent or branched execution across multiple layers of the workflow.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `actions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | An array of action names (as strings) to be executed concurrently. Each action in this list will run using the shared context. Nested parallel and loop actions are supported for composing deeply concurrent workflows. |

## Constraints

Property rules:

- `actions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ACTION_NOT_FOUND` | error | Action "…" not found in this BusinessApi. |

## Example

Use to run several independent, side-effect-free actions concurrently for latency — typically parallel fetches/enrichments — avoiding branches that mutate the same context fields or records.

```json
{
  "name": "enrichOrderConcurrently",
  "description": "Fetch customer, shipping rates, and inventory levels at the same time.",
  "actions": [
    "fetchCustomer",
    "fetchShippingRates",
    "fetchInventoryLevels"
  ]
}
```
