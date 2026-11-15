# HierarchicalEdge

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [HierarchicalEdge in Part 2](../spec/HierarchicalEdge.md)

One edge of a HierarchicalResourceGraph (docs/ADR-graph-database-layer.md §9). `from` / `to` may each be a single node label or a list of candidate labels (e.g. a CAN_READ edge from ['user','group'] to ['folder','document']).

## Contained in

- [HierarchicalResourceGraph](./HierarchicalResourceGraph.md) as `edges` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
