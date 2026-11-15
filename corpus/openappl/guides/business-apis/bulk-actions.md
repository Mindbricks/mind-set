---
title: Bulk actions
---

# Bulk actions

OpenAPPL deliberately avoids dedicated "bulk" business APIs at the
top level: every business API is one operation on one resource, in
line with REST semantics. Bulk work is composed inside a business
API's workflow using four primitives, each with a different shape:

| Primitive | Action class | Use when |
|---|---|---|
| **Bulk insert-or-update** | `UpsertBulkCrudAction` | Rows arrive keyed by property name (a parsed spreadsheet, a json body) and must be matched to stored rows on a key: insert the new, update the known, with per-column policies |
| **Bulk insert** | `CreateBulkCrudAction` | You need to write many child rows in one statement (the array of inputs is known at runtime). |
| **Bulk update / delete by query** | `UpdateCrudAction`, `DeleteCrudAction` | You can express the target set as a WHERE clause and apply the same change to every match. |
| **Per-item loop** | `LoopAction` (over an array) | Each item needs its own workflow (different validation, different downstream actions). |

There is no `crudType: "bulk"`; there is no top-level `POST /<x>/bulk`
auto-generated route. Bulk work is always nested inside a business API
of one of the five standard crudTypes.

## `CreateBulkCrudAction`: bulk insert of child records

The store entry sits under
`actions.createBulkCrudActions[]`. Each entry names a target data
object of the same service (`childObject`) and an MScript expression
(`objects`) that evaluates to an array of plain objects. The service
writes them through its own data layer in one batch.

```json
{
  "name":               "createAuditLogs",
  "childObject":        "AuditLog",
  "objects":            { "js": "this.events.map(e => ({ orderId: this.instance.id, userId: this.session.userId, kind: e.kind, payload: e.payload, at: new Date() }))" },
  "contextPropertyName": "createdLogs",
  "writeToResponse":    false
}
```

There is no cross-service bulk write. The action writes only to the
local data layer, and a `childObject` written as
`<otherService>:<Object>` is refused at design time
(`CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL`). To write rows that another
service owns, call an API of that service with an
[`InterserviceCallAction`](../../spec/InterserviceCallAction.md). See
[`CreateBulkCrudAction`](../../spec/CreateBulkCrudAction.md).

## `UpsertBulkCrudAction`: bulk insert-or-update on a match key

Declared under `actions.upsertBulkCrudActions[]`. Each incoming row is matched
to a stored row on `matchBy` (id, a unique property, or a composite index);
`matchMode` decides whether a match is updated, skipped or rejected and whether
a miss is inserted (`upsert`, `insert`, `update`, `skipExisting`);
`columnPolicies` refine an update per column (`overwrite`, `fillIfEmpty`,
`keep`, `skipIfEmpty`, `compute` over `existing` and `row`), and `emptyCells:
skip` makes a blank incoming cell mean "no change". Writes go row by row
through the same create / update-by-id operations a single write uses, so
hashing, events and indexing behave as on a single write. Result: `{ inserted,
updated, skipped, rejected }`. Its natural input is
[`FileToDataAction`](../../spec/FileToDataAction.md); full reference in
[`UpsertBulkCrudAction`](../../spec/UpsertBulkCrudAction.md).

## Bulk update / delete by query

`UpdateCrudAction` and `DeleteCrudAction` already operate on sets:
their `whereClause` is an MScript expression selecting the rows, and
`dataClause` (for update) carries the assignments. There is no
`UpdateBulkCrudAction` and no `DeleteBulkCrudAction`: the standard
CRUD actions handle the bulk case.

Update reads matching rows before writing so each `updated` event can carry
that row's `old` image. A row that begins matching after this read is
left for a later call. On SQL databases, plain and numeric updates use one
write statement; SQL array mutations and MongoDB numeric or array mutations
write per row. MongoDB plain updates write each prefetched document with its
own conditional update and re-read only the ones whose write matched, so a
document another writer moved out of the selector meanwhile is neither
written nor reported. This costs one conditional-write round trip per
prefetched document, plus the before-image read and a re-read when any
write matched.
Delete works in pages of 1000, and each page prefetches its rows, archives
exactly those ids, emits their `deleted` events and then runs the relation
cascade before the next page is read. Read
[On-delete cascades](../data-modeling/relations.md#on-delete-cascades)
before wiring a `DeleteCrudAction` at an object that has children.

```json
{
  "name":          "archiveStale",
  "childObject":   "Order",
  "whereClause":   { "js": "{ status: 'expired', archivedAt: null }" },
  "dataClause":    [
    { "dataProperty": "status",     "dataValue": { "js": "'archived'" } },
    { "dataProperty": "archivedAt", "dataValue": { "js": "new Date()" } }
  ],
  "contextPropertyName": "archivedOrders",
  "writeToResponse":    false
}
```

Each `dataClause` entry is an
[`ApiAggregateData`](../../spec/ApiAggregateData.md) record:
`dataProperty` names the child object's property,
`dataValue` is the MScript expression. This is distinct from a
top-level business API's `dataClauseItems` (which uses
`name` / `value` per
[`DataMapItem`](../../spec/DataMapItem.md)).

This is the right shape for "archive every expired order": no per-row
round trip. The action returns the updated rows as an array (`[]` when
nothing matched), so the affected count is
`this.archivedOrders.length`. A `DeleteCrudAction` returns the deleted
rows the same way.

For the DELETE variant, the id list *is* materialised, one page at a
time: the delete path prefetches each page so it can emit the right
`deleted` events, reconcile the search index and cascade to the page's
children. That is per page, not per row, and it is what makes a bulk
delete honour `onDeleteAction`.

See [`UpdateCrudAction`](../../spec/UpdateCrudAction.md) and
[`DeleteCrudAction`](../../spec/DeleteCrudAction.md).

## Per-item workflows: `LoopAction`

When each item in the array needs its own workflow (different
validation, conditional writes, per-item enrichment),
`actions.loopActions[]` iterates over an MScript expression and runs a
named set of inner actions per item. Inner actions read the current
item by the name `loopItemName` gives it, either bare (`row.id`) or on
the context (`this.row.id`); `this.crudItem` is the same item. See
[Parallel and loops](../workflow/parallel-and-loops.md) for
the full surface, including `isParallel`, step results, and ordering.

```json
{
  "name":         "importRows",
  "loopFor":      { "js": "this.payload.items" },
  "loopItemName": "row",
  "isParallel":   false,
  "actions":      ["validateRow", "createRow"],
  "writeToResponse": false
}
```

A loop that runs inner actions walks its items one at a time even with
`isParallel: true`; for concurrent work use a `ParallelAction`. See
[Parallel and loops](../workflow/parallel-and-loops.md) and
[Race conditions](../workflow/race-conditions.md).

## Per-item validation

For `CreateBulkCrudAction`, validate inside the `objects` MScript
expression: filter or transform the array before the bulk write
runs.

```json
{
  "name":     "createCleanLogs",
  "childObject": "AuditLog",
  "objects":  { "js": "this.events.filter(e => e.kind && e.payload).map(e => ({ kind: e.kind, payload: e.payload }))" },
  "writeToResponse": false
}
```

For per-item rejection (the API must return which items failed),
switch to `LoopAction` with a `ValidationAction` whose `checkType` is
`storedCheck`, then collate the results before responding.

## Filtering / pruning the input

Use plain MScript on the `objects` (bulk) or `loopFor` (loop)
expression. Dropping invalid items before the DB write is a
one-liner:

```json
"objects": { "js": "this.payload.items.filter(it => it.amount > 0 && it.sku)" }
```

For richer transformations, declare an `arrowFunctionAction` or
`listMapActions` earlier in the workflow and reference its result.

## Transactionality and partial failure

`CreateBulkCrudAction` hands the entire `objects` array to the data layer
in one call: there is no per-item retry or partial-rollback semantics. If
the write throws, the action throws, and the surrounding workflow
behaves the same as any other failing action (per `onActionError`:
default `throwError` aborts the API, `completeApi` catches the error
into `this.<actionName>Error`).

A row that fails the model's own validation (a required property left
out) makes the write THROW on both database engines rather than disappear,
and the error is answered as HTTP 422 `VALIDATION_ERROR` naming the
offending fields. Note what that does NOT undo: on MongoDB the insert is
unordered, so the rows that passed validation ARE written before the error
is raised: the partial-success contract above, reported instead of hidden.
Every row the call did write is treated exactly like a successful write
before the 422 is raised: the accepted inserts are projected to
Elasticsearch and raise their `created` db event, and the rows the same
call updated raise their `updated` event, so the search index and the
event stream agree with the collection.

`UpdateCrudAction` on SQL writes a plain or numeric change in one
statement over the rows it prefetched, so the engine's statement-level
atomicity applies to that write; array mutations, and every MongoDB
update, write row by row with no transaction around them (see "Bulk
update / delete by query" above). No row-by-row recovery is generated.

`DeleteCrudAction` is **not** atomic. It runs a pre-flight over
the whole `doDelete` subtree first, so an `onDeleteAction: "restrict"`
child anywhere below the matched set refuses the WHOLE call with HTTP
409 `RELATION_RESTRICTED` before anything is written, and then commits
one page of 1000 at a time, cascading each page before reading the
next. There is no transaction around those pages: a failure part way
through (a concurrent writer creating a blocker after the pre-flight, a
`CASCADE_DEPTH_EXCEEDED`, a driver error on page 7) leaves the earlier
pages archived, their events emitted and their children cascaded, and
the error still reaches the caller. A retry re-runs from what is left
matching; rows already archived no longer match and are not touched
again.

For workflows that need partial-success reporting, use `LoopAction`
with `onActionError: "completeApi"` on the per-item action: each
iteration's error lands on `this.<innerActionName>Error`, and a
final step can collate the failures.

## Response shape

A `CreateBulkCrudAction` exposes its result on the context under
`contextPropertyName` (an array of the created rows) and, when
`writeToResponse: true`, attaches the array to the response under the
same name. `UpdateCrudAction` / `DeleteCrudAction` expose the array of
rows they updated or deleted; its `length` is the affected count. Shape
the final response with
`addToResponseActions` at `afterBuildOutput`; for example, return
`{ created: N, failed: [...] }` after a loop with per-item
`completeApi`.

## When to prefer `LoopAction` over the bulk actions

| Need | Prefer |
|---|---|
| Same insert / update / delete for every item, hot path | `CreateBulkCrudAction` / `UpdateCrudAction` / `DeleteCrudAction` |
| Per-item validation that reports which rows passed | `LoopAction` with `ValidationAction(storedCheck)` |
| Per-item side effects (email, downstream API) | `LoopAction` |
| Parallel external calls | `ParallelAction` of branch-per-call (see [Parallel and loops](../workflow/parallel-and-loops.md)) |
| Very long input (thousands of rows or more) | `cronSettings` + `LoopAction` in batches; the synchronous request path is bounded by request timeout |

## Bulk work as the API's purpose: a job record

When the bulk change *is* what the endpoint does (archive every expired
order, re-price a category, delete a user's drafts), give the API a job
record as its main object. The API is a `create` on a small job data
object (here `archiveJob`, with `status`, `cutoffDate`, `archivedCount`
and `completedAt`): the main write inserts the job row, the bulk
action runs after it, and a last `UpdateCrudAction` writes the outcome
back onto the job row.

```json
{
  "basics": {
    "apiOptions":  { "name": "createArchiveJob", "crudType": "create", "dataObjectName": "archiveJob" },
    "authOptions": { "loginRequired": true, "checkRoles": ["admin"] }
  },
  "parameters": {
    "requestParameters": [
      { "name": "cutoffDate", "type": "Date", "httpLocation": "body", "required": true }
    ]
  },
  "query": {
    "dataClauseItems": [
      { "name": "cutoffDate", "value": { "js": "this.cutoffDate" } },
      { "name": "status",     "value": { "js": "'running'" } }
    ]
  },
  "actions": {
    "updateCrudActions": [
      {
        "name":                "archiveExpiredOrders",
        "childObject":         "order",
        "whereClause":         { "js": "({ status: 'expired', expiresAt: { $lt: this.cutoffDate } })" },
        "dataClause":          [ { "dataProperty": "status", "dataValue": { "js": "'archived'" } } ],
        "contextPropertyName": "archivedOrders",
        "onActionError":       "completeApi"
      },
      {
        "name":        "recordJobOutcome",
        "childObject": "archiveJob",
        "whereClause": { "js": "({ id: this.archiveJob.id })" },
        "dataClause":  [
          { "dataProperty": "status",        "dataValue": { "js": "this.archiveExpiredOrdersError ? 'failed' : 'completed'" } },
          { "dataProperty": "archivedCount", "dataValue": { "js": "(this.archivedOrders ?? []).length" } },
          { "dataProperty": "completedAt",   "dataValue": { "js": "new Date()" } }
        ]
      }
    ]
  },
  "workflow": {
    "create": { "afterMainCreateOperation": ["archiveExpiredOrders", "recordJobOutcome"] }
  }
}
```

- `this.archiveJob` is the inserted job row at `afterMainCreateOperation`,
  so the outcome write addresses it by id.
- `onActionError: "completeApi"` on the bulk action keeps a failure from
  ending the request: the error lands on `this.archiveExpiredOrdersError`
  and the job row records `failed` instead of staying `running`.
- Because `recordJobOutcome` updates the API's own object in that stage,
  the service re-reads the job row before the response is
  built, so the caller receives the job with its final `status` and
  `archivedCount` (see
  [Workflow context](../workflow/workflow-context.md#the-record-after-a-post-main-rewrite)).
- The selector is built on the server from the API's own parameters.
  Never take a `whereClause` or a target object from the caller;
  `childObject` is fixed at design time. A selector with no `this.<x>`
  reference at all applies to every matching row on every call and
  draws a review warning (`WHERECLAUSE_UNSCOPED_CASCADE`) unless the
  API runs on a cron controller.
- The same host fits a bulk delete (a `DeleteCrudAction` in place of the
  update) or a bulk insert (`CreateBulkCrudAction`), and a cron
  controller can run it on a schedule (see [Cron controllers](cron-jobs.md)).
  For work that outlives one request, see
  [Big data and async flows](../capabilities/big-data-and-async-flows.md).

## See also

- [BusinessApi overview](overview.md), [Create API](create-api.md),
  [Update API](update-api.md)
- [Parallel and loops](../workflow/parallel-and-loops.md),
  [Race conditions](../workflow/race-conditions.md),
  [Error handling](../workflow/error-handling.md)
- [Cron controllers](cron-jobs.md): for very large backfills
- [MScript cookbook](../mscript/cookbook.md)
- Specification: [`UpsertBulkCrudAction`](../../spec/UpsertBulkCrudAction.md), [`CreateBulkCrudAction`](../../spec/CreateBulkCrudAction.md),
  [`UpdateCrudAction`](../../spec/UpdateCrudAction.md),
  [`DeleteCrudAction`](../../spec/DeleteCrudAction.md),
  [`LoopAction`](../../spec/LoopAction.md).
