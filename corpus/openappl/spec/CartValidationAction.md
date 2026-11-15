# CartValidationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CartValidationAction in Part 1](../ontology/CartValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Validates a shopping cart before checkout. Checks that items exist, stock is available, prices are valid, and minimum order requirements are met. The validation results are written to the context for use in subsequent actions.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `validations` | `CartValidationType`[] | no | `["itemsExist","stockAvailable","pricesValid"]` | `itemsExist`, `stockAvailable`, `pricesValid`, `minimumOrderMet`, `shippingAddressValid`, `promotionsValid` |  | Array of validation types to perform. Valid options: 'itemsExist', 'stockAvailable', 'pricesValid', 'minimumOrderMet', 'shippingAddressValid'. |
| `failFast` | `Boolean` | no | `true` |  |  | If true, stop validation on first failure. If false, collect all failures before returning. |

## Constraints

Property rules:

- `validations` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CART_ACTION_ON_NON_CART_OBJECT` | warning | CartValidationAction is typically used on a cart DataObject, but the parent API targets "…". |

## Example

Use before checkout to validate a cart — items present, stock available, prices current, minimum order met — writing the results to context. Set failFast=false to collect all failures at once.

```json
{
  "name": "validateCart",
  "description": "Run pre-checkout cart validations and collect every failure for the client.",
  "validations": [
    "itemsExist",
    "stockAvailable",
    "pricesValid",
    "minimumOrderMet"
  ],
  "failFast": false,
  "contextPropertyName": "cartValidation"
}
```
