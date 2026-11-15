---
title: Permission & membership filters
---

# Permission & membership filters

Two list-filter families that scope a list query by *who is asking*,
evaluated against the session and the project's access model — without
hard-coding the predicate in every endpoint. Both contribute an
id-list / criterion to the list's WHERE clause; they differ in how
multiple entries combine:

- **Permission filters** (`ListPermissionFilter`) are **restrictive** —
  multiple entries combine with **AND**.
- **Membership filters** (`ListMembershipFilter`) are **permissive** —
  multiple entries combine with **OR** (any membership grants
  visibility).

This is the list-time counterpart to the single-record
[`MembershipCheckAction`](membership.md) gate and the permission checks
in the [authentication](../system-services/authentication/overview.md) pipeline.

## Permission filters

### Which block activates it

`BusinessApi.query.listOptions.permissionFilters[]` (array of
`ListPermissionFilter`) on a `list`-type API:

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | String | ✓ | Code-safe identifier. |
| `permission` | String | ✓ | The permission the filter is built for. |
| `condition` | MScript | | Optional — when it evaluates false the filter is skipped entirely (e.g. exempt owners or platform admins). |

### What it emits

Each entry dynamically constrains the query to records the caller is
permitted to see under `permission`, derived from session/object roles.
More than one entry → all are applied with **AND** (each further
narrows the set).

```json
{
  "basics": { "apiOptions": { "name": "listInvoices", "crudType": "list", "dataObjectName": "Invoice" } },
  "query": {
    "listOptions": {
      "permissionFilters": [
        { "name": "canViewInvoices", "permission": "invoice.view" },
        { "name": "regionScoped",    "permission": "invoice.viewRegion", "condition": { "js": "this.session.role !== 'globalAdmin'" } }
      ]
    }
  }
}
```

`canViewInvoices` always applies; `regionScoped` adds a second
restriction unless the caller is a `globalAdmin` (the `condition`
skips it). Both restrictions are ANDed.

## Membership filters

### Which block activates it

`BusinessApi.query.listOptions.membershipFilters[]` (array of
`ListMembershipFilter`) on a `list`-type API:

| Field | Type | Req | Notes |
|---|---|---|---|
| `name` | String | ✓ | Code-safe identifier. |
| `objectKeyIdField` | PropRefer | ✓ | Property on the *list item* that holds the owning-record id to check membership against (e.g. `organisationId` on a `Project`). |
| `userKey` | MScript | ✓ | The user id to check; typically `this.session.userId`. |
| `dataObjectName` | DataObjectName | | The object whose membership configuration applies. Defaults to the API's main data object; set it to check a related/parent object's membership. |
| `checkFor` | MScript | | Optional — narrow by the membership row. A value (`'admin'`, `['owner','admin']`) is the required member ROLE: it is compared with the row's declared `roleField` only, case-insensitively (no `roleField` = every member is `member`). An expression that reads `membership` (`membership.seat === 'gold'`) is a predicate evaluated on each membership row. If omitted, any valid membership grants access. |
| `condition` | MScript | | Optional — skip the membership check entirely when false (exempt owners / admins). |

### What it emits

Each entry joins through the configured membership object (see
[Membership](membership.md)) and keeps rows the caller has a valid
membership on. More than one entry → **OR**: a row is visible if the
caller satisfies *any* one of the membership filters.

```json
{
  "basics": { "apiOptions": { "name": "listTasks", "crudType": "list", "dataObjectName": "Task" } },
  "query": {
    "listOptions": {
      "membershipFilters": [
        {
          "name":             "viaProject",
          "dataObjectName":   "Project",
          "objectKeyIdField": "projectId",
          "userKey":          { "js": "this.session.userId" }
        },
        {
          "name":             "viaOrganisation",
          "dataObjectName":   "Organisation",
          "objectKeyIdField": "organisationId",
          "userKey":          { "js": "this.session.userId" },
          "checkFor":         { "js": "['owner','admin']" }
        }
      ]
    }
  }
}
```

A task is listed if the caller is a member of its `Project` **or** an
owner/admin of its `Organisation` (its membership row's `roleField` holds
`owner` or `admin`; no other column of that row is consulted). Each filter checks membership of a
*related* object (`dataObjectName`) using a field on the task row
(`objectKeyIdField`) as the key.

When the filter's `dataObjectName` is an object moderated with
[`objectModeration`](../capabilities/object-moderation.md) in `mode: onPlace`,
the collected ids are narrowed through one gated read of that object, so a
row the caller may not see never scopes the list. A moderated MEMBERSHIP
object (the linking object itself) is different: its rows are read as an
authorization scope, not as content, and are not gated.

## Composing permission + membership filters

When both families are present on the same list, the effective scope is:

```text
( permissionFilter1 AND permissionFilter2 ... )    -- narrow by permission
  AND
( membershipFilter1 OR membershipFilter2 ... )     -- widen by membership
```

So permissions restrict the universe of visible records, and within
that universe membership decides per-record visibility. See the
[ListOptions hub](list-options.md) for how these layer with joint and
search filters.

## See also

- [Membership](membership.md) — the single-record gate
  (`MembershipCheckAction`) and `membershipSettings` configuration.
- [Joint filters](joint-filters.md) — filter by a criterion in a
  related object (the other relation-consumer filter).
- [ListOptions hub](list-options.md) — combination rules across all
  six families.
- [Authentication](../system-services/authentication/overview.md) — RBAC / PBAC
  permissions these filters reference.
- [Native permission system](../capabilities/native-permissions.md) — the
  `permissionCheck` gate compiles its list decision into exactly these
  `$in` / `$nin` filters (with the NONE→zero-rows leak guard).
- Specification: [`ListPermissionFilter`](../../spec/ListPermissionFilter.md),
  [`ListMembershipFilter`](../../spec/ListMembershipFilter.md),
  [`MembershipSettings`](../../spec/MembershipSettings.md).
