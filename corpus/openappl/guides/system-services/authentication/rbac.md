---
title: RBAC (Role-Based Access Control)
---

# RBAC (Role-Based Access Control)

RBAC is a declarative way to manage user permissions across the project. It is configured
under `AccessControl.roleSettings` ([`RBACSettings`](../../../spec/RBACSettings.md) /
[`RBACSettingsConfig`](../../../spec/RBACSettingsConfig.md)).

```plaintext
Roles are defined at design time and treated as a static vocabulary.
This gives consistent behavior across services and simplifies permission
reasoning.
```

## Enabling RBAC

```json
{
  "authentication": {
    "accessControl": {
      "roleSettings": {
        "rbacIsActive": true,
        "configuration": { "usersHaveMultipleRoles": false }
      }
    }
  }
}
```

When `rbacIsActive` is `true`, the auth service and other modules enforce access control
based on roles.

## System-level roles (always present)

Even when RBAC is not explicitly activated, the compiler applies a system-level role model.
The `roleId` property is **always** attached to every user, keeping fundamental
authorization flows consistent.

**Single-tenant projects** get these built-in roles:

- `superAdmin`
- `admin`
- `user`

**Multi-tenant (SaaS) projects** get an extended set:

- SaaS-level: `superAdmin`, `saasAdmin`, `saasUser`
- Tenant-level (per tenant): `tenantOwner`, `tenantAdmin`, `tenantUser`

A SaaS-level role (`saasAdmin`, `saasUser`) is granted only by a `superAdmin` or
`saasAdmin` caller; a tenant-level caller is refused with `400 SAAS_ROLE_GRANT_FORBIDDEN`
(see [Users](users.md)).

These are generated automatically and support the foundational permission logic for
managing tenants, users, and administrative hierarchies, even before any custom RBAC
configuration.

> **`admin` is not available in multi-tenant projects; use `superAdmin` / `saasAdmin`.**
> In a multi-tenant project the platform operator is `superAdmin` + `saasAdmin` only. A role
> item named `admin` (or whose `value` is `admin`, in any case) is refused with
> `RBAC_ROLE_NAME_RESERVED`, and an `admin` entry in any session-role list (an api's
> `checkRoles` / `absoluteRoles`, the checkout / subscription / ledger route gates, the
> bucket, hub-room, video-room, event-subscription, content, job-stream and agentHub role
> lists) is refused with `MULTI_TENANT_ADMIN_ROLE_REFERENCE`. Use `superAdmin` /
> `saasAdmin` for the platform operator, or a differently named role (for example
> `storeAdmin`) for a tenant-level administrator. The generated system services spell their
> operator gates `saasAdmin` in a multi-tenant project, a deliberate widening of
> `saasAdmin`, a SaaS-level role only `superAdmin` can grant. Role-list defaults are
> tenancy-aware: the agentHub `approvalRoles` / `dynamicAgentRoles` default is empty and
> resolves to `superAdmin` + `saasAdmin` in a multi-tenant project; a blueprint that still
> carries the old default `["superAdmin","admin"]` there only warns
> (`MULTI_TENANT_ADMIN_ROLE_LEGACY_DEFAULT`). Single-tenant projects are unchanged: `admin`
> is a built-in role there.

> **`user` is not available in multi-tenant projects either; use `tenantUser` / `saasUser`.**
> The end users of a multi-tenant project are `tenantUser` (a member of a tenant, the
> default role of a new user) and `saasUser` (a platform-level user). Every role-write door
> refuses `user` there with `400 ROLE_NOT_DEFINED`, a role item named or valued `user` is
> refused with `RBAC_ROLE_NAME_RESERVED`, and a `user` entry in any session-role list is
> refused with `MULTI_TENANT_USER_ROLE_REFERENCE` (no one can hold the role, so the entry
> would admit nobody). Single-tenant projects are unchanged: `user` is their base role.

> **Roles are not badges.** A role gates authorization; a label a user earns (premium, gold,
> verified seller) is a badge: an ordinary data object with its own apis. A real role change
> after an operation goes through a machine-to-machine-only auth api, which may store only a
> declared role that is neither an administrator nor a SaaS-level (`saasAdmin`, `saasUser`)
> role; see [Users](users.md#roleid).

The list is a **vocabulary, not a ladder**: these roles are compared by name and none of
them inherits another's access. In particular `superAdmin` does not implicitly pass a
`checkRoles` gate declared for `admin`: `checkRoles` is matched by name and nothing else.

The operator BYPASS is the one thing you do not have to name: every login-required Business
API is generated with `superAdmin` as an absolute role, and `tenantOwner` is added wherever
the tenant filter is in force (a tenant-scoped api, never a SaaS-level one). No other role
joins them, not `tenantAdmin`. An absolute role bypasses every authorization check but never
the tenant scope, so the automatic `tenantOwner` reaches its own tenant and nothing else;
where the tenant filter is absent (a SaaS-level api, a shared-catalog object) only
`superAdmin` is automatic, and you declare any tenant role you need there yourself. See
[`superAdmin` is automatic](./business-api-auth.md#superadmin-and-tenantowner-are-automatic-hierarchy-still-is-not).

## Defining roles

Roles are defined via `roleItems`, an array of [`RoleItem`](../../../spec/RoleItem.md)
(each with `name` and `value`):

```json
{
  "authentication": {
    "accessControl": {
      "roleSettings": {
        "rbacIsActive": true,
        "configuration": {
          "roleItems": [
            { "name": "Admin", "value": "admin" },
            { "name": "User", "value": "user" },
            { "name": "Manager", "value": "manager" }
          ]
        }
      }
    }
  }
}
```

- `name`: display label (used in UIs and docs).
- `value`: stored in `user.roleId` and the session.

`RoleItem.value` is type `Any`, so you may use strings or numbers; there is no separate
role-ID-type setting. Pick a convention and keep it.

## Multiple roles per user

Allow multiple roles via `usersHaveMultipleRoles`:

```json
{
  "authentication": {
    "accessControl": {
      "roleSettings": {
        "rbacIsActive": true,
        "configuration": { "usersHaveMultipleRoles": true }
      }
    }
  }
}
```

When `true`, `roleId` is an array of role values end to end:

- **Storage**: the auth `user.roleId` column is a String array (at most 255 characters per
  element) with default `["user"]` (`["tenantUser"]` on a multi-tenant project); the
  `userSession.roleId` snapshot is an array too. The seeded super admin carries
  `["superAdmin"]`.
- **Session**: `session.roleId` carries the array. Author role checks with
  `userHasRole('staff')` (variadic: `userHasRole('staff', 'admin')`), which already passes on
  ANY held role and reads both shapes. The framework's own gates normalize the slot the same
  way.
- **Granting roles**: `PATCH /userrole/:userId` accepts a single string or a list
  (`{ "roleId": ["admin", "editor"] }`); a string is stored as a one-element list.
  `createUser` takes the same shape. The role-ceiling guards rank both sides by the highest
  role held, so no listed role may outrank the caller.
- **Gates**: `checkRoles`, `absoluteRoles`, ownership bypass and the RBAC/PBAC resolvers pass
  when ANY held role is listed. A global-role grant row applies when any held role matches
  it.
- **Every other role gate, same rule**: the socket hub join gate and the event-subscription
  topic gate, the video room gate, the content-layer editorial gates (edit / publish /
  review / approve), the agent tool `requiredRoles` filter, the agentHub approval roles, the
  tool-hub operator policy and the job-stream route gate all decide on ANY held role. A
  session whose role set cannot be determined (no `roleId`, an empty list, a list of blank
  values) names NO role and is DENIED, never waved through.
- **Cross-project identity**: a verified sibling-project claim may carry `roleId` as a list;
  the forwarded-identity merge admits a flat array of scalars and `FORWARDED_ROLE_CEILING`
  caps it role by role, dropping the slot entirely when nothing survives.
- **Directory**: `listUsersByRole?roleName=<value>` matches by membership, so notification
  role fan-out reaches multi-role users.
- **Filtering on the column**: on a project where `roleId` is still a SCALAR, `$overlap` /
  `$noverlap` and `$contains` / `$ncontains` authored against it degrade to `$in` / `$nin`
  rather than erroring, so the same filter is portable across the flag.

**Migration note.** Flipping the flag on an existing project changes the column TYPE from a
single string to a string array. A generated service that supports the migration retypes
`user.roleId` and `userSession.roleId` itself when it starts, wraps each stored role in a
one-element array, keeps `NULL` as `NULL` and keeps `NOT NULL`, and reports each converted
column; the next start changes nothing. Document stores need no column change (a stored
scalar is read as a one-element array), search-index keyword mappings index both shapes, and
sessions cached before the flip still carry a scalar: every gate reads both shapes, so they
keep working until they expire. See [Changing a stored property into an
array](../../data-modeling/property-types.md#changing-a-stored-property-into-an-array) for
the rules and the limits.

Three things to know before the deploy:

- **Old instances stop working when the column changes.** A service built before the change
  writes a plain string into what is now an array column, and that write fails. Replace
  every instance; do not run the old and the new build side by side for long.
- **Values written during a mismatch are not repaired.** If a regenerated service ran
  against the scalar column, a registration in that window may have stored the array literal
  as text, for example `{"user"}`. The wrap turns it into the one-element array
  `['{"user"}']`, which matches no role. Find such rows (a role whose text starts with `{`)
  and correct them by hand.
- **A wrap that fails is reported, not hidden.** The health report then carries the failed
  repair and names the column with the reason `array-wrap-failed` and the database's
  message. The column is still a single string, so logins fail until the cause is removed
  and the service restarts.

You can also run the cast yourself on the auth database before deploying the regenerated
service (retype both `roleId` columns to a string array, wrapping each non-null value in a
one-element array and setting the array default); the reconcile then finds arrays and does
nothing. Use `'tenantUser'` as the default on a multi-tenant project, and the project's
actual table names if they are prefixed.

## Custom role lookups

`RBACSettingsConfig` supports `customRoleLookups`, an array of `DataMapItem` with
[MScript](../../mscript/overview.md) values: dynamic, logical roles evaluated at runtime:

```json
{
  "authentication": {
    "accessControl": {
      "roleSettings": {
        "rbacIsActive": true,
        "configuration": {
          "customRoleLookups": [
            {
              "name": "isProjectAdmin",
              "value": { "js": "session.roleId === 'editor'" }
            }
          ]
        }
      }
    }
  }
}
```

The generated predicate receives the current `session` as its argument, so lookup
expressions read session fields directly. These logical roles can be used inside Business
APIs and validation scripts.

## See also

- [PBAC](./pbac.md): fine-grained permission models layered on roles.
- [Business API authentication](./business-api-auth.md): `checkRoles`, `absoluteRoles`, and
  per-API enforcement.
- [Permissions strategy](../../best-practices/permissions-strategy.md): when to reach for
  roles vs OBAC vs ABAC.
- Spec: [`RBACSettings`](../../../spec/RBACSettings.md),
  [`RBACSettingsConfig`](../../../spec/RBACSettingsConfig.md),
  [`RoleItem`](../../../spec/RoleItem.md).
