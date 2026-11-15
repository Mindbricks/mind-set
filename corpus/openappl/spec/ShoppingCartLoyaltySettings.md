# ShoppingCartLoyaltySettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartLoyaltySettings in Part 1](../ontology/ShoppingCartLoyaltySettings.md)

**Activation:** the pattern is switched on by `supportLoyalty`.

Loyalty program configuration. When enabled, adds points properties to Cart and CartItem.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportLoyalty` | `Boolean` | no | `false` |  |  | Whether to enable loyalty points functionality. |
| `supportPointsRedemption` | `Boolean` | no | `false` |  |  | Whether customers can redeem points for discounts. |
| `pointsToMoneyRate` | `Double` | no | `100` |  |  | How many points equal 1 currency unit (e.g., 100 points = $1). |
| `pointsAllocationMode` | `PointsAllocationMode` | no | `"proportional"` | `proportional`, `lastItem`, `highestPrice`, `firstMatch` |  | Declared allocation policy for cart-level bonus loyalty points. Current nodejs cart pricing does not consume this selector or define an authoritative earned-bonus source for it. Eligible items, price basis and integer-remainder rules remain unspecified; this setting does not compute or allocate points by itself. |

## Constraints

Property rules:

- `pointsAllocationMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `SHOPPING_CART_LOYALTY_INVALID_RATE` | error | pointsToMoneyRate must be a positive finite number, got … |
