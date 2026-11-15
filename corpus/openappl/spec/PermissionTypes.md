# PermissionTypes

**Level:** `section` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [PermissionTypes in Part 1](../ontology/PermissionTypes.md)

Defines the active permission mechanisms in the project. OpenAPPL supports multiple types of permission strategies including role-based (RBAC), user-specific overrides, user group-level permissions, object-level (OBAC), and tenant-specific rules. This configuration determines which of these models are enabled for the access control logic.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roleBasedPermissionsIsActive` | `Boolean` | no | `true` |  |  | Enables Role-Based Access Control (RBAC) for the project. When active, permissions can be assigned to roles, and users inherit access through their roles. |
| `userBasedPermissionsIsActive` | `Boolean` | no |  |  |  | Enables user-specific permission overrides. When active, admins can assign custom permissions directly to individual users regardless of their roles or groups. |
| `userGroupBasedPermissionsIsActive` | `Boolean` | no |  |  |  | Enables permission control via user groups. When active, permissions can be assigned to defined user groups and inherited by all members. |
| `objectBasedPermissionsIsActive` | `Boolean` | no |  |  |  | Enables Object-Based Access Control (OBAC). When active, permission rules can be defined per individual data object (e.g., per record) and evaluated dynamically based on the object's relation to the user. |
| `tenantBasedPermissionsIsActive` | `Boolean` | no |  |  |  | Declared switch for tenant-specific permission profiles, default false. Current nodejs multi-tenant permission queries already include current-tenant or ROOT rows independently of this flag; it does not enable or disable those existing rows. A separate custom tenant-profile model and the meaning of true/false remain unspecified. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
