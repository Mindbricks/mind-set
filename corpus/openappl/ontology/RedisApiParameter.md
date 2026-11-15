# RedisApiParameter

**Level:** `section` · **Family:** [BusinessApiParameters](./families.md#businessapiparameters) (domain `BusinessApi`)

**Specification:** [RedisApiParameter in Part 2](../spec/RedisApiParameter.md)

Defines a parameter whose value is fetched from Redis before Business API execution begins. The result is written directly to the context as `this.<name>`, making it accessible like any other parameter. This is useful for injecting server-side or cached state without requiring the client to send it explicitly.

## Contained in

- [BusinessApiParameters](./BusinessApiParameters.md) as `redisParameters` (a list)

Blueprint paths:

- `authentication.businessLogic.parameters.redisParameters`
- `services.businessLogic.parameters.redisParameters`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
