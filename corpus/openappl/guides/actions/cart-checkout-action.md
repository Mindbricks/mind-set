---
title: CartCheckoutAction
---

# CartCheckoutAction

Runs the checkout phase of the shopping-cart subsystem: inventory reservation, promotion-usage recording, order creation, and (optionally) clearing the cart. Use it as the finalisation step of a buy-flow workflow: payment is a separate concern handled by [`PaymentAction`](./payment-action.md).

> **Status.** The action runs the SAME cart-to-order handoff the cart REST router runs (`checkoutSettings.orderCreationMode`, the compiled property mappings and `orderDataClause`, the data-layer order insert), takes the same single-flight checkout claim, and records the same outcome (see [shopping cart](../capabilities/shopping-cart.md), "Checkout is single-flight"). Promotion-usage recording runs inside the checkout claim: `recordPromotionUsage: true` counts the campaign rows used by the checkout in their `usageCount` column, and `false` skips recording. A `usageLimit` rule applies a total campaign cap; per-customer, budget and daily counters are not implemented.

## When to use it

- The final step of a buy-flow workflow, after the cart has been validated and the payment plan is decided.
- Convert a cart into an order, reserving inventory and recording promotion usage atomically.
- Re-run a partial checkout in `validate` mode without committing: useful for a "pre-checkout" preview endpoint.
- Pair it with [`CartValidationAction`](./cart-validation-action.md) and [`CouponValidationAction`](./coupon-validation-action.md) earlier in the workflow, and with [`PaymentAction`](./payment-action.md) either side depending on whether payment is captured before or after order creation.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `stage` | `CartCheckoutStage` | no | `validate` (validate only, no state change), `process` (full checkout, default), or `finalize` (final order creation). |
| `clearCartAfterCheckout` | `Boolean` | no | When true (default at runtime), the cart is cleared after a successful checkout. |
| `recordPromotionUsage` | `Boolean` | no | When true (default at runtime), promotion / coupon usage is recorded for tracking and limits. |

`CartCheckoutStage` values: `validate` | `process` | `finalize`.

## Behaviour

Per-stage semantics:

- `validate`: runs the same checks as `CartValidationAction` plus pricing reconciliation, but does **not** create an order, reserve inventory, or clear the cart. Use for a pre-checkout preview.
- `process` (default): full checkout: reserves inventory, records promotion usage (when enabled), creates the order, clears the cart (when enabled).
- `finalize`: assumes earlier stages already ran; performs the final order-creation step. Use when the checkout is split across multiple workflows (e.g. for an external-payment redirect flow).

The result carries the handoff outcome (`orderCreationMode`, `orderId`, `order`, `checkoutEventPublished`) and the checkout identity `checkoutId`; `reconciled: true` marks a response that completed an earlier crashed checkout from its recorded outcome instead of running the handoff again. See [shopping cart](../capabilities/shopping-cart.md) for the REST twin.

## Example

```json
{
  "name": "checkout",
  "writeToResponse": true,
  "contextPropertyName": "order",
  "stage": "process",
  "clearCartAfterCheckout": true,
  "recordPromotionUsage": true
}
```

A two-step flow with explicit pre-validation:

```json
"cartValidationActions": [
  { "name": "validateCart", "writeToResponse": false }
],
"cartCheckoutActions": [
  { "name": "previewCheckout", "writeToResponse": false, "stage": "validate" },
  { "name": "doCheckout",      "writeToResponse": true,  "contextPropertyName": "order", "stage": "process" }
]
```

## Errors

- Empty cart, out-of-stock items, expired promotions, or mismatched pricing all throw from the cart manager. Use `onActionError: "completeApi"` to inspect them via `this.<actionName>Error` and shape a user-friendly response.
- A basket already checked out answers `409 CART_ALREADY_CHECKED_OUT`; a basket whose checkout is still in flight (or whose expired claim could not be reconciled) answers `409 CHECKOUT_IN_PROGRESS` with the in-flight `checkoutId` under `errors`. Neither is retried blindly: the shopper POLLS the outcome with `GET /<cart>?checkoutId=<id>` (or a hand-written action reads the same checkout outcome by its id) and branches on its `status`: `succeeded`, `partial` and `failed` are final, `inProgress` is the only one that waits, and a fresh checkout is a recovery step only for `failed` with `retryable: true` or for `inProgress` with `leaseExpired: true`. A settled checkout whose outcome record is gone answers a terminal shape derived from the frozen cart header, marked `recordUnavailable: true`; it is never reported as `inProgress`. A failed wired order create answers `502 ORDER_CREATION_FAILED`, releases the claim and leaves the cart retryable.
- Inventory reservation is not performed by this action, so there is no reservation conflict to retry; see [race conditions](../workflow/race-conditions.md) for the general pattern.

## See also

- [`CartValidationAction`](./cart-validation-action.md)
- [`CouponValidationAction`](./coupon-validation-action.md)
- [`PaymentAction`](./payment-action.md)
- [Shopping cart](../capabilities/shopping-cart.md)
