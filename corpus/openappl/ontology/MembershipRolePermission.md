# MembershipRolePermission

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [MembershipRolePermission in Part 2](../spec/MembershipRolePermission.md)

A single CONFIG-ONLY membership-role-to-permission binding (ADR-native-permission-system §9.3). Binds a membership role (the value of the membership object's `roleField`, or the built-in `member` default) to a list of permission names declared under a PermissionGroup. Read straight from the blueprint at request time by the L4 resolver — NEVER seeded into the `givenPermission` store, NEVER runtime-DB-managed.

## Contained in

- [MembershipSettingsConfig](./MembershipSettingsConfig.md) as `rolePermissions` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
