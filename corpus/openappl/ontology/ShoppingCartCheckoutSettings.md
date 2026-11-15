# ShoppingCartCheckoutSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartCheckoutSettings in Part 2](../spec/ShoppingCartCheckoutSettings.md)

Configuration for cart-to-order checkout process. Defines how checkout converts a cart into an order, including property mapping, order creation mode, and event publishing.

## Contained in

- [ShoppingCartConfig](./ShoppingCartConfig.md) as `checkoutSettings`

Blueprint paths:

- `services.shoppingCartConfig.checkoutSettings`

## Contains

- `propertyMappings`: [CartToOrderPropertyMapping](./CartToOrderPropertyMapping.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
