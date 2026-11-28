---
title: BusinessApi overview
---

# BusinessApi overview

A `BusinessApi` is the top-level request unit in a service: it
ties a route, an auth policy, the request shape, the data clauses, the
action store, and the workflow into a single declarative object.

**OpenAPPL has an explicit API model: nothing is auto-generated.**
Every operation a service exposes is declared by hand as one
`BusinessApi` under `services[*].businessLogic[]` (or under
`authentication.businessLogic[]` when the auth service exposes them).
A blueprint that starts with `businessLogic: []` produces **zero**
routes: no API exists for a data object until you declare it. There
is no "default vs custom" distinction: every API is author-defined.

A "CRUD API" is simply a `BusinessApi` you author with one of the five
standard crudTypes (`create` / `get` / `list` / `update` / `delete`).
The compiler supplies the standard lifecycle *pipeline* for that
crudType (fetch, where-clause, data-clause, persist, event) so you
write very little, but you still declare the entry. A "verb API" like
`publishOrder` is the same pattern with a non-default
`apiOptions.name`; it picks the closest crudType (usually `update`) and
carries its logic in actions. See the per-crudType deep dives:
[Create API](create-api.md) · [Get API](get-api.md) ·
[List API](list-api.md) · [Update API](update-api.md) ·
[Delete API](delete-api.md).

## Anatomy

The pattern is partitioned into six chapters, each a typed concern:

```json
{
  "basics":      { "apiOptions": "...", "authOptions": "..." },
  "parameters":  { "requestParameters": [], "redisParameters": [] },
  "controllers": { "restSettings": "...", "kafkaSettings": "...", "sseSettings": "...", "cronSettings": "...", "grpcSettings": "..." },
  "query":       { "selectClause": "...", "whereClause": "...", "dataClauseItems": [], "getOptions": "...", "listOptions": "...", "paginationOptions": "...", "deleteOptions": "..." },
  "actions":     { "fetchObjectActions": [], "validationActions": [], "...": "..." },
  "workflow":    { "create": "...", "update": "...", "get": "...", "list": "...", "delete": "..." }
}
```

This map shows every chapter for orientation. When authoring, only
`basics` is required. Send the chapters, arrays, and workflow sections
you actually populate; omitted arrays normalize to `[]` and omitted
optional subobjects to `null` (never send `[]` for an
object-typed subgroup). See the
[authoring canon](../workflow/overview.md#authoring-actions-and-workflow).

| Chapter | Purpose |
|---|---|
| `basics` | Identity (`apiOptions`) and auth gate (`authOptions`). |
| `parameters` | Request inputs: every `name` lands on the runtime context as `this.<name>`. |
| `controllers` | Transport bindings: enable REST, gRPC, Kafka, SSE, cron independently. |
| `query` | Data-side declarative shape: select / where / data / list / pagination clauses. |
| `actions` | The typed action store. See [Actions & workflow](../workflow/overview.md). |
| `workflow` | Ordered action names at fixed lifecycle milestones, keyed by crudType (action ids are also accepted on input). |

The smallest valid BusinessApi is just a `basics.apiOptions` block plus
a transport flag:

```json
{
  "basics":      { "apiOptions": { "name": "getOrder", "crudType": "get", "dataObjectName": "Order" } },
  "controllers": { "restSettings": { "hasRestController": true } }
}
```

That declares `GET /orders/:orderId`. The route exists because you
declared the entry, not because `Order` exists.

## crudType drives field applicability

`basics.apiOptions.crudType` is one of `create`, `get`, `list`,
`update`, `delete`. There is no `custom` crudType: every business API
declares one of the five. The crudType decides which `query` sub-blocks
apply:

| Block | create | get | list | update | delete |
|---|:-:|:-:|:-:|:-:|:-:|
| `apiOptions`, `authOptions` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `requestParameters`, `redisParameters` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `dataClauseItems` | ✓ | — | — | ✓ | — |
| `selectClause` | answer [1] | ✓ | ✓ | answer [1] | answer [1] |
| `whereClause` | — | ✓ | ✓ | ✓ | ✓ |
| `getOptions` | — | ✓ | — | — | — |
| `listOptions`, `paginationOptions` | — | — | ✓ | — | — |
| `deleteOptions` | — | — | — | — | ✓ |
| `actions`, `workflow` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `*Settings` (REST / gRPC / Kafka / SSE / cron) | ✓ | ✓ | ✓ | ✓ | ✓ |

[1] On a write only `selectClause.selectProperties` is read, and only as the
boundary of the answer (declared + `id`); the write itself is never
projected ([Response shape](response-shape.md#write-answers-and-selectproperties)).
A `selectJoins` entry on a write is ignored.

Populating a block on the wrong crudType is a design-time mistake: the
compiler drops the config and the validator emits a
`BUSINESSAPI_BLOCK_IGNORED` warning. See [`BusinessApi`](../../spec/BusinessApi.md)
for the full applicability table. Each crudType has its own page with a
sequence diagram and a milestone list:
[Create](create-api.md), [Get](get-api.md), [List](list-api.md),
[Update](update-api.md), [Delete](delete-api.md).

## `basics`

```json
"basics": {
  "apiOptions": {
    "name":           "publishOrder",
    "crudType":       "update",
    "dataObjectName": "Order",
    "apiDescription": "Mark the order as published."
  },
  "authOptions": {
    "loginRequired": true,
    "checkRoles":    ["seller"]
  }
}
```

`authOptions` covers session-required, role allow-lists, ownership
checks, and tenant scope. Finer-grained checks belong in the action
store via `permissionCheckActions`, `objectPermissionActions`, or
`membershipCheckActions`. See [`ApiAuthOptions`](../../spec/ApiAuthOptions.md)
and the [Authentication](../system-services/authentication/overview.md) section.

### Machine-only APIs

A route segment exactly equal to `m2m` or `machine` (case-insensitive), or an
API name ending in `ForMachine`, declares machine intent. Validation reports
`MACHINE_ROUTE_OPEN_TO_USERS` as an error when that API is human-reachable,
has `requiredCallerKind: "any"` (the default), and has no runnable authorization
gate. This applies to private/protected reads and to mutations of public
objects. The message names the route and whether any logged-in user or
anonymous callers can reach it. Use

```json
"authOptions": { "requiredCallerKind": "machine", "M2MAllowed": true }
```

for a machine-only API, or require login and put the intended defined roles
in `checkRoles` for a human role gate. `M2MAllowed` alone admits machine callers
without restricting human callers; `absoluteRoles` is a bypass, not a gate.
The error holds for an API written long ago exactly as for a new one.

The rule shares its gate detection with `ABSOLUTE_ROLES_WITHOUT_GATE`: role
checks, emitted permission checks, enforceable ownership, 401/403 validation
actions, live membership checks, session-scoped WHERE clauses, list membership
filters, and valid supported parent-ownership checks. A gate on
`loginRequired: false` does not count. Public-object get/list reads,
JobStream-hidden targets, injected framework APIs, and APIs without REST or
another human-facing non-Kafka transport are exempt. The segments
`internal` and `system` do not declare machine intent. Machine callers and
their tokens are described in [M2M](../system-services/authentication/m2m.md).

### Name → route / event / constant generation

The API name is more than a label: `apiOptions.name`, `crudType`, and
`dataObjectName` together drive three generated naming surfaces:

- **REST route**: when `restSettings.routePath` is left at `$default`,
  the route derives from the name + crudType + object. Default-shape
  verb-noun names collapse onto the pluralized object
  (`createOrder` → `POST /orders`, `getOrder` →
  `GET /orders/:orderId`, `listOrders` → `GET /orders`). A non-default
  verb concatenates verb + singular object (`publishOrder` →
  `/publishorder`); set `routePath` explicitly for a cleaner path like
  `/orders/:orderId/publish`. The `selectBy` field on `whereClause`
  chooses the URL parameter (`:orderId` by default, or `:<field>` when
  you select by something else). See
  [`ApiRestSettings`](../../spec/ApiRestSettings.md) for the full
  route calculator.
- **Event names**: see "Events" below; the API event verb is the
  passive form of the operation derived from the name + crudType.
- **Generated identifiers**: the per-API manager (see
  [ApiManager](api-manager.md)), the route constant, the typed
  request/response interfaces. Use camelCase and start with a verb so the
  generated identifiers read naturally.

[`ApiOptions`](../../spec/ApiOptions.md) carries the rest of the
identity / behaviour knobs:

- `apiDescription`: one-paragraph business-purpose summary. Surfaced
  in generated API documentation and consumed **verbatim** by AI agents
  through the service's tool registry; write it as if a stranger
  needed to decide whether to call this API.
- `frontendDocument`: UX prompt for frontend generators (markdown
  preferred). Describe what the screen behind this API should look
  like, not the request shape.
- `testingNotes`: markdown happy-path test instructions read verbatim
  by test-plan generators.
- `raiseApiEvent`: when true, the runtime emits a Kafka API event
  after the response. Default `false` for every crud type: an api that
  omits the field publishes no route event and declares no route topic,
  so set it to `true` explicitly on every api a consumer listens to. See
  "Events" below.
- `raiseDbLevelEvents`: retired, has no effect; leave it unset.
  DB-level events are published for every create, update and delete of
  a data object unless the OBJECT turns them off with
  `objectSettings.basicSettings.publishDbEvents: false`. See
  "Events" below.
- `dataViewName`: overlays the read path with a BFF DataView's
  Elasticsearch index (get / list only). See "Reading from a DataView"
  below.
- `blockMcp` / `isDefaultApi`: keeps the API out of the MCP tool
  registry, and the "default API for this crudType" flag. See
  "MCP exposure" and "`isDefaultApi`" below.

### `isDefaultApi` is just a property

`isDefaultApi` does **not** generate or imply any API: it is a plain
flag that marks one of *your declared* APIs as the canonical one for
its crudType. The generated API documentation labels it **Default**
and tells frontend generators and AI agents to use it rather than a
custom variant, and an agent layer that exposes an object's standard
CRUD tool routes it through this API (for example `updateDepartment` over
`retireDepartment`). It is not a powerful distinction: declare your
APIs and set `isDefaultApi` on at most one per crudType.

## `parameters`

```json
"parameters": {
  "requestParameters": [
    { "name": "orderId", "type": "ID",     "httpLocation": "urlpath", "required": true },
    { "name": "reason",  "type": "String", "httpLocation": "body",    "required": false }
  ],
  "redisParameters": [
    { "name": "tenantConfig", "type": "Object", "redisKey": { "js": "'tenant:' + this.session.workspaceId" }, "required": false }
  ]
}
```

Each `requestParameter` entry's `name` becomes `this.<name>` on the
runtime context before workflow execution. A
[`BusinessApiParameter`](../../spec/BusinessApiParameter.md) carries
`name`, `type` (the `DataTypes` enum), `required`, `httpLocation`,
optional `defaultValue`, `transform` (an MScript applied at read time),
`isArray`, `enumOptions`, `hidden`, and `description`. `httpLocation` is
one of `query`, `body`, `urlpath`, `header`, `cookie`, `bearer`,
`session`, `request`. It is REQUIRED and has no schema default: leaving
it out is reported as `REQUIRED_FIELD_MISSING`. Where a location still
has to be resolved for a parameter that never passed validation (an
imported blueprint, a partial subtree write), the fallback is METHOD-AWARE:
an api whose effective HTTP method is `GET` or `DELETE` binds from the
query string, every other method from the body. Declaring `body` on a
`GET` or `DELETE` is refused (`BODY_PARAM_ON_BODYLESS_METHOD`): no
caller can attach a body to those methods, so the parameter would read
`undefined` on every call. URL placeholders in
`restSettings.routePath` (e.g. `:teamId`) auto-promote into this list
with `httpLocation: 'urlpath'` if not declared explicitly: the built
api rebinds any parameter whose NAME matches a `:segment`, reported as
an autoFix (`REQUEST_PARAM_REBOUND_TO_URLPATH`), so give such a
parameter no `dataPath` or a `dataPath` equal to the segment name.
A route segment is read, not applied: on a `get`, `list`, `update` or
`delete` api a segment that names a property of the api's data object
(`/projects/:projectId/phases` on `phase.projectId`), whether declared
as a parameter or only present in the route, must be bound (in
`query.whereClause.selectBy` or as `this.projectId` in the where
clause) or the api answers rows of every `projectId`.
Validation reports such a segment that nothing reads as the error
`ROUTE_PARAM_FIELD_UNBOUND`; declare it as a parameter with
`httpLocation: 'urlpath'` and `contractOnly: true` only when the api must
deliberately not filter on it.

`isArray: true` is enforced at the request boundary. A single
`?tags=a` query value (and a single header value) is read as the
one-element list `["a"]`, because those transports cannot tell one
value from a one-element list. A JSON body, gRPC, Kafka, MCP, cron or
internal-call value CAN say `["a"]`, so a scalar sent there for an
array parameter is refused with `400` and `errorCode:
INVALID_PARAMETER_TYPE` ("Parameter 'tags' must be an array."), on
every database, MongoDB included. An absent optional array parameter is
legal.

Declared `Integer`, `Short`, `Float`, `Double` and `Decimal` query/header
parameters are converted to finite numbers before validation or workflow
expressions run. For example, `minLng=-74.05&maxLng=-73.9`
compares numerically. Invalid or empty numeric text returns `400` with a
sentence naming the parameter. `Boolean` query/header values accept `true`
and `false`; other text returns `400`. For `isArray: true`, conversion
applies to each element after the single-value array lift. Missing and
null values stay missing/null. Body parameters and non-REST readers keep
their JSON types.

`redisParameters` reads a value from Redis on every request using an
MScript expression as the key and writes the result onto the context
the same way: for per-tenant config, session caches, or rate-limit
counters. See [`RedisApiParameter`](../../spec/RedisApiParameter.md).

## `controllers`: the five transports

Each transport is independent: enable as many as you want by setting
the corresponding `has*Controller` flag. The same `BusinessApi` can
carry REST + gRPC + Kafka + SSE + cron simultaneously; one handler,
several entry points, no shape drift, because all of them route into
the same typed action store + workflow.

```json
"controllers": {
  "restSettings":  { "hasRestController": true, "routePath": "/orders/:orderId/publish" },
  "grpcSettings":  { "hasGrpcController": true, "responseType": "single" },
  "kafkaSettings": { "hasKafkaController": true, "requestTopicName": "orders.publish.requested" },
  "sseSettings":   { "hasSseController": true,  "responseMode": "stream", "chunkSize": 100 },
  "cronSettings":  { "hasCronController": true, "cronExpression": "0 3 * * *" }
}
```

| Transport | Flag | When | Page |
|---|---|---|---|
| **REST** | `restSettings.hasRestController` | Browser-facing, partner integrations, anywhere HTTP semantics matter. The default; route auto-derives from the name when `routePath` is `$default`. | [`ApiRestSettings`](../../spec/ApiRestSettings.md) |
| **gRPC** | `grpcSettings.hasGrpcController` | Hot-path internal traffic, contract-typed clients, streaming responses. | [gRPC controllers](grpc-controllers.md) |
| **Kafka** | `kafkaSettings.hasKafkaController` | Fire-and-forget, fan-out, eventual processing: the API runs when a message lands on `requestTopicName`. | [Kafka controllers](kafka-controllers.md) |
| **SSE** | `sseSettings.hasSseController` | Streaming a response over one open HTTP connection (LLM tokens, long progress, large exports). | [SSE streaming](sse-streaming.md) |
| **cron** | `cronSettings.hasCronController` | Scheduled sweeps: the API runs on a cron tick, no client. | [Cron controllers](cron-jobs.md) |

Per-transport specification:
[`ApiRestSettings`](../../spec/ApiRestSettings.md),
[`ApiGrpcSettings`](../../spec/ApiGrpcSettings.md),
[`ApiKafkaSettings`](../../spec/ApiKafkaSettings.md),
[`ApiSseSettings`](../../spec/ApiSseSettings.md),
[`ApiCronSettings`](../../spec/ApiCronSettings.md).

### MCP exposure

Every API with a REST controller is **published as a tool** to external
AI agents unless it opts out. Each service serves its tool registry at
`GET /tools` (name, JSON-schema inputs, and the REST method and path to
call); an MCP gateway reads it, projects each entry into an MCP tool, and
calls the API over its normal REST route with the caller's own
credentials, so the route's auth applies. The agent consumes
`apiOptions.apiDescription` verbatim as the tool's description.

- `blockMcp: true` on [`ApiOptions`](../../spec/ApiOptions.md) keeps
  the API out of the registry: use it for flows an agent must not drive
  (card entry, 3-D Secure).
- `mcpExposed` does not change what is published: no opt-in is needed.

See [MCP-BFF](../system-services/mcpbff.md) and
[Application MCP](../system-services/application-mcp.md). Write the
`apiDescription` as agent-facing documentation: state the
business purpose, the inputs, and when to call it.

## `query`

The data-side declarative shape. Which sub-blocks apply depends on the
crudType (see the table above); each is covered in depth on its
crudType page:

- `selectClause`: projection (and joins) for read APIs (`get` /
  `list`). See [Get API](get-api.md) and [List API](list-api.md), plus
  [`SelectClauseSettings`](../../spec/SelectClauseSettings.md). On a
  `create` / `update` / `delete`, `selectProperties` bounds the answer
  (declared + `id`) without projecting the write.
- `whereClause`: locator for record-targeted APIs (`get`, `update`,
  `delete`) and base scope filter for `list`. `update` and `delete`
  resolve to a single record via the fetched instance's `id` for
  safety, regardless of WHERE breadth. The full clause vocabulary lives
  on [List API](list-api.md#whereclause-locator-and-base-filter); see
  also [`WhereClauseSettings`](../../spec/WhereClauseSettings.md).
- `dataClauseItems`: write payload for `create` / `update`. Each entry
  is a [`DataMapItem`](../../spec/DataMapItem.md) mapping a property
  name to a value (MScript or literal). Properties bound by
  `sessionSettings` or `staticJoin` on the data object are
  auto-injected at write time and must **not** appear here. Common
  value shapes:

  | Shape | `value` MScript | Use when |
  |---|---|---|
  | Caller-supplied | `"this.<paramName>"` | The value comes from a `requestParameter`. |
  | Forced literal | `"'archived'"` | A constant the API always writes (note the inner quotes: `value` is an MScript expression, so string literals quote themselves). |
  | Caller with fallback | `"this.<paramName> ?? 'draft'"` | Use the caller's value if present, otherwise a default. |
  | Computed | `"LIB.calc(this.X, this.Y)"` | Derived from the live context via a service-library function. |
  | Joined context reference | `"this.<staticJoinName>.id"` | Pull a value from a `staticJoin`-resolved object on the context. |

  See [Create API](create-api.md) and [Update API](update-api.md) for
  the dataClause in context.

- `getOptions`, `listOptions`, `paginationOptions`, `deleteOptions`:
  per-crudType knobs (cache, runtime filters, joint / membership /
  permission / search filters, pagination, soft- vs hard-delete). See
  [Get API](get-api.md), [List API](list-api.md), and
  [Delete API](delete-api.md).

## Reading from a DataView

Setting `apiOptions.dataViewName` overlays a **read** API with a BFF
DataView's Elasticsearch index instead of the DB. This is how a normal
service consumes a BFF DataView's projection (DataViews live in normal
services; the bffService config injects them).

⚠️ **Only `get` and `list` read from the DataView.** The compiler wires
the DataView source exclusively for those two crudTypes. For `create`,
`update`, and `delete`, `dataViewName` has no effect: those operations
always run against the DB. `dataObjectName` is always required, and the
referenced DataView's `mainObject` must match it.

```json
"apiOptions": {
  "name":           "listOrders",
  "crudType":       "list",
  "dataObjectName": "Order",
  "dataViewName":   "orderSummary"
}
```

| crudType | Source for the response | DB touched? |
|---|---|---|
| `get` | DataView ES index: lookup by document `_id`, with the compiled where clause travelling as the read's `filter`. | No. |
| `list` | DataView ES index: the where-clause query is compiled to the Elasticsearch query DSL; runtime filters AND in. | No. |
| `create` / `update` / `delete` | `dataViewName` is ignored: the operation runs against the DB. | Yes. |

The where-clause builder produces both DB and Elastic queries
from the same declaration, so tenant / ownership filters are respected
identically in DataView mode, on **both** read shapes: the `get` applies
its clause beside the id address rather than addressing by id alone, so a
document the clause excludes answers 404. A condition on a column the
view's projection does not carry matches nothing, so a view narrower than
the clause fails closed.

One control does **not** cross over: `query.selectClause.selectProperties`
is lowered onto the query on the database engines only, and the
Elasticsearch read helpers take no column list. Declaring it beside
`dataViewName` is reported at design time
(`DATAVIEW_SELECT_PROPERTIES_INERT`); the projection boundary for
view-backed data is the view's own `viewBasics.properties`, applied when
the document is written. See [BFF](../system-services/bff.md) for
the DataView join model and indexer, and
[Get API](get-api.md) / [List API](list-api.md) for the read paths.

## `actions`: the typed store

`actions` is **not** a flat array. It's a registry partitioned by
action type: one typed array per action class. Every typed key
(`fetchObjectActions`, `validationActions`, ...) holds an array of one
specific action subtype (e.g. `fetchObjectActions: [FetchObjectAction]`
in the schema). The mapping from typed key to action subtype is
one-to-one: adding an entry to the wrong array is a design-time
validation error.

```json
"actions": {
  "fetchObjectActions":     [ "..." ],
  "validationActions":      [ "..." ],
  "permissionCheckActions": [ "..." ],
  "updateCrudActions":      [ "..." ],
  "addToResponseActions":   [ "..." ],
  "publishEventActions":    [ "..." ]
}
```

There are 40+ typed arrays; see [`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md)
for the full catalogue. Each subtype carries its own typed fields
(there is no generic `parameters: {}` bag). Every action extends
[`BusinessApiAction`](../../spec/BusinessApiAction.md), which adds
shared knobs: `name`, `condition` (MScript gate), `contextPropertyName`
(where the result lands on `this`), `writeToResponse` (optional,
default `false`; set `true` only to include the result in the
response), `onActionError` (`throwError` default / `completeApi`), and
`emitProgressInSSEContext`. `updateCrudActions` and `deleteCrudActions`
additionally take `onNoRows` (`ignore` default / `throwError`): a
selector that matched no row resolves an empty array and is NOT an error
unless the action opts in, so `onActionError: completeApi` alone cannot
observe an empty match (see [`UpdateCrudAction`](../../spec/UpdateCrudAction.md)).
The deep action / workflow semantics live in
the [Actions & workflow](../workflow/overview.md) section.

## `workflow`: lifecycle milestones

`workflow` references action **names** at fixed lifecycle stages. Only
the sub-flow matching the API's `crudType` is populated:

```json
"workflow": {
  "update": {
    "afterReadParameters":   ["normalizeReason"],
    "afterCheckParameters":  ["validateState"],
    "afterFetchInstance":    ["loadSeller"],
    "afterBuildDataClause":  ["stampPublishedAt"],
    "afterMainUpdateOperation": ["publishEvent"]
  }
}
```

Each milestone is an ordered array of action names. Actions declared
in the store but not referenced from the workflow do not run: they
are available for definition but not wired in. The five sub-flows
(`create`, `get`, `list`, `update`, `delete`) populate slightly
different milestone sets; each crudType page lists its milestones, and
the [`CreateBusinessWorkflow`](../../spec/CreateBusinessWorkflow.md)
and sibling schema patterns carry the exact list.

## Request lifecycle

The per-API manager (see [ApiManager](api-manager.md)) drives a fixed
pipeline; the milestones you populate in `workflow.<crudType>` map
one-to-one onto its `after*` hook points.

```mermaid
sequenceDiagram
  participant C as Client
  participant R as Route / controller
  participant M as ApiManager
  participant DB as DB / external

  C->>R: HTTP / gRPC / Kafka / SSE / cron tick
  R->>M: new <Api>Manager(request, transport)
  M->>M: 0. afterStartBusinessApi
  M->>M: 1. checkValidLogin → afterCheckValidLogin
  M->>M: 2. readParameters (+ Redis) → afterReadParameters
  M->>M: 3. transformParameters → afterTransposeParameters
  M->>M: 4. checkParameters → afterCheckParameters
  M->>M: 5. checkBasicAuth → afterCheckBasicAuth
  M->>M: 5e. checkApprovalRequired (requireApproval; create / list / plain get)
  M->>M: 6. buildWhereClause → afterBuildWhereClause
  M->>DB: 7. fetchInstance (update / delete) → afterFetchInstance
  M->>M: 8. checkInstance → afterCheckInstance
  M->>M: 8c. checkApprovalRequired (requireApproval; update / delete)
  M->>M: 9. buildDataClause → afterBuildDataClause
  M->>M: 9b. moderation seam (objectModeration; create / update)
  M->>DB: 10. mainOperation
  M->>M: 11. afterMain<Crud>Operation
  M->>M: 12. buildOutput → afterBuildOutput
  M-->>R: ApiOutput
  R-->>C: HTTP response / Kafka ack / stream
  M->>M: 13. afterSendResponse → raiseEvent → afterApiEvent
```

Steps 6–8 only run for non-create kinds (a WHERE locator). Steps 7–8
only run for `update` / `delete`. Step 9 only runs for `create` /
`update`. Steps 5e / 8c are the step-up approval milestone of an api
declaring `authOptions.requireApproval` (one of the two, by crud type): after
every authorization check, before the first stage that may write; see
[Business API auth](../system-services/authentication/business-api-auth.md#step-up-approval-requireapproval). Step 9b runs only on a create / update of an object with
`objectModeration`: the verdict is taken there, after every check ran
against the author, and a held `staged` write ends the request with `202`
`{ moderation }` before step 10; see
[Object content moderation](../capabilities/object-moderation.md#the-decision). Step 13 runs after the response has already been sent: its
errors are logged but never propagated. For how each step becomes a
method on the generated manager, see [ApiManager](api-manager.md).

## Events

When `apiOptions.raiseApiEvent` is true, the runtime publishes a
Kafka **API event** after the response is sent. The default is `false`
for every crud type: an api that omits the field publishes nothing, and
one that sets `true` explicitly publishes the event. A get or list event
carries the whole result (a list event the whole page), so turn reads on
only when something consumes them. Event verbs use passive
forms: `created`, `updated`, `deleted` for default verbs; `got` is
rewritten to `retrieved`, `list` to `listed`. A non-default verb API
publishes under its own passive name. The topic string follows the
project convention
`<projectCodeName>-<serviceName>-service-<resource>-<verb>`; the
compiler derives it from one shared naming rule, so
publishers and subscribers can't drift.

To publish your own events from inside the workflow, use a
`publishEventActions` entry ([`PublishEventAction`](../../spec/PublishEventAction.md))
rather than relying on the automatic API event.

Independently of the API event, every create, update and delete the
service makes on a data object publishes a **DB-level event** on
`<serviceCodename>-dbevent-<object>-<created|updated|deleted>` (object
name lowercased; the row under `data`, and on an update the previous
row under `old`). They are published by default: BFF DataViews,
realtime hubs, subscriptions and notifications depend on them, and the
api-level `apiOptions.raiseDbLevelEvents` has no effect. An object
nothing consumes (an internal log table) turns them off, together with
its elastic-index copies, with `objectSettings.basicSettings.publishDbEvents: false`;
its Elasticsearch index is still written, and validation refuses
the switch on an object something consumes (`DB_EVENTS_SWITCH_CONSUMED`).
Stored DataViews count as consumers (main object, aggregate or stat source);
dynamic DataViews permit the switch and keep reading the source data.
A project consumer of an API's derived route topic, with or without the
project codename prefix, requires
`apiOptions.raiseApiEvent: true`; false or omitted reports
`KAFKA_TOPIC_API_EVENT_DISABLED`, naming the service and API to switch on.
For topic-string conventions, see
[Kafka topic naming](../best-practices/kafka-topic-naming.md).

## Edge controllers: when BusinessApi isn't enough

The `BusinessApi` is the primary path for everything. For the rare
edge case that doesn't fit its shape at all (a webhook needing total
request control, a streaming sync job, a bespoke report endpoint) the
service-level `edgeControllers[]` is the **super-flexible manual escape
hatch**: an [`EdgeController`](../../spec/EdgeController.md) routes a raw
request to a named edge function you write, outside the action workflow.

```json
{
  "edgeControllers": [
    {
      "edgeControllerOptions": { "functionName": "paymentWebhook" },
      "edgeRestSettings": { "restEnabled": true, "method": "POST", "path": "/payment-webhook" }
    }
  ]
}
```

Use this only when the declarative BusinessApi genuinely can't express
the operation: it trades the declared auth / validation / event
pipeline for full control. The edge function signature, persistence rules
and the REST / Kafka / cron edge settings are specified on
[`EdgeController`](../../spec/EdgeController.md).

## Worked example: `publishOrder`

A non-default verb API: same six chapters, `crudType: "update"`, custom
`name` and route.

```json
{
  "basics": {
    "apiOptions": {
      "name":           "publishOrder",
      "crudType":       "update",
      "dataObjectName": "Order",
      "apiDescription": "Mark the order as published and notify the buyer."
    },
    "authOptions": { "loginRequired": true, "checkRoles": ["seller"] }
  },
  "parameters": {
    "requestParameters": [
      { "name": "orderId", "type": "ID",     "httpLocation": "urlpath", "required": true },
      { "name": "reason",  "type": "String", "httpLocation": "body",    "required": false }
    ]
  },
  "controllers": {
    "restSettings": { "hasRestController": true, "routePath": "/orders/:orderId/publish" }
  },
  "query": {
    "whereClause":     { "selectBy": ["id"] },
    "dataClauseItems": [
      { "name": "status",      "value": { "js": "'published'" } },
      { "name": "publishedAt", "value": { "js": "new Date()" } }
    ]
  },
  "actions": {
    "validationActions": [
      {
        "name":             "checkDraft",
        "description":      "Order must be in draft state.",
        "validationScript": { "js": "this.instance.status === 'draft'" },
        "shouldBeTrue":     true,
        "checkType":        "liveCheck",
        "errorMessage":     "Only draft orders can be published.",
        "errorStatus":      "409"
      }
    ],
    "fetchObjectActions": [
      {
        "name":           "loadBuyer",
        "targetObject":   "User",
        "matchValue":     { "js": "this.instance.buyerId" },
        "localKey":       "id",
        "isRequired":     true,
        "contextPropertyName": "buyer"
      }
    ],
    "publishEventActions": [
      {
        "name":    "fireEvent",
        "topic":   "orders.published",
        "message": { "js": "{ orderId: this.instance.id, buyerId: this.buyer.id }" }
      }
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

The `update` pipeline handles the WHERE locator, the fetch, the
data-clause assembly, and the DB write. The `checkDraft` validation
runs after the instance has been fetched (so `this.instance.status` is
populated) and rejects with HTTP 409 if the state is wrong. The
`loadBuyer` fetch enriches the context. `fireEvent` publishes a Kafka
event after the DB update succeeds.

## Explicit-mode cheat-sheet

What to declare where, in the explicit model:

- **A caller-supplied value** → a `requestParameters` entry. It lands on
  `this.<name>`.
- **A value the API always writes** → a `dataClauseItems` entry with a
  literal `value` MScript (`"'published'"`). Not a parameter.
- **A value derived from session / staticJoin** → declare it on the
  *data object* (`sessionSettings` / `staticJoin`); it auto-injects at
  write time. Do **not** add it to `dataClauseItems` or
  `requestParameters`.
- **A business rule** → a `validationActions` entry wired into the
  matching workflow milestone, not application code in an edge function.
- **A cross-object read** → a `fetchObjectActions` entry, not a manual
  DB call.

Anti-patterns: a "god API" with a `mode` switch (split into separate
APIs); putting a session-bound value in `requestParameters` (a caller
could spoof it; use `sessionSettings`); reaching for an edge controller
when a BusinessApi + actions would do.

## See also

- Per-crudType: [Create](create-api.md) · [Get](get-api.md) ·
  [List](list-api.md) · [Update](update-api.md) · [Delete](delete-api.md)
- [ApiManager](api-manager.md): the per-API manager of the generated service
- [Bulk actions](bulk-actions.md), [SSE streaming](sse-streaming.md),
  [Cron controllers](cron-jobs.md)
- Transports: [gRPC controllers](grpc-controllers.md),
  [Kafka controllers](kafka-controllers.md)
- [Actions & workflow: overview](../workflow/overview.md)
- Specification: [`BusinessApi`](../../spec/BusinessApi.md),
  [`BusinessApiBasics`](../../spec/BusinessApiBasics.md),
  [`BusinessApiParameters`](../../spec/BusinessApiParameters.md),
  [`BusinessApiControllers`](../../spec/BusinessApiControllers.md),
  [`BusinessApiQuery`](../../spec/BusinessApiQuery.md),
  [`BusinessApiActionStore`](../../spec/BusinessApiActionStore.md),
  [`BusinessWorkflow`](../../spec/BusinessWorkflow.md).
