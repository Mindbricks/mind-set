# ServiceSettings

**Level:** `chapter` · **Family:** [ServiceSettings](../ontology/families.md#servicesettings) (domain `Service`)

**Ontology:** [ServiceSettings in Part 1](../ontology/ServiceSettings.md)

Defines the foundational settings of the service module, including basic metadata and authentication configurations. These settings must be established before designing the service's data model. They determine the service's identity, behavior within the project, and how it handles authentication. This configuration acts as the entry point for service-level behavior, ensuring consistency and security from the outset of development.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `serviceBasics` | [`ServiceBasics`](./ServiceBasics.md) | yes |  |  |  | Defines the basic metadata of the service, including its unique name, description, and optional custom configuration variables. These basics are used throughout code generation, routing, and documentation. |
| `serviceOptions` | [`ServiceOptions`](./ServiceOptions.md) | no |  |  |  | Defines basic options of the service for authentication, http and data model |
| `realtimeConfig` | [`RealtimeConfig`](./RealtimeConfig.md) | no |  |  |  | Configures the Socket.IO server for realtime hubs and WebSocket event subscriptions. Only relevant when the service has at least one RealtimeHub or WebSocket EventSubscription. Controls the scaling adapter (Redis for multi-instance, memory for dev), heartbeat timings, and per-user connection limits. |
| `grpcClients` | [`GrpcClientConfig`](./GrpcClientConfig.md)[] | no |  |  |  | A list of FOREIGN (non-OpenAPPL) gRPC servers this service can call from a `GrpcCallAction` (docs/ADR-grpc-interservice-and-grpccall.md, Part B). Each entry declares a named gRPC client: the foreign server's endpoint, its `.proto` contract (supplied INLINE as `protoSource` — the codegen writes it into the caller's gRPC-client assets at `controllers/grpc/proto/<name>.proto`), the `package`/`service` to load from that proto, optional static auth metadata headers, and optional TLS. A `GrpcCallAction` references one of these by `grpcClientName` and a `grpcMethodName`. This is the foreign-server counterpart of the auto-selected interservice gRPC path (Part A): an OpenAPPL target is known to the framework and needs zero config, while a foreign target is declared here once. Calls ride the shared `grpcUnaryCall` engine — same engine the interservice gRPC branch uses. |

## Constraints

Property rules:

- `serviceBasics` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `grpcClients` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
