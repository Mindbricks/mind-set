---
title: CartValidationAction
---

# CartValidationAction

Pre-flight checks for a shopping cart: item existence, stock availability, price validity, minimum-order rules, shipping-address validity. Use it before [`CartCheckoutAction`](./cart-checkout-action.md) so the checkout step can assume a clean cart.

> The action runs the cart engine's `validate` dry run, bound to the service's shopping cart: it reports on the cart and claims nothing.

## When to use it

- Before any checkout step in a buy-flow workflow.
- Whenever a UI needs to surface cart problems without committing the checkout (run it in a "preview" endpoint).
- Independently from coupon validation: see [`CouponValidationAction`](./coupon-validation-action.md), which is a separate axis.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `validations` | `CartValidationType[]` | no | Subset of checks to run. Each is one of `itemsExist`, `stockAvailable`, `pricesValid`, `minimumOrderMet`, `shippingAddressValid`. |
| `failFast` | `Boolean` | no | When true, stop at the first failure. When false (default), collect every failure before returning. |

## Behaviour

The action runs the service's shopping-cart validation for the calling request (the cart configuration of the service, `validations`, `failFast` and the request params) and returns a structured report: an object indicating which checks passed and which failed, with per-failure context (out-of-stock SKUs, mismatched prices, missing fields, ...).

The intended default is to **not throw** on a failed cart; the report is the action's value, and downstream actions decide what to do. Pair it with a `ValidationAction` reading from `this.<contextPropertyName>` if you want a hard stop.

`minimumOrderMet` compares the basket total against `params.minimumOrderTotal` (a runtime param, default `0`).

**Which total it measures.** It reads the cart's persisted pre-redemption figure, `grossTotal`, so a shopper paying part of the basket with loyalty points still meets a minimum their goods satisfy: points are a payment method, not a discount on the goods, which is the same convention the promotion rules use (`minCartTotal` reads `cart.subtotal`, never a points-reduced figure). Note that `grossTotal` is a stored field, not `total + pointsValue`: `pointsValue` records what was requested, and once the goods shrink below an existing redemption that sum overstates the basket.

A compiler that does not implement a check, or that compares a different total (for example the post-redemption `total`), does not follow this rule. Do not rely on the pre-redemption basis in a blueprint compiled by a compiler that does not document it, and treat a clean validation report from a compiler that does not evaluate a check (the name is accepted and echoed back in the report, and nothing evaluates it, so the cart validates clean) as "not checked" rather than "checked and passed".

A cart snapshot that carries neither `grossTotal` nor the `subtotal` / `discountTotal` / `vatTotal` figures it is derived from is answered with a distinct `MINIMUM_ORDER_UNDETERMINABLE` issue rather than being measured against the post-redemption `total`. Re-pricing the cart (`POST /<cart>/recalculate`) rebuilds every figure from the items and repairs it.

## Example

```json
{
  "name": "validateCart",
  "writeToResponse": false,
  "contextPropertyName": "cartReport",
  "validations": ["itemsExist", "stockAvailable", "pricesValid", "minimumOrderMet"],
  "failFast": false
}
```

Paired with a hard stop:

```json
"validationActions": [
  {
    "name": "abortIfCartInvalid",
    "description": "Stop when the cart is not valid for checkout.",
    "writeToResponse": false,
    "validationScript": { "js": "this.cartReport.allValid === true" },
    "shouldBeTrue": true,
    "checkType": "liveCheck",
    "errorStatus": "422",
    "errorMessage": "Cart is not valid for checkout."
  }
]
```

## Errors

- Infrastructure errors (DB / catalogue unavailable) throw and abort the workflow per `onActionError`.
- Cart-level failures (`stockAvailable: false`, etc.) are returned as data, not exceptions. Use a follow-up [`ValidationAction`](./validation-action.md) to convert them to an HTTP error.

## See also

- [`CartCheckoutAction`](./cart-checkout-action.md)
- [`CouponValidationAction`](./coupon-validation-action.md)
- [`ValidationAction`](./validation-action.md)
- [Shopping cart](../capabilities/shopping-cart.md)
