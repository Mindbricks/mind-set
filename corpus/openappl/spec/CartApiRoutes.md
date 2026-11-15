# CartApiRoutes

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartApiRoutes in Part 1](../ontology/CartApiRoutes.md)

Which cart API routes to generate. All default to true: an omitted flag counts as true and false drops the route. The routes mount at /{cartObjectName} (basicSettings.cartObjectName, default 'cart'); apiSettings.routePrefix is not read. applyCoupon and removeCoupon are generated only when the coupon feature is on, and redeemPoints only when points redemption is on (see each flag). The Go runtime ignores these flags and has no recalculate or redeemPoints route.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `getCart` | `Boolean` | no | `true` |  |  | GET /{cartObjectName} - Retrieve current cart with items and totals. |
| `addItem` | `Boolean` | no | `true` |  |  | POST /{cartObjectName}/items - Add an item to the cart by barcode (required); quantity defaults to 1. |
| `updateItem` | `Boolean` | no | `true` |  |  | PUT /{cartObjectName}/items/:barcode - Update item quantity. |
| `removeItem` | `Boolean` | no | `true` |  |  | DELETE /{cartObjectName}/items/:barcode - Remove item from cart. |
| `clearCart` | `Boolean` | no | `true` |  |  | DELETE /{cartObjectName}/items - Clear all items from cart. |
| `applyCoupon` | `Boolean` | no | `true` |  |  | POST /{cartObjectName}/coupons - Apply a coupon code (body { couponCode }). Generated only when promotionSettings.supportPromotions, dynamicPromotions.enabled and dynamicPromotions.supportCoupons are all on. |
| `removeCoupon` | `Boolean` | no | `true` |  |  | DELETE /{cartObjectName}/coupons/:code - Remove an applied coupon. Same coupon gate as applyCoupon. |
| `redeemPoints` | `Boolean` | no | `true` |  |  | POST /{cartObjectName}/redeemPoints - Redeem loyalty points (body { points }). Generated only when loyaltySettings.supportLoyalty and supportPointsRedemption are both on (Node.js and Rust; the Java, .NET, Python and PHP routers check only this flag). |
| `checkout` | `Boolean` | no | `true` |  |  | POST /{cartObjectName}/checkout - Begin checkout process. |
| `recalculate` | `Boolean` | no | `true` |  |  | POST /{cartObjectName}/recalculate - Force recalculation. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
