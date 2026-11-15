# ReadJwtTokenAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ReadJwtTokenAction in Part 2](../spec/ReadJwtTokenAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a read jwt token operation from either context, session or request and write its payload to the context with the contextPropertyName after validating it. The token signature should be in HMAC format. The token payload may be used for allowing access to an object via a signed token instead of standard authentication. This is typically used for public or limited-access sharing workflows (e.g., view-only links). Once the token payload is in context any other validations may be performed using the payload values in further actions.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `readJwtTokenActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.readJwtTokenActions`
- `services.businessLogic.actions.readJwtTokenActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
