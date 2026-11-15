# ObjectPermissionCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [ObjectPermissionCheckAction in Part 1](../ontology/ObjectPermissionCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Performs a permission check scoped to a specific object instance. It evaluates whether the current user has the required permissions on the resolved object, based on all applicable sources: directly assigned object permissions, inherited permissions from parent contexts (e.g., user or role permissions), and dynamic ABAC rules that intersect with the object’s attributes. This check is used when fine-grained, instance-level authorization is required.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `permissionName` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | The name of the permission that the user must possess on the resolved object instance. |
| `readObjectIdFrom` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the ID of the specific instance whose permissions should be checked. This could reference input parameters, session values, or context-fetched records (e.g., `{ "js": "this.projectId" }` or `{ "js": "this.parent.organizationId" }`). |
| `checkType` | `ApiCheckType` | yes |  | `storedCheck`, `liveCheck` |  | Specifies how the result of the check is handled. If set to `liveCheck`, the API will immediately throw a permission error if the check fails. If set to `storedCheck`, the result is stored in the context and does not interrupt execution—allowing you to combine multiple permission checks later in the workflow. |

## Constraints

Property rules:

- `readObjectIdFrom`, `checkType` must be present. (`REQUIRED_FIELD_MISSING`)
- `checkType` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `permissionName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `PERMISSION_NOT_FOUND` | error | Permission "…" not found in project. |

## Example

Use for fine-grained, instance-level authorization — confirm the user holds the required permission(s) on a specific resolved object, considering direct grants, inherited role permissions, and ABAC rules.

```json
{
  "name": "requireDocumentEditPermission",
  "description": "Caller must hold editDocument (and shareDocument when sharing) on this exact document.",
  "permissionName": [
    "editDocument"
  ],
  "readObjectIdFrom": { "js": "this.data.documentId" },
  "checkType": "liveCheck"
}
```
