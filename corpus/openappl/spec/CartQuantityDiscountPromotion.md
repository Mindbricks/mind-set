# CartQuantityDiscountPromotion

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartQuantityDiscountPromotion in Part 1](../ontology/CartQuantityDiscountPromotion.md)

Static promotion: Tiered discount based on total item quantity. Not applied (see StaticPromotionSettings).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Whether this promotion is active. |
| `tiers` | [`CartQuantityDiscountTier`](./CartQuantityDiscountTier.md)[] | no | `[]` |  |  | Array of quantity discount tiers. |
| `stackableWithDynamic` | `Boolean` | no | `false` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Should a quantity-tier discount remain metadata for a named consumer, execute alongside dynamic campaigns, or be removed; if executed, does false exclude all dynamic rewards and which discount runs first? |

## Constraints

Property rules:

- The items of `tiers` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
