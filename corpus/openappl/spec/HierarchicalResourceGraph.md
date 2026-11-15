# HierarchicalResourceGraph

**Level:** `section` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [HierarchicalResourceGraph in Part 1](../ontology/HierarchicalResourceGraph.md)

**Name:** an instance is named by `name`.

The flagship composite graph pattern (docs/ADR-graph-database-layer.md §9). A single high-level declaration expands into node projections on the underlying DataObjects, the hierarchy/permission edges (CONTAINS / MEMBER_OF / CAN_*), a PermissionInheritancePolicy that shapes the generated Cypher, and a ready set of graphQueries (effectivePermission / permissionExplain / reachableNodes). One declaration yields the whole document-management authorization use case — folder hierarchy, inherited permissions, group access, document-level overrides, and explainable access checks.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The composite's name. Unique within the service; used to name the expanded queries and assets. Must be a valid codeName. |
| `provider` | `String` | yes |  |  |  | Name of the graphProvider the composite projects into (must match a projectSettings.graphProvidersSettings.graphProviders[].name). |
| `nodes` | [`DataObjectName`](./DataObjectName.md)[] | no |  |  | names a [DataObject](./DataObject.md) | The DataObjects projected as node labels (DataObjectName[]), e.g. ['user','group','folder','document']. |
| `edges` | [`HierarchicalEdge`](./HierarchicalEdge.md)[] | no |  |  |  | The hierarchy/permission edges between the node labels (HierarchicalEdge[]) — CONTAINS / MEMBER_OF / CAN_READ / CAN_EDIT etc. |
| `inheritance` | [`PermissionInheritancePolicy`](./PermissionInheritancePolicy.md) | no |  |  |  | The PermissionInheritancePolicy that shapes the generated Cypher (flow-down via *0..N, deny-override via negative-path filters, document-level overrides). |

## Constraints

Property rules:

- `name`, `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `nodes` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `edges` must have distinct names (`relationshipType`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
