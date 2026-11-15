# CouponValidationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [CouponValidationAction in Part 2](../spec/CouponValidationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Validates a coupon code for eligibility against the active cart and optionally calculates the discount amount. The code must name a campaign (requiresCoupon, couponCode) of the campaign store, and every rule of that campaign must pass (date windows, minimums, a usageLimit cap, ...). Results are written to the context as { valid, couponCode, discountAmount?, reason?, rewards? } - an unknown or ineligible code is valid false with a reason, not an error. An EMPTY or missing couponCode is the one error: 400 'couponCode is required', by design (there is nothing to validate).

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `couponValidationActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.couponValidationActions`
- `services.businessLogic.actions.couponValidationActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
