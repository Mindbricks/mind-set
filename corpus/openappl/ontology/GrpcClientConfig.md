# GrpcClientConfig

**Level:** `section` · **Family:** [ServiceSettings](./families.md#servicesettings) (domain `Service`)

**Specification:** [GrpcClientConfig in Part 2](../spec/GrpcClientConfig.md)

A named, FOREIGN gRPC server this service can call via a `GrpcCallAction` (docs/ADR-grpc-interservice-and-grpccall.md, Part B). Declared under `serviceSettings.grpcClients[]`. The designer supplies the foreign server's `.proto` (primarily as INLINE `protoSource` text; a path/URL is a documented follow-on) plus the `package`/`service` to load from it; codegen writes that proto into the caller's gRPC-client assets (`controllers/grpc/proto/<name>.proto`) and the runtime loads it through the shared `grpcUnaryCall` engine by a `__dirname`-relative path. `endpoint` is a literal `host:port` or a `$ENV:VAR` reference resolved from the environment at runtime. `metadata[]` are STATIC headers (e.g. an API-key / Bearer token the foreign server expects — there is no OpenAPPL M2M trust to a foreign server) and may themselves use `$ENV:` refs. `tls` selects insecure (dev default) vs SSL.

## Contained in

- [ServiceSettings](./ServiceSettings.md) as `grpcClients` (a list)

Blueprint paths:

- `services.serviceSettings.grpcClients`

## Contains

- `metadata`: [GrpcClientMetadataItem](./GrpcClientMetadataItem.md), a list
- `tls`: [GrpcClientTls](./GrpcClientTls.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
