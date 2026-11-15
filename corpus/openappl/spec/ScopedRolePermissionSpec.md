# ScopedRolePermissionSpec

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ScopedRolePermissionSpec in Part 1](../ontology/ScopedRolePermissionSpec.md)

Spec shared by `scopedRolePermission` and `scopedRoleExplain` — RBAC over ReBAC. The subject's role is read from a property of a membership edge (`(User)-[:MEMBER_OF {role}]->(Project)`) at each declared scope reachable from the resource; ONE role is picked (by default the most specific scope wins, so a project `Viewer` is NOT rescued by a workspace `Admin`) and `grant` turns it into a decision, while an explicit `deny` always wins. Answer contract: `scopedRolePermission` returns exactly ONE row, also for an unknown subject or resource — `allowed` (boolean), `role` (the picked role; null = not a member at any scope), `scope` (the scope `name` it came from), `scopeId` (that scope node's id), `denied` (an explicit deny was hit) and one `<name>Id` column per `returnId` scope. `role` null is not_a_member; `role` set with `allowed` and `denied` false is a plain permission_denied. `scopedRoleExplain` returns one row per candidate (`kind` membership/deny, `scope`, `scopeId`, `hops`, `role`, `granted`, `selected`), at most 25; zero rows = no membership and no deny anywhere. Params: `subjectId`, `resourceId`, `tenantId`, plus `permission` in `graph` grant mode; the resource, scope, role and permission nodes are tenant-filtered like every other graph query. Use it instead of `effectivePermission` when the decision depends on a role stored on the membership, on which scope that role came from, or on a role -> permission join (`effectivePermission` only answers whether an edge path exists, and a stronger role further out would wrongly win). Use it instead of a hand-written `custom` query for this shape: it is validated at design time and emits the tested Cypher.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `subjectLabel` | `String` | no |  |  |  | Label of the subject node matched by `$subjectId` (e.g. `User`). Null matches the id on any label. The subject node is not tenant-filtered: users cross tenants and the membership decides. |
| `subjectPathEdges` | `String`[] | no |  |  |  | Optional group hop before the membership edge: edge types walked OUTBOUND from the subject (e.g. ['IN_TEAM']), so a membership held by a team the subject belongs to counts too. Empty (default) = only the subject's own memberships. |
| `subjectPathMaxDepth` | `Integer` | no | `0` |  |  | Maximum hops of the `subjectPathEdges` walk (default 0 = direct membership only; at most 50). |
| `resourceLabels` | `String`[] | no |  |  |  | Candidate labels of the node matched by `$resourceId` (e.g. ['Project','Workspace']). Several are allowed; empty = any label. |
| `scopes` | [`ScopedRoleScope`](./ScopedRoleScope.md)[] | no |  |  |  | The scope levels a role can be held at, ORDERED MOST SPECIFIC FIRST (e.g. `project`, then `workspace`). At least one. With `precedence: nearestScope` the first scope that has a membership decides. |
| `membershipEdge` | `String` | yes |  |  |  | Relationship type from the subject to a scope node that carries the role (e.g. `MEMBER_OF`). Its projection must write `roleProperty` (and every condition property and `activeProperty`) as edgeProperties, otherwise every check answers `role: null`. |
| `roleProperty` | `String` | no | `"role"` |  |  | The membership edge property holding the role value (default `role`). |
| `membershipConditions` | [`ScopedRoleCondition`](./ScopedRoleCondition.md)[] | no |  |  |  | Extra equality filters on the membership edge; all must hold (e.g. `[{ "property": "status", "equals": "active" }]`). |
| `activeProperty` | `String` | no |  |  |  | Soft-delete flag checked as `coalesce(x.<property>, true)` on the membership edge, the role node, the grant edge and the permission node (e.g. `isActive`): a record whose flag is false no longer grants. Null (default) = no soft-delete filter. |
| `precedence` | `ScopedRolePrecedence` | no | `"nearestScope"` | `nearestScope`, `highestRank` |  | How one role is picked from the candidates: `nearestScope` (default: the earliest declared scope with a membership wins, then the fewest hops) or `highestRank` (the strongest role by `roleRanking`, at any scope). |
| `roleRanking` | `String`[] | no |  |  |  | `highestRank` only: role values, strongest first (e.g. ['owner','admin','member']). A role not in the list ranks below every listed one. Required with `highestRank`, ignored (with a warning) with `nearestScope`. |
| `roleMatch` | `ScopedRoleMatch` | no | `"exact"` | `exact`, `caseInsensitive` |  | How a role value is compared with the role node key, `roleRanking` and `allowedRoles`: `exact` (default) or `caseInsensitive` (e.g. an edge carrying `Admin` against a role node keyed `admin`). |
| `grant` | [`ScopedRoleGrant`](./ScopedRoleGrant.md) | yes |  |  |  | How the picked role becomes allow/deny (ScopedRoleGrant): `graph` joins the role to a permission node, `roleList` checks a fixed list, `membership` allows any member. |
| `deny` | [`ScopedRoleDeny`](./ScopedRoleDeny.md) | no |  |  |  | Optional explicit denies (ScopedRoleDeny). A deny always wins over a grant. |

## Constraints

Property rules:

- `membershipEdge`, `grant` must be present. (`REQUIRED_FIELD_MISSING`)
- `precedence`, `roleMatch` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
