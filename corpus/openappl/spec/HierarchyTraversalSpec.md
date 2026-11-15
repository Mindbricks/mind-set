# HierarchyTraversalSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [HierarchyTraversalSpec in Part 1](../ontology/HierarchyTraversalSpec.md)

Spec shared by `ancestors` and `descendants` — upward or downward traversal of a single hierarchy edge (docs/ADR-graph-database-layer.md §8b). `ancestors` walks the edge toward the root ('all managers above'); `descendants` walks toward the leaves ('headcount under').

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `nodeLabel` | `String` | yes |  |  |  | The label of the nodes in the hierarchy (e.g. `Employee` or `Folder`). |
| `edgeType` | `String` | yes |  |  |  | The hierarchy relationship type traversed (e.g. `REPORTS_TO` or `CONTAINS`). |
| `maxDepth` | `Integer` | no |  |  |  | The maximum number of hops to traverse (the `*1..N` bound). Unset = unbounded. |

## Constraints

Property rules:

- `nodeLabel`, `edgeType` must be present. (`REQUIRED_FIELD_MISSING`)
