# MembershipDiscountPromotion

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [MembershipDiscountPromotion in Part 1](../ontology/MembershipDiscountPromotion.md)

Static promotion: Discount based on customer membership level. Not applied (see StaticPromotionSettings).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enabled` | `Boolean` | no | `false` |  |  | Whether this promotion is active. |
| `membershipProperty` | `String` | no | `"membershipLevel"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named metadata consumer resolves this selector, or should discount execution read a specified verified-session property; what lookup/path/type rules and no-membership/unknown-level behavior are required? |
| `levels` | [`MembershipDiscountLevel`](./MembershipDiscountLevel.md)[] | no |  |  |  | Array of membership levels and their discount percentages. |
| `stackableWithDynamic` | `Boolean` | no | `false` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Should this flag feed a named metadata consumer, or govern membership and dynamic discount coexistence; when false which reward wins, and when true how are ordering, caps and percentage compounding resolved? |

## Constraints

Property rules:

- The items of `levels` must have distinct names (`membershipLevel`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
