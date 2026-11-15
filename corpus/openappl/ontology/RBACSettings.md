# RBACSettings

**Level:** `section` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [RBACSettings in Part 2](../spec/RBACSettings.md)

Configuration for Role-Based Access Control (RBAC) within the project. When enabled, RBAC allows permissions to be assigned to named roles, which are then associated with users. This setup supports both single-role and multi-role configurations, along with custom logical roles defined by dynamic lookup conditions.

## Contained in

- [AccessControl](./AccessControl.md) as `roleSettings`

Blueprint paths:

- `authentication.accessControl.roleSettings`

## Contains

- `configuration`: [RBACSettingsConfig](./RBACSettingsConfig.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
