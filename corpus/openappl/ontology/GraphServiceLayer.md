# GraphServiceLayer

**Level:** `chapter` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [GraphServiceLayer in Part 2](../spec/GraphServiceLayer.md)

The service's graph-database surface, namespaced under `service.graphLayer` so the graph collections don't pollute the Service top level (docs/ADR-graph-database-layer.md §4c/§8/§9). Groups the service's standalone `GraphEdge`s (graph-only relationships, §4c), declarative `GraphQuery`s (curated traversal archetypes, §8b), and composite `HierarchicalResourceGraph` resources (the flagship authorization graph, §9). DataObject node projections live on `objectSettings.graphProjection`; graph providers live on `projectSettings.graphProvidersSettings`.

## Contained in

- [Service](./Service.md) as `graphLayer`

Blueprint paths:

- `services.graphLayer`

## Contains

- `edges`: [GraphEdge](./GraphEdge.md), a list
- `queries`: [GraphQuery](./GraphQuery.md), a list
- `resources`: [HierarchicalResourceGraph](./HierarchicalResourceGraph.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
