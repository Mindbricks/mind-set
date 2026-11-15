# UpdateCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [UpdateCrudAction in Part 2](../spec/UpdateCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines an embedded update operation for related data objects—typically child or connected entities—within a Business API. This action is used when the API needs to selectively update external records based on a condition. It is commonly applied after creating or modifying a parent object to ensure consistency or to propagate business state changes across related objects. The childObject must be a data object of the same service: the action updates through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To update rows another service owns, call that service's update API with an `InterserviceCallAction`.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `updateCrudActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.updateCrudActions`
- `services.businessLogic.actions.updateCrudActions`

## Contains

- `dataClause`: [ApiAggregateData](./ApiAggregateData.md), a list

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
