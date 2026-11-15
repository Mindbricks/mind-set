# GrpcClientTls

**Level:** `section` · **Family:** [ForeignPermissionProvider](./families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Specification:** [GrpcClientTls in Part 2](../spec/GrpcClientTls.md)

Transport security for a foreign gRPC client (see GrpcClientConfig.tls). `insecure` (default) matches the interservice gRPC dev default; `ssl` enables TLS with an optional CA override for private / self-signed server certificates.

## Contained in

- [ForeignPermissionProvider](./ForeignPermissionProvider.md) as `tls`
- [GrpcClientConfig](./GrpcClientConfig.md) as `tls`

Blueprint paths:

- `authentication.foreignPermissionProvider.tls`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
