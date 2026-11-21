---
title: CouponValidationAction
---

# CouponValidationAction

Validates a coupon code against the project's promotion catalogue: code validity, expiration, usage limits, minimum-order rules, and (optionally) the discount amount. Writes the validation report to context for downstream actions to act on.

The coupon code itself comes from the request parameters (e.g. `params.couponCode`): the action reads it via the shopping-cart manager.

> **Prerequisite: the shopping-cart opt-in AND dynamic promotions.** The action evaluates the coupon against the service's promotion engine, and the only carrier of that engine is the service's shopping cart, which exists only when `shoppingCartConfig.basicSettings.useShoppingCartFeature` is true. On top of that the engine itself is built only when `shoppingCartConfig.promotionSettings.supportPromotions` **and** `promotionSettings.dynamicPromotions.enabled` are both true (turn `dynamicPromotions.supportCoupons` on as well for the cart's `/coupons` routes). Without those settings the action answers `{ valid: false, reason: "Promotion engine not enabled" }` for every code: it validates nothing. So validation reports it rather than letting it ship silently:
>
> - no cart opt-in on the service: **error** `COUPON_ACTION_WITHOUT_CART_OPTIN` (the action is refused);
> - cart opt-in on, dynamic promotions off: **warning** `COUPON_ACTION_WITHOUT_PROMOTION_ENGINE`.

## When to use it

- Before [`CartCheckoutAction`](./cart-checkout-action.md), to confirm a customer-supplied coupon still applies at checkout time.
- In a coupon-preview endpoint that returns the computed discount without committing the cart.
- Away from a checkout flow (a subscription discount or a one-off promo redemption) but still only on a service that carries the cart opt-in and dynamic promotions. There is no cart-free promotion engine; on a service without them, evaluate the code against your own rows instead.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `checkUsageLimits` | `Boolean` | no | When true, enforce a campaign's `usageLimit` rule against `usageCount`; false skips that rule for this call. This is a total campaign cap; per-customer counters are not implemented. |
| `checkExpiration` | `Boolean` | no | Has no effect: the campaign's `dateRange` rule is always evaluated, including when this flag is false. |
| `calculateDiscount` | `Boolean` | no | When true (default at runtime), compute and include the discount amount in the result. |

## Behaviour

The action runs the cart engine over the service's shopping cart: that cart is what carries the service's promotion configuration, so the action evaluates the coupon against the same promotion engine the cart's `POST /<cart>/coupons` route uses. It validates the coupon with `checkUsageLimits`, `checkExpiration`, `calculateDiscount` and the request params, and lands the result on `this.<contextPropertyName>`, and on the response when `writeToResponse: true`:

```json
{ "valid": true, "couponCode": "SAVE10", "discountAmount": 3, "rewards": [ ... ] }
```

`rewards` and `discountAmount` are present only when `calculateDiscount` is true. An ineligible coupon answers `{ "valid": false, "couponCode": "SAVE10", "reason": "..." }`: the reason is the promotion engine's own rejection message (e.g. no campaign carries that code).

The action does **not throw** on an invalid coupon; the report is the action's value. Use a follow-up [`ValidationAction`](./validation-action.md) to convert "coupon invalid" into an HTTP error, or just feed the result to the client. It does throw `400` when no `couponCode` reached `params`, and `404` when the caller has no active cart.

## Example

```json
{
  "name": "checkCoupon",
  "writeToResponse": true,
  "contextPropertyName": "couponResult",
  "checkUsageLimits": true,
  "checkExpiration": true,
  "calculateDiscount": true
}
```

With a hard stop:

```json
"validationActions": [
  {
    "name": "abortIfCouponInvalid",
    "description": "Stop when the coupon check failed.",
    "writeToResponse": false,
    "validationScript": { "js": "this.couponResult.valid === true" },
    "shouldBeTrue": true,
    "checkType": "liveCheck",
    "errorStatus": "422",
    "errorMessage": "Coupon is not valid."
  }
]
```

## Errors

- Infrastructure errors (catalogue unavailable) throw and abort the workflow per `onActionError`.
- Coupon-level rejections are returned as data, not exceptions.

## See also

- [`CartValidationAction`](./cart-validation-action.md)
- [`CartCheckoutAction`](./cart-checkout-action.md)
- [Shopping cart](../capabilities/shopping-cart.md)
