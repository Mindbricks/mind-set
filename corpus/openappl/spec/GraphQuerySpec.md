# GraphQuerySpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [GraphQuerySpec in Part 1](../ontology/GraphQuerySpec.md)

The discriminated type-specific payload of a GraphQuery, keyed by `GraphQuery.type` (docs/ADR-graph-database-layer.md §8b). The pattern system has no native one-of type, so this wrapper holds every sub-spec as a nullable sub-object; exactly the one matching the query's `type` is populated and read by codegen. `ancestors` and `descendants` share HierarchyTraversalSpec; `scopedRolePermission` and `scopedRoleExplain` share ScopedRolePermissionSpec. Mirrors ComputeJobSpec exactly.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `reachableNodes` | [`ReachableNodesSpec`](./ReachableNodesSpec.md) | no |  |  |  | Active when `type` is `reachableNodes` (ReachableNodesSpec). |
| `effectivePermission` | [`EffectivePermissionSpec`](./EffectivePermissionSpec.md) | no |  |  |  | Active when `type` is `effectivePermission` (EffectivePermissionSpec). |
| `permissionExplain` | [`PermissionExplainSpec`](./PermissionExplainSpec.md) | no |  |  |  | Active when `type` is `permissionExplain` (PermissionExplainSpec). |
| `ancestors` | [`HierarchyTraversalSpec`](./HierarchyTraversalSpec.md) | no |  |  |  | Active when `type` is `ancestors` (HierarchyTraversalSpec). |
| `descendants` | [`HierarchyTraversalSpec`](./HierarchyTraversalSpec.md) | no |  |  |  | Active when `type` is `descendants` (HierarchyTraversalSpec). |
| `shortestPath` | [`ShortestPathSpec`](./ShortestPathSpec.md) | no |  |  |  | Active when `type` is `shortestPath` (ShortestPathSpec). |
| `neighborhood` | [`NeighborhoodSpec`](./NeighborhoodSpec.md) | no |  |  |  | Active when `type` is `neighborhood` (NeighborhoodSpec). |
| `recommendation` | [`RecommendationSpec`](./RecommendationSpec.md) | no |  |  |  | Active when `type` is `recommendation` (RecommendationSpec). |
| `custom` | [`CustomGraphQuerySpec`](./CustomGraphQuerySpec.md) | no |  |  |  | Active when `type` is `custom` — the bring-your-own-Cypher escape hatch (CustomGraphQuerySpec). |
| `scopedRolePermission` | [`ScopedRolePermissionSpec`](./ScopedRolePermissionSpec.md) | no |  |  |  | Active when `type` is `scopedRolePermission` (ScopedRolePermissionSpec). Required for that type: a missing spec is SCOPED_ROLE_SPEC_MISSING. |
| `scopedRoleExplain` | [`ScopedRolePermissionSpec`](./ScopedRolePermissionSpec.md) | no |  |  |  | Active when `type` is `scopedRoleExplain` (ScopedRolePermissionSpec, the same spec shape as `scopedRolePermission`). Required for that type: a missing spec is SCOPED_ROLE_SPEC_MISSING. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
