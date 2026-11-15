# PropertyGraphEdge

**Level:** `section` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [PropertyGraphEdge in Part 2](../spec/PropertyGraphEdge.md)

Projects an FK-relation property as a graph edge (docs/ADR-graph-database-layer.md §4a). The owning property must declare a relation (`basicSettings.hasRelation: true` + `relationSettings`). `relationshipType` names the Neo4j relationship; `direction` orients it relative to the owning node (e.g. a `folder.parentId -> folder` relation with `relationshipType: CONTAINS` and `direction: inbound` means parent CONTAINS this node — the edge points target → source). On write, the edge is `MERGE`d to the target node alongside the node upsert.

## Contained in

- [DataProperty](./DataProperty.md) as `graphEdge`

Blueprint paths:

- `authentication.userProperties.graphEdge`
- `authentication.tenantProperties.graphEdge`
- `authentication.dataObjects.properties.graphEdge`
- `services.dataObjects.properties.graphEdge`

## Contains

No other pattern: every property is a value or a reference.

## References

- `edgeProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md))

## Referenced by

No property of another pattern names this pattern.
