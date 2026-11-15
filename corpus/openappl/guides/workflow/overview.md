---
title: Actions and workflow overview
---

# Actions and workflow overview

A business API runs a **workflow** of **actions**. The action store
declares every action the API can execute; the workflow says when each
runs. Two collaborating structures, separated by intent: definition
versus orchestration.

- **`actions`** is the typed store. A registry of every action this API
  declares, grouped by action class.
- **`workflow`** is the lifecycle map. Ordered arrays of action
  **names** at fixed milestones, keyed by the API's `crudType`.

Actions are *defined* in the store. The workflow *references* them by
name at the milestone where they should run. An action declared in
the store but absent from every milestone is inert.

## A typical shape

```json
"actions": {
  "fetchObjectActions": [
    { "name": "loadOrder", "targetObject": "Order", "matchValue": { "js": "this.orderId" }, "localKey": "id", "contextPropertyName": "order", "writeToResponse": false, "isRequired": true }
  ],
  "validationActions": [
    { "name": "checkDraft", "description": "Order must be in draft.", "validationScript": { "js": "this.order.status === 'draft'" }, "shouldBeTrue": true, "errorMessage": "Order is not in draft.", "errorStatus": "409", "writeToResponse": false }
  ],
  "updateCrudActions": [
    { "name": "publish", "childObject": "Order", "whereClause": { "js": "{ id: this.order.id }" }, "dataClause": [ { "dataProperty": "status", "dataValue": { "js": "'published'" } } ], "writeToResponse": false }
  ],
  "addToResponseActions": [
    { "name": "respond", "context": [ { "contextName": "orderId", "contextValue": { "js": "this.order.id" } } ], "writeToResponse": false }
  ]
},
"workflow": {
  "update": {
    "afterFetchInstance":       ["loadOrder"],
    "afterCheckInstance":       ["checkDraft"],
    "afterMainUpdateOperation": ["publish"],
    "afterBuildOutput":         ["respond"]
  }
}
```

The action **name** is the link between store and workflow. The
result of each action lands on the runtime context under
`contextPropertyName` (defaults to the action's name when absent);
downstream actions read it as `this.<contextPropertyName>`.

## Authoring actions and workflow

Sparse, name-canonical payloads are the authoring form the validator
and the compiler expect. Eight rules cover it:

1. **Only the action arrays you use.** Every array in the store is
   optional; an omitted array normalizes to `[]`. Never write empty
   scaffolding.
2. **Unique camelCase names, never ids.** An action's `name` is its
   handle (unique within the store); ids are assigned when the
   blueprint is stored, so don't author them. An unnamed action is
   stripped on write.
3. **`dataValue`, not its aliases.** Expression values use the
   canonical `dataValue` key. The aliases `value` / `valueScript` /
   `valueExpression` are canonicalized on write, but author the
   canonical form.
4. **Define and reference in pairs.** An action runs only where a
   workflow milestone references it, where a scheduled
   `loopActions` / `parallelActions` container lists it in its
   `actions`, or where a scheduled `DecisionAction` names it as its
   `escalateTo`. An action none of these reaches is still generated
   as a full callable action that nothing calls (so whatever it was
   meant to put on the context stays `undefined`); validation reports
   it as `WORKFLOW_ACTION_UNSCHEDULED` (WARNING, naming the action and
   the api), including on an api that declares no `workflow` block at
   all. A ref that resolves to no stored action is stripped on write
   and reported as an ERROR finding (`WORKFLOW_ACTION_NOT_FOUND`).
5. **Only the api's own crudType, only populated phases.** Omitted
   workflow sections are equivalent to empty; only a POPULATED
   non-matching crudType triggers `WORKFLOW_CRUDTYPE_MISMATCH`.
6. **Reference by NAME.** Action names are the canonical stored form
   of workflow refs; action ids are accepted on input only and
   resolve to the same action.
7. **No duplicate refs; loop members ride the loop.** Don't list the
   same action twice across milestones, and don't reference a loop's
   member actions in a milestone alongside the `loopActions` entry
   that already runs them.
8. **Merge to add, replace to prune.** A merge write adds and patches
   without deleting; to remove stale actions or refs, rewrite the api
   as a whole (a replacing write) instead of merging.

### Before and after

Don't scaffold every key (BEFORE, abbreviated; a full scaffold has 60
action arrays and all five crudTypes):

```json
"actions": {
  "fetchObjectActions": [],
  "fetchStatsActions": [],
  "fetchParentActions": [],
  "validationActions": [
    { "name": "checkDraft", "validationScript": { "js": "this.instance.status === 'draft'" }, "shouldBeTrue": true, "errorStatus": "409", "errorMessage": "Not a draft order.", "writeToResponse": false }
  ],
  "createCrudActions": [],
  "publishEventActions": [],
  "...54 more empty arrays...": []
},
"workflow": {
  "create": { "afterStartBusinessApi": [], "...": [] },
  "get":    { "afterStartBusinessApi": [], "...": [] },
  "list":   { "afterStartBusinessApi": [], "...": [] },
  "update": { "afterStartBusinessApi": [], "afterCheckInstance": ["checkDraft"], "...every other milestone...": [] },
  "delete": { "afterStartBusinessApi": [], "...": [] }
}
```

Write only what you populate (AFTER, the same api, canonical form):

```json
"actions": {
  "validationActions": [
    { "name": "checkDraft", "validationScript": { "js": "this.instance.status === 'draft'" }, "shouldBeTrue": true, "errorStatus": "409", "errorMessage": "Not a draft order.", "writeToResponse": false }
  ]
},
"workflow": {
  "update": { "afterCheckInstance": ["checkDraft"] }
}
```

Both persist identically. The sparse form is smaller, diff-friendly,
and can't drift out of sync with the schema. The same omit-when-unused
rule applies to the api's optional subobjects (`parameters`,
`controllers`, `query`): omit or `null` them when unused, and never
write `[]` for an object-typed subgroup (that is an
`INVALID_FIELD_TYPE`).

## The action store

[`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md) is
partitioned by action class: 45+ typed arrays, one per supported action
subtype. Examples:

| Group | Arrays |
|---|---|
| Data fetch | `fetchObjectActions`, `fetchParentActions`, `fetchStatsActions`, `searchObjectActions`, `fetchFromElasticActions`, `collateListsActions` |
| Logic / validation | `validationActions`, `permissionCheckActions`, `objectPermissionActions`, `membershipCheckActions`, `arrowFunctionActions`, `functionCallActions`, `listMapActions` |
| CRUD writes | `createCrudActions`, `updateCrudActions`, `deleteCrudActions`, `createBulkCrudActions`, `upsertBulkCrudActions`, `createObjectActions` |
| Tabular import / export | `fileToDataActions` (csv / tsv / xlsx / json / ndjson to typed rows), `upsertBulkCrudActions` (rows to insert-or-update), `dataToFileActions` in ROWS mode (rows to file) |
| External | `apiCallActions`, `interserviceCallActions`, `aiCallActions`, `agentCallActions`, `paymentActions`, `refundActions`, `subscriptionActions`, `payoutActions`, `verifyWebhookActions`, `integrationActions` |
| Context / response | `addToContextActions`, `addToResponseActions`, `removeFromResponseActions`, `renderDataActions`, `dataToFileActions`, `renderPdfActions`, `redirectActions` |
| Auth / identity | `readJwtTokenActions`, `createJWTTokenActions`, `signDataWithProjectKeyActions` |
| Messaging | `publishEventActions`, `sendMailActions`, `sendSmsActions`, `sendPushNotificationActions`, `sendWhatsAppActions`, `emitSseEventActions` |
| Storage | `readFromRedisActions`, `writeToRedisActions` |
| Composition | `loopActions`, `parallelActions`, `iteratorActions` |
| Commerce | `cartValidationActions`, `cartCheckoutActions`, `couponValidationActions` |

Each subtype carries its own typed fields. There is no generic
`parameters: {}` bag. The per-action pages in Part 2 list every field.

## Shared action fields

Every action class extends
[`BusinessApiAction`](../../spec/BusinessApiAction.md) and inherits
these knobs:

| Field | Notes |
|---|---|
| `name` (required) | Unique camelCase id within the API; also the name of the generated action. |
| `id` | Optional explicit id (rarely needed: workflow refs use the NAME; an id is accepted only as ref input). |
| `description` | Free-text, surfaced in generated code comments and docs. |
| `condition` (MScript) | If set, the action runs only when the expression is truthy. |
| `contextPropertyName` | Where the result lands on `this`. Leave `null` when the result isn't used downstream. |
| `writeToResponse` | Optional, default `false`. When `true`, the result attaches to the response under `contextPropertyName`. |
| `onActionError` | `throwError` (default: abort the API) or `completeApi` (catch, expose `this.<actionName>Error`, continue). |
| `emitProgressInSSEContext` | In SSE mode, emit a progress event before and after this action. |

## The workflow

`workflow` is keyed by `crudType`. Only the sub-flow matching the
API's crudType is populated; the others are ignored.

```json
"workflow": {
  "create":  { "afterMainCreateOperation": ["..."] },
  "get":     { "afterMainGetOperation":    ["..."] },
  "list":    { "afterMainListOperation":   ["..."] },
  "update":  { "afterMainUpdateOperation": ["..."] },
  "delete":  { "afterMainDeleteOperation": ["..."] }
}
```

Each milestone is an ordered array of action **names**. The service
walks the array in order; each action awaits the previous one.

## The milestones

Every kind walks the same pipeline skeleton; some milestones only run
for some kinds.

```mermaid
graph LR
  S[afterStartBusinessApi] --> A["login check, no milestone"]
  A --> P[afterReadParameters]
  P --> T[afterTransposeParameters]
  T --> CP[afterCheckParameters]
  CP --> BA[afterCheckBasicAuth]
  BA --> WC[afterBuildWhereClause]
  WC --> FI[afterFetchInstance]
  FI --> CI[afterCheckInstance]
  CI --> BD[afterBuildDataClause]
  BD --> MO["afterMain<Crud>Operation"]
  MO --> BO[afterBuildOutput]
  BO -.response sent.-> SR[afterSendResponse]
  SR --> AE[afterApiEvent]
```

`afterBuildWhereClause` runs for every crudType except `create`.
`afterFetchInstance` only runs for `update` and `delete`.
`afterCheckInstance` runs for `update`, `delete` and `get`: on an update
or a delete it follows the pre-write fetch, and on a `get` it runs once
the row has been read, after the main read and before
`afterMainGetOperation` (so a check placed there sees
`this.<objectName>`; a get that matched no row skips it).
`afterBuildDataClause` only runs for `create` and `update`.
`afterSendResponse` and `afterApiEvent` fire **after the HTTP response
has been sent**: their actions cannot affect the response, only
trigger side-effects.

### The post-response phase is success-only

The dotted `response sent` edge above is the **success** edge, and it is
the only way into `afterSendResponse`. When the pipeline aborts and the
api answers 4xx/5xx, the service skips the whole post-response tail
(`afterSendResponse`, the api event and `afterApiEvent`), so no action
authored there runs and no event is published. Events are domain facts:
a request that failed produced none. The skip is logged as a
`PostResponseSuppressedOnAbort` warning naming the withheld actions, so
it is visible rather than silent.

Two consequences for authoring:

- Work that must run **on failure** does not belong in
  `afterSendResponse` / `afterApiEvent`. Put it in the stage that owns
  the failure, or in a separate compensating api.
- A `publishEventAction` placed in `afterSendResponse` therefore
  announces only operations that actually happened. An explicitly
  completed missing-instance response (`onNotFound: complete`) is still
  a success branch: it answers 2xx and keeps `afterSendResponse`, while
  its api event stays suppressed because no CRUD operation took place.

The five kind-specific workflow pages enumerate the exact
milestones each sub-flow exposes:

- [`CreateBusinessWorkflow`](../../spec/CreateBusinessWorkflow.md)
- [`GetBusinessWorkflow`](../../spec/GetBusinessWorkflow.md)
- [`ListBusinessWorkflow`](../../spec/ListBusinessWorkflow.md)
- [`UpdateBusinessWorkflow`](../../spec/UpdateBusinessWorkflow.md)
- [`DeleteBusinessWorkflow`](../../spec/DeleteBusinessWorkflow.md)

Milestone **order is the diagram above**, not the key order of the
stored JSON. A workflow section is a map; the service walks the
pipeline and calls each milestone's array when its hook comes up.

## Ordering: what may read what

An action can only read a context value that has already been
**produced**. Two facts decide that, and both are why a mis-ordered
workflow cannot be fixed by shuffling keys:

1. **Between milestones**: the order is the fixed pipeline above.
   `afterMainUpdateOperation` can never run before
   `afterBuildDataClause`.
2. **Inside one milestone**: actions run in the **declaration order
   of that milestone's array**. There is **no dependency resolution**
   and no topological sort. A workflow write **merges additively**, and
   a replacing write replaces an array wholesale; it does **not
   reorder** one. To move a producer ahead of a consumer that is
   already listed before it, either rewrite the whole array with a
   replacing write, or move the producer to an **earlier milestone**.

Two clause slots are evaluated by the service itself, not by an
action, and both run **before** the milestone that shares their name:

| Slot | Evaluated at | May read |
|---|---|---|
| `query.whereClause` (`fullWhereClause`, `additionalClauses`) | where-clause build | everything produced up to and including `afterCheckBasicAuth` |
| `query.dataClauseItems[].value` | data-clause build | everything produced up to and including `afterCheckInstance` |

So a `dataClauseItems` entry reading a value produced at
`afterBuildDataClause` or later writes `undefined` on every request:
`afterBuildDataClause` fires *after* the clause has already been built.

Reading a value that is produced later is not a syntax error and does
not throw: it evaluates to `undefined`. In a `shouldBeTrue: false`
validation action (`if (result) throw`) `undefined` is falsy, so the
guard does **not** fire and the request is answered as though the check
had passed. The validator reports this as
`ACTION_CONTEXT_READ_BEFORE_PRODUCED`, an **error** for a
`validationActions` script and for a `dataClauseItems` value, a warning
for other slots, and names both the reading action and the producing
one. At runtime the generated guard additionally fails closed: an
`undefined` result throws instead of passing.

### Framework bindings are ordered too

Most `this.<X>` names the service binds (`this.session`,
`this.request`, `this.crudType`, the request-parameter mirrors, the
route segments) exist before any action runs, and reading one is never
an ordering question. Five do **not**: the service writes them part-way
through the pipeline, and reading one earlier yields `undefined` in
exactly the same silence.

| Binding | Written by | Available from |
|---|---|---|
| `this.result` | the main operation | `afterMainOperation` (`afterMain<Crud>Operation`) |
| `this.data`, `this.dbResult` | aliases of `this.result` | `afterMainOperation` |
| `this.<objectName>` on a **create** | the main operation | `afterMainCreateOperation` |
| `this.output` | the output build | `afterBuildOutput` |
| `this.instance` | the instance fetch, pipeline step 7 | `afterFetchInstance` |

The first four are reported as `ACTION_CONTEXT_READ_BEFORE_PRODUCED`
with the producing step named, at the same tiers as an action-produced
context. `this.instance` has its own rule,
`INSTANCE_READ_BEFORE_FETCH`; see
[the fetched row](workflow-context.md#the-fetched-row-thisinstance).

A framework step cannot be rescheduled, so the fix is always to move
the **reader** to the producing milestone or later. On a `get`, an
`update` or a `delete`, `this.<objectName>` is bound by the instance
fetch at step 7 rather than by the main operation, which is why only a
`create` is judged on that alias.

## Per-kind defaults

The crudType's pipeline ships with default behaviour wired in:
`create` runs the DB insert; `list` builds the WHERE from request
parameters and paginates; `update` fetches the instance and writes
the data clause. The author extends these defaults by attaching
actions to milestones; the core flow does not have to be redefined.
See [Business APIs](../business-apis/overview.md) for the per-kind
default pipeline.

## Action result properties

When an action declares a `contextPropertyName`, the service assigns
its result to `this.<contextPropertyName>` after the action runs.
Downstream actions and MScript snippets read it the same way:

```json
{ "name": "loadBuyer", "targetObject": "User", "matchValue": { "js": "this.order.buyerId" }, "localKey": "id", "contextPropertyName": "buyer", "writeToResponse": false }
```

```text
this.buyer.email   <- available after loadBuyer runs
```

When `contextPropertyName` is omitted, results are addressable by
the action's `name`. See [Workflow context](workflow-context.md).

## Composing flows

Actions inside a single milestone run **sequentially**. The service
does not auto-parallelise. For real fan-out, declare a
`parallelActions[]` entry that names other actions to run
concurrently, then reference that parallel action by its `name` in
the milestone array, sitting alongside any other action names at the
same milestone. A milestone array can contain regular actions, named
parallel actions, and named loop actions in any order; everything in
the array still runs in declared order, but each `parallelActions` /
`loopActions` entry runs its own children concurrently or iteratively
when its turn comes. See [Parallel and loops](parallel-and-loops.md)
and [Race conditions](race-conditions.md). For iteration use
`loopActions[]`. For failure paths see
[Error handling](error-handling.md).

### Which action goes at which milestone

Place each action at the first milestone where everything it reads
exists, and before anything that must not happen if it fails. The
milestone names below are the ones each crudType's workflow offers.

**Enrich on read (`get` / `list`).** Lookups that decorate the record
([`FetchParentAction`](../../spec/FetchParentAction.md),
[`FetchObjectAction`](../../spec/FetchObjectAction.md),
[`FetchStatsAction`](../../spec/FetchStatsAction.md),
[`CollateListsAction`](../../spec/CollateListsAction.md)) go at
`afterMainGetOperation` / `afterMainListOperation`, where the read row
or rows exist. Put the extra values into the answer with
`writeToResponse: true` on the lookup, or with an
[`AddToResponseAction`](../../spec/AddToResponseAction.md) at
`afterBuildOutput`. A check on the row a `get` read (membership in its
organization, a state rule) goes at `afterCheckInstance`, which runs
before `afterMainGetOperation`.

**Safe updates (`update`).** Input rules
([`ValidationAction`](../../spec/ValidationAction.md) on parameters) go
at `afterCheckParameters`; a role or permission check
([`PermissionCheckAction`](../../spec/PermissionCheckAction.md)) at
`afterCheckBasicAuth`; checks on the stored row
([`MembershipCheckAction`](../../spec/MembershipCheckAction.md),
[`ObjectPermissionCheckAction`](../../spec/ObjectPermissionCheckAction.md),
a state `ValidationAction` reading `this.instance`) at
`afterFetchInstance` or `afterCheckInstance`, the first milestones where
`this.instance` is loaded. Changes to other rows
([`UpdateCrudAction`](../../spec/UpdateCrudAction.md) on children) and
[`PublishEventAction`](../../spec/PublishEventAction.md) go at
`afterMainUpdateOperation`, after the write succeeded.

**Eventful creates (`create`).** Validate the input at
`afterCheckParameters` (a `FetchParentAction` can run there too, reading
the parent key from the request parameter). Everything that needs the
new row (`PublishEventAction`,
[`InterserviceCallAction`](../../spec/InterserviceCallAction.md),
child [`CreateCrudAction`](../../spec/CreateCrudAction.md) /
[`CreateBulkCrudAction`](../../spec/CreateBulkCrudAction.md)) goes
at `afterMainCreateOperation`, where `this.<objectName>` is the created
row. On an object with a duplicate-policy unique index, gate those with
`condition: "this.createOutcome === 'created'"` (see
[Workflow context](workflow-context.md#what-the-create-actually-did-thiscreateoutcome)).

**Delete cleanup (`delete`).** Ownership and state checks go at
`afterCheckInstance`. Child rows are removed by the relation's
`onDeleteAction` cascade (see
[On-delete cascades](../data-modeling/relations.md#on-delete-cascades)),
not by hand-written `DeleteCrudAction`s. Side effects that announce the
delete or clean up elsewhere (`PublishEventAction`, an
`InterserviceCallAction`) go at `afterMainDeleteOperation`.

On every kind, work that must not delay or fail the response (logging,
analytics, a follow-up job) goes at `afterSendResponse`, which runs only
when the request succeeded.

## Worked example

```json
{
  "basics": { "apiOptions": { "name": "publishOrder", "crudType": "update", "dataObjectName": "Order" } },
  "parameters": {
    "requestParameters": [
      { "name": "orderId", "type": "ID", "httpLocation": "urlpath", "required": true }
    ]
  },
  "actions": {
    "validationActions": [
      { "name": "checkDraft", "description": "Order must be draft.", "validationScript": { "js": "this.instance.status === 'draft'" }, "shouldBeTrue": true, "errorStatus": "409", "errorMessage": "Not a draft order.", "writeToResponse": false }
    ],
    "fetchObjectActions": [
      { "name": "loadBuyer", "targetObject": "User", "matchValue": { "js": "this.instance.buyerId" }, "localKey": "id", "isRequired": true, "contextPropertyName": "buyer", "writeToResponse": false }
    ],
    "publishEventActions": [
      { "name": "fireEvent", "topic": "orders.published", "message": { "js": "{ orderId: this.instance.id, buyerId: this.buyer.id }" }, "writeToResponse": false }
    ]
  },
  "workflow": {
    "update": {
      "afterCheckInstance":       ["checkDraft", "loadBuyer"],
      "afterMainUpdateOperation": ["fireEvent"]
    }
  }
}
```

After the service resolves the `:orderId` path param and fetches the
order into `this.instance`, the workflow runs `checkDraft` (rejects
with 409 if not in draft state), then `loadBuyer` (loads the buyer
into `this.buyer`), then performs the DB update, then publishes the
event.

## See also

- [Workflow context](workflow-context.md),
  [Parallel and loops](parallel-and-loops.md),
  [Race conditions](race-conditions.md),
  [Error handling](error-handling.md)
- [Business APIs overview](../business-apis/overview.md)
- Recipes: [MScript cookbook](../mscript/cookbook.md),
  [Best practices: action composition](../best-practices/action-composition.md)
- Specification: [`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md),
  [`BusinessApiAction`](../../spec/BusinessApiAction.md),
  [`BusinessWorkflow`](../../spec/BusinessWorkflow.md).
