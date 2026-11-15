# StaticPromotionSettings

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [StaticPromotionSettings in Part 1](../ontology/StaticPromotionSettings.md)

Simple cart-level promotion tiers (free-shipping threshold, cart total and quantity discounts, membership discounts, a loyalty points multiplier). Not applied: no template or runtime library in any language reads these settings, so a static promotion changes no price. Kept so stored blueprints stay valid; author the same tiers as dynamic campaigns instead (for example a minCartTotal rule with a freeShipping reward, or a tieredDiscount reward).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `freeShippingThreshold` | [`FreeShippingPromotion`](./FreeShippingPromotion.md) | no |  |  |  | Free shipping when cart total exceeds a threshold. Not applied (see StaticPromotionSettings). |
| `cartTotalDiscount` | [`CartTotalDiscountPromotion`](./CartTotalDiscountPromotion.md) | no |  |  |  | Tiered percentage or fixed discount based on cart total. Not applied (see StaticPromotionSettings). |
| `cartQuantityDiscount` | [`CartQuantityDiscountPromotion`](./CartQuantityDiscountPromotion.md) | no |  |  |  | Tiered discount based on total item quantity. Not applied (see StaticPromotionSettings). |
| `membershipDiscounts` | [`MembershipDiscountPromotion`](./MembershipDiscountPromotion.md) | no |  |  |  | Discounts based on customer membership level. Not applied (see StaticPromotionSettings). |
| `loyaltyPointsMultiplier` | [`LoyaltyPointsMultiplierPromotion`](./LoyaltyPointsMultiplierPromotion.md) | no |  |  |  | Points multiplier based on membership level. Not applied (see StaticPromotionSettings). |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
