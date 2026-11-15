# CartTotalDiscountPromotion

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartTotalDiscountPromotion in Part 1](../ontology/CartTotalDiscountPromotion.md)

Static promotion: Tiered discount based on cart total. Not applied (see StaticPromotionSettings).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Whether this promotion is active. |
| `tiers` | [`CartTotalDiscountTier`](./CartTotalDiscountTier.md)[] | no | `[]` |  |  | Array of discount tiers. Evaluated top-down, first matching tier applies. |
| `maxDiscountAmount` | `Double` | no | `null` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named consumer enforces or explains this cap; if static cart-total tiers execute, is the cap per selected tier or whole cart, before or after VAT, rounding and dynamic discounts? |
| `stackableWithDynamic` | `Boolean` | no | `false` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Should this flag feed a named metadata consumer, or control actual cart-total and dynamic discount coexistence; if executed, which engine wins when false and which discount applies first when true? |

## Constraints

Property rules:

- The items of `tiers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
