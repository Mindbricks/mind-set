# ReadFromRedisAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [ReadFromRedisAction in Part 2](../spec/ReadFromRedisAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Reads a value from Redis using a dynamically computed key and writes the result into the context under a specified property name (contextPropertyName). This action is typically used to retrieve session data, temporary values, or cached results that are needed later in the API flow. The retrieved value becomes accessible to other actions using `this.<contextName>`.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `readFromRedisActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.readFromRedisActions`
- `services.businessLogic.actions.readFromRedisActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
