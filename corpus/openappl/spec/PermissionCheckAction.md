# PermissionCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [PermissionCheckAction in Part 1](../ontology/PermissionCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a global permission check that evaluates whether the user holds specific platform or service-level permissions. This check is not tied to any particular object instance and is useful for validating roles such as `canAccessAdminPanel`, `canExportData`, or `canSendEmails`. You can either enforce the result immediately or store it in context for conditional usage later in the flow.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permissionName` | `String` | yes |  |  |  | The name of the permission that the user must possess. The check will only succeed if the user has the given permission. |
| `checkType` | `ApiCheckType` | yes |  | `storedCheck`, `liveCheck` |  | Specifies how the result of the check should be handled. When set to `liveCheck`, the Business API will immediately throw an authorization error if the check fails, halting execution. When set to `storedCheck`, the result is stored in context and does not interrupt execution—even if the check fails. This allows for advanced, combinational authorization logic where multiple checks may be evaluated together later in the workflow. |

## Constraints

Property rules:

- `permissionName`, `checkType` must be present. (`REQUIRED_FIELD_MISSING`)
- `checkType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PERMISSION_NOT_FOUND` | error | Permission "…" not found in project. |

## Example

Use for a global, instance-independent permission gate — verify the user holds a platform/service-level capability such as exporting data or accessing an admin panel.

```json
{
  "name": "requireExportPermission",
  "description": "Only users with the data-export capability may run this bulk export.",
  "permissionName": "canExportData",
  "checkType": "liveCheck"
}
```
