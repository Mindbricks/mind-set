# GraphEdgeProjection

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [GraphEdgeProjection in Part 1](../ontology/GraphEdgeProjection.md)

Projects each row of the owning DataObject as a graph relationship. Edge-shaped graph projection: the owning DataObject's rows ARE relationships (docs/ADR-graph-database-layer.md §4b) — e.g. a permissionGrant object with subjectId / resourceId / action projects as a `CAN_READ` relationship, not a vertex. On each write, the relationship is upserted between the `from` and `to` endpoints keyed by the named properties; on delete it is removed.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationshipType` | `String` | yes |  |  |  | The Neo4j relationship type the rows project as, e.g. `CAN_READ`. |
| `from` | [`GraphEdgeEnd`](./GraphEdgeEnd.md) | yes |  |  |  | The source endpoint of the relationship (GraphEdgeEnd) — the candidate node labels and the property on THIS object whose value keys the source node. |
| `to` | [`GraphEdgeEnd`](./GraphEdgeEnd.md) | yes |  |  |  | The target endpoint of the relationship (GraphEdgeEnd) — the candidate node labels and the property on THIS object whose value keys the target node. |
| `edgeProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | Optional properties of this object copied onto the relationship (PropRefer[]), e.g. ['action','grantedAt']. |

## Constraints

Property rules:

- `relationshipType`, `from`, `to` must be present. (`REQUIRED_FIELD_MISSING`)
- `edgeProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
