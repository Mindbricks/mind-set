# DeleteCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [DeleteCrudAction in Part 2](../spec/DeleteCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines an embedded delete operation to remove related records—typically child or connected entities—within a Business API. This action allows declarative, conditional deletion of external data objects that are linked to the primary object. It is typically used for cascading deletes, cleanup logic, or enforcing referential integrity in business processes. The childObject must be a data object of the same service: the action deletes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To delete rows another service owns, call that service's delete API with an `InterserviceCallAction`.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `deleteCrudActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.deleteCrudActions`
- `services.businessLogic.actions.deleteCrudActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
