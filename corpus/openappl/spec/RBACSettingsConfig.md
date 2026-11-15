# RBACSettingsConfig

**Level:** `subsection` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [RBACSettingsConfig in Part 1](../ontology/RBACSettingsConfig.md)

Configuration details for RBAC, including roles, role ID data type, custom role lookups, and multi-role support.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `roleItems` | [`RoleItem`](./RoleItem.md)[] | no |  |  |  | Defines the list of roles available in the project. Each role is represented as a RoleItem object with a name and a value. These roles will be used to assign permissions and will appear in session data during authentication. The system roles always exist, even when RBAC is not active: superAdmin, admin and user in a single-tenant project; superAdmin, saasAdmin, tenantOwner, tenantAdmin, tenantUser and saasUser in a multi-tenant one. Every role item here is an additional role beside them and must not repeat one (RBAC_ROLE_NAME_RESERVED). A multi-tenant project has no role named admin and none named user: its end users are tenantUser (a tenant member, the default role of a new user) and saasUser (a platform-level user), so a role item named or valued admin or user is refused there, every role-write door refuses them (400 ROLE_NOT_DEFINED) and a session-role list naming them is refused (MULTI_TENANT_ADMIN_ROLE_REFERENCE / MULTI_TENANT_USER_ROLE_REFERENCE). Roles are not badges: a label a user earns (premium, gold, verified seller) is a badge - an ordinary data object with its own apis (a userBadge pattern is planned) - not a role item. |
| `rolePermissions` | [`RolePermission`](./RolePermission.md)[] | no |  |  |  | Optional SEED of default role-to-permission grants (ADR-native-permission-system §9.1). Each entry binds a declared role (by its RoleItem name) to a list of declared permissions (PermissionGroup permission names). At project boot these are upserted into the `givenPermission` store as L4 global-role grant rows (`{ roleId: <role value>, permissionName, canDo: true }`), so a session carrying that role is granted those permissions by default. These are SEED defaults only — an admin can edit the live bindings at runtime via the PBAC management API. |
| `customRoleLookups` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | An optional mapping of custom logical roles and their evaluation logic. Each entry maps a role name to an MScript condition that determines whether the role is assigned to a user dynamically. |
| `usersHaveMultipleRoles` | `Boolean` | no | `false` |  |  | Indicates whether users can have multiple roles. If true, the `roleId` in the session and user model will be treated as an array of role values. Every door that writes a role list (updateUserRole, the admin createUser, create<Tenant>UserOnSaas and the machine-to-machine role-write door) refuses an empty list with 400 ROLE_LIST_EMPTY: it would strip every role the user holds. |

## Constraints

Property rules:

- The items of `roleItems` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `rolePermissions` must have distinct names (`role`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `customRoleLookups` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
