# ForeignPermissionProvider

**Level:** `chapter` · **Family:** [ForeignPermissionProvider](./families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Specification:** [ForeignPermissionProvider in Part 2](../spec/ForeignPermissionProvider.md)

Project-wide foreign permission server configuration (one foreign server, one transport). Codegen generates ONE permission client per service from this block — a gRPC stub (proto emitted from `protoSource`, called via grpcUnaryCall) or a REST caller (fetch) — shared by every api that opts in via `authOptions.foreignPermissionCheck`. `endpoint` / `headers` / `tls.caCert` `$ENV:` refs resolve at runtime.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `foreignPermissionProvider`

Blueprint paths:

- `authentication.foreignPermissionProvider`

## Contains

- `providerBasics`: [ForeignPermissionProviderBasics](./ForeignPermissionProviderBasics.md)
- `tls`: [GrpcClientTls](./GrpcClientTls.md)
- `headers`: [GrpcClientMetadataItem](./GrpcClientMetadataItem.md), a list
- `sessionBindings`: [ForeignPermissionSessionBinding](./ForeignPermissionSessionBinding.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
