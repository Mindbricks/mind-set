# GraphEdgeEnd

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [GraphEdgeEnd in Part 1](../ontology/GraphEdgeEnd.md)

One end of an edge-shaped projection (docs/ADR-graph-database-layer.md §4b). `labels` are the candidate node labels the endpoint may resolve to (e.g. ['User','Group']); `key` is the property on the edge object whose value matches the target node's identity.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `labels` | `String`[] | no |  |  |  | Candidate node labels this endpoint may resolve to, e.g. ['User','Group'] or ['Folder','Document']. |
| `key` | [`PropRefer`](./PropRefer.md) | yes |  |  | names a [DataProperty](./DataProperty.md) from `>basicSettings.name` | The property on the owning edge object (PropRefer) whose value keys the node at this end of the relationship (matched against the node's identity). |

## Constraints

Property rules:

- `key` must be present. (`REQUIRED_FIELD_MISSING`)
- `key` must be a well-formed [`PropRefer`](./PropRefer.md) (a property of a data object). (`INVALID_PROP_REFER_FORMAT`)
