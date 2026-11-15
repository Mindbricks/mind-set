# ObjectPermissionCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ObjectPermissionCheckAction in Part 2](../spec/ObjectPermissionCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Performs a permission check scoped to a specific object instance. It evaluates whether the current user has the required permissions on the resolved object, based on all applicable sources: directly assigned object permissions, inherited permissions from parent contexts (e.g., user or role permissions), and dynamic ABAC rules that intersect with the object’s attributes. This check is used when fine-grained, instance-level authorization is required.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `objectPermissionActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.objectPermissionActions`
- `services.businessLogic.actions.objectPermissionActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
