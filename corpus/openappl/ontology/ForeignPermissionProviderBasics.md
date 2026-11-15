# ForeignPermissionProviderBasics

**Level:** `section` · **Family:** [ForeignPermissionProvider](./families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Specification:** [ForeignPermissionProviderBasics in Part 2](../spec/ForeignPermissionProviderBasics.md)

Transport and decision policy of the foreign permission server (one server, one transport). Carries the grpc/rest selector, the endpoint, the transport-specific binding (proto package/service/method for grpc; restMethod/restPath/requestIn for rest), and the deny/message/status/failOpen/cache rules classified over the server's response.

## Contained in

- [ForeignPermissionProvider](./ForeignPermissionProvider.md) as `providerBasics`

Blueprint paths:

- `authentication.foreignPermissionProvider.providerBasics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
