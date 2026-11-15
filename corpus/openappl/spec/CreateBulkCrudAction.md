# CreateBulkCrudAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CreateBulkCrudAction in Part 1](../ontology/CreateBulkCrudAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a bulk creation operation for multiple related data objects—typically child or associated entities—within a Business API. These actions enable CASCADING (never transactional) bulk object creation as part of a larger business operation: the bulk insert is committed on its own as soon as the action completes, and nothing rolls it back if a later action of the same api throws — see the failure-semantics section of `BusinessWorkflow`. When the bulk write can legitimately fail (a unique index), place the action in a PRE-MAIN stage — `afterBuildDataClause` for `create`/`update`, `afterCheckInstance` for `update`/`delete` — so it fails before the parent row is written. Often used when the main API needs to create multiple child records at once (e.g., bulk creating child tasks, audit logs, or attachments). The objects parameter is an MScript expression that evaluates to an array of objects, where each object contains the property-value mappings for a single record to be created. The childObject must be a data object of the same service: the action writes through this service's dbLayer, and a `<otherService>:<Object>` reference is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL). There is no cross-service bulk write; to create rows another service owns, call that service's API with an `InterserviceCallAction`.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `childObject` | [`DataObjectName`](./DataObjectName.md) | yes |  |  | names a [DataObject](./DataObject.md) | Specifies the related data object to be created in bulk. It must be a data object of the same service, named bare or with this service's own name as prefix: the action calls the service's dbLayer bulk create utility function (`createBulk{ObjectName}`) directly. A reference to another service's object (`<otherService>:<Object>`) is refused at design time (CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL); there is no cross-service bulk write, so call the owning service's API with an `InterserviceCallAction` instead. |
| `objects` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to an array of objects. Each object in the array represents a single record to be created, with property-value mappings that define what data to write into the new object. Each property value can use MScript to evaluate from the current context. The child row is written from these mappings PLUS two generator fills, which follow different precedence rules. The TENANT column of a tenant-scoped child is not an authored-wins fill: for an ordinary caller the resolved session tenant is written OVER any tenant an entry supplies (in dotnet, mapped tenant aliases are collapsed first), so a row cannot name another tenant; a superAdmin or root-tenant caller acts across tenants and keeps an authored tenant, and only an absent one is stamped from its session tenant; with no resolved session tenant nothing is stamped and no tenant is invented. Every child property carrying `sessionSettings.sessionParam`, filled from the caller's session, is written ONLY when the entry does not name it: there an authored mapping wins, and a session that carries no value leaves the key ABSENT, so a NOT NULL column refuses the row instead of being written null. `staticJoin` columns are still NOT resolved on this path, so map those explicitly: an entry the `objects` source shows (an array of object literals, or a `.map` callback that returns object literals) and that leaves a joined column unmapped is a design-time warning (CREATE_BULK_STATIC_JOIN_UNMAPPED), because that column is written NULL. Required columns are NOT checked at design time on this path (CHILD_CREATE_MISSING_VALUE_SOURCE is the single-row CreateCrudAction's check): an entry that leaves a required column without a value is refused by the database at run time. |

## Constraints

Property rules:

- `childObject`, `objects` must be present. (`REQUIRED_FIELD_MISSING`)
- `childObject` must be a well-formed [`DataObjectName`](./DataObjectName.md) (a data object, optionally qualified by its service (`service:object`)). (`INVALID_DATA_OBJECT_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `DATA_OBJECT_NOT_FOUND` | error | DataObject "…" not found in this service or project. |

## Example

Use to create many child records at once from an array built in context — e.g. fan out order line items into individual orderItem rows in a single bulk write.

```json
{
  "name": "createOrderItems",
  "description": "Bulk-create one orderItem per validated cart line.",
  "childObject": "orderItem",
  "objects": { "js": "this.lineItems.map(li => ({ orderId: this.createdOrder.id, productId: li.productId, quantity: li.quantity, unitPrice: li.unitPrice }))" },
  "contextPropertyName": "orderItems"
}
```
