# CreateCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CreateCrudAction in Part 1](../ontology/CreateCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines an embedded creation operation for a related data object—typically a child or associated entity—within a Business API. These actions enable CASCADING (never transactional) object creation as part of a larger business operation: the child row is committed on its own as soon as the action completes, and nothing rolls it back if a later action of the same api throws — see the failure-semantics section of `BusinessWorkflow`. When the child write can legitimately fail (a unique index with `onDuplicate: throwError`), place the action in a PRE-MAIN stage — `afterBuildDataClause` for `create`/`update`, `afterCheckInstance` for `update`/`delete` — so it fails before the parent row is written. Often used when the main API creates or updates a parent object and simultaneously needs to initialize dependent records (e.g., child tasks, audit logs, attachments). The childObject must be a data object of the same service: the action writes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To create a row another service owns, call that service's create API with an `InterserviceCallAction` (its `tenantContext` names the tenant on a multi-tenant project).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the related data object to be created. It must be a data object of the same service, named bare or with this service's own name as prefix: the action calls the service's dbLayer utility function (`create{ObjectName}`) directly. A reference to another service's object (`<otherService>:<Object>`) is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL); to create a row another service owns, call that service's create API with an `InterserviceCallAction`. |
| `dataClause` | [`ApiAggregateData`](./ApiAggregateData.md)[] | no |  |  |  | An array of property-value mappings that define what data to write into the new object. Each entry uses MScript to evaluate a value from the current context. The child row is written from these mappings PLUS the two auto-fills the generator applies to a column the mappings do not name: the tenant column, stamped from the session tenant, and every child property carrying `sessionSettings.sessionParam`, filled from the caller's session. In dotnet, mapped tenant aliases are collapsed before the resolved session tenant overrides an authored tenant for ordinary callers; superAdmin and root-tenant callers retain an authored tenant. Other authored mappings retain precedence, and an unresolvable auto-fill leaves the key ABSENT, so a NOT NULL column refuses the row instead of being written null. A child property carrying a `staticJoin` block that the mappings do not name is resolved on this path too: it is read from the joint source row exactly as the main create resolves it - local or cross-service source, and the `staticJoin.defaultValue` fallback when the join cannot supply a value. A required child column with none of these sources is a design-time error (CHILD_CREATE_MISSING_VALUE_SOURCE). |

## Constraints

Property rules:

- `childObject` must be present. (`REQUIRED_FIELD_MISSING`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `dataClause` must have distinct names (`dataProperty`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CHILD_CREATE_MISSING_VALUE_SOURCE` | error | createCrudAction "…" writes child object "…", whose property "…" is required but has no value source in this action. |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service or project. |

## Example

Use to create a single related/child record as part of a larger operation — e.g. write an audit-log entry after the main object is updated. The child object belongs to the same service and is written through its dbLayer; a row another service owns is created by calling that service's API with an InterserviceCallAction.

```json
{
  "name": "createAuditLog",
  "description": "Record an audit entry for the status change just applied to the order.",
  "childObject": "auditLog",
  "dataClause": [
    {
      "dataProperty": "entityType",
      "dataValue": { "js": "'order'" }
    },
    {
      "dataProperty": "entityId",
      "dataValue": { "js": "this.order.id" }
    },
    {
      "dataProperty": "action",
      "dataValue": { "js": "'statusChanged'" }
    },
    {
      "dataProperty": "actorId",
      "dataValue": { "js": "this.session.userId" }
    },
    {
      "dataProperty": "detail",
      "dataValue": { "js": "{ from: this.previousStatus, to: this.data.status }" }
    }
  ],
  "contextPropertyName": "auditLog"
}
```
