# ForeignPermissionProviderBasics

**Level:** `section` · **Family:** [ForeignPermissionProvider](../ontology/families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Ontology:** [ForeignPermissionProviderBasics in Part 1](../ontology/ForeignPermissionProviderBasics.md)

Transport and decision policy of the foreign permission server (one server, one transport). Carries the grpc/rest selector, the endpoint, the transport-specific binding (proto package/service/method for grpc; restMethod/restPath/requestIn for rest), and the deny/message/status/failOpen/cache rules classified over the server's response.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `type` | `ForeignPermissionProviderType` | yes |  | `grpc`, `rest` |  | Transport for the permission server: `grpc` (call a foreign gRPC `service.method` via the shipped grpcUnaryCall machinery, proto emitted from `protoSource`) or `rest` (HTTP `fetch` to `endpoint + restPath`). REQUIRED. |
| `endpoint` | `String` | yes |  |  |  | The permission server address. For gRPC: a `host:port` (e.g. `permissions.internal:50051`). For REST: a base URL (e.g. `https://perm.internal`). Either a literal or a `$ENV:VAR` reference (e.g. `$ENV:PERMISSION_SERVER_URL`) resolved at runtime. Prefer `$ENV:` so the endpoint isn't baked into the generated code. REQUIRED. |
| `protoSource` | `Text` | no |  |  |  | [grpc only] The FOREIGN permission server's `.proto` contract, supplied INLINE as proto text. Codegen writes it verbatim and loads it through proto-loader. The proto MUST declare the `package` and `service` named below, and the `method` must be one of that service's rpc methods. A request can use explicit proto fields matching the params/sessionBindings keys, or `google.protobuf.Struct` for a fully-dynamic map. |
| `package` | `String` | no |  |  |  | [grpc only] The proto `package` name to load from `protoSource` (e.g. `permission`). Must match the `package` declared in the proto. |
| `service` | `String` | no |  |  |  | [grpc only] The proto `service` name to load from `protoSource` (e.g. `Permission`). Must match a `service` declared in the proto. |
| `method` | `String` | no |  |  |  | [grpc only] The rpc method name to invoke on `service` (e.g. `Check`). Must be declared in the proto. Unary only. |
| `restMethod` | `ForeignPermissionRestMethod` | no | `"POST"` | `POST`, `GET` |  | [rest only] HTTP method used to call the permission server (`POST` default or `GET`). |
| `restPath` | `String` | no |  |  |  | [rest only] The path appended to `endpoint` for the permission check (e.g. `/check`). REQUIRED for rest. |
| `requestIn` | `ForeignPermissionRequestIn` | no | `"body"` | `body`, `query` |  | [rest only] Where the merged request (params + sessionBindings) is placed on the HTTP call: `body` (JSON body, default — for POST) or `query` (query string — for GET). |
| `denyWhen` | `String` | no |  |  |  | MScript RULE evaluated with `result` bound to the RAW server response (any shape — boolean / int / string / complex object); TRUE ⇒ DENY. E.g. `!result.allowed` \| `result !== 'GRANTED'` \| `result.code != 0`. When omitted the default rule is `result === false \|\| result?.allowed === false`. (Interpreted in Phase 2.) |
| `messageFrom` | `String` | no |  |  |  | Optional MScript over `result` → the user-facing deny message (e.g. `result.message \|\| result.errorCode`). The per-api `denyMessage` takes precedence when both are set. (Interpreted in Phase 2.) |
| `statusFrom` | `String` | no |  |  |  | Optional MScript over `result` → the HTTP status to raise on deny (e.g. `result.status` to honor 401 invalid-token / 403 denied / 400 / 500). Defaults to 403 when omitted. (Interpreted in Phase 2.) |
| `failOpen` | `Boolean` | no | `false` |  |  | Transport error / server down policy: `false` (default, fail-CLOSED → deny/403) vs `true` (fail-OPEN → allow). Default fail-closed for safety. A REST answer with a non-2xx HTTP status is a failed check too, whatever its body says, unless the body is an explicit deny (`denyWhen` true), which denies with its own status and message: a 500 `{ error }` or a 404 problem document is never an allow. Both transports are bounded at 10000 ms (the REST fetch through an abort signal, the grpc call through its deadline); a call that outlives it is a transport error. A failed check is never cached. (Interpreted in Phase 2.) |
| `cacheTtlSeconds` | `Integer` | no | `0` |  |  | Optional Redis result cache for the permission DECISION (the latency follow-on the ADR flags). When > 0, the gate caches the classified allow/deny outcome (message + detail + status) keyed by a stable hash of the SUBJECT + the QUESTION — `sha256(<projectCodename>:foreignperm:<session.userId ?? 'guest'>:<hash of the compiled params>)`, NOT the volatile bearer token — and checks it BEFORE calling the server, so the same user asking the same permission in the same scope reuses the cached decision across requests/sessions for this many seconds. On a miss it calls the server, classifies, then stores the outcome with this TTL (BOTH allow and deny are cached). Redis errors are fail-soft (fall through to a live call). `0` (default) or absent = NO cache: behavior is byte-identical to the always-call gate. |

## Constraints

Property rules:

- `type`, `endpoint` must be present. (`REQUIRED_FIELD_MISSING`)
- `type`, `restMethod`, `requestIn` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
