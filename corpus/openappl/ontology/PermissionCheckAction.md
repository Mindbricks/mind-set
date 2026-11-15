# PermissionCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [PermissionCheckAction in Part 2](../spec/PermissionCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a global permission check that evaluates whether the user holds specific platform or service-level permissions. This check is not tied to any particular object instance and is useful for validating roles such as `canAccessAdminPanel`, `canExportData`, or `canSendEmails`. You can either enforce the result immediately or store it in context for conditional usage later in the flow.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `permissionCheckActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.permissionCheckActions`
- `services.businessLogic.actions.permissionCheckActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
