# ReachableNodesSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ReachableNodesSpec in Part 1](../ontology/ReachableNodesSpec.md)

Spec for `reachableNodes` — variable-length traversal from a source node over given edge types, filtered on the target's projected properties (docs/ADR-graph-database-layer.md §8b / Cypher map).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `sourceLabel` | `String` | yes |  |  |  | The label of the source node the traversal starts from (e.g. `User`). |
| `targetLabel` | `String` | yes |  |  |  | The label of the reachable target nodes returned (e.g. `Document`). |
| `edgeTypes` | `String`[] | no |  |  |  | The relationship types traversed, in path order (e.g. ['MEMBER_OF','CAN_READ','CONTAINS']). |
| `maxDepth` | `Integer` | no | `20` |  |  | The maximum variable-length depth of the hierarchy/containment portion of the traversal (the `*0..N` bound). |
| `filterProperties` | `String`[] | no |  |  |  | Names of the target's filterable properties allowed in the WHERE clause (e.g. ['category','status']). |

## Constraints

Property rules:

- `sourceLabel`, `targetLabel` must be present. (`REQUIRED_FIELD_MISSING`)
