# CreateBulkCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CreateBulkCrudAction in Part 2](../spec/CreateBulkCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a bulk creation operation for multiple related data objects—typically child or associated entities—within a Business API. These actions enable CASCADING (never transactional) bulk object creation as part of a larger business operation: the bulk insert is committed on its own as soon as the action completes, and nothing rolls it back if a later action of the same api throws — see the failure-semantics section of `BusinessWorkflow`. When the bulk write can legitimately fail (a unique index), place the action in a PRE-MAIN stage — `afterBuildDataClause` for `create`/`update`, `afterCheckInstance` for `update`/`delete` — so it fails before the parent row is written. Often used when the main API needs to create multiple child records at once (e.g., bulk creating child tasks, audit logs, or attachments). The objects parameter is an MScript expression that evaluates to an array of objects, where each object contains the property-value mappings for a single record to be created. The childObject must be a data object of the same service: the action writes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). There is no cross-service bulk write; to create rows another service owns, call that service's API with an `InterserviceCallAction`.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `createBulkCrudActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.createBulkCrudActions`
- `services.businessLogic.actions.createBulkCrudActions`

## Contains

No other pattern: every property is a value or a reference.

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
