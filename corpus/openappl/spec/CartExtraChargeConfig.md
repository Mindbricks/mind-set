# CartExtraChargeConfig

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartExtraChargeConfig in Part 1](../ontology/CartExtraChargeConfig.md)

Configuration for additional charges like handling, packaging, insurance, etc.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportExtraCharges` | `Boolean` | no | `false` |  |  | Whether the cart supports extra charges beyond shipment. |
| `storeBreakdown` | `Boolean` | no | `false` |  |  | Declared request to store individual extra charges as a JSON array. Current nodejs cart schema/pricing exposes extraChargesTotal but does not create or populate a breakdown through this flag. The destination property, entry schema and authoritative charge producer remain unspecified. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.
