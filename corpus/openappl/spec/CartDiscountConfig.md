# CartDiscountConfig

**Level:** `subsection` · **Family:** [ShoppingCartConfig](../ontology/families.md#shoppingcartconfig) (domain `Service`)

**Ontology:** [CartDiscountConfig in Part 1](../ontology/CartDiscountConfig.md)

Configuration for discount handling.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `supportType` | `DiscountSupportType` | no | `"itemLevel"` | `none`, `cartLevel`, `itemLevel`, `bothLevels` |  | Declared supported discount level, schema default itemLevel. Current nodejs pricing also accepts cart-level dynamic rewards under that default and does not enforce this selector. Enforcing the documented level restrictions would change existing prices; the default and reward-level classification require a compatibility decision. |
| `allocationMode` | `DiscountAllocationMode` | no | `"proportional"` | `proportional`, `byQuantity`, `lastItem`, `customRule` |  | Declared allocation policy for cart-level discounts. Current nodejs pricing uses proportional allocation; this selector does not activate the other enum policies. The documented proportional, byQuantity and lastItem strategies are derivable. The unresolved customRule option has no specified allocation event name, input, result/error protocol or rounding/line-cap contract. Activation also requires the supportType default-compatibility ruling; difficulty implementing the three built-in strategies is not an ambiguity. |

## Constraints

Property rules:

- `supportType`, `allocationMode` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
