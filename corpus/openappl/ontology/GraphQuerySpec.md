# GraphQuerySpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [GraphQuerySpec in Part 2](../spec/GraphQuerySpec.md)

The discriminated type-specific payload of a GraphQuery, keyed by `GraphQuery.type` (docs/ADR-graph-database-layer.md §8b). The pattern system has no native one-of type, so this wrapper holds every sub-spec as a nullable sub-object; exactly the one matching the query's `type` is populated and read by codegen. `ancestors` and `descendants` share HierarchyTraversalSpec; `scopedRolePermission` and `scopedRoleExplain` share ScopedRolePermissionSpec. Mirrors ComputeJobSpec exactly.

## Contained in

- [GraphQuery](./GraphQuery.md) as `spec`

## Contains

- `reachableNodes`: [ReachableNodesSpec](./ReachableNodesSpec.md)
- `effectivePermission`: [EffectivePermissionSpec](./EffectivePermissionSpec.md)
- `permissionExplain`: [PermissionExplainSpec](./PermissionExplainSpec.md)
- `ancestors`: [HierarchyTraversalSpec](./HierarchyTraversalSpec.md)
- `descendants`: [HierarchyTraversalSpec](./HierarchyTraversalSpec.md)
- `shortestPath`: [ShortestPathSpec](./ShortestPathSpec.md)
- `neighborhood`: [NeighborhoodSpec](./NeighborhoodSpec.md)
- `recommendation`: [RecommendationSpec](./RecommendationSpec.md)
- `custom`: [CustomGraphQuerySpec](./CustomGraphQuerySpec.md)
- `scopedRolePermission`: [ScopedRolePermissionSpec](./ScopedRolePermissionSpec.md)
- `scopedRoleExplain`: [ScopedRolePermissionSpec](./ScopedRolePermissionSpec.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
