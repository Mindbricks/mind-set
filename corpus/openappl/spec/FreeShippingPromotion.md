# FreeShippingPromotion

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [FreeShippingPromotion in Part 1](../ontology/FreeShippingPromotion.md)

Static promotion: Free shipping when cart total exceeds threshold. Not applied (see StaticPromotionSettings).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Whether this promotion is active. |
| `minCartTotal` | `Double` | no | `100` |  |  | Minimum cart total (ex-VAT) to qualify for free shipping. |
| `customerMessage` | `String` | no | `"Free shipping on orders over $100!"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named preview or storefront consumer decides that the ex-VAT free-shipping threshold is met and displays customerMessage, and must the message wait until shipment charges are actually waived? |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
