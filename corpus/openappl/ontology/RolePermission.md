# RolePermission

**Level:** `subsection` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [RolePermission in Part 2](../spec/RolePermission.md)

A single SEED role-to-permission binding (ADR-native-permission-system §9.1). Binds a role (referenced by its RoleItem `name`) to a list of permission names (declared under a PermissionGroup). Seeded at boot as L4 global-role grant rows in the `givenPermission` store.

## Contained in

- [RBACSettingsConfig](./RBACSettingsConfig.md) as `rolePermissions` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
