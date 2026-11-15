# FunctionCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [FunctionCallAction in Part 2](../spec/FunctionCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Defines a reusable logic step that calls a library-defined function using MScript syntax. This action allows for custom transformation, enrichment, or computation during the execution of a Business API. It is often used to prepare derived values, calculate totals, or apply shared service logic prior to validation or response shaping.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `functionCallActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.functionCallActions`
- `services.businessLogic.actions.functionCallActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
