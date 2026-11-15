# PermissionExplainSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [PermissionExplainSpec in Part 2](../spec/PermissionExplainSpec.md)

Spec for `permissionExplain` — returns the matched PATH(S) from subject to resource, not just a boolean (docs/ADR-graph-database-layer.md §8b / Cypher map). The enterprise-grade 'why can they access this — which group/role/folder/grant granted it?' query that pure CRUD cannot offer.

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `permissionExplain`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
