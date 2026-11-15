# FetchObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FetchObjectAction in Part 2](../spec/FetchObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Fetches one or more records from a foreign or related data object and stores the result in the context or response. Supports key-based lookup or complex query filtering. Commonly used to enrich the current object with external data before proceeding with workflow logic. It can return null or raise a 404 error when no objects found according to isRequired property.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fetchObjectActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fetchObjectActions`
- `services.businessLogic.actions.fetchObjectActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `targetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `localKey` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `targetObject`)
- `properties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `targetObject`)

## Referenced by

No property of another pattern names this pattern.
