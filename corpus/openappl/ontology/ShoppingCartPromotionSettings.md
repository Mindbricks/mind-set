# ShoppingCartPromotionSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartPromotionSettings in Part 2](../spec/ShoppingCartPromotionSettings.md)

Promotion engine configuration. The promotions that price a cart are the dynamic ones (the generated {cart}Campaign store read by the full promotion engine); static promotions are accepted by the schema but no generated service reads them.

## Contained in

- [ShoppingCartConfig](./ShoppingCartConfig.md) as `promotionSettings`

Blueprint paths:

- `services.shoppingCartConfig.promotionSettings`

## Contains

- `staticPromotions`: [StaticPromotionSettings](./StaticPromotionSettings.md)
- `dynamicPromotions`: [DynamicPromotionSettings](./DynamicPromotionSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
