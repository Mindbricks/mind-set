# DeleteCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [DeleteCrudAction in Part 1](../ontology/DeleteCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines an embedded delete operation to remove related records—typically child or connected entities—within a Business API. This action allows declarative, conditional deletion of external data objects that are linked to the primary object. It is typically used for cascading deletes, cleanup logic, or enforcing referential integrity in business processes. The childObject must be a data object of the same service: the action deletes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). To delete rows another service owns, call that service's delete API with an `InterserviceCallAction`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | The name of the related data object from which records will be deleted. It must be a data object of the same service, named bare or with this service's own name as prefix: the action calls the service's dbLayer delete utility function (`delete{ObjectName}ByMQuery`) directly. A reference to another service's object (`<otherService>:<Object>`) is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL); to delete rows another service owns, call that service's delete API with an `InterserviceCallAction`. |
| `whereClause` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `mquery` | An MScript-based query that defines the selection condition for records to be deleted. This field is required and must identify which records in the child object will be affected. |
| `onNoRows` | `BusinessApiActionNoRowsOption` | no | `"ignore"` | `ignore`, `throwError` |  | What to do when the whereClause matched NO row. `ignore` (default) completes the action with an empty result exactly as before, so an existing blueprint is unchanged; `throwError` raises a typed 404 (`errorCode: ACTION_NO_ROWS_MATCHED`) that `onActionError` then routes like any other action error - aborting the api, or stored as `this.<actionName>Error` under `completeApi`. Set it when this delete addresses one specific row whose absence is a defect (a compensation that must undo a row the request just wrote); leave it for a cascading cleanup that may legitimately find nothing. |

## Constraints

Property rules:

- `childObject`, `whereClause` must be present. (`REQUIRED_FIELD_MISSING`)
- `onNoRows` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service or project. |

## Example

Use to remove related records by a where clause for cascading deletes or cleanup — e.g. delete all cart items once a cart is converted to an order.

```json
{
  "name": "clearCartItems",
  "description": "Delete every item in the cart that was just checked out.",
  "childObject": "cartItem",
  "whereClause": { "js": "{ cartId: this.cart.id }" }
}
```
