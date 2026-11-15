# RolePermission

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [RolePermission in Part 1](../ontology/RolePermission.md)

**Name:** an instance is named by `role`.

A single SEED role-to-permission binding (ADR-native-permission-system §9.1). Binds a role (referenced by its RoleItem `name`) to a list of permission names (declared under a PermissionGroup). Seeded at boot as L4 global-role grant rows in the `givenPermission` store.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `role` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The role this binding grants permissions to. Must match the `name` of a declared RoleItem (or a built-in system role). The seed resolves this to the role's session value (the `roleId` a session carries). |
| `permissions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | The list of permission names granted to the role. Each must resolve to a permission declared under a PermissionGroup. |

## Constraints

Property rules:

- `role` must be present. (`REQUIRED_FIELD_MISSING`)
- `role`, `permissions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PERMISSION_NOT_FOUND` | error | Permission "…" not found in project permission groups. |
| `ROLE_NOT_FOUND` | error | Role "…" not found in project roleItems. |
