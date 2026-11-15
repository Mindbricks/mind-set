---
title: PBAC (Permission-Based Access Control)
---

# PBAC (Permission-Based Access Control)

Beyond [RBAC](./rbac.md), OpenAPPL offers **Permission-Based Access Control**: a
fine-grained system for defining and evaluating permissions at multiple levels. PBAC is
configured under `accessControl` using
[`PermissionBasics`](../../../spec/PermissionBasics.md),
[`PermissionBasicsConfig`](../../../spec/PermissionBasicsConfig.md),
[`PermissionGroup`](../../../spec/PermissionGroup.md),
[`PermissionTypes`](../../../spec/PermissionTypes.md),
[`OBACPermission`](../../../spec/OBACPermission.md), and
[`AbacPermission`](../../../spec/AbacPermission.md).

## Enabling PBAC

```json
{
  "authentication": {
    "accessControl": {
      "permissionBasics": {
        "pbacIsActive": true,
        "configuration": { "permissionGroups": [] }
      }
    }
  }
}
```

## Defining permissions and groups

Permissions are declared in named groups under `permissionGroups`:

```json
{
  "authentication": {
    "accessControl": {
      "permissionBasics": {
        "pbacIsActive": true,
        "configuration": {
          "permissionGroups": [
            {
              "groupName": "projectManagement",
              "permissions": ["createProject", "editProject", "deleteProject"]
            },
            {
              "groupName": "userManagement",
              "permissions": ["inviteUser", "removeUser"]
            }
          ]
        }
      }
    }
  }
}
```

Each permission string must be unique across the project. Reference them as
`"projectManagement.createProject"` / `"userManagement.inviteUser"`, or simply
`"createProject"`, depending on your naming style.

## Activating permission types

[`PermissionTypes`](../../../spec/PermissionTypes.md) declares **which strategies** are
active; multiple can run concurrently:

```json
{
  "authentication": {
    "accessControl": {
      "permissionTypes": {
        "roleBasedPermissionsIsActive": true,
        "userBasedPermissionsIsActive": true,
        "userGroupBasedPermissionsIsActive": true,
        "objectBasedPermissionsIsActive": true,
        "tenantBasedPermissionsIsActive": true
      }
    }
  }
}
```

- `roleBasedPermissionsIsActive`: permissions via roles.
- `userBasedPermissionsIsActive`: permissions granted directly to users.
- `userGroupBasedPermissionsIsActive`: group-based permissions.
- `objectBasedPermissionsIsActive`: object-scoped permissions (OBAC).
- `tenantBasedPermissionsIsActive`: tenant-scoped permission logic.

## Object-Based Access Control (OBAC)

Configured through [`OBACPermission`](../../../spec/OBACPermission.md) under
`objectBasedSettings`:

```json
{
  "authentication": {
    "accessControl": {
      "objectBasedSettings": {
        "objectBasedPermissionsIsActive": true,
        "dataObjects": ["project", "invoice"]
      }
    }
  }
}
```

Access to specific instances of `project` or `invoice` is then governed by object-level
rules (e.g. per-record permissions).

## Tenant-based permissions

Tenant-based logic is activated via `tenantBasedPermissionsIsActive` in `PermissionTypes`.
Conceptually this enables:

- SaaS-level administrators to define **tenant-specific permission profiles**.
- Different tenants to have different permission sets or feature capabilities.

See [Multi-tenancy](./multi-tenancy.md) for tenant-level authorization options and
feature-flag-style modeling.

## Attribute-Based Access Control (ABAC)

ABAC is handled via [`AbacPermission`](../../../spec/AbacPermission.md) under
`attributeBasedSettings`:

```json
{
  "authentication": {
    "accessControl": {
      "attributeBasedSettings": {
        "attributeBasedPermissionsIsActive": true,
        "abacDefinitions": [
          {
            "name": "projectEditors",
            "dataObject": "project",
            "whereClause": { "js": "{ projectType: 'external' }" },
            "permissions": ["projectManagement.editProject"]
          }
        ]
      }
    }
  }
}
```

- `dataObject`: the target data object.
- `whereClause`: an [MScript](../../mscript/overview.md) expression that evaluates to a
  **query-like filter object**, not a boolean predicate. When the filter matches a row, the
  rule's `permissions` are granted on that row.
- `permissions`: permission strings granted when the rule matches.

ABAC rules are evaluated in the context of data objects and may **override** or **augment**
role-based and user-based permissions.

## Permission-assignment storage

When PBAC is active (`permissionBasics.pbacIsActive`), the auth service generates the
**`givenPermission`** data object and stores every permission assignment in it; you do not
model it yourself. One row is one grant or one explicit denial:

| Column | Meaning |
|---|---|
| `permissionName` | The permission. `null` on an **object-role** row (a user holds a role on one object). |
| `roleId` | The role the row applies to (role grants and object roles). |
| `subjectUserId` | The user the row applies to. |
| `subjectUserGroupId` | The user group the row applies to. |
| `objectId` | The object instance the row is scoped to; `null` for a general grant. |
| `canDo` | Required, default `true`. `false` makes the row an explicit **deny**. |
| `<tenantName>Id` | The tenant, on a multi-tenant project. |

A permission check walks the layers from the most specific to the least (object override,
user override, object role, membership, global role, ownership) and the first layer with a
matching row decides. Inside one layer a `canDo: false` row beats any grant, and when no
layer matches the answer is deny. An absolute role short-circuits the walk with an allow.

The rows are written through the auth service's permission APIs (`createRolePermission`,
`createObjectPermission`, ...). Each `(role, permission)` pair declared in the RBAC
settings' `rolePermissions` is seeded as one row at startup. For the routes, methods and
callers of the generated permission APIs see [the compiler
specification](../../../compiler/index.md).

### Checks in services other than auth

The permission assignments (the `givenPermission` rows) are stored in the **auth** service.
A `permissionCheck` on a business API of any other service reads them from auth over the
machine-to-machine seam:

- the service posts the permission and its caller's identity (user id, role ids, tenant id)
  to auth's `POST /subjectgivenpermissions` with a signed `x-m2m-token` (audience
  `svc:auth@<projectId>`, the same seam the agent hub uses for chat identity). Auth accepts
  only a verified peer service, never a user session.
- auth answers the caller's rows, read with the same query its own resolver runs; the
  service then decides locally through the same layers (object and user overrides, object
  roles, membership, global role, ownership).
- an answer is cached for **30 seconds** per user, role, tenant and permission, so a grant
  or a revoke reaches the other services within that window.
- the check **fails closed**: when auth cannot be asked (the auth address or project id
  missing, auth unreachable, a refused token, a malformed answer) the request is refused
  with HTTP `503`. The client receives a generic `503` / internal-error answer; the
  internal error retains `PERMISSIONS_UNAVAILABLE` for diagnostics. A permission-filtered
  list is refused rather than returned empty.

Every service that runs a `permissionCheck` therefore needs the auth service's address and
its service identity (the M2M signing key), as for any other call to auth.

## PBAC permission-types summary

| Permission type | Description | Activation key |
|---|---|---|
| Role-Based | Permissions granted based on roles | `roleBasedPermissionsIsActive` |
| User-Based | Permissions granted directly to users | `userBasedPermissionsIsActive` |
| User Group-Based | Permissions granted to user groups | `userGroupBasedPermissionsIsActive` |
| Tenant-Based | Tenant-specific permission logic and profiles | `tenantBasedPermissionsIsActive` |
| Object-Based (OBAC) | Permissions tied to specific object instances | `objectBasedPermissionsIsActive` |
| Attribute-Based (ABAC) | Permissions via attribute-level rules (`AbacPermission`) | `attributeBasedPermissionsIsActive` in `attributeBasedSettings` |

## See also

- [RBAC](./rbac.md): roles as the base layer.
- [User groups](./user-groups.md): the subjects of group-based permissions.
- [Business API authentication](./business-api-auth.md): how permissions are enforced per
  API.
- [Permissions strategy](../../best-practices/permissions-strategy.md): choosing among the
  models.
- Spec: [`PermissionBasics`](../../../spec/PermissionBasics.md),
  [`PermissionTypes`](../../../spec/PermissionTypes.md),
  [`OBACPermission`](../../../spec/OBACPermission.md),
  [`AbacPermission`](../../../spec/AbacPermission.md).
