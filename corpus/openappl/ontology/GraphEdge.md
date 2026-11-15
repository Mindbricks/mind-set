# GraphEdge

**Level:** `section` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [GraphEdge in Part 2](../spec/GraphEdge.md)

A standalone, graph-only relationship hosted on a service (docs/ADR-graph-database-layer.md §4c). Unlike the FK property `graphEdge` (§4a) or the edge-object `projectsAsEdge` (§4b), a GraphEdge has NO relational home — it exists only in the graph (e.g. a computed `SIMILAR_TO` between documents). Its `properties[]` reuse the standard DataProperty shape. Sibling of computeJobs / dbBuckets on the service.

## Contained in

- [GraphServiceLayer](./GraphServiceLayer.md) as `edges` (a list)

Blueprint paths:

- `services.graphLayer.edges`

## Contains

- `properties`: [DataProperty](./DataProperty.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
