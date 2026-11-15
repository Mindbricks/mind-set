# ShoppingCartItemSettings

**Level:** `section` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [ShoppingCartItemSettings in Part 1](../ontology/ShoppingCartItemSettings.md)

Configuration for cart line items. The CartItem DataObject is auto-generated based on these settings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `itemObjectSuffix` | `String` | no | `"Item"` |  |  | Suffix for the auto-generated CartItem DataObject name (default: 'Item'). E.g., 'cart' + 'Item' = 'cartItem'. |
| `supportCategory` | `Boolean` | no | `false` |  |  | Whether items track category for filtering and promotions. |
| `supportBrand` | `Boolean` | no | `false` |  |  | Whether items track brand for filtering and promotions. |
| `supportProductGroup` | `Boolean` | no | `false` |  |  | Whether items track product group ID for variant grouping in promotions. |
| `supportVendor` | `Boolean` | no | `false` |  |  | Whether items track vendor/supplier for marketplace scenarios. |
| `supportGiftItems` | `Boolean` | no | `false` |  |  | Whether items can be marked as promotional gifts. |
| `supportItemMetadata` | `Boolean` | no | `false` |  |  | Whether items have a metadata JSON field for custom data. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
