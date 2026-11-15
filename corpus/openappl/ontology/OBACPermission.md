# OBACPermission

**Level:** `section` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [OBACPermission in Part 2](../spec/OBACPermission.md)

Configuration for Object-Based Access Control (OBAC), which restricts access to specific data objects based on object ownership or association. If your system requires permissions that vary per object instance (e.g., 'only the creator can edit this record'), OBAC should be enabled and the relevant data objects listed.

## Contained in

- [AccessControl](./AccessControl.md) as `objectBasedSettings`

Blueprint paths:

- `authentication.accessControl.objectBasedSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObjects` names instances of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
