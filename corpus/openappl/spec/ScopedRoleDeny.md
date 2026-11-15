# ScopedRoleDeny

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ScopedRoleDeny in Part 1](../ontology/ScopedRoleDeny.md)

Explicit denies of a ScopedRolePermissionSpec. A hit answers `allowed: false, denied: true`, whatever role was picked (deny overrides allow).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `scopeEdge` | `String` | no |  |  |  | Relationship type from the subject to ANY declared scope node reachable from the resource that denies (e.g. `BLOCKED_FROM`), whatever the precedence picked. |
| `grantEdge` | `String` | no |  |  |  | `graph` grant mode only: relationship type from the picked role node to the permission node that denies even when the role also has the grant edge (e.g. `CANNOT`). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
