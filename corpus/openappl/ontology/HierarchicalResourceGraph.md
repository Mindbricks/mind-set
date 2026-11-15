# HierarchicalResourceGraph

**Level:** `section` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [HierarchicalResourceGraph in Part 2](../spec/HierarchicalResourceGraph.md)

The flagship composite graph pattern (docs/ADR-graph-database-layer.md §9). A single high-level declaration expands into node projections on the underlying DataObjects, the hierarchy/permission edges (CONTAINS / MEMBER_OF / CAN_*), a PermissionInheritancePolicy that shapes the generated Cypher, and a ready set of graphQueries (effectivePermission / permissionExplain / reachableNodes). One declaration yields the whole document-management authorization use case — folder hierarchy, inherited permissions, group access, document-level overrides, and explainable access checks.

## Contained in

- [GraphServiceLayer](./GraphServiceLayer.md) as `resources` (a list)

Blueprint paths:

- `services.graphLayer.resources`

## Contains

- `edges`: [HierarchicalEdge](./HierarchicalEdge.md), a list
- `inheritance`: [PermissionInheritancePolicy](./PermissionInheritancePolicy.md)

## References

- `nodes` names instances of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
