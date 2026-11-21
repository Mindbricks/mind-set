---
title: CreateBulkCrudAction
---

# CreateBulkCrudAction

Creates multiple records in a related data object in a single call. The records come from an MScript expression that evaluates to an array; each entry is the property bag for one row. Use it when the parent operation needs to write many child rows at once: bulk tasks, audit-log batches, attachment rows, line items.

`childObject` must be a data object of the same service: the action calls only the local `dbLayer`, and a `<otherService>:<Object>` reference is refused at design time (`CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL`). There is no cross-service bulk write; to create rows another service owns, call that service's API with an [`InterserviceCallAction`](./interservice-call-action.md).

## When to use it

- Create many child rows from a single workflow step (orders -> line items, bulk tagging, attachment uploads).
- Write structured audit entries derived from an iteration.
- Mirror a request payload that already arrives as an array (e.g. a bulk-import endpoint).
- For a single child row use [`CreateCrudAction`](./create-crud-action.md).

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `childObject` | `DataObjectName` | yes | The data object to create rows in. Must be a data object of the same service. |
| `objects` | `MScript` | yes | Expression that evaluates to the array of objects to create. Each entry must include every required field of the child object (not checked at design time on this path; the database refuses a row without one) and every `staticJoin` column (an entry that visibly leaves one out is a warning). |

## Behaviour

The action:

1. Evaluates `objects` against the current context. If the result is not a non-empty array, returns `[]` immediately.
2. For a tenant-scoped child in a multi-tenant project, writes the caller's session tenant onto every row, over a tenant the row supplies (a superAdmin or a root-tenant caller keeps the tenant it authored, and only an absent one is filled in), then fills every session-bound child column a row does not already carry from the caller's session, and runs with the request's session and request id as its context.
3. Creates the rows through the child object's `dbLayer` bulk create.
4. Returns the created rows. The result is stored on `this.<contextPropertyName>` (when set) and written to the response when `writeToResponse` is true.

> **Session-bound child columns are auto-filled; joined ones are not.** Each row is written from its own `objects` entry, the tenant stamp, and every child property carrying `sessionSettings.sessionParam` that the row does not already carry, read from the caller's session. For those session-bound columns a value the row already carries always wins, and a session that carries no value leaves the key ABSENT, so a required column refuses the row rather than being written null. The tenant column is the exception: for an ordinary caller the resolved session tenant is written over a tenant the row supplies, so a row cannot name another tenant; a superAdmin or root-tenant caller keeps an authored tenant, and only an absent one is stamped. `staticJoin` is applied only when that object is the MAIN data object of a create API, never on this nested create, so put a joined column in every row explicitly. Validation warns (`CREATE_BULK_STATIC_JOIN_UNMAPPED`) when an entry the `objects` source shows (an array of object literals, or a `.map` callback that returns one) leaves a joined column out, naming the object, the property and the entries; a list passed through verbatim (`this.data.lines`) or an entry built by spreading is not judged. See [Write-time data composition](../composition/write-time-data-composition.md).

When `emitProgressInSSEContext` is true and the API is running in SSE mode, a progress event is emitted with the row count.

**A moderated child is written without a verdict.** The bulk insert goes through the `dbLayer`, past the moderation seam of a `childObject` that carries [`objectModeration`](../capabilities/object-moderation.md): in `staged` mode no row is staged, in `onPlace` mode every row lands `accepted`. The validator names each such action (`OBJECT_MODERATION_UNSTAGED_WRITE_PATH`, a warning). See [Writes the moderation seam never sees](../capabilities/object-moderation.md#writes-the-moderation-seam-never-sees).

## Example

Create line items from the request payload after the parent order is created:

```json
"createBulkCrudActions": [
  {
    "name": "createOrderLines",
    "writeToResponse": false,
    "contextPropertyName": "createdLines",
    "childObject": "OrderLine",
    "objects": { "js": "this.data.lines.map(l => ({ orderId: this.order.id, sku: l.sku, qty: l.qty, unitPrice: l.unitPrice }))" }
  }
]
```

Map an iteration result into rows:

```json
{
  "name": "writeAuditTrail",
  "writeToResponse": false,
  "childObject": "AuditEntry",
  "objects": { "js": "this.changes.map(c => ({ actor: this.session.userId, target: c.id, action: c.op, at: new Date().toISOString() }))" }
}
```

## Errors

- `objects` evaluating to a non-array (or `null`) yields `[]`: the action does not throw.
- Per-row validation errors throw from the dbLayer. The bulk utility is not transactional: on SQL the new rows go in as one multi-row INSERT (all-or-nothing as a statement), but a row whose `id` already exists is updated first, one by one, and that update stays if the insert then fails; on MongoDB the insert is unordered, so rows that pass validation are written even when another row fails. See [Bulk actions](../business-apis/bulk-actions.md#transactionality-and-partial-failure).
- A row that supplies the id of a record owned by another tenant (active or archived) is refused for the whole batch, before anything is written, with the same 404 `<object> not found` a missing record answers. (A compiler refuses a guard it does not implement.)
- Supplied ids are compared using the model's storage binding: UUID columns accept equivalent casing, braces and omitted hyphens; native MongoDB ObjectIds accept either hex case. Explicit string ids remain byte-exact, even when they look like UUIDs or ObjectIds. Tenant values retain their exact spelling. These id rules also apply to same-tenant updates and archived-id refusal.
- dbLayer errors propagate. Use `onActionError: "completeApi"` to inspect via `this.<actionName>Error`.

## See also

- [`CreateCrudAction`](./create-crud-action.md): single-row create
- [`UpdateCrudAction`](./update-crud-action.md), [`DeleteCrudAction`](./delete-crud-action.md)
- [Bulk actions](../business-apis/bulk-actions.md)
- [Multi-tenancy](../data-modeling/multi-tenancy.md)
