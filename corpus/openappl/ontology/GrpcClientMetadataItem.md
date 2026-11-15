# GrpcClientMetadataItem

**Level:** `section` · **Family:** [ForeignPermissionProvider](./families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Specification:** [GrpcClientMetadataItem in Part 2](../spec/GrpcClientMetadataItem.md)

A single STATIC gRPC metadata header sent on every call to a foreign gRPC server (see GrpcClientConfig.metadata). The value is a literal string or a `$ENV:VAR` reference resolved at runtime — NOT MScript (these are static credentials, not per-call dynamic values).

## Contained in

- [ForeignPermissionProvider](./ForeignPermissionProvider.md) as `headers` (a list)
- [GrpcClientConfig](./GrpcClientConfig.md) as `metadata` (a list)

Blueprint paths:

- `authentication.foreignPermissionProvider.headers`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
