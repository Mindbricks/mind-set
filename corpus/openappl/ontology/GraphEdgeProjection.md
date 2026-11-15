# GraphEdgeProjection

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [GraphEdgeProjection in Part 2](../spec/GraphEdgeProjection.md)

Projects each row of the owning DataObject as a graph relationship. Edge-shaped graph projection: the owning DataObject's rows ARE relationships (docs/ADR-graph-database-layer.md §4b) — e.g. a permissionGrant object with subjectId / resourceId / action projects as a `CAN_READ` relationship, not a vertex. On each write, the relationship is upserted between the `from` and `to` endpoints keyed by the named properties; on delete it is removed.

## Contained in

- [GraphProjection](./GraphProjection.md) as `projectsAsEdge`

## Contains

- `from`: [GraphEdgeEnd](./GraphEdgeEnd.md)
- `to`: [GraphEdgeEnd](./GraphEdgeEnd.md)

## References

- `edgeProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
