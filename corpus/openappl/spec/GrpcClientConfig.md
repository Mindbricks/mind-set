# GrpcClientConfig

**Level:** `section` · **Family:** [ServiceSettings](../ontology/families.md#servicesettings) (domain `Service`)

**Ontology:** [GrpcClientConfig in Part 1](../ontology/GrpcClientConfig.md)

**Name:** an instance is named by `name`.

A named, FOREIGN gRPC server this service can call via a `GrpcCallAction` (docs/ADR-grpc-interservice-and-grpccall.md, Part B). Declared under `serviceSettings.grpcClients[]`. The designer supplies the foreign server's `.proto` (primarily as INLINE `protoSource` text; a path/URL is a documented follow-on) plus the `package`/`service` to load from it; codegen writes that proto into the caller's gRPC-client assets (`controllers/grpc/proto/<name>.proto`) and the runtime loads it through the shared `grpcUnaryCall` engine by a `__dirname`-relative path. `endpoint` is a literal `host:port` or a `$ENV:VAR` reference resolved from the environment at runtime. `metadata[]` are STATIC headers (e.g. an API-key / Bearer token the foreign server expects — there is no OpenAPPL M2M trust to a foreign server) and may themselves use `$ENV:` refs. `tls` selects insecure (dev default) vs SSL.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique codeName for this gRPC client within the service. Referenced by `GrpcCallAction.grpcClientName`. |
| `endpoint` | `String` | yes |  |  |  | The foreign gRPC server's address. Either a literal `host:port` (e.g. `payments.internal:50051`) or a `$ENV:VAR` reference (e.g. `$ENV:PAYMENT_GRPC_URL`) resolved from the environment at runtime. Prefer `$ENV:` so the endpoint isn't baked into the generated code. |
| `protoSource` | `Text` | yes |  |  |  | The FOREIGN server's `.proto` contract, supplied INLINE as proto text (the primary form). Codegen writes it verbatim to `controllers/grpc/proto/<name>.proto` so the runtime loads it through proto-loader with the same options the gRPC server uses. The proto MUST declare the `package` and `service` named below. (A path/URL source is a documented follow-on.) |
| `package` | `String` | yes |  |  |  | The proto `package` name to load from `protoSource` (e.g. `payment`). Must match the `package` declared in the proto. |
| `service` | `String` | yes |  |  |  | The proto `service` name to load from `protoSource` (e.g. `PaymentService`). Must match a `service` declared in the proto; `GrpcCallAction.grpcMethodName` must be one of its rpc methods. |
| `metadata` | [`GrpcClientMetadataItem`](./GrpcClientMetadataItem.md)[] | no |  |  |  | Optional STATIC metadata headers sent on every call to this foreign server (e.g. an API key or a Bearer token the server expects). Each value may be a literal string or a `$ENV:VAR` reference resolved at runtime. Unlike the interservice gRPC path, there is no OpenAPPL M2M trust to a foreign server — auth is whatever the foreign server requires, declared here. |
| `tls` | [`GrpcClientTls`](./GrpcClientTls.md) | no |  |  |  | Optional transport security. When omitted or `mode: 'insecure'` (the dev default) the channel uses insecure credentials — matching the interservice gRPC default. `mode: 'ssl'` uses TLS; `caCert` (literal PEM or `$ENV:VAR`) overrides the system trust roots when the server presents a private/self-signed certificate. |

## Constraints

Property rules:

- `name`, `endpoint`, `protoSource`, `package`, `service` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `metadata` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `GRPC_PROTO_PACKAGE_MISMATCH` | error | protoSource does not declare `package …;` — the package name must match the proto. |
| `GRPC_PROTO_SERVICE_MISMATCH` | error | protoSource does not declare `service … {…}` — the service name must match the proto. |
