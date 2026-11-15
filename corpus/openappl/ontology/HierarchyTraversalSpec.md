# HierarchyTraversalSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [HierarchyTraversalSpec in Part 2](../spec/HierarchyTraversalSpec.md)

Spec shared by `ancestors` and `descendants` — upward or downward traversal of a single hierarchy edge (docs/ADR-graph-database-layer.md §8b). `ancestors` walks the edge toward the root ('all managers above'); `descendants` walks toward the leaves ('headcount under').

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `ancestors`
- [GraphQuerySpec](./GraphQuerySpec.md) as `descendants`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
