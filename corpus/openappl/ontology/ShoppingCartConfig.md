# ShoppingCartConfig

**Level:** `chapter` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [ShoppingCartConfig in Part 2](../spec/ShoppingCartConfig.md)

Shopping cart configuration chapter. When enabled, auto-generates the Cart and CartItem DataObjects (plus the Campaign store when promotionSettings.dynamicPromotions is enabled) with Redis-first architecture for hyper-scalable cart management. No Coupon or CampaignUsageLog object is ever generated: a coupon is the couponCode column of a campaign row.

## Contained in

- [Service](./Service.md) as `shoppingCartConfig`

Blueprint paths:

- `services.shoppingCartConfig`

## Contains

- `basicSettings`: [ShoppingCartBasicSettings](./ShoppingCartBasicSettings.md)
- `pricingSettings`: [ShoppingCartPricingSettings](./ShoppingCartPricingSettings.md)
- `itemSettings`: [ShoppingCartItemSettings](./ShoppingCartItemSettings.md)
- `productCatalogSettings`: [ShoppingCartProductCatalogSettings](./ShoppingCartProductCatalogSettings.md)
- `reservationSettings`: [ShoppingCartReservationSettings](./ShoppingCartReservationSettings.md)
- `logisticsSettings`: [ShoppingCartLogisticsSettings](./ShoppingCartLogisticsSettings.md)
- `loyaltySettings`: [ShoppingCartLoyaltySettings](./ShoppingCartLoyaltySettings.md)
- `promotionSettings`: [ShoppingCartPromotionSettings](./ShoppingCartPromotionSettings.md)
- `redisSettings`: [ShoppingCartRedisSettings](./ShoppingCartRedisSettings.md)
- `apiSettings`: [ShoppingCartApiSettings](./ShoppingCartApiSettings.md)
- `checkoutSettings`: [ShoppingCartCheckoutSettings](./ShoppingCartCheckoutSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
