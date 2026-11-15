# MembershipRolePermission

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [MembershipRolePermission in Part 1](../ontology/MembershipRolePermission.md)

**Name:** an instance is named by `role`.

A single CONFIG-ONLY membership-role-to-permission binding (ADR-native-permission-system §9.3). Binds a membership role (the value of the membership object's `roleField`, or the built-in `member` default) to a list of permission names declared under a PermissionGroup. Read straight from the blueprint at request time by the L4 resolver — NEVER seeded into the `givenPermission` store, NEVER runtime-DB-managed.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `role` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The membership role this binding grants permissions to. Matches the value carried in the membership object's `roleField`, or the built-in `member` role (the default applied to plain roleless membership and any row with no role value). |
| `permissions` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | The list of permission names this membership role grants on the scope object. Each must resolve to a permission declared under a PermissionGroup. |

## Constraints

Property rules:

- `role` must be present. (`REQUIRED_FIELD_MISSING`)
- `role`, `permissions` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
