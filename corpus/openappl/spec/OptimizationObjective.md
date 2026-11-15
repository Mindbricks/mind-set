# OptimizationObjective

**Level:** `subsection` · **Family:** [ComputeJob](../ontology/families.md#computejob) (domain `Service`)

**Ontology:** [OptimizationObjective in Part 1](../ontology/OptimizationObjective.md)

The objective of an OptimizationSpec — whether to minimize or maximize, and the expression being optimized.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sense` | `String` | no |  |  |  | Optimization sense: `min\|max`. Kept as String in v1. |
| `expr` | `String` | no |  |  |  | The objective expression evaluated over the decision variables (String/MScript in v1). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
