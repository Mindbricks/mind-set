# ScopedRolePermissionSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](./families.md#graphservicelayer) (domain `Service`)

**Specification:** [ScopedRolePermissionSpec in Part 2](../spec/ScopedRolePermissionSpec.md)

Spec shared by `scopedRolePermission` and `scopedRoleExplain` — RBAC over ReBAC. The subject's role is read from a property of a membership edge (`(User)-[:MEMBER_OF {role}]->(Project)`) at each declared scope reachable from the resource; ONE role is picked (by default the most specific scope wins, so a project `Viewer` is NOT rescued by a workspace `Admin`) and `grant` turns it into a decision, while an explicit `deny` always wins. Answer contract: `scopedRolePermission` returns exactly ONE row, also for an unknown subject or resource — `allowed` (boolean), `role` (the picked role; null = not a member at any scope), `scope` (the scope `name` it came from), `scopeId` (that scope node's id), `denied` (an explicit deny was hit) and one `<name>Id` column per `returnId` scope. `role` null is not_a_member; `role` set with `allowed` and `denied` false is a plain permission_denied. `scopedRoleExplain` returns one row per candidate (`kind` membership/deny, `scope`, `scopeId`, `hops`, `role`, `granted`, `selected`), at most 25; zero rows = no membership and no deny anywhere. Params: `subjectId`, `resourceId`, `tenantId`, plus `permission` in `graph` grant mode; the resource, scope, role and permission nodes are tenant-filtered like every other graph query. Use it instead of `effectivePermission` when the decision depends on a role stored on the membership, on which scope that role came from, or on a role -> permission join (`effectivePermission` only answers whether an edge path exists, and a stronger role further out would wrongly win). Use it instead of a hand-written `custom` query for this shape: it is validated at design time and emits the tested Cypher.

## Contained in

- [GraphQuerySpec](./GraphQuerySpec.md) as `scopedRolePermission`
- [GraphQuerySpec](./GraphQuerySpec.md) as `scopedRoleExplain`

## Contains

- `scopes`: [ScopedRoleScope](./ScopedRoleScope.md), a list
- `membershipConditions`: [ScopedRoleCondition](./ScopedRoleCondition.md), a list
- `grant`: [ScopedRoleGrant](./ScopedRoleGrant.md)
- `deny`: [ScopedRoleDeny](./ScopedRoleDeny.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
