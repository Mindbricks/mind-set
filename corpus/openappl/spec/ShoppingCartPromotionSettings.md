# ShoppingCartPromotionSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartPromotionSettings in Part 1](../ontology/ShoppingCartPromotionSettings.md)

**Activation:** the pattern is switched on by `supportPromotions`.

Promotion engine configuration. The promotions that price a cart are the dynamic ones (the generated {cart}Campaign store read by the full promotion engine); static promotions are accepted by the schema but no generated service reads them.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportPromotions` | `Boolean` | no | `false` |  |  | Whether to enable promotion functionality. Adds couponCode and appliedCampaignIds fields to Cart. |
| `conflictResolution` | `ConflictResolutionMode` | no | `"bestForCustomer"` | `bestForCustomer`, `applyAll`, `priorityOrder`, `exclusive` |  | Declared policy for competing promotions, schema default bestForCustomer. Current nodejs evaluation follows existing priority ordering and selects the first nonstackable candidate; it does not select the highest customer benefit through this field. Honoring bestForCustomer for default/unset designs would change prices and requires a compatibility and benefit-comparison ruling. |
| `maxPromotionsPerCart` | `Integer` | no | `null` |  |  | Nodejs positive maximum number of distinct campaign IDs selected for rewards across coupon and automatic campaigns, active only when dynamic promotions are enabled; null is unlimited. Selection retains coupon codes in header order, then automatic campaigns by priority. Several rewards from one campaign use one slot. Repricing, checkout and BusinessApi cart actions enforce the bound, including CAS rebuilds. Selected coupon reward provenance is retained independently of coupon-code dictionary keys and follows the checkout claim. When promotion usage recording is enabled and a campaign store is wired, the existing usage workflow records selected campaigns and excludes unselected campaigns sharing a coupon code. This cap does not change the existing usage marker, usage-limit or compensation behavior. conflictResolution remains a separate unresolved default contract. |
| `staticPromotions` | [`StaticPromotionSettings`](./StaticPromotionSettings.md) | no |  |  |  | Static promotion tiers. Accepted by the schema but not applied: no generated service reads them, in any language. Use dynamic promotions (campaigns) for discounts that must change a price. |
| `dynamicPromotions` | [`DynamicPromotionSettings`](./DynamicPromotionSettings.md) | no |  |  |  | Complex promotions loaded from the generated {cart}Campaign store (one DataObject; coupons are its couponCode column). |

## Constraints

Property rules:

- `conflictResolution` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_COUPONS_REQUIRE_DYNAMIC_PROMOTIONS` | warning | supportCoupons is true but dynamicPromotions.enabled is false — coupon validation requires the dynamic promotion engine to be active. |
| `SHOPPING_CART_INVALID_MAX_PROMOTIONS` | error | maxPromotionsPerCart must be a positive integer, got … |
