# BusinessApiParameters

**Level:** `chapter` · **Family:** [BusinessApiParameters](./families.md#businessapiparameters) (domain `BusinessApi`)

**Specification:** [BusinessApiParameters in Part 2](../spec/BusinessApiParameters.md)

Parameter sources of a `BusinessApi` (section): custom `requestParameters` (validated request inputs fed into the workflow context) and `redisParameters` (values read from Redis into the context).

## Contained in

- [BusinessApi](./BusinessApi.md) as `parameters`

Blueprint paths:

- `authentication.businessLogic.parameters`
- `services.businessLogic.parameters`

## Contains

- `requestParameters`: [BusinessApiParameter](./BusinessApiParameter.md), a list
- `redisParameters`: [RedisApiParameter](./RedisApiParameter.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
