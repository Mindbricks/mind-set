# CreateCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CreateCrudAction in Part 2](../spec/CreateCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines an embedded creation operation for a related data object—typically a child or associated entity—within a Business API. These actions enable CASCADING (never transactional) object creation as part of a larger business operation: the child row is committed on its own as soon as the action completes, and nothing rolls it back if a later action of the same api throws — see the failure-semantics section of `BusinessWorkflow`. When the child write can legitimately fail (a unique index with `onDuplicate: throwError`), place the action in a PRE-MAIN stage — `afterBuildDataClause` for `create`/`update`, `afterCheckInstance` for `update`/`delete` — so it fails before the parent row is written. Often used when the main API creates or updates a parent object and simultaneously needs to initialize dependent records (e.g., child tasks, audit logs, attachments). The childObject must be a data object of the same service: the action writes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To create a row another service owns, call that service's create API with an `InterserviceCallAction` (its `tenantContext` names the tenant on a multi-tenant project).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `createCrudActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.createCrudActions`
- `services.businessLogic.actions.createCrudActions`

## Contains

- `dataClause`: [ApiAggregateData](./ApiAggregateData.md), a list

## References

- `childObject` names an instance of [DataObject](./DataObject.md) (type [DataObjectName](./DataObjectName.md))

## Referenced by

No property of another pattern names this pattern.
