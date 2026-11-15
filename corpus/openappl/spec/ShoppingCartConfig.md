# ShoppingCartConfig

**Level:** `chapter` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartConfig in Part 1](../ontology/ShoppingCartConfig.md)

Shopping cart configuration chapter. When enabled, auto-generates the Cart and CartItem DataObjects (plus the Campaign store when promotionSettings.dynamicPromotions is enabled) with Redis-first architecture for hyper-scalable cart management. No Coupon or CampaignUsageLog object is ever generated: a coupon is the couponCode column of a campaign row.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basicSettings` | [`ShoppingCartBasicSettings`](./ShoppingCartBasicSettings.md) | yes |  |  |  | Core cart settings including activation, naming, currency, and guest cart support. The useShoppingCartFeature flag activates the entire shopping cart functionality. |
| `pricingSettings` | [`ShoppingCartPricingSettings`](./ShoppingCartPricingSettings.md) | no |  |  |  | Price calculation settings including VAT handling, rounding, discounts, shipment, and extra charges. |
| `itemSettings` | [`ShoppingCartItemSettings`](./ShoppingCartItemSettings.md) | no |  |  |  | Cart item configuration including what item properties to generate. |
| `productCatalogSettings` | [`ShoppingCartProductCatalogSettings`](./ShoppingCartProductCatalogSettings.md) | no |  |  |  | Optional product catalog integration for automatic item population when adding products. |
| `reservationSettings` | [`ShoppingCartReservationSettings`](./ShoppingCartReservationSettings.md) | no |  |  |  | Opt-in TTL stock reservation. When enabled on a catalog-bound cart with a stock mapping, adding a line reserves units against a Redis capacity counter seeded from the catalogue row; holds expire on their own short TTL, are released on remove/clear, and are consumed inside the claimed checkout window. |
| `logisticsSettings` | [`ShoppingCartLogisticsSettings`](./ShoppingCartLogisticsSettings.md) | no |  |  |  | Shipping logistics settings for weight, dimensions, and volume tracking. |
| `loyaltySettings` | [`ShoppingCartLoyaltySettings`](./ShoppingCartLoyaltySettings.md) | no |  |  |  | Loyalty program settings for points earning and redemption. |
| `promotionSettings` | [`ShoppingCartPromotionSettings`](./ShoppingCartPromotionSettings.md) | no |  |  |  | Promotion engine configuration including static and dynamic promotions. |
| `redisSettings` | [`ShoppingCartRedisSettings`](./ShoppingCartRedisSettings.md) | no |  |  |  | Redis caching configuration for hyper-scalable cart management. |
| `apiSettings` | [`ShoppingCartApiSettings`](./ShoppingCartApiSettings.md) | no |  |  |  | Generated API routes configuration. |
| `checkoutSettings` | [`ShoppingCartCheckoutSettings`](./ShoppingCartCheckoutSettings.md) | no |  |  |  | Checkout settings for cart-to-order conversion. Configures how checkout creates orders, property mappings, and event publishing. |

## Constraints

Property rules:

- `basicSettings` must be present. (`REQUIRED_FIELD_MISSING`)
