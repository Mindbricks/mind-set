# AbacPermission

**Level:** `section` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [AbacPermission in Part 2](../spec/AbacPermission.md)

Configuration for Attribute-Based Access Control (ABAC), allowing fine-grained permission control using attribute-level rules on data objects. ABAC evaluates access by applying custom filter conditions to each object. When a rule matches, the user session may be granted specific permissions or even dynamic roles for that object. These rules can supplement or override standard RBAC or OBAC logic.

## Contained in

- [AccessControl](./AccessControl.md) as `attributeBasedSettings`

Blueprint paths:

- `authentication.accessControl.attributeBasedSettings`

## Contains

- `abacDefinitions`: [ABACDefinititon](./ABACDefinititon.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
