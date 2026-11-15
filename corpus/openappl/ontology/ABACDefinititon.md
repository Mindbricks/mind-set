# ABACDefinititon

**Level:** `subsection` · **Family:** [AccessControl](./families.md#accesscontrol) (domain `ProjectAuthentication`)

**Specification:** [ABACDefinititon in Part 2](../spec/ABACDefinititon.md)

Defines a single ABAC (Attribute-Based Access Control) rule for a given data object. Each rule applies a conditional filter to determine which records a user can access, and grants either dynamic permissions or a role for matching records.

## Contained in

- [AbacPermission](./AbacPermission.md) as `abacDefinitions` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
