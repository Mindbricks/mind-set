# ApiPermissionCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiPermissionCheck in Part 2](../spec/ApiPermissionCheck.md)

Per-BusinessApi NATIVE permission gate (ADR-native-permission-system §9.5). `permission` is a declared `PermissionGroup` permission name the caller must hold for this API; the runtime resolver decides it through the layered model (object/user override → object-role → multi-scope membership → global role → ownership). `scopeFields` is an OPTIONAL multi-scope channel: the request/instance FK fields whose ids form the `scopeMap` the resolver checks object-roles (L3) + memberships (L4) on. This is the native counterpart to `foreignPermissionCheck` (the two are mutually exclusive per API).

## Contained in

- [ApiAuthOptions](./ApiAuthOptions.md) as `permissionCheck`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
