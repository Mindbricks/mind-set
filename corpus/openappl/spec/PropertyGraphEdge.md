# PropertyGraphEdge

**Level:** `section` · **Family:** [DataProperty](../ontology/families.md#dataproperty) (domain `DataObject`)

**Ontology:** [PropertyGraphEdge in Part 1](../ontology/PropertyGraphEdge.md)

Projects an FK-relation property as a graph edge (docs/ADR-graph-database-layer.md §4a). The owning property must declare a relation (`basicSettings.hasRelation: true` + `relationSettings`). `relationshipType` names the Neo4j relationship; `direction` orients it relative to the owning node (e.g. a `folder.parentId -> folder` relation with `relationshipType: CONTAINS` and `direction: inbound` means parent CONTAINS this node — the edge points target → source). On write, the edge is `MERGE`d to the target node alongside the node upsert.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `relationshipType` | `String` | yes |  |  |  | The Neo4j relationship type for the projected edge, e.g. `CONTAINS` or `IN_CATEGORY`. |
| `direction` | `GraphDirection` | no | `"outbound"` | `outbound`, `inbound`, `undirected` |  | Orientation of the edge relative to the owning node (GraphDirection): `outbound` (owning node → target), `inbound` (target → owning node), or `undirected`. Defaults to `outbound`. |
| `edgeProperties` | [`PropRefer`](./PropRefer.md)[] | no |  |  | names a [DataProperty](./DataProperty.md) | Optional properties of the owning row copied onto the relationship (PropRefer[]). |

## Constraints

Property rules:

- `relationshipType` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `edgeProperties` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
