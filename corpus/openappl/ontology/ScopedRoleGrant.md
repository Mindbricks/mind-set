# ScopedRoleGrant

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [ScopedRoleGrant in Part 2](../spec/ScopedRoleGrant.md)

How the role picked by a ScopedRolePermissionSpec becomes a decision. `graph` allows when the role node (`roleLabel`, keyed by `roleKeyProperty` = the role value) has a `grantEdge` to the permission node (`permissionLabel`, keyed by `permissionKeyProperty` = `$permission`), e.g. `(Role {key})-[:CAN]->(Action {key: $permission})`; `roleList` allows when the role is in `allowedRoles` (no `$permission` param); `membership` allows whenever a role was picked.

## Contained in

- [ScopedRolePermissionSpec](./ScopedRolePermissionSpec.md) as `grant`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
