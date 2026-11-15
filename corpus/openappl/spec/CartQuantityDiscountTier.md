# CartQuantityDiscountTier

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartQuantityDiscountTier in Part 1](../ontology/CartQuantityDiscountTier.md)

**Name:** an instance is named by `name`.

A single tier in cart quantity discount promotion. Part of blueprint-static promotions; current nodejs generation and pricing do not consume these values. Their runtime contract or disposition remains undecided.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  |  | The tier's identifying name (e.g. 'bulk-5'). Identifies the tier in designer lists and duplicate detection — thresholds stay purely functional. |
| `minQuantity` | `Integer` | no | `4` |  |  | Minimum total items to activate this tier. |
| `discountPercent` | `Double` | no | `5` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Should this percentage have a named metadata consumer, or execute after which quantity threshold, on which net/gross amount, with what fixed-discount precedence, rounding and dynamic stacking policy? |
| `discountAmount` | `Double` | no | `0` |  |  | Fixed discount amount to apply. |
| `customerMessage` | `String` | no | `"5% off when buying 3+ items"` |  |  | Static promotion value currently not applied by generated services. No dedicated semantic metadata consumer is identified. Pending ruling: retain with an explicit semantic consumer contract, activate a defined static/dynamic execution contract, or approve removal. Decision question: Which named designer-preview or storefront display consumer selects the qualifying quantity tier and displays its customerMessage, or should the static message field be removed? |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
