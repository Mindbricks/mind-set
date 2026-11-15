---
title: User groups
---

# User groups

The `auth` service supports **user grouping**: organizing users into logical groups. Groups
are most useful for permission management (see [PBAC](./pbac.md)) but can drive any
group-based business logic across services.

- A user can belong to **zero, one, or many groups**.
- Only admin-level users can create groups and assign members.

Activate groups via `LoginDefUserSettings.userGroupsActive`:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "userGroupsActive": true }
    }
  }
}
```

When `userGroupsActive` is `true`, the compiler adds two system-owned data objects to the
auth service:

| Data object | System columns |
|---|---|
| `userGroup` | `id`, `groupName`, `avatar` |
| `userGroupMember` | `id`, `groupId`, `userId`, `ownerId` |

## `userGroup`

Stores metadata about each group.

1. **`id`**: UUID identifying the group.
2. **`groupName`**: the group's display name.
3. **`avatar`**: a public URL to the group avatar. As with user avatars, the auth service
   stores only the URL, never the binary.

Auto-generate group avatars with `userGroupAutoAvatarScript` (an
[MScript](../../mscript/overview.md) expression). The default uses Gravatar against the group
name:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": {
        "userGroupAutoAvatarScript": { "js": "`https://gravatar.com/avatar/${LIB.common.md5(this.groupName ?? 'nullValue')}?s=200&d=identicon`" }
      }
    }
  }
}
```

## `userGroupMember`

Each record is one membership.

1. **`id`**: UUID for this membership (use it when removing a member).
2. **`groupId`**: the group's ID.
3. **`userId`**: the member's ID.
4. **`ownerId`**: the admin who created the membership, auto-populated from the current
   session.

## Tenant-level grouping

In multi-tenant apps you choose whether groups are tenant-scoped or global, via
`userGroupsInTenantLevel`:

```json
{
  "authentication": {
    "loginDefinition": {
      "userSettings": { "userGroupsInTenantLevel": true }
    }
  }
}
```

- **Tenant-level groups** (`true`): created and visible only within the owning tenant; only
  tenant admins manage them. A tenant-ID field (e.g. `clientId`, `storeId`) is added to both
  `userGroup` and `userGroupMember`.
- **SaaS-level (global) groups** (`false`, default): shared across tenants; created and
  managed by SaaS-level admins (e.g. `superAdmin`). Tenant admins can assign users to global
  groups but cannot create, update or delete them. What each caller can READ of them is
  scoped (below), and so is what it can WRITE ([Writing groups and
  memberships](#writing-groups-and-memberships)).

## Writing groups and memberships

The write APIs are admin-gated (`superAdmin`, `admin`, `saasAdmin`, `tenantAdmin`). On a
multi-tenant project two more rules apply:

| Write | Global groups (multi-tenant) | Tenant-level groups | Single-tenant |
|---|---|---|---|
| `createGroup` / `updateGroup` / `deleteGroup` (and the `*UserGroup` aliases) | `superAdmin` / `saasAdmin` only | the admin roles, inside the caller's tenant | the admin roles |
| `addGroupMember` / `createUserGroupMember` | SaaS-level roles: any user; another admin role: users of its own session tenant only | same as global, and the `groupId` must be a group of its own session tenant | the admin roles |
| `removeGroupMember` / `deleteUserGroupMember` | SaaS-level roles: any membership; another admin role: memberships of users of its own session tenant only | the admin roles, inside the caller's tenant | the admin roles |

A tenant admin naming a user (or a membership whose user) is outside its session tenant gets
**404**, and nothing is written. On tenant-level groups the same 404 answers an add whose
`groupId` names another tenant's group. A machine (M2M) caller with no user identity is not
narrowed.

## Reading groups and memberships

The four read APIs (`getUserGroup`, `listUserGroups`, `getGroupMember`, `listGroupMembers`)
accept any signed-in caller, and each carries a row scope in its query. The scope applies to
the by-id read (a row outside it is a 404), to the list rows and to the list count alike:

| Caller | Memberships it reads | Groups it reads |
|---|---|---|
| `superAdmin` / `saasAdmin` (and `admin` on a single-tenant project) | all | all |
| `tenantAdmin`, tenant-level groups | its session tenant's | its session tenant's |
| `tenantAdmin`, global groups | those of its session tenant's users | the groups those memberships reference |
| everyone else (`tenantOwner`, `tenantUser`, `user`, an admin role of a multi-tenant project other than the above) | its own (`userId` = the caller) | the groups it is an active member of |

A shared global group therefore shows a tenant admin only its own tenant's members.
`ownerId` plays no part (it records the admin who added the member). A machine (M2M) caller
with no user identity matches nothing.

`listGroupMembers` (`GET /groupmembers`) also declares two filters, `groupId` and `userId`:
`?groupId=<id>` lists one group's memberships, `?userId=<id>` one user's, and both together
are ANDed. A filter only narrows the scope above; it never widens it.

User-group permissions are activated separately under `accessControl` via
`permissionTypes.userGroupBasedPermissionsIsActive` (see [PBAC](./pbac.md)).

## See also

- [Users](./users.md): the `user` object and its system properties.
- [PBAC](./pbac.md): group-based permission grants.
- [Multi-tenancy](./multi-tenancy.md): tenant scoping.
- Spec: [`LoginDefUserSettings`](../../../spec/LoginDefUserSettings.md).
