# FunctionCallAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [FunctionCallAction in Part 1](../ontology/FunctionCallAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Defines a reusable logic step that calls a library-defined function using MScript syntax. This action allows for custom transformation, enrichment, or computation during the execution of a Business API. It is often used to prepare derived values, calculate totals, or apply shared service logic prior to validation or response shaping.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `callScript` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that defines the function call. The script may reference a predefined library function and pass contextual arguments. Example: `{ "js": "LIB.calculateTotal(this.items)" }`. |

## Constraints

Property rules:

- `callScript` must be present. (`REQUIRED_FIELD_MISSING`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `ACTION_PERFORMS_NO_OPERATION` | warning | This action returns a literal `null` for … — a key that reads as a resource handle. |
| `CALL_SCRIPT_REQUIRED` | error | FunctionCallAction.callScript is required — provide an MScript expression invoking the server-side function. |

## Example

Use to invoke a shared service-library function for a derived computation or transformation — e.g. compute an order total with tax and shipping from line items before validation or response shaping.

```json
{
  "name": "computeOrderTotal",
  "description": "Calculate the grand total via the shared pricing library.",
  "callScript": { "js": "LIB.pricing.calculateOrderTotal(this.lineItems, this.shippingAddress, this.couponCode)" },
  "contextPropertyName": "orderTotal"
}
```
