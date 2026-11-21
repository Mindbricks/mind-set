# GrpcCallAction

Call a method on a declared external gRPC client. Bind request fields from workflow context. For server-streaming calls, collect response messages and apply `responsePath` to each one. Validation reports `GRPC_CLIENT_NOT_FOUND` for an undeclared client. Client-streaming and bidirectional methods are outside this action's contract.

See the [pattern reference](../../spec/GrpcCallAction.md) and the [gRPC interservice guide](../capabilities/grpc-interservice.md).
