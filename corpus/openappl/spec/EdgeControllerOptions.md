# EdgeControllerOptions

**Level:** `section` · **Family:** [EdgeController](../ontology/families.md#edgecontroller) (domain `Service`)

**Ontology:** [EdgeControllerOptions in Part 1](../ontology/EdgeControllerOptions.md)

Options that define the execution behavior of the edge controller, including the function to call and login requirement.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `functionName` | `String` | yes |  |  |  | The name of the function defined in the service library that will handle this controller's logic. The function must be an async module under 'edgeFunctions'. RETURN CONTRACT: it returns either a plain value, serialised as JSON with HTTP 200, or a response envelope { status, headers, body } (a numeric status TOGETHER with a body and/or a plain-object headers member), which is honoured verbatim: the status is set, the headers are set, a Buffer or string body is sent raw (binary downloads) and any other body is JSON-serialised. A bare { status: 200, ... } with no body/headers stays a JSON body, so legacy handlers are unaffected. Throwing an error carrying a numeric .status answers that code as problem+json. |
| `M2MAllowed` | `Boolean` | no | `false` |  |  | If true, this edge controller accepts machine callers: a service token sent as `x-m2m-token` (an `Authorization: Bearer` is accepted only when it verifies as a service token) that VERIFIES through the same service-identity verifier the Business APIs use, from a calling service this service admits (`serviceOptions.allowedM2MClients` / `blockedM2MClients`). A token is never accepted for its shape: an unsigned or foreign-key token is 401, and a verified service the lists refuse is 403 M2M_CLIENT_NOT_ALLOWED. With loginRequired:false this is an M2M-ONLY edge route (a user session alone does not pass, 401 M2M_TOKEN_REQUIRED). With loginRequired:true the route accepts a user session OR such a token. Unlike a Business API, where loginRequired:false means public, the edge pair has a real m2m mode. The edge function sees the verified caller as ctx.isM2M / ctx.m2mIssuer. |
| `loginRequired` | `Boolean` | no | `true` |  |  | Whether the caller must be logged in to access this edge route. If true (the default), the generated adapter requires a user session before invoking the function (401 SESSION_REQUIRED), or, when M2MAllowed is also true, a user session OR a verified and admitted service token. False with M2MAllowed:true is M2M-only; false with M2MAllowed:false is a public route. |
| `loadShedTier` | `Integer` | no |  |  |  | Optional shed-priority tier (integer 0-5) this edge controller declares for itself when the owning service runs a `loadShield` (0 = never shed; 5 = first to shed). The per-API counterpart of the shield's central `loadShield.tiers.assignments[]` — same semantics as BusinessApi `apiOptions.loadShedTier`. PRECEDENCE (most specific wins): central action-narrowed assignment > central api-level assignment > this `loadShedTier` > the derived default (edge routes classify by HTTP verb: GET 3, mutating 2). INERT without a declared/enabled shield (byte-identical output; validation warns with LOADSHIELD_TIER_WITHOUT_SHIELD). Only the REST-enabled route is shielded — kafka/cron triggers are structurally outside the shield's path. Values outside 0-5 fail validation (LOADSHIELD_TIER_INVALID). |

## Constraints

Property rules:

- `functionName` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EDGE_FUNCTION_NAME_INVALID` | error | functionName "…" is not a valid JavaScript identifier. |
| `EDGE_PUBLIC_ENDPOINT` | warning | EdgeController has loginRequired:false and M2MAllowed:false — this endpoint is publicly accessible (no auth check). |
