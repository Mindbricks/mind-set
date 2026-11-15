# WriteToRedisAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [WriteToRedisAction in Part 2](../spec/WriteToRedisAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Writes a value to Redis under a computed key. The value is defined via MScript and can include dynamic data from the current context. This is typically used for storing transient data such as verification tokens, process state, or temporary API results.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `writeToRedisActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.writeToRedisActions`
- `services.businessLogic.actions.writeToRedisActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
