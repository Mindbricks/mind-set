---
title: Workflow context
---

# Workflow context

Every action and every MScript expression runs against a shared
context object bound as `this`. The context aggregates the request
parameters, the session, results from earlier actions, framework
helpers, and (in loops) per-iteration state. This page is the field
reference.

Every business API in the generated service carries typed fields for
its `requestParameters`, `redisParameters`, and any
`contextPropertyName`-bearing actions. How the service implements the
context is described in
[the compiler specification](../../compiler/index.md); the names and
the order in which they appear are the contract documented here.

## Top-level fields

| Field | Type | Populated by | Notes |
|---|---|---|---|
| `this.<paramName>` | per-property | `parameters.requestParameters[]` | Each request parameter lands here; the entry's `name` is the field name. |
| `this.<redisName>` | per-property | `parameters.redisParameters[]` | Each Redis parameter is fetched and assigned the same way. |
| `this.<actionContextName>` | per-action | An action with `contextPropertyName` set | The action's result. Reads as `this.<contextPropertyName>` (or `this.<name>` when `contextPropertyName` is omitted). |
| `this.<actionName>Error` | `Error` | An action whose `onActionError: "completeApi"` failed | Lets later actions branch on the failure. |
| `this.decisions` | `Record<string, object>` | Each [`DecisionAction`](../../spec/DecisionAction.md) | `this.decisions.<actionName>.<questionName>` is `{ value, confidence, probabilities, model }`, and `this.decisions.<actionName>._meta` records the model, who answered, low-confidence and unanswered questions and any escalation. Branch on `value`, never on the probability. An authorization check action that reads it is refused (`DECISION_ON_AUTHZ_SURFACE`). |
| `this.session` | `object \| null` | Auth middleware on the request | `userId`, `roleId`, `tenantCodename`, the tenant id under the project's own name (`<tenantName>Id`), custom claims. There is no generic `session.tenantId`. `null` when `loginRequired: false` and no caller. |
| `this._tenantId` | `string \| null` | Derived from `session.<tenantName>Id`, then the tenant header, then root | Convenience shortcut. The service also exposes it under the project's own name (`this.<tenantName>Id`). |

There is no `this.userId` or `this.userRole` session shortcut: read the
caller as `this.session.userId` and `this.session.roleId`. A bare
`this.userId` exists only when the API declares a `userId` request
parameter or its data object has a `userId` column, and then it holds
that value, not the caller.

| Field | Type | Populated by | Notes |
|---|---|---|---|
| `this.params` | `Record<string, unknown>` | Nothing populates it; see the note below | An OPTIONAL aggregate slot. Parameter reading binds each declared parameter into its own `this.<X>` and does not fill this map, so an action must read `this.<X>`, never `this.params.<X>`. |
| `this.whereClause` | `Record<string, unknown>` | Built before the DB read | Available from `afterBuildWhereClause` onwards. |
| `this.dataClause` | `Record<string, unknown>` | Built before the DB write | Available from `afterBuildDataClause` onwards. |
| `this.instance` | `Record<string, unknown> \| null` | The instance fetch for `update` / `delete` (and an ownership-gated `get`) | The pre-mutation row. |
| `this.result` | `any` | Main DB operation | Available from `afterMain<Crud>Operation` onwards. |
| `this.totalCount` | `number` | List DB layer | Total matching rows for list APIs (used to drive the response paging block). |
| `this.dataName` | `string` | The API's data object name (singular by default; a plural for list APIs) | Internal label for the API's primary data. It is NOT a response key: single-item responses are the bare record at the body root (with `_type`), list responses are `{ data, paging }`. |
| `this.dataObjectName` | `string` | The API's data object name | The canonical data-object name (used in error messages). |
| `this.name` | `string` | The API's `apiOptions.name` | The API's name. |
| `this.crudType` | `'create' \| 'get' \| 'list' \| 'update' \| 'delete'` | The API's `crudType` | The API kind; gates milestone selection. |
| `this.controllerType` | `'rest' \| 'kafka' \| 'grpc' \| 'mcp' \| 'socket' \| 'sse' \| 'cron'` | The triggering controller | The transport that triggered this request. |
| `this.output` | `ApiOutput \| null` | The output build | Available from `afterBuildOutput` onwards. `addToResponseActions` writes named keys onto it. |
| `this.pagination` | `{ page, pageSize }` | Pagination reading, from the 1-based `page` / `pageSize` request parameters, resolved off the transport envelope for the api's protocol, with `pageNumber` / `pageRowCount` accepted as aliases | List APIs only. |
| `this.request` | `object` | The controller that triggered the API | The raw transport request. Reading declared parameters off `this.<paramName>` is the canonical form; `this.request` is the escape hatch for what no parameter binds. On an event-triggered (Kafka) API it is a pseudo-request built from the message: `body` = the event's `data` (the record, already unwrapped out of the unified event envelope), `event` = the raw envelope (`id` / `type` / `source` / `time` / `requestId` / `actor` / `data` / `old`), `session` = the envelope's `actor`, `requestId` = its `requestId`. There is no `this.event`. |
| `this.requestId` | `string` | Request middleware | Stable correlation ID for logs. |
| `this.isM2M` | `boolean` | M2M auth path | True when the call came from another service with a service token. |
| `this.isOwner` | `boolean` | Ownership check | True when the auth gate matched ownership. |
| `this.absoluteRoles`, `this.checkRoles` | `string[]` | `authOptions` | Used by validation actions to bypass certain checks. |

The output payload (`this.output`) is populated during
`afterBuildOutput`. Mutating it directly is rare;
[`AddToResponseAction`](../../spec/AddToResponseAction.md) and
[`RemoveFromResponseAction`](../../spec/RemoveFromResponseAction.md)
are the canonical entry points.

## Reading values from MScript

MScript expressions are JavaScript-flavoured expression fragments
evaluated with `this` bound to the context (see
[MScript overview](../mscript/overview.md)). Property access uses
standard dot notation:

```text
this.orderId
this.session.userId
this.loadOrder.status
this.buyer.email
this.payload.items[0].sku
this.payload.items.filter(it => it.qty > 0)
```

For nested null safety, use optional chaining: `this.buyer?.email`.

The service also exposes two helpers on the context:

| Helper | Purpose |
|---|---|
| `this.readFromContext(path)` | Dot-notation read on the context (returns `null` for missing segments). |
| `this.readFromSession(path)` | Dot-notation read on `this.session`. |

These are used when a source-level expression goes through a runtime
resolver, but most expressions read fields directly.

## Per-field detail

### `this.session`: authenticated user and tenant

```json
{
  "userId":      "u_a1b2c3",
  "workspaceId": "t_company1",
  "roleId":      "seller",
  "fullName":    "Jane Doe",
  "email":       "jane@example.com"
}
```

The exact shape is up to the project's session configuration. In a
multi-tenant project the tenant id sits under the project's own tenant
name (`<tenantName>Id`, `workspaceId` above); there is no generic
`tenantId`. Read every field as `this.session.<field>`
(`this.session.userId`, `this.session.roleId`); for the tenant,
`this._tenantId` (see the table above) is the shortcut.

When `loginRequired: false`, `this.session` may be `null`. Always
guard MScript against the unauthenticated path.

### Request parameters

For a parameter declared as
`{ "name": "orderId", "httpLocation": "urlpath", "type": "ID" }`, the
value lands at `this.orderId` after the parameters are read. Available
from the `afterReadParameters` milestone onwards.

### Redis parameters

For an entry with `redisKey: "'tenant:' + this.session.workspaceId"`,
the service fetches the Redis value and assigns it to
`this.<name>` while reading the Redis parameters. Same milestone
semantics as request parameters.

### Action result properties

An action with `contextPropertyName: "buyer"` writes its result to
`this.buyer` after the action runs. When `contextPropertyName` is
omitted, the action's `name` is used:

```json
{ "name": "loadOrder", "targetObject": "Order", "matchValue": { "js": "this.orderId" }, "localKey": "id", "writeToResponse": false }
```

```text
this.loadOrder.status   <- available after the action runs
```

**"After the action runs" is literal.** A read of a context value whose
producer is scheduled later (in a later milestone, or later in the
same milestone's array) evaluates to `undefined`; it does not throw
and it is not a syntax error. In a `shouldBeTrue: false` validation
action that reads as "no error" and the guard passes vacuously. The
validator reports the shape as `ACTION_CONTEXT_READ_BEFORE_PRODUCED`.
See [Ordering: what may read what](overview.md#ordering-what-may-read-what)
for the intra-milestone rule and the two framework-evaluated clause
slots.

The same rule covers the service's own MID-pipeline bindings:
`this.result` / `this.data` / `this.dbResult` and, on a `create`,
`this.<objectName>` and `this.createOutcome` exist only from
`afterMainOperation` on, and `this.output` only from
`afterBuildOutput` on. An action scheduled
earlier reads `undefined`: a `publishEventActions` message that is an
object literal then ships an event whose every key is `undefined` and
which serializes as `"data": {}`. Because the producing step cannot be
moved, the fix is always to schedule the reader later.

### The record after a post-main rewrite

On a `create` or `update` API whose `afterMainCreateOperation` /
`afterMainUpdateOperation` stage runs an `UpdateCrudAction`, a
`DeleteCrudAction` or an `UpsertBulkCrudAction` on the API's **own**
data object (its `childObject` spelled exactly as the API's
`dataObjectName`, directly or inside a loop or parallel container), the
service re-reads the main row by its id once that
stage has finished and before the response is built. `this.result`,
`this.dbResult` and `this.data` are rebound to the re-read row, and so
is `this.<objectName>` unless an action of the stage bound that name
itself (`contextPropertyName: "<objectName>"`). The response, and every
`afterBuildOutput` action, therefore shows the row as the stage left it.

Three limits:

- **Later actions in the same stage still see the old row.** The re-read
  runs after the whole stage, so an action listed after the rewrite in
  the same array reads the record as the main operation wrote it.
- **Only those three actions on the API's own object trigger it.** A
  stage without one is not re-read, even if it rewrote the row another
  way (library code in a `FunctionCallAction`), and the response then
  shows the main operation's row.
- **A deleted row is not replaced.** If the stage deleted the row, the
  re-read finds nothing and the response keeps the record the main
  operation wrote.

### What the create actually did: `this.createOutcome`

A `create` whose data object declares a unique index with
`onDuplicate: 'stopOperation'` is retry-safe: a replay finds the
existing row, SKIPS the insert and answers 2xx with the same id. The
pipeline is not skipped: `afterMainCreateOperation` still runs, with
`this.result` and `this.<objectName>` bound to that prior row, so
every post-main side effect fires again unless you gate it.

`this.createOutcome` is the gate's input, bound by the main operation
beside `this.<objectName>`:

| Value | Meaning |
| --- | --- |
| `'created'` | A row was inserted (a create never revives a soft-deleted row, so only a real insert counts). |
| `'duplicateStopped'` | An `onDuplicate: 'stopOperation'` index matched. **Nothing was written**; `this.result` is the pre-existing row. |
| `'duplicateUpdated'` | An `onDuplicate: 'doUpdate'` index matched and the row was updated in place. |

```json
{ "condition": { "js": "this.createOutcome === 'created'" } }
```

Put that condition on every post-main action whose effect must not
repeat: child `createCrudActions`, counter-allocating
`functionCallActions`, `publishEventActions`. Without it a replay
duplicates order lines, audit rows and events while the response body
still looks correct.

It exists only on a `create`, and only when the object declares an
index with one of those two policies; and only from
`afterMainCreateOperation` on. Read earlier it is `undefined`, so
`this.createOutcome === 'created'` is false for the GENUINE create too
and the gate suppresses exactly the run it was meant to allow.

### The fetched row: `this.instance`

`this.instance` is the row the pipeline fetched for an `update`, a
`delete` or an ownership-gated `get`. The instance fetch runs at
pipeline step 7, so the row is `null` at every milestone from
`afterStartBusinessApi` through `afterBuildWhereClause` (including
`afterCheckBasicAuth`, and including the `query.whereClause` that
BUILDS the fetch) and is loaded only from `afterFetchInstance` on.
A `create`, a `list` or a plain `get` never fetches a row at all.

A gate whose key is read off the row before the fetch therefore
compares `undefined` and refuses every caller: a 403 with no database
read behind it, answered in a couple of milliseconds:

```json
{ "name": "requireOrgAdmin", "dataObjectName": "organization",
  "objectKey": { "js": "this.instance.organizationId" } }
```

```text
afterCheckBasicAuth  -> this.instance is null  -> 403 for everyone
afterCheckInstance   -> the row is loaded      -> the check decides
```

The validator reports this as `INSTANCE_READ_BEFORE_FETCH` (error on a
gate action or the where clause, warning elsewhere). Two fixes, either
one on its own: schedule the check at `afterFetchInstance` or later,
or derive its key from a request-scoped value that already exists at
the stage it runs: a route/body parameter (`this.<paramName>`), a
session field (`this.session.<field>`), or an earlier action's context
value.

## Adding to the context

Use [`AddToContextAction`](../../spec/AddToContextAction.md) when an
action needs to publish multiple named values, or when the value is a
small computed expression that doesn't deserve its own action class.

```json
{
  "name":            "deriveTotals",
  "context":         [
    { "contextName": "subtotal", "contextValue": { "js": "this.items.reduce((s, it) => s + it.qty * it.price, 0)" } },
    { "contextName": "tax",      "contextValue": { "js": "this.subtotal * 0.2" } }
  ],
  "writeToResponse": false
}
```

After the action runs, both `this.subtotal` and `this.tax` are
available.

For one-off computation use an `arrowFunctionActions[]` entry: the
arrow body returns the value, which lands on
`this.<contextPropertyName>`. Prefer `addToContextActions` when the
intent is "stash this for later"; prefer `arrowFunctionActions` when
the intent is "compute one value used immediately downstream".

## Shaping the response

[`AddToResponseAction`](../../spec/AddToResponseAction.md) copies
named values from the context into the final response. Same
`context: ContextData[]` shape as `AddToContextAction`, but its entries
go to the response only: they never create a `this.<contextName>` that a
later action can read, and the ordering check does not treat them as
producers. Typically attached to `afterBuildOutput`.

```json
{
  "name":            "respond",
  "context":         [
    { "contextName": "publishedAt", "contextValue": { "js": "this.instance.publishedAt" } },
    { "contextName": "buyer",       "contextValue": { "js": "{ id: this.buyer.id, email: this.buyer.email }" } }
  ],
  "writeToResponse": false
}
```

[`RemoveFromResponseAction`](../../spec/RemoveFromResponseAction.md)
deletes named properties from the response, which is useful for
redacting sensitive defaults.

## Inside a loop or parallel branch

When the workflow enters a `LoopAction`, the iteration binds two
extra fields:

| Field | Notes |
|---|---|
| `this.<loopItemName>` | The current array element. The name is configured by `LoopAction.loopItemName`. |
| `this.crudItem` | Alias of the current element. Always populated unless `loopItemName === 'crudItem'`. |

Inner actions read `this.<loopItemName>` (or `this.crudItem`) for
the current item. The outer context is still readable: loops do not
shadow the parent unless the inner step's own
`contextPropertyName` collides with a parent field.

A `ParallelAction` runs its named children concurrently. Each
child writes its result to `this.<contextPropertyName>` (or
`this.<name>`) on the shared context; there is no per-branch
namespace. Two children that publish under the same property name
race; see [Race conditions](race-conditions.md).

See [Parallel and loops](parallel-and-loops.md) and
[MScript step context](../mscript/step-context.md).

## See also

- [Overview](overview.md), [Parallel and loops](parallel-and-loops.md),
  [Error handling](error-handling.md)
- [MScript syntax](../mscript/syntax.md),
  [MScript step context](../mscript/step-context.md)
- Action reference: [`AddToContextAction`](../../spec/AddToContextAction.md),
  [`AddToResponseAction`](../../spec/AddToResponseAction.md),
  [`RemoveFromResponseAction`](../../spec/RemoveFromResponseAction.md),
  [`ArrowFunctionAction`](../../spec/ArrowFunctionAction.md).
