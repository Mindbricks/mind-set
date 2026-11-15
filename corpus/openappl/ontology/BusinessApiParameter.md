# BusinessApiParameter

**Level:** `section` · **Family:** [BusinessApiParameters](./families.md#businessapiparameters) (domain `BusinessApi`)

**Specification:** [BusinessApiParameter in Part 2](../spec/BusinessApiParameter.md)

Defines a customizable input parameter for a Business API. Parameters are extracted from the incoming request, transformed and validated, and then written directly to the API context under `this.<name>`. These parameters may originate from any request part (e.g., body, query, session), and can be combined with Redis-based or auto-generated parameters.

## Contained in

- [BusinessApiParameters](./BusinessApiParameters.md) as `requestParameters` (a list)

Blueprint paths:

- `authentication.businessLogic.parameters.requestParameters`
- `services.businessLogic.parameters.requestParameters`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
