# GraphProjection

**Level:** `section` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [GraphProjection in Part 2](../spec/GraphProjection.md)

Projects a DataObject into a graph database (docs/ADR-graph-database-layer.md §3/§4b/§5). Node-shaped (set `labels` + `projectedProperties`) OR edge-shaped (set `projectsAsEdge`), never both. Node mode: on every write of the row, `projectToGraph` does an idempotent `MERGE (n:Label {identity}) SET n += $props` over the `projectedProperties` subset; `filterableProperties` (a subset) drive Neo4j indexes so traversals can filter in-graph. Edge mode: the object's rows are relationships (a join/grant table) — see GraphEdgeProjection. `projectedProperties` are the SELECTIVE filter set only (status/category/tenantId/createdAt) — never large text/blobs/full bodies; non-projected attributes are hydrated relationally (§5). Referenced property names are real properties of this object (PropRefer).

## Contained in

- [ObjectSettings](./ObjectSettings.md) as `graphProjection`

Blueprint paths:

- `authentication.dataObjects.objectSettings.graphProjection`
- `services.dataObjects.objectSettings.graphProjection`

## Contains

- `projectsAsEdge`: [GraphEdgeProjection](./GraphEdgeProjection.md)

## References

- `identity` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `projectedProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `filterableProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
