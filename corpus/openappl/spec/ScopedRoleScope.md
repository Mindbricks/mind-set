# ScopedRoleScope

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ScopedRoleScope in Part 1](../ontology/ScopedRoleScope.md)

One scope level of a ScopedRolePermissionSpec — where a role can be held (e.g. the project itself, or the workspace the project belongs to). The scope node is reached by walking `pathEdges` from the resource in `direction` (OUTBOUND by default, INBOUND for a parent -> child containment edge), and the subject's membership edge into that node supplies a candidate role. Inside one scope the nearest node wins (fewest hops).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | Scope name returned in the answer's `scope` column (e.g. `project`, `workspace`). A bare identifier, unique within `scopes`. |
| `label` | `String` | yes |  |  |  | Label of the scope node (e.g. `Workspace`). |
| `pathEdges` | `String`[] | no |  |  |  | Edge types walked from the resource to reach the scope node, in `direction` (e.g. ['BELONGS_TO']). Empty with `maxDepth: 0` = the resource itself is the scope node. |
| `minDepth` | `Integer` | no | `0` |  |  | Minimum hops of that walk (default 0). With 0 the resource itself also matches when it carries `label`, so one query answers both for a project and for a workspace passed directly as `$resourceId`. |
| `maxDepth` | `Integer` | no | `0` |  |  | Maximum hops of that walk (default 0 = the resource itself; at most 50). |
| `direction` | `ScopedRoleScopeDirection` | no | `"outbound"` | `outbound`, `inbound` |  | Which way the `pathEdges` walk goes (ScopedRoleScopeDirection): `outbound` (default) follows the edges from the resource, `(r)-[:E*]->(scope)`, for containment written child -> parent (e.g. `BELONGS_TO`, `CONTAINED_IN`); `inbound` walks against them, `(r)<-[:E*]-(scope)`, for containment written parent -> child (the FK `CONTAINS` convention: a `folder.parentId` / `doc.folderId` graphEdge with direction inbound points parent -> child, so a folder scope walks CONTAINS with direction inbound). The validator warns (SCOPED_ROLE_SCOPE_DIRECTION_UNREACHABLE) when no projected writer of the path edges can be walked this way from the resource labels to the scope label. |
| `tenantRoot` | `Boolean` | no | `false` |  |  | Multi-tenant projects: this scope's nodes ARE the tenants (e.g. the workspace of a workspace-per-tenant model). The node must then be `$tenantId` itself instead of carrying the tenant property, so a role there resolves only inside the caller's own tenant and a caller that binds no tenant resolves nothing. Default false. |
| `returnId` | `Boolean` | no | `false` |  |  | Also return a `<name>Id` column (e.g. `workspaceId`): the id of the nearest node of this scope reachable from the resource, member or not. Default false. |

## Constraints

Property rules:

- `name`, `label` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
