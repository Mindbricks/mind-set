---
title: CreateCrudAction
---

# CreateCrudAction

Creates a single related record (typically a child or associated entity) from inside another Business API's workflow. The values to write come from MScript expressions over the API context.

This is **not** a create API: those are full Business APIs you declare in their own right. `CreateCrudAction` is the in-workflow step you reach for when a parent operation needs to write an additional row as a side effect.

`childObject` must be a data object of the same service: the action calls only the local `dbLayer`, and a `<otherService>:<Object>` reference is refused at design time (`CRUD_ACTION_CHILD_OBJECT_NOT_LOCAL`). To create a row another service owns, use an [`InterserviceCallAction`](./interservice-call-action.md) against that service's create API.

## When to use it

- Write an audit / activity / history row tied to the main operation.
- Initialise a default child record (a wallet row when a user signs up, a draft cart when a session opens).
- Add an attachment, tag, or join-table row alongside the parent.
- For multiple rows in one step use [`CreateBulkCrudAction`](./create-bulk-crud-action.md).
- To change what a create API itself writes, edit that API: don't model it with `CreateCrudAction`.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `childObject` | `DataObjectName` | yes | Target data object. Must be a data object of the same service. |
| `dataClause` | `ApiAggregateData[]` | yes | Property-value pairs that populate the new row. Required fields of the child object must be present. |

`ApiAggregateData` fields:

| Property | Type | Req | Description |
|---|---|---|---|
| `dataProperty` | `PropRefer` | yes | Target property on the child object. Must match a valid property of the data object. |
| `dataValue` | `MScript` | yes | Expression that yields the value. May reference `this`, request parameters, prior action results, or a [`LoopAction`](./loop-action.md) item by its `loopItemName`. |

## Behaviour

The action:

1. Builds the row data by evaluating each `dataClause[i].dataValue` and assigning it to the `dataClause[i].dataProperty` property. For a tenant-scoped child in a multi-tenant project it then stamps the session tenant onto the tenant column when the `dataClause` did not set it, and fills every child property carrying `sessionSettings.sessionParam` that the `dataClause` did not name from the caller's session.
2. Creates the row through the child object's `dbLayer` create, with the request's session and request id as its context.
3. Returns the created row (unwrapping `result.data` when present). The value is stored on `this.<contextPropertyName>` and added to the response when `writeToResponse` is true.

**When no row was written.** A create that returns without writing a row, and without throwing, logs one `info` line `ActionWroteNoRows`. `info` is the service's default log level, so the service log shows it. Fields: `requestId`, `action`, `object` (the child object), `operation: "create"`, and a `reason`:

| `reason` | What the dbLayer create answered |
|---|---|
| `no-row-returned` | No answer at all (`null` / `undefined`). |
| `duplicate-kept-existing` | A unique index declared with `onDuplicate: "stopOperation"` matched: the existing row is returned and nothing is written. |
| `existing-id-kept` | A MongoDB create with an explicitly provided id found a live row that already owns that id and returned it untouched. |

An `onDuplicate: "doUpdate"` upsert writes the row and is not logged. An `onDuplicate: "throwError"` refusal is the 409 below, logged as `DuplicateRecordRefused`. The returned value is unchanged, and the line never prints a row.

> **Session-bound and joined child columns are auto-filled.** The row data holds the `dataClause` mappings, the tenant stamp, and every child property carrying `sessionSettings.sessionParam` that the mappings did not name, read from the caller's session. An authored mapping always wins (no fill is applied for a column the `dataClause` names, so an authored explicit `null` stays null), and a session that carries no value leaves the key ABSENT, so a required column refuses the row rather than being written null. A child property carrying a `staticJoin` block that the mappings do not name is resolved on this nested create too, matched on the foreign key the row data already holds, the same way the main create resolves it (a local source through the data layer, a sibling-service or non-local source through the Elasticsearch projection); an authored mapping for the joined column wins and emits no join. When the join cannot supply a value (a null foreign key, a missing source row, a null read), the `staticJoin.defaultValue` fallback applies here too, exactly as on the main create. A required child column with no source at all (no mapping, no `sessionSettings`, no `staticJoin`, no column default) is a design-time error (`CHILD_CREATE_MISSING_VALUE_SOURCE`) rather than a row the database refuses after the parent has committed. See [Write-time data composition](../composition/write-time-data-composition.md).

> **A moderated child is written without a verdict.** This action writes through the `dbLayer`, past the moderation seam of a `childObject` that carries [`objectModeration`](../capabilities/object-moderation.md): in `staged` mode the row is not staged, in `onPlace` mode it lands `accepted`. The validator names each such action (`OBJECT_MODERATION_UNSTAGED_WRITE_PATH`, a warning), and a `dataClause` entry naming the compiler-managed `moderationStatus` / `moderationAuthorId` column of an `onPlace` child is refused (`OBJECT_MODERATION_MANAGED_COLUMN_WRITTEN`). A `staticJoin` fill sourced from an `onPlace` object reads it through the read gate with the caller's identity. Route user content through the child's own create api instead; see [Writes the moderation seam never sees](../capabilities/object-moderation.md#writes-the-moderation-seam-never-sees).

## Example

```json
{
  "name": "writeAuditRow",
  "writeToResponse": false,
  "childObject": "AuditEntry",
  "dataClause": [
    { "dataProperty": "actor",  "dataValue": { "js": "this.session.userId" } },
    { "dataProperty": "target", "dataValue": { "js": "this.order.id" } },
    { "dataProperty": "action", "dataValue": { "js": "'order.created'" } },
    { "dataProperty": "at",     "dataValue": { "js": "new Date().toISOString()" } }
  ]
}
```

Initialise a draft wallet alongside the new user (child in the same service):

```json
{
  "name": "initWallet",
  "writeToResponse": false,
  "childObject": "Wallet",
  "dataClause": [
    { "dataProperty": "ownerId", "dataValue": { "js": "this.user.id" } },
    { "dataProperty": "balance", "dataValue": { "js": "0" } }
  ]
}
```

## Errors

- Missing required fields on the child object throw at validation in the dbLayer.
- A `dataClause` entry with an unresolved `dataProperty` fails at project-validation time.
- **HTTP 409, `errorCode: DUPLICATE_RECORD`** - the create hit a unique index the child object declares with `onDuplicate: "throwError"`. The public message is the fixed key `errMsg_DuplicateRecord` for every index: the response never names the index, the column or the conflicting row. The index name goes to an operator log line (`DuplicateRecordRefused`) correlated by `requestId`, and that log never carries the existing row. The same message and code are what the auto-generated **create** endpoint answers, so a client sees one duplicate contract wherever the write came from. A dbLayer envelope that supplies its own code (for example `CODENAME_REMINT_EXHAUSTED`) keeps that code with the same fixed message.

### Reading the row behind a duplicate

The action parks the conflicting row on an internal member of its own
invocation, `this._existing_<actionName>`, next to the `this.<actionName>Error`
slot that `onActionError: "completeApi"` fills. A later step of the same
workflow can read it - to answer with the existing row, to branch, or to
correlate - and it never reaches a client on its own: it is not serialized into
the response, into the RFC 9457 problem body or into any event payload. Only a
step you author can put any part of it on the wire.

The member is scoped to ONE invocation. Every execution of the action clears it
on entry, so a loop, a repeat or a parallel run never reads the previous run's
row, and it is `null` when the refusal carried no row.

```json
{
  "name": "addTag",
  "childObject": "Tag",
  "onActionError": "completeApi",
  "dataClause": [
    { "dataProperty": "label", "dataValue": { "js": "this.label" } }
  ]
}
```

With `onActionError: "completeApi"` the workflow continues after the refusal;
`this.addTagError` holds the 409 and `this._existing_addTag` holds the row that
already owned the label (or `null`).

This is the duplicate MESSAGE contract only. It fixes what a duplicate refusal
says on these two create doors; it does not claim to solve record enumeration
in general - other doors (login, verification, list filters, response timing)
are untouched by it.

## See also

- [`CreateBulkCrudAction`](./create-bulk-crud-action.md)
- [`UpdateCrudAction`](./update-crud-action.md), [`DeleteCrudAction`](./delete-crud-action.md)
- [CRUD APIs](../business-apis/overview.md)
- [`ApiAggregateData`](../../spec/ApiAggregateData.md)
