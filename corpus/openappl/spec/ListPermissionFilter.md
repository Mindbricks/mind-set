# ListPermissionFilter

**Level:** `subsection` · **Family:** [BusinessApiQuery](../ontology/families.md#businessapiquery) (domain `BusinessApi`)

**Ontology:** [ListPermissionFilter in Part 1](../ontology/ListPermissionFilter.md)

**Name:** an instance is named by `name`.

Permission-based filter that operate on list queries before execution. This is used for object based permissions assigned to a specific role or user

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | A human readable and source-code safe to define the permission filter. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An optional MScript expression that skips the permission check entirely if it evaluates to false. Useful for exempting trusted users such as object owners or platform admins. |
| `permission` | `String` | yes |  |  |  | The name of the permission that the filter wil be built for |
| `on` | `String` | no |  |  |  | An optional request-field name carrying the parent/scope object id passed to the native resolver's `compileListFilter(permission, on, …)` for membership-role checks against a parent (ADR-native-permission-system §7.2). Null = a flat type-level check. |
| `ownershipCheck` | `Boolean` | yes |  |  |  | When true, the L5 ownership fallback applies to the compiled list filter — a row the subject owns is included even when no override/role/membership grants it (ADR-native-permission-system §5 layer 5). Mirrors `ApiAuthOptions.ownershipCheck`. |

## Constraints

Property rules:

- `name`, `permission`, `ownershipCheck` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
