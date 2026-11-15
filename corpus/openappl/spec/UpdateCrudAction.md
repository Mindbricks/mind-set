# UpdateCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [UpdateCrudAction in Part 1](../ontology/UpdateCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines an embedded update operation for related data objects—typically child or connected entities—within a Business API. This action is used when the API needs to selectively update external records based on a condition. It is commonly applied after creating or modifying a parent object to ensure consistency or to propagate business state changes across related objects. The childObject must be a data object of the same service: the action updates through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To update rows another service owns, call that service's update API with an `InterserviceCallAction`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the related data object that will be updated. It must be a data object of the same service, named bare or with this service's own name as prefix: the action calls the service's dbLayer update utility function (`update{ObjectName}ByMQuery`) directly. A reference to another service's object (`<otherService>:<Object>`) is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL); to update rows another service owns, call that service's update API with an `InterserviceCallAction`. |
| `whereClause` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `mquery` | An MScript-based query that determines which records in the child object should be updated. This is a required field and must uniquely or conditionally identify the target set of records. |
| `dataClause` | [`ApiAggregateData`](./ApiAggregateData.md)[] | no |  |  |  | A list of key-value assignments to apply to the matched records. Each item in the list defines a property of the child object and its new value (evaluated via MScript). Required fields must be included explicitly, and all values are resolved in the current context. |
| `onNoRows` | `BusinessApiActionNoRowsOption` | no | `"ignore"` | `ignore`, `throwError` |  | What to do when the whereClause matched NO row. `ignore` (default) completes the action with an empty result exactly as before, so an existing blueprint is unchanged; `throwError` raises a typed 404 (`errorCode: ACTION_NO_ROWS_MATCHED`) that `onActionError` then routes like any other action error - aborting the api, or stored as `this.<actionName>Error` under `completeApi`. Set it when this update addresses one specific row whose absence is a defect; leave it for a deliberately broad selector that may match nothing. |

## Constraints

Property rules:

- `childObject`, `whereClause` must be present. (`REQUIRED_FIELD_MISSING`)
- `onNoRows` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)
- The items of `dataClause` must have distinct names (`dataProperty`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service or project. |
| `ON_NO_ROWS_ABORTS_API` | warning | onNoRows: "throwError" with onActionError: "throwError" (the default) aborts the api with a 404 when this … matches no row. |

## Example

Use to conditionally update related records as part of a business operation — propagate state changes across linked objects via a where clause plus a data clause.

```json
{
  "name": "markRelatedTasksDone",
  "description": "Close every open task tied to the project once the project is archived.",
  "childObject": "task",
  "whereClause": { "js": "{ projectId: this.project.id, status: { $ne: 'done' } }" },
  "dataClause": [
    {
      "dataProperty": "status",
      "dataValue": { "js": "'done'" }
    },
    {
      "dataProperty": "closedReason",
      "dataValue": { "js": "'projectArchived'" }
    },
    {
      "dataProperty": "closedAt",
      "dataValue": { "js": "new Date().toISOString()" }
    }
  ]
}
```
