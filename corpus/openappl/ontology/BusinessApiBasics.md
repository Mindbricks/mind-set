# BusinessApiBasics

**Level:** `chapter` · **Family:** [BusinessApiBasics](./families.md#businessapibasics) (domain `BusinessApi`)

**Specification:** [BusinessApiBasics in Part 2](../spec/BusinessApiBasics.md)

Groups a BusinessApi's core API options and authentication settings. Core identity and authentication settings of a `BusinessApi` (section) — groups `apiOptions` (name, crud type, target data object, response shape) and `authOptions` (login requirement + permission checks).

## Contained in

- [BusinessApi](./BusinessApi.md) as `basics`

Blueprint paths:

- `authentication.businessLogic.basics`
- `services.businessLogic.basics`

## Contains

- `apiOptions`: [ApiOptions](./ApiOptions.md)
- `authOptions`: [ApiAuthOptions](./ApiAuthOptions.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
