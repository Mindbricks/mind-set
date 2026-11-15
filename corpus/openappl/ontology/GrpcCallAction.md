# GrpcCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [GrpcCallAction in Part 2](../spec/GrpcCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls a FOREIGN (non-OpenAPPL) gRPC server during Business API execution (docs/ADR-grpc-interservice-and-grpccall.md, Part B). The gRPC counterpart of `ApiCallAction`: instead of a URL it targets a named gRPC client (declared in `serviceSettings.grpcClients[]`) and an rpc method. The request message is built from compiled MScript `request.fields` (like ApiCallAction compiles its body/headers); the call rides the shared `grpcUnaryCall` engine (the same engine the interservice gRPC path uses) with the grpcClient's static metadata attached; the decoded Response is extracted by `responsePath` and stored in context (and optionally written to the response). For an OpenAPPL target, prefer `InterserviceCallAction` (transport auto-selects gRPC with zero proto config); use `GrpcCallAction` for third-party gRPC services whose proto you supply via the grpcClient.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `grpcCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.grpcCallActions`
- `services.businessLogic.actions.grpcCallActions`

## Contains

- `request`: [GrpcCallRequest](./GrpcCallRequest.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
