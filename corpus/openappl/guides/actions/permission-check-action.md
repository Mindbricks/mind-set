---
title: PermissionCheckAction
---

# PermissionCheckAction

`PermissionCheckAction` evaluates whether the current user holds a **global** (non-instance-scoped) permission. It is one of three permission concepts in OpenAPPL, distinct from [`ObjectPermissionCheckAction`](./object-permission-check-action.md) (permission *on a specific row*) and [`MembershipCheckAction`](./membership-check-action.md) (membership *in a related data object*). Use this action when the check answers "can this user, broadly, do this thing?", admin panel access, data export, sending email, and so on.

## When to use it

- Gate a Business API on a role-level capability that doesn't depend on which row is being acted on.
- Combine global capability with [`ObjectPermissionCheckAction`](./object-permission-check-action.md) when both checks are required (e.g., "user has `canPublish` AND has `editDocument` on this draft").
- Defer the result via `storedCheck` and branch on it later in the workflow.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `permissionName` | `String` | ✓ | Name of the permission the user must hold. Must match a permission declared under the project's auth model. |
| `checkType` | `ApiCheckType` | ✓ | `liveCheck` throws and aborts the API on failure. `storedCheck` writes the boolean to context and lets execution continue, combine multiple checks in a single decision downstream. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

Before any check runs, the action applies the **absolute-roles bypass**: if the current user holds a role listed in `this.absoluteRoles` (configured per Business API, `superAdmin` is the canonical example), the check short-circuits and returns `true`. `storedCheck` then writes `true` to context; `liveCheck` skips the throw. The bypass is enforced by the action itself, not by the authentication gate, so it applies regardless of whether the permission is actually granted in the auth model. See [Authentication, absolute roles](../system-services/authentication/overview.md) for how the role list is declared.

When the bypass does not apply, the runtime resolves the user's permission set from the current session and asserts the requested `permissionName` against it:

- `liveCheck`, failure throws a `403` and aborts the API.
- `storedCheck`, the boolean is written to `this.<contextPropertyName>` (or the action's default slot) and execution continues.

Authentication / session loading is upstream of this action. Permission *definitions* live in the auth model and are referenced by name; see [authentication](../system-services/authentication/overview.md) for how the permission catalogue is declared.

## Example

```json
{
  "name": "ensureExportRights",
  "permissionName": "canExportData",
  "checkType": "liveCheck"
}
```

Combined deferred form:

```json
[
  {
    "name": "isAdmin",
    "permissionName": "canAccessAdminPanel",
    "checkType": "storedCheck",
    "contextPropertyName": "isAdmin"
  },
  {
    "name": "isOwner",
    "permissionName": "isResourceOwner",
    "checkType": "storedCheck",
    "contextPropertyName": "isOwner"
  },
  {
    "name": "enforceAccess",
    "description": "Allow if admin OR owner.",
    "validationScript": { "js": "this.isAdmin || this.isOwner" },
    "checkType": "liveCheck",
    "errorMessage": "You do not have access to this resource."
  }
]
```

(The last entry is a [`ValidationAction`](./validation-action.md), illustrating how `storedCheck` results compose downstream.)

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`ObjectPermissionCheckAction`](./object-permission-check-action.md): per-instance permission.
- [`MembershipCheckAction`](./membership-check-action.md): membership in a related data object.
- [`ValidationAction`](./validation-action.md): generic script-based check; useful to combine `storedCheck` results.
- [Authentication service](../system-services/authentication/overview.md).
- [Native permission system](../capabilities/native-permissions.md): the
  declarative `permissionCheck` API gate (use this action for decisions
  that depend on data fetched mid-workflow).
- [Permissions strategy](../best-practices/permissions-strategy.md).
