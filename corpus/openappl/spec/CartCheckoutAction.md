# CartCheckoutAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CartCheckoutAction in Part 1](../ontology/CartCheckoutAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Processes shopping cart checkout. Handles inventory reservation, promotion usage recording, order creation, and cart clearing. The checkout result is written to the context.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `stage` | `CartCheckoutStage` | no | `"process"` | `validate`, `process`, `finalize` |  | The checkout stage: 'validate' for validation only, 'process' for full checkout processing, 'finalize' for final order creation. |
| `clearCartAfterCheckout` | `Boolean` | no | `true` |  |  | If true, clear the cart after successful checkout. |
| `recordPromotionUsage` | `Boolean` | no | `true` |  |  | If true, record promotion usage at checkout: inside the checkout claim, the usageCount of each campaign the checkout used is incremented once (guarded by its usageLimit cap when campaignSettings.supportUsageLimits is on; 409 PROMOTION_USAGE_LIMIT_REACHED when the cap is reached). Needs dynamic promotions with the generated campaign store; otherwise nothing is recorded. |

## Constraints

Property rules:

- `stage` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `CART_ACTION_ON_NON_CART_OBJECT` | warning | CartCheckoutAction is typically used on a cart DataObject, but the parent API targets "…". |

## Example

Use to process a cart checkout — reserve inventory, record promotion usage, create the order, and clear the cart — choosing the stage (validate/process/finalize) appropriate to the step.

```json
{
  "name": "processCheckout",
  "description": "Run full checkout processing and clear the cart afterward.",
  "stage": "process",
  "clearCartAfterCheckout": true,
  "recordPromotionUsage": true,
  "contextPropertyName": "checkoutResult"
}
```
