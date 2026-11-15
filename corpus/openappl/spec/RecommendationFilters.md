# RecommendationFilters

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationFilters in Part 1](../ontology/RecommendationFilters.md)

Deterministic serve-time filters of a recommendation list (recommendation ADR section 5.2). They are re-applied to every candidate while it is hydrated; none of them may be a decision-provider call.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `visibleWhen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript over the candidate row: the item's visibility rule (e.g. published), on top of its read gate and tenant. |
| `availableWhen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript over the candidate row: stock or availability. |
| `compatibleWhen` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript over `{ anchor, candidate }` for anchor-based lists: structured compatibility, e.g. `candidate.batteryType == anchor.batteryType`. Compatibility is a filter, never a score. |
| `excludeConsumedBy` | `String` | no |  |  |  | A source name or a signal label (`shoppingCart`, `ordered`, ...): items the calling actor (the user, or a guest cart's session) already has in a matching source that records an actor are dropped at serve time. Nodejs `buyAgain` ignores this filter because repeated acquisitions are its candidates. Nodejs `personalized` also excludes consumed items from its own evidence sources across all retained valid history, including outside its seed window. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
