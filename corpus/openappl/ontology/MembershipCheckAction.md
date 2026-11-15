# MembershipCheckAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [MembershipCheckAction in Part 2](../spec/MembershipCheckAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines access control based on membership rules configured on a data object. This is used when access to a Business API operation depends on whether the current user is a member of a related entity, such as a project, team, or organization. The `dataObjectName` field specifies which object’s membership rules should be applied—if omitted, the main data object of the Business API is used by default. This action supports direct and nested membership checks, such as validating access to a parent organization while updating a child project.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `membershipCheckActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.membershipCheckActions`
- `services.businessLogic.actions.membershipCheckActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `dataObjectName` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
