# CartCheckoutAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CartCheckoutAction in Part 2](../spec/CartCheckoutAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Processes shopping cart checkout. Handles inventory reservation, promotion usage recording, order creation, and cart clearing. The checkout result is written to the context.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `cartCheckoutActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.cartCheckoutActions`
- `services.businessLogic.actions.cartCheckoutActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
