# CouponValidationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [CouponValidationAction in Part 1](../ontology/CouponValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Validates a coupon code for eligibility against the active cart and optionally calculates the discount amount. The code must name a campaign (requiresCoupon, couponCode) of the campaign store, and every rule of that campaign must pass (date windows, minimums, a usageLimit cap, ...). Results are written to the context as { valid, couponCode, discountAmount?, reason?, rewards? } - an unknown or ineligible code is valid false with a reason, not an error. An EMPTY or missing couponCode is the one error: 400 'couponCode is required', by design (there is nothing to validate).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `checkUsageLimits` | `Boolean` | no | `true` |  |  | How this validation treats a usageLimit rule of the coupon's campaign: true enforces it against the campaign's usageCount (even when campaignSettings.supportUsageLimits is off), false skips it (the rule passes). |
| `checkExpiration` | `Boolean` | no | `true` |  |  | Has no effect: the campaign's dateRange rule, which is what expires a coupon, is always evaluated. |
| `calculateDiscount` | `Boolean` | no | `true` |  |  | If true, calculate and include the discount amount in the result. |

## Constraints

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `COUPON_ACTION_ON_NON_COUPON_OBJECT` | warning | CouponValidationAction is typically used on a coupon DataObject, but the parent API targets "…". |
| `COUPON_ACTION_WITHOUT_CART_OPTIN` | error | CouponValidationAction "…" cannot work on this service: it has no shopping-cart opt-in, so codegen emits no <Service>ShoppingCart delegate, the CartActionEngine is constructed without a promotion engine, and every coupon … |
| `COUPON_ACTION_WITHOUT_PROMOTION_ENGINE` | warning | CouponValidationAction "…" validates nothing on this service: the shopping-cart opt-in is on but dynamic promotions are off, so the generated <Service>ShoppingCart carries no promotion engine and every coupon code is … |

## Example

Use to validate a coupon code — checking expiration, usage limits, and minimum-order eligibility — and compute the discount amount into context for the checkout total.

```json
{
  "name": "validateCoupon",
  "description": "Validate the applied coupon and compute its discount before checkout.",
  "checkUsageLimits": true,
  "checkExpiration": true,
  "calculateDiscount": true,
  "contextPropertyName": "couponResult"
}
```
