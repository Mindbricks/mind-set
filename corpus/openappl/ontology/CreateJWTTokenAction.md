# CreateJWTTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CreateJWTTokenAction in Part 2](../spec/CreateJWTTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Generates a signed JWT token from a given payload. This token can be stored in context or included in the API response for client use. Typically used for authentication or temporary session flows.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `createJWTTokenActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.createJWTTokenActions`
- `services.businessLogic.actions.createJWTTokenActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
