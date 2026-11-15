# RBACSettings

**Level:** `section` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [RBACSettings in Part 1](../ontology/RBACSettings.md)

**Activation:** the pattern is switched on by `rbacIsActive`.

Configuration for Role-Based Access Control (RBAC) within the project. When enabled, RBAC allows permissions to be assigned to named roles, which are then associated with users. This setup supports both single-role and multi-role configurations, along with custom logical roles defined by dynamic lookup conditions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `rbacIsActive` | `Boolean` | yes |  |  |  | A boolean value to enable or disable role-based access control (RBAC) in the project. When enabled, access decisions can be made based on user roles. |
| `configuration` | [`RBACSettingsConfig`](./RBACSettingsConfig.md) | no |  |  |  | The configuration object for RBAC settings. Leave it null if rbacIsActive is false. |

## Constraints

Property rules:

- `rbacIsActive` must be present. Enforced only while `rbacIsActive` is on. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `RBAC_ROLE_NAME_RESERVED` | error | Role … "…" is reserved in multi-tenant projects: a role named user does not exist there. |
| `ROLE_NAME_NORMALIZED` | warning | Role name "…" is normalized to "…" in generated code (roles are camelCase identities). |
