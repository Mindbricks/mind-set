# LoyaltyPointsMultiplierPromotion

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [LoyaltyPointsMultiplierPromotion in Part 1](../ontology/LoyaltyPointsMultiplierPromotion.md)

Static promotion: Points multiplier based on membership level. Not applied (see StaticPromotionSettings).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Whether this promotion is active. |
| `membershipProperty` | `String` | no | `"membershipLevel"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named metadata consumer resolves this property, or should loyalty execution read a verified session field; are nested paths allowed, what type identifies a level, and how do missing/unknown levels select defaultMultiplier? |
| `defaultMultiplier` | `Double` | no | `1` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named consumer uses the fallback multiplier, or what authoritative base earned-points producer should it multiply for non-members, with what integer rounding and interaction with membership/dynamic multipliers? |
| `levels` | [`PointsMultiplierLevel`](./PointsMultiplierLevel.md)[] | no | `[]` |  |  | Array of membership levels and their point multipliers. |

## Constraints

Property rules:

- The items of `levels` must have distinct names (`membershipLevel`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
