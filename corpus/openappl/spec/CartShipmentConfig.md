# CartShipmentConfig

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartShipmentConfig in Part 1](../ontology/CartShipmentConfig.md)

Configuration for shipment/delivery charges.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportShipment` | `Boolean` | no | `false` |  |  | Whether the cart supports shipment charges. |
| `defaultShipmentVatRate` | `Double` | no | `0.18` |  |  | Declared default shipping VAT rate, schema default 0.18, with the defaultVatRate percent/legacy-fraction unit convention. Current nodejs cart-total calculation does not apply shipping VAT through this field. Whether shipmentCost is net or gross, how shipping affects order/payment totals and how to change existing default prices require a ruling. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
