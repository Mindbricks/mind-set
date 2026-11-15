# MembershipDiscountLevel

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [MembershipDiscountLevel in Part 1](../ontology/MembershipDiscountLevel.md)

**Name:** an instance is named by `membershipLevel`.

Discount configuration for a specific membership level. Part of blueprint-static promotions; current nodejs generation and pricing do not consume these values. Their runtime contract or disposition remains undecided.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `membershipLevel` | `String` | no | `"silver"` |  |  | The membership level name (e.g., silver, gold, platinum). |
| `discountPercent` | `Double` | no | `5` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named metadata consumer interprets this percentage, or should a verified matching membership level reduce the cart; which price/VAT base, cap, rounding and static/dynamic stacking rules apply? |
| `customerMessage` | `String` | no | `"Silver member: 5% off"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named preview or storefront display consumer selects the verified member level and displays customerMessage, and is the message suppressed when the discount is ineligible or loses to a dynamic campaign? |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
