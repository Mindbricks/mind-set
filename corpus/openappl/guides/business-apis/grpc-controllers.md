---
title: gRPC controllers
---

# gRPC controllers

A **gRPC controller** exposes a `BusinessApi` over gRPC alongside (or
instead of) REST. Useful when the consumer is another service in the
cluster that benefits from binary framing + streaming semantics.

## ApiGrpcSettings: the per-API toggle

Lives at `BusinessApi.controllers.grpcSettings`:

```json
{
  "controllers": {
    "grpcSettings": {
      "hasGrpcController": true,
      "responseType":      "single"
    }
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `hasGrpcController` | yes | Toggle. Set to `true` to register the gRPC method. |
| `responseType` | | `single` (default) returns one response; `stream` declares a server-side stream. |

The fields are flat - a nested `configuration: { ... }` wrapper is
accepted on input and lifted to the flat shape at validate time.

**The response shape is not configurable.** There is no
`responseFormat` field, and a blueprint that sets one does not build.
gRPC response messages follow Google AIP conventions, fixed:

- a single-item method returns the **resource message directly**, with
  no wrapper;
- a list method returns
  `<Method>Response { repeated <Model> data = 1; Paging paging = 2; }`
  with `Paging { int32 page = 1; int32 page_size = 2; int32 total_count = 3;
  int32 total_pages = 4; string next_cursor = 5; }` - the AIP snake_case
  names of REST's `paging` block. An offset list fills the first four
  (1-based `page`) and leaves `next_cursor` empty; a
  `cursorMode` list fills `page_size` and `next_cursor` (empty on the last
  page) and leaves the rest `0`;
- failures surface as **gRPC status codes** (`NOT_FOUND`,
  `PERMISSION_DENIED`, ...), never inside the response message.

This mirrors the REST contract on [Response shape](response-shape.md) -
same records, same paging, different framing.

Unary interservice list callers restore the REST paging shape. Offset replies
expose `page`, `pageSize`, `totalCount` and `totalPages`, without `nextCursor`.
Cursor replies expose only `pageSize` and `nextCursor`; an empty wire cursor
becomes REST `null` at the end of the list.

List requests also carry an optional page window: `optional int32 page =
1001`, `optional int32 page_size = 1002` and `optional string cursor = 1003`.
Omitting them preserves the default window. Authored request parameters retain
their original tags and take precedence by proto name and protobuf JSON name:
an authored `pageSize`, for example, suppresses the generated `page_size` field.
There is then no separate `page_size` override. The compiler refuses a
list request whose authored parameter tags reach 1001, preventing a paging-tag
collision. The decoded window uses the same defaults and clamps as REST: page
starts at 1, page size defaults to the API's configured size and is clamped to
1-1000; cursor is used for cursor-mode lists.

A client sends the proto's exact field names (`page`, `page_size`,
`cursor`). An explicitly supplied zero page or page size clamps to 1;
an omitted envelope field stays absent even when the client library enables
defaults. Authored colliding parameters keep their existing presence and
default semantics. Interservice workflows map `pageNumber` to `page`
and `pageSize` / `pageRowCount` to `page_size`. If an authored parameter owns
that wire name or its default protobuf JSON name, the workflow sends the
authored spelling instead. An exact authored parameter name always keeps its
meaning. Undefined values stay omitted; explicit zero reaches the same clamp.
When multiple supplied names target one slot, an exact authored field wins,
then a canonical paging name, then a legacy alias, independent of item order.
`cursor` is forwarded to the cursor field, including an authored colliding
spelling, so workflows can continue a cursor-mode list walk.

Which target languages implement the page window is listed in
[the compiler specification](../../compiler/index.md).

## What gets generated

For each API with `hasGrpcController: true`:

- A gRPC method in the service's `.proto` file. Method name derives
  from `basics.apiOptions.name`.
- Request message type derived from
  `parameters.requestParameters`.
- Response message type derived from the API's crudType per the fixed
  AIP shapes above - the resource message for single-item methods, a
  `<Method>Response { repeated data; Paging paging }` for lists.
- A server-side handler that delegates to the same action-store
  workflow REST uses - no duplicate logic.

## Moderated writes: the `moderation` field

A create or update on an object with
[`objectModeration`](../capabilities/object-moderation.md) answers through
the same resource message, plus one field: its proto declares
`ModerationOutcome moderation = 1000 { string id; string status; string message; }`.
The tag is fixed far above the object's own field numbering, so adding a
property never moves it, and every other api's proto stays unchanged.

- **Held** (a `staged` write the engine did not accept - a `reject` or
  `review` verdict, a low confidence, a provider failure): gRPC
  status `OK`, only `moderation` is set, every resource field is empty
  (nothing was written), and the initial metadata carries
  `x-moderation-status` / `x-moderation-id` for a client that does not read
  the field. This is REST's `202`.
- **Written** (a `staged` accept, every `onPlace` verdict): the record, with
  `moderation` beside it and no moderation metadata.

On an `onPlace` object the record's `moderationStatus` column is an Enum
and reads as its label (`accepted`, `rejected`, `review`), like every Enum
field (below). See
[Object content moderation - what a gRPC caller sees](../capabilities/object-moderation.md#what-a-grpc-caller-sees).

## Enum fields cross as their label

An `Enum` property of the resource message, and an `Enum` request
parameter, is a proto `string` carrying the label (`"high"`), the same
value REST answers and the service stores; an array Enum is
`repeated string`. The vocabulary is written on the field as a comment:

```proto
string priority = 3; // one of: low, medium, high
```

On the request message a scalar Enum parameter is `optional string`, so a
caller that leaves it out sends nothing: the parameter is absent (its
`defaultValue` applies, an optional one is accepted) rather than an empty
string the vocabulary check would refuse. A value outside the vocabulary
answers `INVALID_ARGUMENT` with the allowed list, as REST answers `400`.
Request readers preserve presence: an omitted optional Enum stays absent,
while an explicitly supplied empty label still reaches validation.

## When `responseType: "stream"` makes sense

Server-side streaming pairs with an API whose workflow either:

- Iterates an input collection (`ListMapAction` over a long list).
- Wraps an upstream stream (an `AiCallAction` with `stream: true`).
- Walks paginated data without buffering it in memory.

For unary request/response (the common case), keep `single`.

> Note: `stream` is **declared** intent. A compiler may emit a unary RPC that
> invokes its callback once even when the flag is set, and the generated
> per-API documentation says so. Author it when it describes the API, but do
> not plan a client around server streaming unless your compiler documents
> that it implements it
> ([the compiler specification](../../compiler/index.md)).

## REST + gRPC on the same API

The two are independent toggles. The same API can carry
`restSettings.hasRestController: true` AND
`grpcSettings.hasGrpcController: true`. Same handler, two entry points,
no shape drift - both controllers route into the typed action store +
workflow.

## Auth

gRPC requests carry the same `Authorization` metadata that REST
requests carry as a header. The service's auth middleware runs
before the workflow, just like REST. `apiOptions.M2MAllowed: true`
lets the API accept a project machine-to-machine token, which is the
common case for service-to-service gRPC traffic.

### `permissionCheck` needs a session on the gRPC entry

The gRPC controller resolves the caller's session from the
`Authorization` metadata, and the session manager that decides an api's
`authOptions.permissionCheck` is attached to the call only when that
credential resolves a session. A call to a `permissionCheck` api that
arrives with no session is therefore **refused with 403**
(`PERMISSION_DENIED`), not passed: there is nothing to decide the
permission for. The api's `absoluteRoles` and a verified machine caller
the api admits (`M2MAllowed`) are decided first and keep their answers.
With `loginRequired: true` (the default) such a call is refused at the
login gate before it gets there; the combination `loginRequired: false`
+ `permissionCheck` + a gRPC controller is reported by validation as a
WARNING (`PERMISSION_CHECK_ON_CALLERLESS_DOOR`, `door: "grpc"`), next
to the `PUBLIC_API_WITH_ROLE_GATE` error for the contradiction itself.
See [Native permissions](../capabilities/native-permissions.md#doors-with-no-caller-session).

## Calling another service

Use [`InterserviceCallAction`](../../spec/InterserviceCallAction.md)
inside a workflow. The action does not pick the transport at the
call site - with the default `transport: "auto"`, `targetService` +
`targetApi` resolve to whichever controllers the target API exposes: gRPC when
the target has a gRPC controller, otherwise REST. Set `transport` to `rest` or
`grpc` to force one (`grpc` against a target without a gRPC controller falls
back to REST and draws the `INTERSERVICE_GRPC_TRANSPORT_FALLBACK` warning).
For a gRPC-only target `auto` is the only path that works.

The action is an entry of `actions.interserviceCallActions[]`:

```json
{
  "name":                "callPricing",
  "contextPropertyName": "quote",
  "targetService":       "pricing",
  "targetApi":           "computeQuote",
  "isArray":             false,
  "apiParameters": [
    { "name": "sku", "value": { "js": "this.data.sku" } },
    { "name": "qty", "value": { "js": "this.data.qty" } }
  ]
}
```

The service resolves the target service URL from the deployment's
service-address configuration, signs an M2M trust token
(`x-m2m-token`), and parks the response on the context under
`contextPropertyName`. Multi-tenant projects propagate the tenant
codename automatically. To forward the caller's user session as well
- so the target sees the original `session.userId` / `roleId` and
applies user-role / ownership checks - set `forwardCallerToken: true`.

Prefer REST when the call sits at the edge of a public-facing flow;
prefer gRPC on the target side for hot-path internal traffic where
binary framing matters.

## REST vs gRPC vs Kafka

| Pick | When |
|---|---|
| REST | Browser-facing, partner integrations, anywhere HTTP semantics matter. |
| gRPC | Hot-path internal traffic, streaming responses, contract-typed clients. |
| Kafka | Fire-and-forget, fan-out, eventual processing. See [Kafka controllers](kafka-controllers.md). |

## See also

- [`InterserviceCallAction`](../../spec/InterserviceCallAction.md) -
  the typed cross-service call surface; covers `forwardCallerToken`
  and `apiParameters` in detail.
- [M2M communication](../system-services/m2m-communication.md) - service-to-service
  trust layer used by gRPC and REST inter-service calls alike.
- [Kafka controllers](kafka-controllers.md) - the asynchronous
  alternative to gRPC for in-cluster traffic.
- Schema: [`ApiGrpcSettings`](../../spec/ApiGrpcSettings.md), [`BusinessApiControllers`](../../spec/BusinessApiControllers.md). `GrpcApiResponseType` (`single` / `stream`) is the one enum `ApiGrpcSettings` consumes.
- [Response shape](response-shape.md) - the REST-side counterpart of the
  fixed AIP shapes above.
- [Business APIs - overview](overview.md) for the
  partitioned `controllers` chapter.
