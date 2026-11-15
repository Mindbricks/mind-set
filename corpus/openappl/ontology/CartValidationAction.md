# CartValidationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CartValidationAction in Part 2](../spec/CartValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Validates a shopping cart before checkout. Checks that items exist, stock is available, prices are valid, and minimum order requirements are met. The validation results are written to the context for use in subsequent actions.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `cartValidationActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.cartValidationActions`
- `services.businessLogic.actions.cartValidationActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
