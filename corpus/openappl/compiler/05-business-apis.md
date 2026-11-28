---
title: Business API semantics
---

# 5. Business API semantics

A business API ([`BusinessApi`](../spec/BusinessApi.md)) is declared, not written. Its
`crudType`, its data object, its parameters, its query settings and its auth options say
what it does; the compiler derives the whole lifecycle from them. A data object gets no
API of its own: a compiler **MUST NOT** generate default CRUD endpoints for a data object
that the blueprint does not ask for. Every API of a generated service is one of three
kinds:

- **declared**: an entry of `Service.businessLogic[]`;
- **lowered**: added by a high-level pattern of the blueprint, such as the payment APIs
  of an order object or the user APIs of the authentication section
  ([12.1](12-derived-surface.md#121-lowering)); these are ordinary business APIs and this
  chapter applies to them;
- **implicit**: a route that a property or a setting brings with it, such as the geo
  routes of a geo property, or an operational route every service has
  ([12.2](12-derived-surface.md#122-implicit-routes)).

A compiler **MUST NOT** expose an API of any other kind.

This chapter specifies the lifecycle (C1) and the route, envelope, paging and error
contract (C2) of every business API.

## 5.1 API types

`crudType` is one of exactly five values:

| `crudType` | Addresses | Main operation | Success status |
|---|---|---|---|
| `create` | a new record | insert | **201** |
| `get` | one record | read | **200** |
| `list` | a set of records | query, paged | **200** |
| `update` | one record | partial update | **200** |
| `delete` | one record | soft or hard delete ([chapter 4](04-data-layer.md)) | **200** |

An API with another verb in its name (for example `publishOrder`) is one of these five
with a non-default name. Bulk work is done by actions inside one API, never by a bulk
API type.

## 5.2 The lifecycle

Every API runs the same pipeline. Steps marked with a milestone name are the places where
the blueprint's workflow ([`BusinessWorkflow`](../spec/BusinessWorkflow.md)) may insert
actions; the actions listed at a milestone run there, in the listed order. An action that
no milestone lists never runs.

| # | Step | Milestone after it | Types |
|---|---|---|---|
| 1 | Start | `afterStartBusinessApi` | all |
| 2 | Authenticate the caller; login, caller-kind and role gates ([chapter 6](06-authorization.md#62-order-of-decisions), gates 1–9) | | all |
| 3 | Idempotent replay check (5.8); a hit answers here | | all, when enabled |
| 4 | Read parameters; reject missing required ones and malformed ids or arrays | `afterReadParameters` | all |
| 5 | Transform parameters | `afterTransposeParameters` | all |
| 6 | Check parameters | `afterCheckParameters` | all |
| 7 | Role gate (again) | `afterCheckBasicAuth` | all |
| 8 | Foreign permission, type-level permission, parent ownership ([chapter 6](06-authorization.md)) | | all |
| 9 | Build the where clause (authored clause, then ownership, permission, tenant, soft-delete terms) | `afterBuildWhereClause` | get, list, update, delete |
| 10 | Fetch the addressed record; **404** if none | `afterFetchInstance` | update, delete, and get with ownership check |
| 11 | Ownership and object-level permission | `afterCheckInstance` | update, delete, get |
| 12 | Build the data clause (values to write; tenant and owner stamps) | `afterBuildDataClause` | create, update |
| 13 | Main operation | `afterMainCreateOperation` / `afterMainGetOperation` / `afterMainListOperation` / `afterMainUpdateOperation` / `afterMainDeleteOperation` | per type |
| 14 | Build the output (5.4) | `afterBuildOutput` | all |
| 15 | Remove secrets and internal columns; send the response | | all |
| 16 | After the response is sent | `afterSendResponse` | all |
| 17 | Raise the API event if `raiseApiEvent` is true ([chapter 7](07-event-bus.md)) | `afterApiEvent` | all |

Rules:

- The milestone names above are wire-stable vocabulary of the language; a compiler **MUST**
  support each milestone that Part 2 lists for the API's type. Note the spelling
  `afterTransposeParameters`.
- For a plain `get` (no ownership check), steps 10–11 run after the read: the record is
  read by the main operation, and `afterCheckInstance` runs after it.
- `get`, `update` and `delete` also have the milestone `afterMissingInstance`. With
  `apiOptions.onNotFound: "complete"`, a missing record does not answer 404: the API runs
  `afterMissingInstance` and answers **200** with `{}`, raising no event.
- An error in any step before the response **MUST** stop the pipeline and answer with the
  error body (5.6). Steps 16–17 **MUST NOT** run after an error response.
- Steps 16–17 run after the response is sent. Their failures **MUST NOT** change the
  response; they are logged.
- A write whose post-write actions failed after the write committed answers with the
  success status and an `actionFailures` array (5.4).

> **To verify:** the reference answers partial success with `actionFailures` on one target
> and with 500 on others. This chapter specifies the `actionFailures` behaviour; the other
> targets are known differences.

Rule example. A workflow that sends a mail after an order is created:

```json
{
  "apiOptions": { "name": "createOrder", "crudType": "create", "dataObjectName": "order" },
  "workflow": { "create": { "afterMainCreateOperation": ["sendConfirmation"] } }
}
```

The confirmation runs after the insert has committed and before the output is built. If
the mail provider fails, the client still gets **201** with the new order, plus
`actionFailures: [{ "action": "sendConfirmation", "error": "…" }]`.

## 5.3 Routes

### Method

| `crudType` | Method |
|---|---|
| `create` | `POST` |
| `get`, `list` | `GET` |
| `update` | `PATCH` |
| `delete` | `DELETE` |

`restSettings.forcePOSTMethod: true` makes any API `POST`. `GET` and `DELETE` carry no body.

### Path

An explicit `restSettings.routePath` is used as written (it starts with `/`; a leading
`/v1` is dropped; `:name` segments are path parameters). With the default
(`"$default"`), the path is derived from the API name and the data object:

1. Split the camelCase API name: the first word is the **action**, the rest, joined and
   lower-cased, is the **resource**. A one-word name has the action `do`.
2. If the action is one of `get`, `list`, `create`, `update`, `delete` and the resource is
   the object name or its plural, the resource path is the **plural of the object name**,
   lower-cased.
3. If the action is one of those five and the resource is something else, the resource
   path is the resource.
4. Otherwise (a non-standard verb) the resource path is action + resource, lower-cased,
   not pluralised.
5. `create` and `list` use `/<resourcePath>`. `get`, `update` and `delete` use
   `/<resourcePath>/:<objectName>Id`, the parameter name keeping its camelCase.
6. A single non-`id` select-by field gives `/<resourcePath>/:<field>`; a default `list`
   with exactly one select-by field gives `/list<plural>`.

| API | Object | Method and path |
|---|---|---|
| `createOrder` | `order` | `POST /orders` |
| `listOrders` | `order` | `GET /orders` |
| `getOrderItem` | `orderItem` | `GET /orderitems/:orderItemId` |
| `updateOrder` | `order` | `PATCH /orders/:orderId` |
| `publishOrder` (update) | `order` | `PATCH /publishorder/:orderId` |
| `clearBasket` (delete) | `basketItem` | `DELETE /clearbasket/:basketItemId` |

- A compiler **MUST** derive the same path. The plural form **MUST** be the reference's
  English pluralisation.
- Every route **MUST** be reachable at its path and also under the prefix `/v1`
  (`/v1/orders`). There is no other version prefix.
- The routes are relative to the service's base address
  ([chapter 3](03-architecture-and-topology.md#33-public-addressing)).

> **To verify:** the pluralisation rules (irregular nouns) need a normative table; until
> then the reference is the rule. Generated table goes here (S9): the route catalogue per
> reference blueprint.

### Parameters

Each request parameter declares where it is read from: `httpLocation` is one of
`bearer`, `cookie`, `header`, `query`, `body`, `urlpath`, `session`, `request`. When it
does not resolve, the default is `query` for `GET`/`DELETE` and `body` otherwise. A path
parameter overrides a body value of the same name.

- A missing required parameter **MUST** answer **400**, listing every missing parameter.
- An addressed id that is not a valid id **MUST** answer **400**.

### Other entry points

The same pipeline is reachable through other transports. Each is opt-in per API, except
REST, which is on unless `restSettings.hasRestController` is `false`.

| Transport | Switch | Entry | Identity |
|---|---|---|---|
| REST | `restSettings` | method and path above | session token |
| Server-sent events | `sseSettings.hasSseController` | method and path of the API (5.9) | session token |
| Event bus | `kafkaSettings.hasKafkaController` | consumes `requestTopicName` ([chapter 7](07-event-bus.md)) | the event's actor |
| gRPC | `grpcSettings.hasGrpcController` | one RPC per API | `authorization` metadata |
| Schedule | `cronSettings.hasCronController` | `cronExpression` (five fields, default hourly) | trusted system |
| In-process | `internalCallSettings` | called by other APIs of the same service | trusted system |

> **To verify:** an API with both REST and SSE on. The documentation says both share the
> route; in the reference the REST handler is mounted first on the same method and path
> and no `Accept` header dispatch was found, so the stream may be unreachable. Until this
> is settled, a compiler **SHOULD** dispatch on `Accept: text/event-stream`.

## 5.4 Success envelope

| API type | Body |
|---|---|
| `create`, `get`, `update`, `delete` | The record itself at the top level, plus `"_type": "<objectName>"`. `delete` returns the deleted (or soft-deleted) record. |
| `list` | `{ "data": [ records, each with _type ], "paging": { "page", "pageSize", "totalCount", "totalPages" } }` |
| `onNotFound: "complete"` miss | `{}` with **200** |
| Write held for moderation | **202** `{ "moderation": { "id", "status", "message" } }` |

- There is no wrapper object and no status field in a success body.
- Keys added by `AddToResponseAction` (or `writeToResponse: true`) go at the top level,
  beside the record or beside `data` and `paging`. `_type`, `data`, `paging` and
  `actionFailures` are reserved.
- `actionFailures` (5.2) is present only when not empty:
  `[{ "action", "error", "retryable"?, "errorCode"? }]`.
- Every body **MUST** be stripped of declared secrets (hashed and secret properties) and of
  internal columns (for example the owner, tenant and archive bookkeeping columns) before
  it is sent, including replayed and streamed bodies.
- Response headers: every response carries `X-Request-Id` (the caller's `x-request-id`, or
  a generated id) and `Server-Timing: app;dur=<ms>`.
- A login-type API returns `accessToken` (and `refreshToken` when enabled) in the body and
  sets the session cookie ([chapter 9.1](09-01-authentication-and-sessions.md)).

Response shaping by the blueprint:

- `selectProperties` limits the record to the listed properties plus `id` and `_type`.
- `selectJoins` embed a joined record under its `joinName` (a one-property join writes the
  plain value).
- A get or list with `dataViewName` returns the BFF view's document instead of the stored
  record ([chapter 9.2](09-02-bff.md)).

Rule example. `GET /v1/orders?page=2&pageSize=2` on a service with five orders:

```json
{
  "data": [
    { "id": "…", "total": 12.5, "_type": "order" },
    { "id": "…", "total": 7, "_type": "order" }
  ],
  "paging": { "page": 2, "pageSize": 2, "totalCount": 5, "totalPages": 3 }
}
```

## 5.5 Pagination and sorting

- Request: `page` (1-based, minimum 1) and `pageSize` (1 to 1000). The aliases
  `pageNumber` and `pageRowCount` **MUST** be accepted. A non-numeric value means "not
  sent"; a fraction is truncated. Read from the query, then the body.
- The default page size is the API's `paginationOptions.defaultPageRowCount`, else 25.
- `totalPages` is `ceil(totalCount / pageSize)`.
- `paginationOptions.cursorMode: true`: the caller sends an opaque `cursor`; the order is
  `createdAt ASC, id ASC`; the answer's `paging` is `{ "pageSize", "nextCursor" }`, with
  `nextCursor` null at the end. No total is computed.
- `paginationOptions.unpaged: true`: the whole set, in the API's order (as below; `createdAt ASC, id ASC`
  when it declares none) and capped by `topPick` after that order, with
  `paging = { page: 1, pageSize: n, totalCount: n, totalPages: n > 0 ? 1 : 0 }`; above the
  service's limit the API answers **422** `UNPAGED_LIST_TOO_LARGE`.
- Sorting is the API's `listSortBy` with a unique `id ASC` tie-break. Runtime sorting
  (`sortBy`, `sortOrder`) and text search (`q`) are accepted only when the API's runtime
  filters enable them.

> **To verify:** the runtime sort allow-list and its 400 `INVALID_SORT_FIELD`, the
> unpaged row limit, and the `POST <route>/list` filter endpoint described in older
> documentation (not found in the reference; a list reads `filters` from its own route).

## 5.6 Error body

Every error answer **MUST** be an RFC 9457 problem document with
`Content-Type: application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "order not found",
  "errorCode": "NOT_FOUND",
  "requestId": "6f1c…"
}
```

| Field | Rule |
|---|---|
| `type` | `about:blank` |
| `title` | the HTTP reason phrase of `status` |
| `status` | the HTTP status |
| `detail` | a human-readable message; for 5xx always `Internal server error` unless the error carries a declared code |
| `errorCode` | **always present**; the specific code, else the default code of the status |
| `retryable` | present, `true`, only for transient failures (database or search engine unavailable, pool saturated) |
| `requestId` | the request id, when known |
| `errors` | per-field validation errors, when there are several |

Default codes per status:

| Status | `errorCode` | Typical cause |
|---|---|---|
| 400 | `BAD_REQUEST` | missing or malformed parameter |
| 401 | `UNAUTHORIZED` | no identified caller on a login-required API |
| 402 | `PAYMENT_REQUIRED` | payment refused |
| 403 | `FORBIDDEN` | a gate of [chapter 6](06-authorization.md) refused |
| 404 | `NOT_FOUND` | the addressed record is not in scope |
| 409 | `CONFLICT` | unique index or relation restriction; idempotency key reuse |
| 413 | `CONTENT_TOO_LARGE` | payload too large |
| 422 | `VALIDATION_ERROR` | value-level validation |
| 429 | `TOO_MANY_REQUESTS` | rate or load limits |
| 500 | `INTERNAL_ERROR` | anything unclassified |
| 501 | `NOT_IMPLEMENTED` | |
| 502 | `BAD_GATEWAY` | an upstream provider failed |
| 503 | `SERVICE_UNAVAILABLE` | a dependency is down; `retryable: true` |
| 504 | `GATEWAY_TIMEOUT` | |

Classification rules (C1): database and search unavailability **MUST** answer 503; a
database constraint violation **MUST** answer 400, 409 or 422 by its kind; an error that
carries its own status keeps it; anything else is 500. A 4xx keeps its own message; a 5xx
never leaks internal detail.

Message keys: a `detail` that is a single message key of the reference catalogue (form
`errMsg_<Name>`) is resolved to a sentence in the caller's `Accept-Language`, and the key
becomes the `errorCode`.

> Generated table goes here (S9): the error-code catalogue (framework codes, message keys
> and the status of each).

## 5.7 Request headers

| Purpose | Name |
|---|---|
| Session token | `Authorization: Bearer <token>`, or the header or cookie `<projectCodename>-access-token` ([chapter 9.1](09-01-authentication-and-sessions.md)) |
| Machine identity | `x-m2m-token` |
| Tenant | `mbx-<tenantName>-codename` (configurable) ([chapter 6](06-authorization.md#66-tenant-isolation)) |
| Correlation | `x-request-id` |
| Idempotency | `api-idempotency-key` |
| Step-up approval | `api-approval-id`, `api-approval-code` |
| Language of messages | `Accept-Language` |

## 5.8 Idempotency key

With `apiOptions.useIdempotencyKey: true`:

- The caller sends `api-idempotency-key` (header, else query, else body).
- The key is scoped to the API, the caller's user id and tenant: it never replays across
  APIs, users or tenants. It is kept for 24 hours.
- Only **2xx** answers are stored. A repeat with the same key and the same declared
  parameters **MUST** replay the stored status and body without running the workflow, and
  add the response header `idempotency-key-cache: true`.
- A repeat with the same key and different parameters **MUST** answer **409**
  `IDEMPOTENCY_KEY_INCONSISTENCY`.
- If the key store is unavailable, the API behaves as if no key was sent.

The lookup runs after authentication and before any authored action.

## 5.9 Server-sent events

With `sseSettings.hasSseController: true` the API streams:

- Login and role gates run **before** the stream opens; their failures are ordinary
  problem responses.
- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`.
- Frames are `event: <name>` + `data: <json>`.
- `responseMode: "stream"` (default): one `meta` frame
  `{ dataName, action, userId, requestId, chunkSize }`, then `chunk` frames
  `{ index, data, count }` (a list streams page by page, default 100 rows, ordered
  `createdAt ASC, id ASC`; other types send one chunk), then one terminal `done` frame
  `{ totalChunks, totalRows, elapsedMs, actionFailures? }`.
- `responseMode: "events"`: `progress` frames `{ step, message, … }` for the pipeline steps
  and for authored emit actions; no terminal frame; the connection ends.
- An error after the stream opened is one `error` frame `{ message, code }`.

## 5.10 Scheduled APIs

With `cronSettings.hasCronController: true` the API runs on its `cronExpression` (five
fields), as a trusted system caller with no parameters. With `singleReplica` (default
`true`), exactly one instance of the service runs each tick, however many replicas run.
A failing run is logged and does not stop the schedule.

> **To verify:** the time zone rule (documented as the service setting `CRON_TIMEZONE`,
> default UTC).

## 5.11 API description

Each service **MUST** publish a machine-readable description of its HTTP interface. The
reference serves OpenAPI 3.0.1 at `GET /openapi.json` and a viewer at `GET /swagger`; a
compiler **SHOULD** serve the same paths. The description lists every API with a REST
entry point and the public system routes, and declares bearer authentication when any
route needs login.
