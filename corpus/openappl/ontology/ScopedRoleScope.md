# ScopedRoleScope

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [ScopedRoleScope in Part 2](../spec/ScopedRoleScope.md)

One scope level of a ScopedRolePermissionSpec — where a role can be held (e.g. the project itself, or the workspace the project belongs to). The scope node is reached by walking `pathEdges` from the resource in `direction` (OUTBOUND by default, INBOUND for a parent -> child containment edge), and the subject's membership edge into that node supplies a candidate role. Inside one scope the nearest node wins (fewest hops).

## Contained in

- [ScopedRolePermissionSpec](./ScopedRolePermissionSpec.md) as `scopes` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
