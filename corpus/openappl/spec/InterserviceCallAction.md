# InterserviceCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [InterserviceCallAction in Part 1](../ontology/InterserviceCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Calls another Business API defined in a different microservice. This enables inter-service coordination within an OpenAPPL application. The response can be extracted into the context or added to the API response. This action supports dynamic parameters and flexible response handling.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `targetService` | `String` | yes |  |  |  | The logical name of the microservice where the target Business API is defined. |
| `targetApi` | `String` | yes |  |  |  | The name of the target Business API to call in the foreign service. |
| `apiParameters` | [`DataMapItem`](./DataMapItem.md)[] | no |  |  |  | A list of key-value MScript expressions passed as input parameters to the target API. These are dynamically evaluated using the current context. Every `:segment` of the target's REST route (its explicit routePath, or the calculated default such as `/orders/:orderId`) MUST be bound by an entry whose `name` matches the segment exactly (case included): the generated action substitutes the URL from that entry, and an unbound segment is a design-time ERROR (INTERSERVICE_PATH_PARAM_UNBOUND) because the call would otherwise send the literal `:segment` and the target would answer 400. At runtime, a bound segment whose value is null, undefined or blank (empty or whitespace-only) refuses the call before any token or I/O with 400 INTERSERVICE_PATH_PARAM_UNBOUND, naming the action, the target, the route and the segment. Not required when the call really rides gRPC (the target declares a gRPC controller and `transport` is `grpc` or `auto`); a `transport: "grpc"` call against a target WITHOUT a gRPC controller falls back to REST and is checked like any REST call. An `applyField` call declares no apiParameters at all: its one id segment is bound through `applyField.recordId`. |
| `responseProperty` | `String` | no |  |  |  | If defined, only the specified property will be extracted from the target API response; otherwise the full response body is stored. It indexes the PRODUCER'S RESPONSE BODY, which under the unified response contract is the record itself at the root (with `_type`) for a single-item target — there is NO resource-named wrapper, so a value like `order` or `profile` on a get/create/update/delete target matches nothing and silently falls back to the whole body. Valid values are a record property (or an `addToResponse`/`writeToResponse` key) on a single-item target, or `data` / `paging` on a LIST target, whose body is the AIP `{ data, paging }` envelope. Leave it unset to store the whole record — that is the normal choice for a single-item call. Over REST, the stored result is decoded by the target's SUCCESS content-type (its bare media type: parameters ignored, any case): `application/json` and the `application/json-*` family are the parsed body; any other textual type (`text/*`, a `+json` type such as `application/problem+json`, a `+xml` type, `application/xml`, `application/x-www-form-urlencoded`) or no content-type at all is the body STRING; any other type (a file download: `application/pdf`, an xlsx or zip vendor type, `application/octet-stream`, `image/*`) is a Buffer holding the exact bytes. The file's filename and content-type are not exposed. Leave responseProperty unset on a file-download target. |
| `isArray` | `Boolean` | yes |  |  |  | If true, the result is expected to be an array. This influences how the response is processed and stored. |
| `forwardCallerToken` | `Boolean` | no | `false` |  |  | When `true`, forward the inbound caller's session token to the downstream service as `Authorization: Bearer <token>` so the call runs under the user's identity (downstream sees the actual `session.userId` / `roleId` / ownership context). The M2M token still rides alongside as `x-m2m-token` for server-to-server trust, so both checks pass and the downstream can prefer whichever its auth middleware reads first. When `false` (default) the call goes M2M-only and the downstream sees no user session — appropriate for system-level audit writes, background jobs invoked by cron, or other contexts where the original caller's identity is irrelevant. Set `true` whenever the downstream API should apply user-role / ownership checks (e.g. an orderService.createOrder call from cartService should preserve the buyer's identity, not run as the cartService service account). |
| `transport` | `InterserviceTransport` | no | `"auto"` | `auto`, `rest`, `grpc` |  | Selects the transport for the interservice call. `auto` (default) uses gRPC automatically when the target Business API has a gRPC controller (`grpcSettings.hasGrpcController`), otherwise REST — for a gRPC-only target this is the only path that works. `rest` forces the HTTP/REST path (the target's normal REST route, with the forwarded caller bearer). `grpc` forces the gRPC path (requires the target to expose a gRPC controller; against a target without one the generated action silently falls back to REST, which draws the INTERSERVICE_GRPC_TRANSPORT_FALLBACK warning). The designer rarely needs to set this — `auto` picks the fastest available transport with no other blueprint changes. |
| `tenantContext` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript expression yielding the CODENAME of the tenant this call must run inside, on a multi-tenant project. The generated call lowers it onto the outbound request as the tenant selector the receiving service's auth pipeline reads (the `mbx-<tenantName>-codename` header, or the project's `tenantNameHeaderName` override), NOT into the request body - so it reaches the receiver's tenant resolution rather than its parameter validation, which is where a hand-placed `_<tenantName>` apiParameters entry lands and is discarded (INTERSERVICE_PARAM_UNPLACEABLE). Use it when the hop has to act inside a tenant that is not the caller's own, or that the caller has no session in: provisioning an invited user into the workspace the invitation names, a cron sweep acting per tenant. A hop that declares no tenantContext and forwards no caller token signs the calling manager's own VERIFIED tenant (the session's tenant, a kafka event actor's tenant, a verified machine caller's claim) into its machine token as the `callerTenantId` claim, so it runs in the caller's own tenant and never in another; a caller with no verified tenant (the root floor, a tenant named only by an anonymous request's header) signs nothing, and the receiver then refuses a tenant-level api (the framework's own payment machine twins included) with 403 `M2M_TENANT_REQUIRED` or, on a platform-level api, serves the ROOT tenant's rows. A hop that forwards the caller's token (`forwardCallerToken`) runs in the tenant of that session. A declared tenantContext wins over the signed claim's default and rides the codename header; an expression that evaluates to null or an empty string REFUSES the call at runtime rather than sending it tenant-less. Leave it unset on a single-tenant project and on any hop that should run in the caller's own tenant. |
| `timeoutMs` | `Integer` | no |  |  |  | Optional positive integer timeout in milliseconds, at most 2147483647 (the Node.js timer maximum), for REST and gRPC inter-service calls. Overrides the service default INTER_SERVICE_TIMEOUT_MS (a positive integer at most 2147483647); an unset environment variable uses 10000 ms, and an invalid environment value logs a warning and falls back to 10000 ms. When omitted, the generated action carries no timeout override. |
| `applyField` | [`InterserviceApplyField`](./InterserviceApplyField.md) | no |  |  |  | Applies ONE data-determined field on one record of the target service through the target's own typed update API (InterserviceApplyField). Use it when the NAME of the field to set is data, for example `this.proposedChange.targetField`: an apiParameters entry's `name` is static, so apiParameters cannot express that call. `targetApi` must be an `update` API of `targetService` whose REST route carries exactly one `:segment`, its id segment; `recordId` binds it, `field` names the target update API's request parameter to set, `value` is the value, and `allowedFields` is the design-time whitelist of names `field` may evaluate to. Every `allowedFields` entry must be in the target update API's write set (a caller-supplied request parameter that one of its dataClauseItems stores into an update-writable property), otherwise INTERSERVICE_APPLY_FIELD_NOT_UPDATABLE. At runtime a `field` outside `allowedFields` refuses the call with 400 INTERSERVICE_APPLY_FIELD_NOT_ALLOWED and an undefined `value` with 400 INTERSERVICE_APPLY_FIELD_VALUE_UNDEFINED, both before any token is minted or any request is sent; an accepted call is an ordinary update request, so the target runs its normal guard pipeline (authorization, ownership, lifecycle hooks) on it. Exclusive with `apiParameters` (INTERSERVICE_APPLY_FIELD_WITH_API_PARAMETERS). Always rides REST, so `transport: "grpc"` is refused (INTERSERVICE_APPLY_FIELD_TRANSPORT_UNSUPPORTED). Generated by the nodejs, rust, java, dotnet and python emitters: a calling service whose language is golang is refused with INTERSERVICE_APPLY_FIELD_LANGUAGE_UNSUPPORTED. Null or absent = an ordinary static-name call. |

## Constraints

Property rules:

- `targetService`, `targetApi`, `isArray` must be present. (`REQUIRED_FIELD_MISSING`)
- `transport` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- The items of `apiParameters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `API_NOT_FOUND` | error, warning | Interservice call target API "…" cannot be verified: service "…" is declared but publishes no Business APIs yet (not yet blueprinted/populated). |
| `INTERSERVICE_FORWARDED_CALLER_ROLE_GATE` | warning | This call forwards the caller's session token to "….…", and that API is role-gated (authOptions.checkRoles […]…). |
| `INTERSERVICE_GRPC_TRANSPORT_FALLBACK` | warning | Interservice call to "….…" declares transport "grpc", but "…" declares no gRPC controller (controllers.grpcSettings.hasGrpcController), so the generated action silently falls back to the target's REST route: the declared … |
| `INTERSERVICE_LIST_ENVELOPE_AS_ARRAY` | warning | This call binds the LIST API "…" on service "…" without a responseProperty, but … — the bound context value is the whole { data, paging } list envelope (inside the interservice call result), never an array, so the array … |
| `INTERSERVICE_PARAM_MISSING` | warning |  |
| `INTERSERVICE_PARAM_UNPLACEABLE` | warning | Interservice call parameter "…" is this project's TENANT SELECTOR, not a parameter of API "…" on service "…" — the target declares […] and reads nothing under "…" as a parameter, so the value is sent and silently … |
| `INTERSERVICE_PATH_PARAM_UNBOUND` | error | Interservice call to API "…" on service "…" leaves route segment ":…" of its REST route "…" unbound: no apiParameters entry is named "…"…. |
| `INTERSERVICE_RESPONSE_PROPERTY_UNKNOWN` | error | responseProperty "…" is not a key the target API "…" on service "…" ever publishes — its … response carries: …. |
| `INTERSERVICE_TARGET_NOT_MOUNTED` | error | Interservice call to "….…" rides REST (…), but "…" declares controllers.restSettings.hasRestController: false, so its REST route is never mounted: every call answers 404 and this action fails (or is silently skipped … |
| `INTERSERVICE_TARGET_UNREACHABLE` | error | Interservice call target "….…" cannot authenticate this caller. |
| `INTERSERVICE_TENANT_CONTEXT_INERT` | warning | This interservice call declares a "tenantContext", but the project is not multi-tenant (authentication.loginDefinition.tenantSettings.useMultiTenantFeature is not true, or no tenantName is set). |
| `INTERSERVICE_TIMEOUT_INVALID` | error | timeoutMs must be a positive integer number of milliseconds <= 2147483647, or omitted to use the service default. |
| `M2M_CALLER_BLOCKED` | warning | Service "…" blocks M2M callers […], and calling service "…" is on that list — this interservice call is rejected at runtime with 403 (the block list wins over allowedM2MClients). |
| `M2M_CALLER_NOT_ALLOWED` | warning | Service "…" restricts M2M callers to […], and calling service "…" is not on the list — this interservice call is rejected at runtime with 403. |
| `SERVICE_NOT_FOUND` | warning | Interservice call target service "…" is declared in this project but not yet blueprinted. |

## Example

Use to call a Business API in another microservice within the same OpenAPPL application — set forwardCallerToken=true when the downstream must apply the original user's role/ownership checks (e.g. cartService asking orderService to create an order for the buyer).

```json
{
  "name": "createOrderInOrderService",
  "description": "Hand the validated cart to orderService.createOrder under the buyer's identity.",
  "targetService": "orderService",
  "targetApi": "createOrder",
  "apiParameters": [
    {
      "name": "items",
      "value": { "js": "this.lineItems" }
    },
    {
      "name": "shippingAddressId",
      "value": { "js": "this.data.shippingAddressId" }
    },
    {
      "name": "couponCode",
      "value": { "js": "this.data.couponCode" }
    }
  ],
  "isArray": false,
  "forwardCallerToken": true,
  "contextPropertyName": "createdOrder"
}
```
