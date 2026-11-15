# ScopedRoleGrant

**Level:** `subsection` · **Family:** [GraphServiceLayer](../ontology/families.md#graphservicelayer) (domain `Service`)

**Ontology:** [ScopedRoleGrant in Part 1](../ontology/ScopedRoleGrant.md)

How the role picked by a ScopedRolePermissionSpec becomes a decision. `graph` allows when the role node (`roleLabel`, keyed by `roleKeyProperty` = the role value) has a `grantEdge` to the permission node (`permissionLabel`, keyed by `permissionKeyProperty` = `$permission`), e.g. `(Role {key})-[:CAN]->(Action {key: $permission})`; `roleList` allows when the role is in `allowedRoles` (no `$permission` param); `membership` allows whenever a role was picked.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `mode` | `ScopedRoleGrantMode` | yes |  | `graph`, `roleList`, `membership` |  | The grant mode (ScopedRoleGrantMode): `graph`, `roleList` or `membership`. |
| `roleLabel` | `String` | no |  |  |  | `graph` mode (required there): label of the role node (e.g. `Role`). |
| `roleKeyProperty` | `String` | no | `"key"` |  |  | `graph` mode: the role node property matched against the picked role value (default `key`). |
| `grantEdge` | `String` | no |  |  |  | `graph` mode (required there): relationship type from the role node to the permission node (e.g. `CAN`). |
| `permissionLabel` | `String` | no |  |  |  | `graph` mode (required there): label of the permission node (e.g. `Action`). |
| `permissionKeyProperty` | `String` | no | `"key"` |  |  | `graph` mode: the permission node property matched against `$permission` (default `key`). |
| `allowedRoles` | `String`[] | no |  |  |  | `roleList` mode (required and non-empty there): the role values that allow (e.g. ['admin','owner']). |

## Constraints

Property rules:

- `mode` must be present. (`REQUIRED_FIELD_MISSING`)
- `mode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
