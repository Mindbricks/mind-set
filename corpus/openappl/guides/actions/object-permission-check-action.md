---
title: ObjectPermissionCheckAction
---

# ObjectPermissionCheckAction

`ObjectPermissionCheckAction` evaluates whether the current user holds a permission on a *specific* object instance. It is one of three permission concepts in OpenAPPL, distinct from [`PermissionCheckAction`](./permission-check-action.md) (a *global* role / capability) and [`MembershipCheckAction`](./membership-check-action.md) (membership in a related data object). Pick this action when authorization depends on the row itself: object-attached permissions, role-inherited permissions, and dynamic ABAC rules that intersect with the object's own attributes.

## When to use it

- Enforce instance-level authorization after the target row has been loaded into the workflow (typically by [`FetchObjectAction`](./fetch-object-action.md) or as the API's main object).
- Combine direct grants on the object, permissions inherited from the user's role, and ABAC rules in a single resolved decision.
- Defer the result via `storedCheck` so the workflow can branch on it later instead of failing immediately.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `permissionName` | `String`[] | ✓ | The permission(s) the user must hold on the resolved instance. Multiple names form an OR, any one is sufficient. |
| `readObjectIdFrom` | `MScript` | ✓ | Expression evaluating to the id of the instance whose permissions are checked. Examples: `this.projectId`, `this.parent.organizationId`. |
| `checkType` | `ApiCheckType` | ✓ | `liveCheck` throws on failure and aborts the API. `storedCheck` writes the result to context and lets execution continue. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

Before any check runs, the action applies the **absolute-roles bypass**: if the current user holds a role listed in `this.absoluteRoles` (e.g. `superAdmin`), the check short-circuits and returns `true` without consulting object permissions, ABAC, or anything else. The bypass is enforced by the action itself, not by the authentication gate. See [Authentication, absolute roles](../system-services/authentication/overview.md).

Prerequisite when the bypass does not apply: the target instance must already be loaded into the workflow context. The action does not fetch it, chain a [`FetchObjectAction`](./fetch-object-action.md) before this one when the row isn't already available.

At runtime, the runtime consolidates three permission sources for the resolved instance id:

1. **Direct object permissions** declared on the row.
2. **Inherited permissions** from the user's role(s) (`ABACDefinition`-driven).
3. **Dynamic ABAC rules** matched against the row's own attributes.

If any source grants any of `permissionName`, the check passes. Otherwise:

- `liveCheck`, throws a `403` and aborts the API.
- `storedCheck`, writes a boolean to `this.<contextPropertyName>` and execution continues.

## Example

```json
{
  "name": "ensureEditorOnDocument",
  "permissionName": ["editDocument", "manageDocument"],
  "readObjectIdFrom": { "js": "this.documentId" },
  "checkType": "liveCheck"
}
```

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PermissionCheckAction`](./permission-check-action.md): global, non-instance permission check.
- [`MembershipCheckAction`](./membership-check-action.md): membership in a related data object.
- [`FetchObjectAction`](./fetch-object-action.md): load the instance before checking.
- [Authentication service](../system-services/authentication/overview.md).
- [Native permission system](../capabilities/native-permissions.md): the
  declarative `permissionCheck` API gate with instance-level resolution
  (object-roles, scope membership, per-row overrides, ABAC).
- [Permissions strategy](../best-practices/permissions-strategy.md).
