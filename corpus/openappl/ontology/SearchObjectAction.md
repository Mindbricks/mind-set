# SearchObjectAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SearchObjectAction in Part 2](../spec/SearchObjectAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Searches one or more records from the main data object or a foreign or related data object and stores the result in the context as an id array. The search is made in elastic search index and the returned id array can be used in the where clause of the main query.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `searchObjectActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.searchObjectActions`
- `services.businessLogic.actions.searchObjectActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `targetObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `searchProperties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `targetObject`)

## Referenced by

No property of another pattern names this pattern.
