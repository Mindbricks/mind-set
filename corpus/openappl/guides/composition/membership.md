---
title: Membership
---

# Membership

**Membership** is *per-record* access control that role-based
permissions cannot cleanly express: a data object holds the set of
users authorised to act on another data object's records. Typical use:
organisation members, team members, project collaborators.

Enforcement pulls into the typed action store: a `MembershipCheckAction`
slot under `BusinessApi.actions.membershipCheckActions[]` runs before
the main operation and either grants or rejects. For list APIs, the
equivalent is a [`ListMembershipFilter`](permission-and-membership-filters.md).

> For one-off, time-bound, **share-by-link** credentials — a scoped
> signed token that grants access to a single record without inviting
> the bearer into the project — see
> [Using share tokens](../capabilities/share-tokens.md). Share tokens are
> an application of project
> [application signing](../capabilities/application-signing.md), not a
> membership check.

## When to use each

| Need | Pick |
|---|---|
| "Anyone with this role can do X" | RBAC — `authOptions.checkRoles` |
| "The record's owner / a related-entity member can do X" | Membership — `MembershipSettings` + `MembershipCheckAction` |
| "Anyone holding this link can do X until it expires" | [Share token](../capabilities/share-tokens.md) (signed, scoped) |
| "Subject + resource + context predicate" | ABAC — project-level `AbacPermission` + a `PermissionCheckAction` |

Membership scales the role idea to per-record boundaries. The
mechanisms compose: a single API can require a role (RBAC), then a
membership check, then a custom MScript validation in the same
workflow.

## Declaring membership

The membership pattern requires two data objects: the **owning
object** (Organisation, Project, Team) and the **membership object**
(OrganisationMember, ProjectMember, TeamMember). The membership object
holds the join — a row per (user, owning-object) pair, plus any
per-relationship attributes (role, scopes).

On the owning data object, opt into membership-driven access and
point at the membership data object:

```json
{
  "objectSettings": {
    "basicSettings": { "name": "organisation" },
    "membershipSettings": {
      "hasMembership": true,
      "configuration": {
        "membershipObjectName":       "organisationMember",
        "membershipObjectIdProperty": "organisationId",
        "membershipUserIdProperty":   "userId",
        "roleField":                  "role",
        "membershipStatusCheck":      { "js": "({ status: { $eq: 'active' } })" }
      }
    }
  }
}
```

The membership object is a separate data object whose rows pair a
user with an owning record. `MembershipSettingsConfig` binds the two:

| Field | Notes |
|---|---|
| `membershipObjectName` | The data object that holds the rows (e.g. `organisationMember`). |
| `membershipObjectIdProperty` | The property on the membership object that points back at the owning record (e.g. `organisationId`). |
| `membershipUserIdProperty` | The property that points at the user (typically `userId`). |
| `roleField` | Optional. The membership-object property holding the member's role (e.g. `role`). `requiredRoles` on a `MembershipCheckAction` compares against it; without it every member is the built-in `member` role and `requiredRoles` cannot be used. |
| `membershipStatusCheck` | Optional static MQuery dict — extra criteria a membership row must satisfy (active, not banned, within validity window). Author it as the bare dict (`{ "status": "active" }`) or as an MScript whose js evaluates to one. |

## Enforcing on a BusinessApi

The typed action store partitions actions by stage. Membership checks
live under `actions.membershipCheckActions[]`. Each entry is a
`MembershipCheckAction` — the slot itself names the class, so there
is no `actionType` discriminator inside the entry:

```json
{
  "basics": { "apiOptions": { "name": "updateProject", "crudType": "update", "dataObjectName": "project" } },
  "actions": {
    "fetchObjectActions": [
      {
        "name":               "loadProject",
        "targetObject":       "project",
        "matchValue":         { "js": "this.projectId" },
        "localKey":           "id",
        "isRequired":         true,
        "contextPropertyName": "project",
        "writeToResponse":    false
      }
    ],
    "membershipCheckActions": [
      {
        "name":              "checkMembership",
        "dataObjectName":    "organisation",
        "objectKey":         { "js": "this.project.organisationId" },
        "userKey":           { "js": "this.session.userId" },
        "requiredRoles":     ["owner", "admin"],
        "checkType":         "liveCheck",
        "errorMessage":      "You must be an admin of the organisation to update this project.",
        "contextPropertyName": "membership",
        "writeToResponse":   false
      }
    ]
  },
  "workflow": {
    "update": {
      "afterFetchInstance": ["loadProject", "checkMembership"]
    }
  }
}
```

`dataObjectName` names the object whose membership rules apply (here,
`organisation`, even though the API operates on a `project`).
`objectKey` is an MScript expression that returns the id of the
specific record to check membership against. `userKey` is usually
`this.session.userId`. `requiredRoles` narrows by the member role read
off the row's declared `roleField`; `checkFor` is the escape hatch for a
condition on another column, written against the bare `membership`
binding (`membership.seat === 'gold'`) and run on the matched row.

`checkType: "liveCheck"` rejects on failure with the supplied
`errorMessage`. `checkType: "storedCheck"` writes the result to
`this.<contextPropertyName>` for downstream conditional logic without
short-circuiting.

The action's slot is `membershipCheckActions[]`. Workflow milestones
reference the action by `name`; the typed slot keeps it next to its
peers for review.

### Two membership contexts in one API

Stack one `MembershipCheckAction` per scope. Each `liveCheck` refuses on
its own, with a 403 carrying its own `errorMessage`, so the caller learns
which membership is missing. Deleting a task here needs membership of the
task's project AND the `admin` role in that project's organisation:

```json
{
  "basics": {
    "apiOptions":  { "name": "deleteTask", "crudType": "delete", "dataObjectName": "task" },
    "authOptions": { "loginRequired": true }
  },
  "actions": {
    "fetchObjectActions": [
      { "name": "loadProject", "targetObject": "project", "matchValue": { "js": "this.instance.projectId" }, "localKey": "id", "isRequired": true, "contextPropertyName": "project" }
    ],
    "membershipCheckActions": [
      {
        "name":           "checkProjectMember",
        "dataObjectName": "project",
        "objectKey":      { "js": "this.instance.projectId" },
        "userKey":        { "js": "this.session.userId" },
        "checkType":      "liveCheck",
        "errorMessage":   "You are not a member of this project."
      },
      {
        "name":           "checkOrgAdmin",
        "dataObjectName": "organisation",
        "objectKey":      { "js": "this.project.organisationId" },
        "userKey":        { "js": "this.session.userId" },
        "requiredRoles":  ["admin"],
        "checkType":      "liveCheck",
        "errorMessage":   "You must be an admin of the organisation."
      }
    ]
  },
  "workflow": {
    "delete": { "afterFetchInstance": ["checkProjectMember", "loadProject", "checkOrgAdmin"] }
  }
}
```

Both `project` and `organisation` declare `membershipSettings`, the
organisation's with the `roleField` that `requiredRoles` reads. The
checks run at `afterFetchInstance` because their keys come from the
fetched row (`this.instance`); a caller with an absolute role passes
both.

## Filtering lists by membership

The single-record `MembershipCheckAction` gate is for `get` /
`update` / `delete`. For `list` APIs, declare one or more
`ListMembershipFilter` entries under
`query.listOptions.membershipFilters[]`. Each entry contributes a
membership predicate to the WHERE clause; multiple entries combine
with OR (any membership grants visibility):

```json
{
  "basics": { "apiOptions": { "name": "listProjects", "crudType": "list", "dataObjectName": "project" } },
  "query": {
    "listOptions": {
      "membershipFilters": [
        {
          "name":              "byOrganisation",
          "dataObjectName":    "organisation",
          "objectKeyIdField":  "organisationId",
          "userKey":           { "js": "this.session.userId" }
        }
      ]
    }
  }
}
```

`objectKeyIdField` is the property on the list item that holds the
owning-record id; the service joins through the configured
membership object and filters the result set to rows the caller has
membership on. Multiple `membershipFilters` combine with **OR** — see
[Permission & membership filters](permission-and-membership-filters.md)
for the full list-filter family.

## Membership helpers in custom code

Every data object that turns on `membershipSettings` gives the generated
service two helper functions, callable from MScript in custom actions:

| Helper | Returns | Use case |
|---|---|---|
| `getMembershipOf<MainObject>(memberKey, objectId)` | The single membership row (cached) or `null`. | Bespoke MScript: gate a deeper check, expose role / scopes on the response. |
| `collectMembershipOf<MainObject>(memberKey)` | All membership rows for the user. | "What organisations does this user belong to?" Drive a UI selector or scope a downstream query. |

`memberKey` is matched against the configured `membershipUserIdProperty` — the
member key, which for an invite-by-email join table is an EMAIL, not a userId.
When that property is something other than `userId` and the join table *also*
carries a real `userId` column, both helpers can match either identity, but only
when you hand them the session userId explicitly:
`getMembershipOf<MainObject>(memberKey, sessionUserId, objectId)` and
`collectMembershipOf<MainObject>(memberKey, sessionUserId)`. Omit it — or pass
`null` for a session that has no userId — and the `userId` leg is dropped rather
than filled with the member key: an email in a uuid comparison takes the whole
statement down, and `userId: null` would match every row whose `userId` was
never backfilled.

### An absent member key answers "member of nothing"

An absent, `null`, `undefined` or EMPTY-STRING `memberKey` is a *no user* value,
and every one of them is answered deny-closed **before any query is built**:
`getMembershipOf<MainObject>` returns `null`, `collectMembershipOf<MainObject>`
returns `[]`, and the generated `MembershipCheckAction` answers with its clean
403. No data read happens on that path, so a no-user call can never be scoped
into someone else's rows by an `IS NULL` or `= ''` match against a member-key
column that was never backfilled.

Both are reachable from custom action code (`FunctionCallAction`,
`ArrowFunctionAction`, library functions). For declarative use
inside a single API, `MembershipCheckAction` is the right surface —
reach for the helpers when the membership row needs to inform
non-gating logic.

Both helpers are **async**. As the whole expression of a slot the
generated service awaits the call; anywhere else write the `await`
yourself. A call whose Promise is read, compared or passed on un-awaited
is refused at design time (`MSCRIPT_ASYNC_HELPER_NOT_AWAITED`). Reading
the roles of two membership rows, for the two contexts of the example
above:

```json
{
  "name": "memberRoles",
  "context": [
    { "contextName": "projectRole", "contextValue": { "js": "(await this.getMembershipOfProject(this.session.userId, this.instance.projectId))?.role ?? null" } },
    { "contextName": "orgRole",     "contextValue": { "js": "(await this.getMembershipOfOrganisation(this.session.userId, this.project.organisationId))?.role ?? null" } }
  ]
}
```

An `addToContextActions` entry like this one, scheduled after
`loadProject`, puts both roles on the context (`this.projectRole`,
`this.orgRole`) for later actions.

## Composing with RBAC / PBAC / ABAC

The four mechanisms layer cleanly. A single API can run all of them
in the pipeline an author chooses; the order is fixed by the
workflow milestones, the surface for each layer is documented above.

| Layer | Mechanism | Where it lives |
|---|---|---|
| **Authentication** | Session required + login type | `authOptions.loginRequired`, project `authBasics` |
| **RBAC (role)** | OR-set of role names | `authOptions.checkRoles`, `authOptions.absoluteRoles` |
| **PBAC (permission)** | One named permission on a role / user / object, resolved through the layered model | `authOptions.permissionCheck`, `PermissionCheckAction`, `ObjectPermissionCheckAction` |
| **Membership** | Per-record / per-resource membership | `objectSettings.membershipSettings` + `MembershipCheckAction` (single-record) or `membershipFilters[]` (list) |
| **ABAC** | MScript predicate over subject + resource + context | Project `AbacPermission` referenced from `PermissionCheckAction` |
| **Custom validation** | Arbitrary MScript | `ValidationAction` |

`absoluteRoles` always wins — set it on roles like `superAdmin` that
should bypass every other layer. Everything else composes:
`authOptions` runs first, then any per-action checks in the workflow,
then `ValidationAction` entries. A failure at any layer short-circuits
the API.

## Things to get right

- **Name the right object in `dataObjectName`.** A
  `MembershipCheckAction` (or `ListMembershipFilter`) checks the
  membership configuration of the object you name — usually the
  *parent* (`Organisation`) even when the API operates on a child
  (`Project` / `Task`).
- **Match `objectKey` / `objectKeyIdField` to the record under check.**
  For single-record actions, `objectKey` is an MScript returning the
  id; for list filters, `objectKeyIdField` is the property on the list
  item that holds the owning-record id.
- **Narrow by role inside one entry, not with a second check.** On a
  `MembershipCheckAction` list the roles in `requiredRoles`; on a list
  filter give `checkFor` the role value (`['owner','admin']`). Both read
  the row's declared `roleField` only. A condition on another column of
  the row reads it through the bare `membership` binding
  (`membership.seat === 'gold'`), never `this.membership`.
- **`membershipStatusCheck` keeps stale memberships out.** Add it on the
  owning object's `membershipSettings.configuration` to exclude
  inactive / expired / banned rows at query time on both engines.
- **Index the membership object.** A composite index on
  `(membershipObjectIdProperty, membershipUserIdProperty)` makes the
  per-record check and the list filter fast — see
  [Index patterns](index-patterns.md).

- **Moderation is not membership.** An
  [`objectModeration`](../capabilities/object-moderation.md) `onPlace` object
  used as a membership object still scopes through its unapproved rows:
  membership checks and filters read it as an authorization scope, and the
  moderation read gate is a content gate that does not ride that read.
  Moderate the content object, not the link.

## See also

- [Permission & membership filters](permission-and-membership-filters.md)
  — the list-time membership filter family.
- [Session-aware logic](session-aware-logic.md) — session-driven
  defaults and scoped reads.
- [Using share tokens](../capabilities/share-tokens.md) — signed
  share-by-link credentials.
- [Authentication](../system-services/authentication/overview.md) — RBAC and
  ABAC.
- [Index patterns](index-patterns.md) — indexing the membership object.
- Specification: [`MembershipCheckAction`](../../spec/MembershipCheckAction.md),
  [`MembershipSettings`](../../spec/MembershipSettings.md),
  [`MembershipSettingsConfig`](../../spec/MembershipSettingsConfig.md).
