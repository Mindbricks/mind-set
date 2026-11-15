# ForeignPermissionSessionBinding

**Level:** `section` · **Family:** [ForeignPermissionProvider](./families.md#foreignpermissionprovider) (domain `ProjectAuthentication`)

**Specification:** [ForeignPermissionSessionBinding in Part 2](../spec/ForeignPermissionSessionBinding.md)

One session-field → request-PLACEMENT binding. The gate pulls `this.session.<from>` (the caller's application JWT is reachable as `accessToken`) and PLACES it on the permission request per `in`: into the bearer token, a request header, the JSON body, or a query param — under key `<as>` (ignored for `bearer`, which is always `Authorization: Bearer <value>`).

## Contained in

- [ForeignPermissionProvider](./ForeignPermissionProvider.md) as `sessionBindings` (a list)

Blueprint paths:

- `authentication.foreignPermissionProvider.sessionBindings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
