# FetchParentAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FetchParentAction in Part 2](../spec/FetchParentAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Fetches selected properties from a parent object related to the current object in context. Typically used to enrich the response or inform access and validation logic with values inherited from a higher-level entity (e.g., organization, project). The parentObject can be a local data object (same service) or a remote data object (different service). For remote parent objects, the action automatically fetches from Elasticsearch, enabling seamless inter-service parent data retrieval. **Important**: A relation to the parent object must be defined in the current dbObject's properties for this action to work.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `fetchParentActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.fetchParentActions`
- `services.businessLogic.actions.fetchParentActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `parentObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))
- `properties` names instances of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md))

## Referenced by

No property of another pattern names this pattern.
