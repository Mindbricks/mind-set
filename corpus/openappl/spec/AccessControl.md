# AccessControl

**Level:** `chapter` · **Family:** [AccessControl](../ontology/families.md#accesscontrol) (domain `ProjectAuthentication`)

**Ontology:** [AccessControl in Part 1](../ontology/AccessControl.md)

Configuration chapter for defining the access control architecture of the project. OpenAPPL supports multiple authorization models including role-based, user-based, object-based, and attribute-based access controls. This section enables a unified, flexible, and scalable permission system that ensures resources and operations are securely accessed based on defined authorization rules across services.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permissionBasics` | [`PermissionBasics`](./PermissionBasics.md) | no |  |  |  | Defines the core permission vocabulary of the project, including permission groups and named permissions. These are referenced in access control logic across services. |
| `roleSettings` | [`RBACSettings`](./RBACSettings.md) | no |  |  |  | Settings for Role-Based Access Control (RBAC), which defines how roles are assigned to users and how roles are mapped to permissions. This is the most common access control strategy in projects. Roles are authorization, not badges: a label a user earns is a badge, an ordinary data object with its own apis (a userBadge pattern is planned). A user's role is written only by the built-in doors (updateUserRole, the admin createUser, create<Tenant>UserOnSaas), which accept a declared role below the caller's own, or by a machine-to-machine-only auth api (requiredCallerKind machineWithoutUserIdentity), which may store a declared role that is neither an administrator nor a SaaS-level (saasAdmin, saasUser) role. A multi-tenant project has no admin and no user role: its end users are tenantUser and saasUser. |
| `permissionTypes` | [`PermissionTypes`](./PermissionTypes.md) | no |  |  |  | Specifies which permission application methods are active in the project. OpenAPPL supports role-based, user-based, user-group-based, object-based (OBAC), and attribute-based (ABAC) authorization models. Multiple types can be active concurrently. |
| `objectBasedSettings` | [`OBACPermission`](./OBACPermission.md) | no |  |  |  | Settings related to Object-Based Access Control (OBAC). In this model, access is determined based on the user's relation to a specific object instance, such as ownership. |
| `attributeBasedSettings` | [`AbacPermission`](./AbacPermission.md) | no |  |  |  | Settings for Attribute-Based Access Control (ABAC). In this model, access decisions are based on dynamic rules involving user, object, or contextual attributes. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
