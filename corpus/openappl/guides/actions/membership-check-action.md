---
title: MembershipCheckAction
---

# MembershipCheckAction

`MembershipCheckAction` evaluates whether the current user is a member of a specific data-object instance, using the membership rules declared on that data object. It is the right action when access depends on a relationship, "is the user in this organisation?", "is the user on this project's team?", rather than on a global role or a permission attached to the instance.

## When to use it

- Gate access to operations on a child object by membership in its parent (e.g., updating a `Project` requires `Organization` membership).
- Defer the result with `checkType: storedCheck` so multiple membership signals can be combined later in the workflow.
- Layer membership on top of a [`PermissionCheckAction`](./permission-check-action.md) (global role) or [`ObjectPermissionCheckAction`](./object-permission-check-action.md) (per-instance permission) without overloading either one.

The action does **not** define what a membership is, that lives in `membershipSettings` on the target data object.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `dataObjectName` | `DataObjectName` | ✓ | The data object whose membership configuration is consulted. Use a related object when the membership check is upstream of the operation (e.g., `Organization` while updating a `Project`). |
| `objectKey` | `MScript` | ✓ | Expression returning the id of the instance whose membership is checked. |
| `userKey` | `MScript` | ✓ | Expression returning the user id to check. Typically `this.session.userId`. |
| `requiredRoles` | `String`[] |   | Optional. The member roles that pass: the membership row's `membershipSettings.configuration.roleField` value must be one of them (case-sensitive). Needs a `roleField` on the scope object. Mutually exclusive with `checkFor`. |
| `checkFor` | `MScript` |   | Optional condition that is not a role list, evaluated with the fetched membership row bound as `membership` (`membership.seatCount > 0`); `this.<field>` reads the API context, not the row. Mutually exclusive with `requiredRoles`. When both are omitted, any valid membership passes. |
| `checkType` | `ApiCheckType` | ✓ | `liveCheck` throws on failure and aborts the API; `storedCheck` writes the boolean result into the context and lets execution continue. |
| `errorMessage` | `String` |   | Message returned on failure when `checkType: liveCheck`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

Before any check runs, the action applies the **absolute-roles bypass**: if the current user holds a role listed in `this.absoluteRoles` (e.g. `superAdmin`), the check short-circuits and returns `true` regardless of whether the user is actually a member of the target instance. The bypass is enforced by the action itself, not by the authentication gate. See [Authentication, absolute roles](../system-services/authentication/overview.md).

When the bypass does not apply, the runtime resolves the membership configuration declared on `dataObjectName`, fetches the rows that match `objectKey`, and checks whether the resolved `userKey` is enrolled as a member. With `requiredRoles` the row's role must be one of the listed roles; with `checkFor` the expression is evaluated against the membership row (`membership.<field>`), so you can require a specific role or status, not just "any member".

- `liveCheck`, failure throws a `403` error using `errorMessage` (or a default if not supplied). Subsequent actions do not run.
- `storedCheck`, the boolean is written to `this.<contextPropertyName>` (or the action's default slot) and execution continues. Use this to combine multiple checks in a single decision.

## Example

```json
{
  "name": "checkProjectMembership",
  "dataObjectName": "Project",
  "objectKey": { "js": "this.projectId" },
  "userKey": { "js": "this.session.userId" },
  "requiredRoles": ["editor", "owner"],
  "checkType": "liveCheck",
  "errorMessage": "You must be an editor on this project to perform this action."
}
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PermissionCheckAction`](./permission-check-action.md): global, role-style permission check.
- [`ObjectPermissionCheckAction`](./object-permission-check-action.md): per-instance permission, not membership.
- [`ValidationAction`](./validation-action.md): for arbitrary script-based checks.
- [Multi-tenancy](../data-modeling/multi-tenancy.md).
- [Membership and share tokens](../composition/membership.md).
