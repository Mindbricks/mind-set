# GraphEdgeEnd

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [GraphEdgeEnd in Part 2](../spec/GraphEdgeEnd.md)

One end of an edge-shaped projection (docs/ADR-graph-database-layer.md §4b). `labels` are the candidate node labels the endpoint may resolve to (e.g. ['User','Group']); `key` is the property on the edge object whose value matches the target node's identity.

## Contained in

- [GraphEdgeProjection](./GraphEdgeProjection.md) as `from`
- [GraphEdgeProjection](./GraphEdgeProjection.md) as `to`

## Contains

No other pattern: every property is a value or a reference.

## References

- `key` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
