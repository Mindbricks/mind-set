# CartTotalDiscountTier

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartTotalDiscountTier in Part 1](../ontology/CartTotalDiscountTier.md)

**Name:** an instance is named by `name`.

A single tier in cart total discount promotion. Part of blueprint-static promotions; current nodejs generation and pricing do not consume these values. Their runtime contract or disposition remains undecided.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The tier's identifying name (e.g. 'over-100'). Identifies the tier in designer lists and duplicate detection — thresholds stay purely functional. |
| `minCartTotal` | `Double` | no | `100` |  |  | Minimum cart total to activate this tier. |
| `discountPercent` | `Double` | no | `10` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Should a named metadata consumer interpret this percentage, or should first-matching cart-total tiers execute; which subtotal qualifies, how is percentage versus fixed amount rejected, and when do caps and dynamic stacking apply? |
| `discountAmount` | `Double` | no | `0` |  |  | Fixed discount amount to apply. Mutually exclusive with discountPercent. |
| `customerMessage` | `String` | no | `"10% off orders over $100!"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named preview or storefront display consumer chooses the first matching cart-total tier and displays customerMessage, and what happens when dynamic discounts suppress that tier? |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
