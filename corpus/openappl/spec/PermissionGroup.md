# PermissionGroup

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [PermissionGroup in Part 1](../ontology/PermissionGroup.md)

**Name:** an instance is named by `groupName`.

Defines a group of permissions under a shared namespace. Each permission group has a unique groupName and a list of permissions that are referenced across the project using either 'groupName.permission' or standalone permission identifiers. These groups simplify permission management in large-scale projects.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `groupName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The unique identifier of the permission group. It is used as a namespace in the format groupName.permission when referencing permissions in roles or other rules. |
| `permissions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | A list of permission names (strings) defined under this group. These should be unique across the project to ensure consistent access rules. |

## Constraints

Property rules:

- `groupName` must be present. (`REQUIRED_FIELD_MISSING`)
- `groupName`, `permissions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DUPLICATE_GROUP_NAME` | error | Duplicate permission group name "…" found at index …. |
| `DUPLICATE_PERMISSION_ACROSS_GROUPS` | error | Permission "…" is already defined in group "…". |
