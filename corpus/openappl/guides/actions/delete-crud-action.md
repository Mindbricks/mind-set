---
title: DeleteCrudAction
---

# DeleteCrudAction

Deletes related records from inside another Business API's workflow, identified by an MScript query. Honours the target data object's soft-delete configuration when present.

This is **not** a delete API: that is a Business API you declare in its own right. `DeleteCrudAction` is the in-workflow step for removing related rows as a side effect of another operation. Cascade rules declared on a data object's [relations](../data-modeling/relations.md) run automatically and do not require this action.

`childObject` must be a data object of the same service: the action calls only the service's own data layer, and a `<otherService>:<Object>` reference is refused at design time (`CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL`). To delete rows another service owns, call that service's delete API with an [`InterserviceCallAction`](./interservice-call-action.md).

## When to use it

- Clean up dependent rows when a parent is archived (`status: 'archived'` triggers stale-draft deletion, etc.).
- Remove join-table rows when a relationship is severed.
- Implement business-driven cleanup that is not expressible as a foreign-key cascade.
- For multiple distinct deletions in one workflow, declare multiple `DeleteCrudAction` entries: each can target a different data object.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `childObject` | `DataObjectName` | yes | Target data object. Must be a data object of the same service. |
| `whereClause` | `MScript` | yes | Expression yielding the query object that selects rows to delete. Required: there is no "delete all" affordance. |
| `onNoRows` | `BusinessApiActionNoRowsOption` | no | What to do when `whereClause` matched NO row. `ignore` (the default) completes the action with an empty result. `throwError` raises a typed 404 with `errorCode: ACTION_NO_ROWS_MATCHED`, which `onActionError` then routes like any other action error. Both are decided in the action itself, whichever database driver the service uses. |

## Behaviour

The action:

1. Evaluates `whereClause` against the current context to build the selection query.
2. Deletes the matching rows through the service's data layer, with the calling request's session and request id as context. The deletion reaches already-archived rows ONLY when the child object carries `isActive` AND the parent API declares [`apiOptions.includeSoftDeleted: true`](../../spec/ApiOptions.md) (the same derivation [`UpdateCrudAction`](./update-crud-action.md) and [`FetchObjectAction`](./fetch-object-action.md) use). Every other combination deletes among the active rows only.
3. Returns the deleted records. They are stored on `this.<contextPropertyName>` (when set) and written to the response when `writeToResponse` is true.

When the target object has soft-delete enabled, the data layer performs a soft delete (sets the deletion flag) rather than a hard delete; the action does not need to opt in.

The delete does three things that the steps above do not show, and they are the reason this action is not a single statement:

- **Pre-flight.** Before the first write, the delete walks the whole `doDelete` subtree the call would remove and asks whether anything that will OUTLIVE the operation still points into it. One live `onDeleteAction: "restrict"` child anywhere in that subtree refuses the entire call with HTTP 409 `RELATION_RESTRICTED`, with nothing written. An object whose subtree holds no `restrict` edge pays nothing for this.
- **Paging.** The matched set is deleted in pages of 1000. Each page prefetches its rows, archives exactly those ids, awaits their `deleted` events and reconciles the search index and caches.
- **Cascade.** Each page then cascades: `doDelete` children are deleted (recursively, to any depth), `setNull` children have their FK cleared, `doNothing` children are left alone. This is the same cascade a delete-by-id runs: see [Relations / on-delete cascades](../data-modeling/relations.md#on-delete-cascades).

There is no transaction around those pages. A failure part way through leaves the earlier pages archived and cascaded; see [Transactionality and partial failure](../business-apis/bulk-actions.md#transactionality-and-partial-failure).

## Example

Clean up draft attachments when an order is archived:

```json
{
  "name": "deleteOrderDrafts",
  "writeToResponse": false,
  "contextPropertyName": "draftsDeleted",
  "childObject": "Attachment",
  "whereClause": { "js": "({ orderId: this.order.id, status: 'draft' })" }
}
```

Remove a membership row by composite key:

```json
{
  "name": "leaveTeam",
  "writeToResponse": false,
  "childObject": "TeamMembership",
  "whereClause": { "js": "({ teamId: this.team.id, userId: this.session.userId })" }
}
```

## Errors

- A missing or empty `whereClause` is rejected at project-validation time.
- A query that matches no rows is governed by `onNoRows`. Under the default `ignore` it is **not** an error: the action returns an empty result. Under `onNoRows: "throwError"` it is the 404 below.
- **HTTP 404, `errorCode: ACTION_NO_ROWS_MATCHED`**: `onNoRows: "throwError"` is set and `whereClause` matched no row. The message names the action and the child object; there is no `detail` object and nothing is written. `onActionError` decides what happens next, exactly as for any other action error: the default `throwError` aborts the api with the 404, `completeApi` stores it on `this.<actionName>Error` and the api continues. An operator log line correlated by `requestId` records the miss.
- **HTTP 409, `errorCode: RELATION_RESTRICTED`**: some live child declares `onDeleteAction: "restrict"` against a row the call would remove, anywhere in the `doDelete` subtree. The message names the blocking object and how many references hold it. Nothing is written. Remove or re-point those rows and retry.
- **HTTP 500, `errorCode: CASCADE_DEPTH_EXCEEDED`**: the `doDelete` chain reached the 32-hop cap. On a mutually referencing relation graph the walk follows the ROW chain rather than the schema, so a shallow model can still reach it with deep data. Nothing is written when the pre-flight raises it; from inside the cascade the shallower hops stay committed.
- Data-layer errors (constraint violations, lock timeouts) propagate; use `onActionError: "completeApi"` to inspect via `this.<actionName>Error`.

## See also

- [`CreateCrudAction`](./create-crud-action.md), [`UpdateCrudAction`](./update-crud-action.md)
- [`CreateBulkCrudAction`](./create-bulk-crud-action.md)
- [Bulk actions](../business-apis/bulk-actions.md)
- [CRUD APIs](../business-apis/overview.md)
