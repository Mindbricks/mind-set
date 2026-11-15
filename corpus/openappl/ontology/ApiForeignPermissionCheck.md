# ApiForeignPermissionCheck

**Level:** `subsection` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [ApiForeignPermissionCheck in Part 2](../spec/ApiForeignPermissionCheck.md)

Per-BusinessApi foreign-permission question. `params` is a FREE MScript map (arbitrary keys; each value MScript evaluated against the api context `this`) sent to the project's `foreignPermissionProvider`. `denyMessage` is an optional manual 403 message overriding the provider's `messageFrom`.

## Contained in

- [ApiAuthOptions](./ApiAuthOptions.md) as `foreignPermissionCheck`

## Contains

- `params`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
