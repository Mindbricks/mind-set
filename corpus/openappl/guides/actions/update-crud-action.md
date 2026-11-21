---
title: UpdateCrudAction
---

# UpdateCrudAction

`UpdateCrudAction` updates properties of a related or child data object from inside a Business API workflow. It is the side-effect counterpart to an **update** API you declare for that object: use it when you need to propagate state into a different object as part of a parent operation, not when the API itself is "update X".

`childObject` must be a data object of the same service: the action calls only the service's local data layer, and a `<otherService>:<Object>` reference is refused at design time (`CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL`). To update rows another service owns, call that service's update API with an [`InterserviceCallAction`](./interservice-call-action.md).

## When to use it

- Cascade a status change from a parent object to its children (`Order.status = "shipped"` -> mark each `OrderItem.fulfilled = true`).
- Stamp a derived value on related rows after a transactional aggregation completes.

Distinguish from an **update** BusinessApi: that one is the canonical way to update an instance via HTTP. `UpdateCrudAction` is for *workflow-internal* updates that ride on top of another API's lifecycle.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `childObject` | `DataObjectName` | ✓ | The related data object being updated. Must be a data object of the same service. |
| `whereClause` | `MScript` | ✓ | MScript expression returning the query that identifies the rows to update. Required and must uniquely or conditionally narrow to the intended target set. |
| `dataClause` | `ApiAggregateData`[] |  | List of key/value assignments to apply. Each entry names a property of `childObject` and supplies an MScript expression for its new value. Optional at the schema level; an omitted or empty `dataClause` produces an empty patch and the action logs an `ActionDataClauseEmpty` warning. What it resolves then depends on the data store: on a SQL data object the write is short-circuited and the action resolves with no rows reported as updated, even when `whereClause` matched rows, so `onNoRows: throwError` reads it as "no rows matched" regardless of `whereClause`; on a MongoDB data object the helper still re-reads and returns the rows `whereClause` matched, so `onNoRows: throwError` does not fire when any row matched. |
| `onNoRows` | `BusinessApiActionNoRowsOption` | | What to do when `whereClause` matched NO row. `ignore` (the default) completes the action with an empty result. `throwError` raises a typed 404 with `errorCode: ACTION_NO_ROWS_MATCHED`, which `onActionError` then routes like any other action error. Both data stores behave this way, and the decision is made in the action, not in the data-layer helper. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

`ApiAggregateData` fields:

| Property | Type | Req | Description |
|---|---|---|---|
| `dataProperty` | `PropRefer` | ✓ | Target property on the child object. Must match a property of the data object. |
| `dataValue` | `MScript` | ✓ | Expression yielding the value. |

## Behaviour

At runtime the action:

1. Resolves `whereClause` to a query against `childObject`.
2. Evaluates each `dataClause` entry in the current context, building a `{ <dataProperty>: <dataValue> }` patch.
3. Applies the patch to the rows the query matches through the child object's data layer. The parent API's `apiOptions.includeSoftDeleted: true` makes the update also match soft-deleted (archived) child rows, on both SQL and MongoDB, even if the parent object does not use soft delete.
4. Returns the array of updated rows. Each one raises an `updated` db event whose `old` is that row as it was before this write.

**Rewriting the API's own row.** When this action runs at `afterMainCreateOperation` / `afterMainUpdateOperation` on the API's own data object (`childObject` equal to the API's `dataObjectName`), the service re-reads that row after the stage and before the response is built: `this.result`, `this.dbResult`, `this.data` and the response show the rewritten row. Actions later in the same stage still see the row as the main operation wrote it. A `DeleteCrudAction` on the own object triggers the same re-read. See [The record after a post-main rewrite](../workflow/workflow-context.md#the-record-after-a-post-main-rewrite).

**After a soft delete, the deleted row is out of reach.** On a soft-deleting child object the update only matches live rows (`isActive: true`), unless archived rows are included (`includeSoftDeleted`) or the selector has an `isActive` key of its own (directly or under `$and` / `$or` / `$nor` / `$not`; a comment or a string value saying isActive does not count; a grouped operand that is not a literal clause, such as `$and: [this.selector()]`, may carry one at runtime, so that selector is not reported). So on a `delete` api whose data object soft-deletes (`useSoftDelete`, the default), an update at `afterMainDeleteOperation` or later that selects the row the api just deleted (an `id` whose value is exactly `this.<object>.id` or `this.<object>Id`, not an expression built from it) matches nothing, and the default `onNoRows: "ignore"` hides it. The validator reports this shape as the warning `UPDATE_AFTER_SOFT_DELETE_NEVER_MATCHES`. Add `isActive: false` to the selector to write onto the archived row; `apiOptions.includeSoftDeleted` is not an alternative here, because a `delete` api that declares it is rejected (`INCLUDE_SOFT_DELETED_ON_DELETE`). A DELETE-verb api that must leave the row live (for example a cancellation that keeps its entitlements until the period ends) cannot be a `delete` crudType.

**A moderated child is written without a verdict.** This action writes through the data layer, past the moderation seam of a `childObject` that carries [`objectModeration`](../capabilities/object-moderation.md): in `staged` mode the change is not staged, in `onPlace` mode `moderationStatus` is left as it was. The validator names each such action (`OBJECT_MODERATION_UNSTAGED_WRITE_PATH`, a warning), and a `dataClause` entry naming the managed `moderationStatus` / `moderationAuthorId` column of an `onPlace` child is refused (`OBJECT_MODERATION_MANAGED_COLUMN_WRITTEN`). See [Writes the moderation seam never sees](../capabilities/object-moderation.md#writes-the-moderation-seam-never-sees).

## Example

After an order ships, stamp `fulfilled = true` on every line item:

```json
{
  "name": "markItemsFulfilled",
  "childObject": "OrderItem",
  "whereClause": { "js": "({ orderId: this.order.id, fulfilled: false })" },
  "dataClause": [
    { "dataProperty": "fulfilled",   "dataValue": { "js": "true" } },
    { "dataProperty": "fulfilledAt", "dataValue": { "js": "new Date().toISOString()" } }
  ]
}
```

## Errors

- `whereClause` resolves to an empty match set: a no-op (zero rows updated) under the default `onNoRows: "ignore"`. The action still returns the empty result. It also logs one `info` line `ActionMatchedNoRows` (`requestId`, `action`, `object`, `operation: "update"`, `reason: "no-rows-matched"`); `info` is the service's default log level, so the service log shows it. Set `onNoRows: "throwError"` when zero matches should surface as an error; a `condition` cannot do this, because it is a pre-run gate that never observes the post-hoc empty match.
- **HTTP 404, `errorCode: ACTION_NO_ROWS_MATCHED`**: `onNoRows: "throwError"` is set and `whereClause` matched no row. The message names the action and the child object; there is no `detail` object and nothing is written. `onActionError` then decides: the default `throwError` aborts the api with that 404, `completeApi` stores it on `this.<actionName>Error` and the api continues. An operator log line correlated by `requestId` records the miss: `ActionMatchedNoRows` at `warn`, with the same fields as above. Neither line prints the selector or a row.
- Required field assignment that violates a check constraint: DB error; surfaced via `onActionError`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`CreateCrudAction`](./create-crud-action.md), [`CreateBulkCrudAction`](./create-bulk-crud-action.md), [`DeleteCrudAction`](./delete-crud-action.md): sibling CRUD-effect actions.
- [Array mutation in MScript](../mscript/array-mutation.md): for updating array-shaped fields.
- [Numeric mutation in MScript](../mscript/numeric-mutation.md): atomic `$inc` / `$dec` / `$incIf` on counters, with a `$col` capacity guard and a typed 409.
