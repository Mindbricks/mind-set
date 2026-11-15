# CartGuestHoldQuota

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartGuestHoldQuota in Part 1](../ontology/CartGuestHoldQuota.md)

Bounds on the reservation holds one guest session may accumulate. Applied only to session-owned carts; authenticated carts are not quota'd here.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `maxLines` | `Integer` | no | `20` |  |  | Maximum distinct reserved lines (products) per guest session. |
| `maxUnits` | `Integer` | no | `100` |  |  | Maximum total reserved units (sum of quantities) per guest session. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
