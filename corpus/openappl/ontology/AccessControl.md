# AccessControl

**Level:** `chapter` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [AccessControl in Part 2](../spec/AccessControl.md)

Configuration chapter for defining the access control architecture of the project. OpenAPPL supports multiple authorization models including role-based, user-based, object-based, and attribute-based access controls. This section enables a unified, flexible, and scalable permission system that ensures resources and operations are securely accessed based on defined authorization rules across services.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `accessControl`

Blueprint paths:

- `authentication.accessControl`

## Contains

- `permissionBasics`: [PermissionBasics](./PermissionBasics.md)
- `roleSettings`: [RBACSettings](./RBACSettings.md)
- `permissionTypes`: [PermissionTypes](./PermissionTypes.md)
- `objectBasedSettings`: [OBACPermission](./OBACPermission.md)
- `attributeBasedSettings`: [AbacPermission](./AbacPermission.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
