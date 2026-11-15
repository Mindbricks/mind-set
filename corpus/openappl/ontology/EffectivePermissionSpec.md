# EffectivePermissionSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [EffectivePermissionSpec in Part 2](../spec/EffectivePermissionSpec.md)

Spec for `effectivePermission` — boolean path-existence from a subject to a resource over membership + grant + containment edges (docs/ADR-graph-database-layer.md §8b / Cypher map). Returns whether the subject effectively holds the access.

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `effectivePermission`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
