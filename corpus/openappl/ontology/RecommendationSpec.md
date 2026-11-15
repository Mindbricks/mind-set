# RecommendationSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [RecommendationSpec in Part 2](../spec/RecommendationSpec.md)

Spec for `recommendation` — a collaborative-filtering traversal: peers who share an edge with the subject, then THEIR other targets (docs/ADR-graph-database-layer.md §8b / §12). 'Users like me also viewed…'. For learned/scored recommendation use a ComputeJob with graphIO instead.

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `recommendation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
