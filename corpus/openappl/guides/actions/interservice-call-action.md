---
title: InterserviceCallAction
---

# InterserviceCallAction

Calls another Business API in a different service of the same project. Routing, M2M authentication, tenant headers, and path-vs-body parameter split are all compiler-managed: from the author's perspective it is a typed function call.

Three outbound-call actions; pick the right one:

- [`InterserviceCallAction`](./interservice-call-action.md): typed call into another service of the project.
- [`ApiCallAction`](./api-call-action.md): free-form HTTP to any URL.
- [`IntegrationAction`](./integration-action.md): named method on a catalogue integration.

## When to use it

- Compose a workflow that needs to invoke a Business API owned by another service (e.g. `cart` invoking `order.createOrder`).
- Read data from another service synchronously when the BFF / Elastic projection is not enough.
- Trigger a downstream side-effect that must complete before the caller proceeds.
- For asynchronous decoupling prefer [event subscriptions](../capabilities/event-subscriptions.md) over a sync call.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `targetService` | `String` | yes | Logical name of the target microservice. |
| `targetApi` | `String` | yes | Name of the target Business API in that service. |
| `apiParameters` | `DataMapItem[]` | no | `{ name, value }` pairs forming the call's input. The compiler places each entry where the target API reads it: a route `:segment`, the query string, a header or the body, keyed on the target parameter's wire name (`dataPath ?? name`). See Behaviour step 1. |
| `responseProperty` | `String` | no | When set, extract this property from the response body instead of storing the whole result. It indexes the **producer's response body**: that body IS the record for a single-item target, so there is no resource-named wrapper to select (`"order"`, `"profile"` match nothing). Leave it unset for single-item calls; see Behaviour step 5. |
| `isArray` | `Boolean` | yes | Whether the result is expected to be an array: affects how the value is treated downstream. |
| `forwardCallerToken` | `Boolean` | no | When true, forward the inbound caller's session token to the downstream service so the call runs under the user's identity (preserves `session.userId` / `roleId` / ownership checks). When false (default), the call is M2M-only and the downstream sees no user session, which only works if the target API is `M2MAllowed`. See Authentication. |
| `applyField` | `InterserviceApplyField` | no | Update ONE field whose name is decided at runtime on a record of the target service, through the target's typed update API: `{ recordId, field, value, allowedFields }`. Exclusive with `apiParameters`; available only where the compiler for the calling service's language implements it. See [Applying a data-determined field](#applying-a-data-determined-field-applyfield). |

## Behaviour

The action:

1. Looks up the target API's route at compile time. Parameters whose `name` matches a `:segment` in the route's **pathname** (the part before the first `?` or `#`) are routed to the path parameters under that name. Every other entry that names a declared request parameter of the target goes where the target reads it, keyed on that parameter's **wire name** `dataPath ?? name` (the key the target's reader looks up, not the parameter name): `httpLocation: urlpath` binds the route segment the `dataPath` names, `query` goes to the query string, `header` to a lowercased request header, `body` to the request body. An entry with no declared target parameter, or one whose location the caller cannot supply (`session`, `request`, `cookie`, unspecified), goes to the body, or to the query string on a GET / DELETE target. So for a target parameter `{ name: "planName", httpLocation: "body", dataPath: "plan" }` the entry is named `planName` and travels as `body.plan`. A colon-prefixed value in a declared query string or fragment (`/items/:id?tag=:ordinary`) is literal text, never a path binding: it is not substituted at runtime and goes out exactly as declared. Design-time validation uses the same pathname boundary for required path bindings and implicitly accepted parameters.
2. Builds the path parameters, query, headers and body from the compiled `apiParameters` MScript values.
3. Makes the call to the target service and API, carrying the session and request id.
4. Unwraps the call result. The call resolves a transport wrapper (`{ status, ok, data }`); the action result is the target API's **response body** on `.data`, never the wrapper. A non-2xx has already thrown, so `status` / `ok` carry no information a flow can act on.
5. When `responseProperty` is set, returns `body[responseProperty]` (falls back to the whole body if the key is missing). `responseProperty` therefore indexes the producer's response body: a record property (or `addToResponse` / `writeToResponse` key) on a single-item target, or `data` / `paging` on a list target, whose body is the AIP `{ data, paging }` envelope. The wrapper field names `status` / `ok` are not valid `responseProperty` values and are rejected by validation.

**Response shape by media type (REST transport).** `.data` is decoded by the success response's bare media type (the `content-type` type/subtype, case-insensitive; parameters such as `charset` or `profile` are ignored): `application/json` (and `application/json-*` types) is the parsed value (the record or `{ data, paging }` envelope above); a textual type (`text/*`, `*+json`, `*+xml`, `application/xml`, `application/x-www-form-urlencoded`) or a missing `content-type` is the body string; **every other type is a byte buffer holding the exact bytes the target sent**. The byte-buffer case is how a file-download target (a `DataToFileAction` or `RenderPdfAction` with `sendToClient: true`: `application/pdf`, the xlsx/zip vendor types, `application/octet-stream`, `image/*`, `audio/*`, `video/*`) reaches the caller intact, so the context property holds the file's bytes and a later action can store or forward them unchanged. Only the bytes travel: the target's filename and `content-type` are not exposed on the action result, so a flow that needs them must know them from the target it calls. Leave `responseProperty` unset on such a call (a byte buffer has no record properties to pick). A non-2xx response throws as before, with the body as a string (or the parsed JSON) on the error, never as a byte buffer.

**Authentication.** The M2M trust token is always attached for server-to-server identification, and `forwardCallerToken` **is** wired end to end: when it is true, the compiler forwards the inbound `Authorization` header with the call, and the downstream service resolves the real user session.

The target API must be able to authenticate this caller, and that is a property of the **target**, not of the call:

- **M2M-only call** (`forwardCallerToken` false, the default). The downstream sees a verified `x-m2m-token` and no user session. The runtime bypasses the login gate only for an API declared `authOptions.M2MAllowed: true`: every other API answers `401 Authentication required`, and a valid M2M token changes nothing. It never passes an **ownership** gate: a target that declares `ownershipCheck` (on a get / list / update / delete) or `parentOwnershipChecks` refuses this call with `403 M2M_SUBJECT_REQUIRED`, because a machine token names no user to own the row. When `authOptions.M2MAllowed` is not set, it defaults to `true` for a default-shaped CRUD API (one whose name is its crudType verb plus its object: `getOrder` / `createOrder` / `listOrders` ...) and to `false` for every other Business API, so a custom-named target must opt in explicitly.
- **Forwarded-caller call** (`forwardCallerToken: true`). The downstream authenticates as the **end user** behind the calling request, so `session.userId`, `roleId` and ownership checks all resolve, but the target's own `checkRoles` gate now applies to that user. Calling an admin-gated API this way answers `403` for any caller who is not an admin.

Validation enforces this at design time: a call into a login-gated, non-`M2MAllowed` target without `forwardCallerToken` is rejected with `INTERSERVICE_TARGET_UNREACHABLE`, a forwarded-caller call into a role-gated target warns with `INTERSERVICE_FORWARDED_CALLER_ROLE_GATE` naming the roles the end user must hold, and an M2M-only call into an ownership-scoped target warns with `INTERSERVICE_SUBJECTLESS_OWNERSHIP_TARGET`.

**Tenancy.** On a multi-tenant project the hop runs in the caller's own tenant with no extra wiring: an M2M-only call signs the calling manager's verified tenant (the session's tenant, a Kafka event actor's tenant, a verified machine caller's claim) into its `x-m2m-token` as the `callerTenantId` claim, which the target scopes by exactly as it would a session tenant; a forwarded-caller call carries the user's tenant inside the bearer. The hop can never escalate: a caller with no verified tenant (the root floor) signs nothing, and a tenant-level target then refuses the call (`403 M2M_TENANT_REQUIRED`) rather than serving the root tenant. To act inside a tenant that is not the caller's own, declare `tenantContext` (an MScript expression yielding the tenant codename): it wins over the signed default and rides the tenant-selector header. See [the tenant of a machine call](../system-services/authentication/m2m.md#the-tenant-of-a-machine-call).

**A moderated target.** A create / update target on an object with [`objectModeration`](../capabilities/object-moderation.md) is moderated for this caller like for any other (only cron and `API.*` internal calls bypass it). A held write answers `202` `{ moderation: { id, status, message } }` over REST, and over gRPC a resource with empty fields beside the same `moderation` field; nothing was written either way. Test `moderation.status` before a later action uses the record. See [Object content moderation: what the caller sees](../capabilities/object-moderation.md#what-the-caller-sees).

## Example

For a gRPC list target, `apiParameters` accepts the paging aliases
`pageNumber` (wire `page`) and `pageSize` / `pageRowCount` (wire `page_size`),
alongside `cursor`. Exact authored target parameter names remain unchanged.
When an authored field owns a paging field's default protobuf JSON name
(`pageSize`, for example), aliases use that authored wire spelling instead of
the suppressed envelope member. Undefined values are omitted, explicit zero
clamps to one at the receiver, and an omitted window retains the API's defaults.
For multiple values targeting one slot, exact authored names take precedence
over canonical paging names, which take precedence over legacy aliases;
undefined values do not overwrite a supplied value, regardless of item order.
Non-list calls keep their authored parameter names without paging translation.

Call `order.createOrder` from a `cart.checkout` flow. `createOrder` is the order object's default-shaped create API, so it is `M2MAllowed` by default and the M2M-only call authenticates; the buyer id rides as an explicit parameter because the downstream sees no user session:

```json
{
  "name": "createOrder",
  "writeToResponse": false,
  "contextPropertyName": "createdOrder",
  "targetService": "order",
  "targetApi": "createOrder",
  "isArray": false,
  "apiParameters": [
    { "name": "buyerId",  "value": { "js": "this.session.userId" } },
    { "name": "items",    "value": { "js": "this.cart.items" } },
    { "name": "currency", "value": { "js": "this.cart.currency" } }
  ]
}
```

No `responseProperty`: `createOrder` is a single-item target, so its
response body is the order record itself and the whole record lands on
`this.createdOrder`.

Call a service API with a path parameter (e.g. route `/vehicles/:vehicleId`):

```json
{
  "name": "loadVehicle",
  "writeToResponse": false,
  "contextPropertyName": "vehicle",
  "targetService": "fleet",
  "targetApi": "getVehicle",
  "isArray": false,
  "apiParameters": [
    { "name": "vehicleId", "value": { "js": "this.vehicleId" } }
  ]
}
```

The compiler detects `:vehicleId` in the route and routes the parameter through the path parameters automatically.

## Applying a data-determined field (`applyField`)

`apiParameters` names every parameter statically: only the value is an expression. When the NAME of the field to change is itself data (a reviewed change request that says "set `status` to `archived`" on a record of another service), use `applyField` instead. It calls the target's typed **update** API for one record and sends exactly one field, so the target runs its own authorization, validation and lifecycle pipeline as for any other caller. There is no raw-JSON body and no dynamic `apiParameters` name.

| Member | Type | Description |
|---|---|---|
| `recordId` | `MScript` | The id of the record to update. It binds the one `:segment` of the target's route (the record id segment, `<dataObjectName>Id` or `id`). |
| `field` | `MScript` | Evaluates at runtime to the NAME of the single field to apply: a request parameter name of the target update API. |
| `value` | `MScript` | The value to apply. `null` is a value and is sent (it clears the field where the target allows it); `undefined` is refused. |
| `allowedFields` | `String[]` | The design-time whitelist of names `field` may evaluate to. Each entry must be in the target update API's write set: a request parameter the API declares under exactly that name (case-sensitive), at `httpLocation` `body` or `query` and not `contractOnly`, that a `dataClauseItems` entry stores into an updatable property, that is not the record id or a route segment, whose wire key (its `dataPath`, else its name) is not `__proto__`, and whose wire key no other request parameter of the target reads from the request (only a parameter at `urlpath`, `session`, `header` or `request` is read elsewhere; the target reads every other location, `cookie` included, from the body or the query string). A parameter at any other location (`urlpath`, `session`, `header`, `cookie`, `request`, `bearer`) or with no declared location is not an allowed field. |

Apply a reviewed change to a department of the `organizationCatalog` service, whose `updateDepartment` API is `PATCH /departments/:departmentId` with the body parameters `name` and `description`:

```json
{
  "name": "applyDepartmentChange",
  "writeToResponse": false,
  "contextPropertyName": "updatedDepartment",
  "targetService": "organizationCatalog",
  "targetApi": "updateDepartment",
  "isArray": false,
  "forwardCallerToken": true,
  "applyField": {
    "recordId": { "js": "this.changeRequest.departmentId" },
    "field": { "js": "this.changeRequest.targetField" },
    "value": { "js": "this.changeRequest.newValue" },
    "allowedFields": ["name", "description"]
  }
}
```

At runtime the action, before it mints the M2M token or sends anything:

1. Evaluates `field`. A value that is not a string, or not one of the allowed names (exact, case-sensitive), answers `400` with `errorCode: "INTERSERVICE_APPLY_FIELD_NOT_ALLOWED"`. The message names the action, the target `service.api` and the refused field name (at most 64 characters, or the type of a non-string); it never contains the value. The allowed names go to the service log only. `value` and `recordId` are not evaluated.
2. Evaluates `value`. `undefined` answers `400` with `errorCode: "INTERSERVICE_APPLY_FIELD_VALUE_UNDEFINED"`, naming the field: a request without the key would reach the target as an update of nothing.
3. Evaluates `recordId` into the route segment. A null or blank id answers `400` `INTERSERVICE_PATH_PARAM_UNBOUND` before any I/O, as for every interservice call.
4. Sends the target's update request with exactly one data key: the field under the wire name the target reads (`dataPath ?? name`), in the body, or in the query string for a parameter the target declares at `httpLocation: "query"`. The key comes from the design-time whitelist, never from the runtime string.

Rules and limits:

- **REST only.** An `applyField` call always rides the target's REST route, also with `transport: "auto"` against a target that has a gRPC controller; `transport: "grpc"` is refused at design time.
- **Exclusive with `apiParameters`.** The request carries exactly the one applied field, so `apiParameters` must be empty. A required parameter of the target other than the record id draws an `INTERSERVICE_PARAM_MISSING` warning: it can only be supplied when it is the applied field.
- **The target decides.** The call is an ordinary call of the target's update API: an M2M-only call needs the target to be `M2MAllowed`, and an ownership-checked target needs `forwardCallerToken: true` so the end user is compared against the record owner (see Authentication above; `INTERSERVICE_TARGET_UNREACHABLE` and the ownership warning apply unchanged).
- **Errors follow `onActionError`.** With `onActionError: "completeApi"` a refused field or an undefined value is swallowed like any other action error (logged, and kept on `this.<actionName>Error`) and the API completes; with `throwError` the `400` reaches the client.
- **Language support.** A compiler refuses an `applyField` call in a calling service whose language it does not implement it for (`INTERSERVICE_APPLY_FIELD_LANGUAGE_UNSUPPORTED`).

Design-time validation of `applyField`:

- `INTERSERVICE_APPLY_FIELD_LANGUAGE_UNSUPPORTED` - the compiler does not implement `applyField` for the calling service's language.
- `INTERSERVICE_APPLY_FIELD_WITH_API_PARAMETERS` - `apiParameters` is not empty next to `applyField`.
- `INTERSERVICE_APPLY_FIELD_TRANSPORT_UNSUPPORTED` - `transport` is `grpc`.
- `INTERSERVICE_APPLY_FIELD_ALLOWED_FIELDS_EMPTY` - `allowedFields` is missing, empty, or holds a blank or non-string entry.
- `INTERSERVICE_APPLY_FIELD_TARGET_NOT_UPDATE` - the target API's `crudType` is not `update`.
- `INTERSERVICE_APPLY_FIELD_TARGET_NOT_ID_ADDRESSED` - the target's REST route does not carry exactly one `:segment`, or that segment is not the record id segment.
- `INTERSERVICE_APPLY_FIELD_NOT_UPDATABLE` - an `allowedFields` entry is not in the target's update write set. The finding names the field, the target `service.api`, the accepted fields and a reason: `UNKNOWN_AT_TARGET`, `NOT_STORED`, `IMMUTABLE`, `SERVER_POPULATED_LOCATION`, `UNSUPPORTED_LOCATION` (declared at a location other than `body` or `query`, `cookie` included, or at none), `RECORD_ID`, `WIRE_KEY_SHARED` (another request parameter of the target reads the same wire key from the request, so the one value would be stored into both; only a parameter at `urlpath`, `session`, `header` or `request` does not; the finding names that parameter and the key) or `UNSAFE_WIRE_KEY` (the wire key is `__proto__`, which a request body cannot carry; give the parameter another `dataPath`). The match is exact; a case-only near miss is named as the likely fix.
- `INTERSERVICE_APPLY_FIELD_TARGET_SURFACE_UNKNOWN` - the target is an update API, but its write set cannot be derived statically (no `dataClauseItems`, no declared parameters, an unresolvable data object). `applyField` needs a statically known typed update.

If a build skips validation, the generated action still refuses these shapes before any I/O (no request is sent): a target API that is not an update API (whatever its route and method), a target route without exactly one `:segment`, `apiParameters` next to `applyField`, and a missing `recordId`, `field` or `value` expression. An `allowedFields` entry the built target does not read at `body` or `query`, declares `contractOnly`, reads under the wire key `__proto__`, or shares its wire key with another request parameter the target reads is never sent: the call answers `400` `INTERSERVICE_APPLY_FIELD_NOT_ALLOWED`.

## Errors

- Unknown `targetService` or `targetApi` is rejected at project validation with a clear error (`SERVICE_NOT_FOUND` / `API_NOT_FOUND`).
- `INTERSERVICE_TARGET_UNREACHABLE`: the target API requires a login and is not `M2MAllowed`, and this call does not set `forwardCallerToken: true`. The call would answer `401 Authentication required` on every request. Fix it by opening the target to M2M (`authOptions.M2MAllowed: true`, optionally narrowed by the target service's `serviceSettings.serviceOptions.allowedM2MClients`) or by forwarding the caller's session.
- `INTERSERVICE_TARGET_NOT_MOUNTED`: the call rides REST (`transport: "rest"`, or `auto` / `grpc` against a target with no gRPC controller) and the target API declares `controllers.restSettings.hasRestController: false`. Its REST route is never mounted, so every call answers `404` (and is silently skipped under `onActionError: completeApi`). Fix it by enabling the target's REST controller, by giving the target a gRPC controller and calling it with `transport: "grpc"` or `"auto"`, or, for a target in the same service, by replacing the call with a `functionCallAction` whose `callScript` is `await API.<apiName>(...)` (the target must declare `internalCallSettings.hasInternalCallController: true`). A target with no `restSettings` block is mounted.
- `INTERSERVICE_SUBJECTLESS_OWNERSHIP_TARGET` (warning): `forwardCallerToken` is not true and the target is `M2MAllowed` and ownership-scoped (`ownershipCheck` on a non-create api, or `parentOwnershipChecks`). The call arrives as a machine caller with no user identity, and the target refuses it with `403 M2M_SUBJECT_REQUIRED` on every request. Fix it by setting `forwardCallerToken: true`, so the call runs as the end user and is compared against the row owner, or, when the flow has no user (a kafka consumer, a cron job), by calling a machine-only api on the target service instead: `authOptions.requiredCallerKind: "machineWithoutUserIdentity"` with `M2MAllowed: true` and no `ownershipCheck`. Compiler-injected targets are not reported.
- `INTERSERVICE_FORWARDED_CALLER_ROLE_GATE` (warning): `forwardCallerToken: true` into a target that declares `checkRoles`. The forwarded token authenticates as the end user, so the call succeeds only for users holding one of those roles; everybody else gets `403`.
- `INTERSERVICE_PATH_PARAM_UNBOUND`: a `:segment` of the target route has no `apiParameters` entry of the same name, and (where the compiler supports `urlpath` parameter binding) no entry named after a target `urlpath` parameter whose `dataPath` is that segment (a design-time error; the generated action also refuses a pathname segment it cannot bind, before any I/O), or a bound segment's value is null, undefined or blank at runtime (400, before any token or I/O). The design-time and the runtime refusal quote the target route with credential-named query and fragment `key=value` pairs masked (`apiKey=%5BREDACTED%5D`, by the same name vocabulary the request logs use); the call itself still uses the route as declared.
- `INTERSERVICE_APPLY_FIELD_NOT_ALLOWED` (400) / `INTERSERVICE_APPLY_FIELD_VALUE_UNDEFINED` (400): runtime refusals of an `applyField` call, before any I/O; see [Applying a data-determined field](#applying-a-data-determined-field-applyfield) for these and for the design-time `INTERSERVICE_APPLY_FIELD_*` codes.
- Downstream errors propagate per `onActionError`. With `completeApi`, the downstream error shape is preserved on `this.<actionName>Error`.

## See also

- [`ApiCallAction`](./api-call-action.md): free-form HTTP
- [`IntegrationAction`](./integration-action.md): catalogue integration
- [Event subscriptions](../capabilities/event-subscriptions.md): async alternative
- [gRPC controllers](../business-apis/grpc-controllers.md)
- [`DataMapItem`](../../spec/DataMapItem.md)
