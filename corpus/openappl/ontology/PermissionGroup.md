# PermissionGroup

**Level:** `subsection` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [PermissionGroup in Part 2](../spec/PermissionGroup.md)

Defines a group of permissions under a shared namespace. Each permission group has a unique groupName and a list of permissions that are referenced across the project using either 'groupName.permission' or standalone permission identifiers. These groups simplify permission management in large-scale projects.

## Contained in

- [PermissionBasicsConfig](./PermissionBasicsConfig.md) as `permissionGroups` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
