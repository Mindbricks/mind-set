# StaticPromotionSettings

**Level:** `subsection` · **Family:** [ShoppingCartConfig](./families.md#shoppingcartconfig) (domain `Service`)

**Specification:** [StaticPromotionSettings in Part 2](../spec/StaticPromotionSettings.md)

Simple cart-level promotion tiers (free-shipping threshold, cart total and quantity discounts, membership discounts, a loyalty points multiplier). Not applied: no template or runtime library in any language reads these settings, so a static promotion changes no price. Kept so stored blueprints stay valid; author the same tiers as dynamic campaigns instead (for example a minCartTotal rule with a freeShipping reward, or a tieredDiscount reward).

## Contained in

- [ShoppingCartPromotionSettings](./ShoppingCartPromotionSettings.md) as `staticPromotions`

## Contains

- `freeShippingThreshold`: [FreeShippingPromotion](./FreeShippingPromotion.md)
- `cartTotalDiscount`: [CartTotalDiscountPromotion](./CartTotalDiscountPromotion.md)
- `cartQuantityDiscount`: [CartQuantityDiscountPromotion](./CartQuantityDiscountPromotion.md)
- `membershipDiscounts`: [MembershipDiscountPromotion](./MembershipDiscountPromotion.md)
- `loyaltyPointsMultiplier`: [LoyaltyPointsMultiplierPromotion](./LoyaltyPointsMultiplierPromotion.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
