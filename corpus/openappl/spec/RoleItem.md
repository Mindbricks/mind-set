# RoleItem

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [RoleItem in Part 1](../ontology/RoleItem.md)

**Name:** an instance is named by `name`.

Represents a role definition in the RBAC system. Each role includes a `name` for display and a `value` used in session data and permission checks.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The display name of the role (e.g., 'grpAdmin', 'editor'). This name will be used for reference in the code and documentation purposes. Please ensure that it is one word with no special characters. For multiple words use camleCase. It must not repeat a system role; in a multi-tenant project the names (and values) admin and user are reserved too (use tenantUser for an ordinary tenant member). |
| `value` | `Any` | yes |  |  |  | The internal value of the role, which will be stored in the `roleId` field of the user or session data. This value is used during authorization checks and should be a string. Make it same as the name to prevent confusion unless you have a reason. When you use a role reference in any authorization configuration, write donw this value not the name. |

## Constraints

Property rules:

- `name`, `value` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DUPLICATE_ROLE_VALUE` | error | Duplicate role value "…" found at index …. |
