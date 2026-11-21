---
title: SubscriptionAction
---

# SubscriptionAction

`SubscriptionAction` drives a recurring-subscription lifecycle against the bound `PaymentProvider`. The `stage` field selects the operation: `subscribe` creates a new subscription, `cancelSubscription` cancels an existing one (immediately or at period end), `refresh` pulls the latest provider state for an existing subscription record.

`BusinessApiActionStore` carries a dedicated `subscriptionActions[]` slot: `SubscriptionAction` is a first-class action type, not a payment-subsystem-only construct.

## When to use it

- Start a recurring subscription against a chosen `SubscriptionPlan`.
- Cancel, either at the next renewal boundary (`cancelAtPeriodEndProperty: true`) or immediately.
- Re-sync provider state into the local `sys_<X>Subscription` record after an external change.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` |   | Lookup key into `projectSettings.paymentProvidersSettings.paymentProviders[].name`. When omitted, the compiler reads `providerName` from the parent data object's `SubscriptionConfig`. |
| `stage` | `PaymentStage` |   | Operation to perform. One of `subscribe`, `cancelSubscription`, `refresh`. |
| `planProperty` | `PropRefer` |   | Property holding the `SubscriptionPlan` reference: the plan `code`, its `providerPlanId`, or its row id. Resolved against `sys_<X>SubscriptionPlan` before the provider is called (see [Plan resolution](#plan-resolution)). Required when `stage = subscribe` **unless** the target data object sets `subscription.configuration.planProperty`, which this action falls back to (see [Plan resolution](#plan-resolution)); validation reports `SUBSCRIPTION_ACTION_MISSING_PLAN_PROPERTY` only when neither is set. |
| `subscriptionIdProperty` | `PropRefer` |   | Property holding the subscription id to operate on. Required when `stage = cancelSubscription` or `stage = refresh`. |
| `cancelAtPeriodEndProperty` | `PropRefer` |   | Optional property holding a boolean. When `stage = cancelSubscription` and this resolves truthy, cancellation is scheduled at period end; otherwise the cancellation is immediate. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

The bound provider must declare `capabilities.supportsSubscriptions = true`. The runtime gates this and raises `CapabilityLimitedError` from the action when the flag is missing.

At runtime the action:

1. Resolves `providerName` from the action config or, when omitted, from the parent DataObject's `subscription.providerName`.
2. Looks up the bound `PaymentProvider` and guards `supportsSubscriptions`.
3. Resolves the stage-specific property references against the current request context (`planProperty` for `subscribe`, `subscriptionIdProperty` for `cancelSubscription` / `refresh`).
4. On `subscribe`, resolves the plan reference against the local plan catalog (see [Plan resolution](#plan-resolution)) and sends the catalog row's `providerPlanId` to the provider.
5. Runs the stage through the payment orchestrator, which persists to the subscription ledger `sys_<X>Subscription`. `<X>` is the **subscription-bearing** DataObject (the one declaring `objectSettings.subscription`), not necessarily the object the api is authored on: an api authored on a sibling still writes into the subscription owner's ledger, the same way `PayoutAction` resolves the marketplace owner and `RefundAction` the checkout target. The orchestrator branches by `stage`: `subscribe` creates the subscription at the provider (and inserts the row), `cancelSubscription` cancels it at the provider with the chosen timing (and updates the row), `refresh` reads the subscription from the provider (and updates the row).
6. Returns the normalized subscription (`NormalizedSubscription`) and stores it on `this.<contextPropertyName>` when set.

### Plan resolution

`planProperty` names a property holding a **SubscriptionPlan reference**, not a provider-side plan id. On `stage = subscribe` the action looks the reference up in the subscription owner's `sys_<X>SubscriptionPlan` catalog, scoped to the resolved provider, and passes the matched row's `providerPlanId` to the provider's create-subscription call:

1. `code` = the reference, `providerName` = the bound provider: the normal path, since `code` is the designer-facing plan code (`"pro-monthly"`).
2. `providerPlanId` = the reference, same provider scope: for designers who store the provider's own id; the value is still validated against the catalog rather than assumed.
3. The plan row id, attempted only when the reference is actually id-shaped (uuid or ObjectId), so a plain code never reaches an id column.

Scoping by provider matters because the same `code` may exist once per provider with a different `providerPlanId` each time.

A reference that matches no row throws: the provider never receives an unresolved reference. The reference is passed through verbatim in exactly one case: the resolved owner declares no subscription block, so no `sys_<X>SubscriptionPlan` catalog was generated and there is nothing to resolve against.

**The provider customer of a `subscribe`.** When the row names no `customerId`, the subscriber's customer is read from the (user, provider) mapping on the auth service, and on a miss created at the provider and mapped: as the signed-in caller with their forwarded bearer, or, for a session-less system caller (a cron or internal-call controller, or a kafka controller declared `loginRequired: false`), for the row's owner column (`sessionSettings.isOwnerField`) through the machine-only `createPaymentCustomerForMachine`. Any other caller with no bearer is refused `401 PAYMENT_CUSTOMER_SESSION_MISSING` before a provider customer is created, and a `subscribe` a session-less system caller runs on an object with no owner column is the design-time ERROR `PAYMENT_SESSIONLESS_ACTION_ORDER_UNOWNED`. In a multi-tenant project the machine-only apis are tenant-scoped and signed with the caller's verified tenant: a session-less caller that carries none is refused `400 PAYMENT_SESSIONLESS_TENANT_UNRESOLVED` before any owner or provider call, and a `subscribe` a session-less system caller runs on a global object (no tenant column) is the design-time WARNING `PAYMENT_SESSIONLESS_START_GLOBAL_ORDER`.

Subsequent provider events (renewal succeeded, payment failed, customer cancelled) are reflected on the same record via webhook handlers; see [payment workflow](../capabilities/payment-workflow.md).

### The subscribe ledger is journal-first

`stage = subscribe` writes its `sys_<X>Subscription` row **before** it calls the provider, as `statusLiteral: pending_provider`, and flips it on the provider's answer. That ordering is what the status vocabulary's two compiler-owned states are for:

| Status | Meaning | Written by |
|---|---|---|
| `pending_provider` | Recorded here, not yet confirmed there. The row claims nothing: no provider subscription id, `cancelAtPeriodEnd: false`, no billing window. | The orchestrator, before the provider's create-subscription call. |
| `provider_failed` | The attempt failed and is closed. `failureReason` starts with `[subscription-definite-refusal] ` (the provider answered no, or the call never left the service) or `[subscription-outcome-unknown] ` (no answer was read, on a provider that deduplicates the create), then names the provider and the refused operation. | The orchestrator, on a failed create. |

Consequences worth knowing when you design against it:

- **A refusal answers a typed error, never a bare 500.** A refusal the adapters already classify (a decline, a gateway fault, a capability stub) keeps its own status and `errorCode`; anything else becomes `502 SUBSCRIPTION_PROVIDER_REFUSED`, which is the answer to "the provider refused" as distinct from "the server broke".
- **One live subscription per order.** On a hosted or tokenized provider the pending row is the order's claim, the same one the `POST /v1/subscribe<x>/:orderId` route takes: see [One live subscription per order](#one-live-subscription-per-order). A refused attempt leaves its row `provider_failed`, and the next subscribe of the order opens a new row.
- **Every row is one attempt, with its own provider key.** The provider's create call carries an idempotency key derived from the attempt's own sentinel (Stripe `Idempotency-Key`, PayPal `PayPal-Request-Id`, Paddle `Idempotency-Key`), so two attempts never share a key. See [A failed subscribe and its retry](#a-failed-subscribe-and-its-retry).
- **Where the payment layer has no order claim** (a checkout-driven provider), the pending row is addressed by a sentinel derived from (provider, order, customer, plan) and held on the table's unique `providerSubscriptionId` index: two orders never share a row. A repeat while that attempt is pending answers `409 SUBSCRIPTION_IN_PROGRESS`; a retry after a definite refusal opens the successor row. Once a subscribe succeeds the sentinel is replaced by the provider's real id.
- **A crash between the two steps leaves `pending_provider`,** which is an honest state rather than a row claiming `active`. Such a row is excluded from the tokenized recharge scheduler's due-list, so it is never charged. The built-in pending-subscription sweeper reconciles stale rows that name a real provider subscription or an iyzico Checkout Form; direct-create sentinels are reported for an operator to resolve.
- **The journal needs an order row.** `sys_<X>Subscription.orderId` is NOT NULL, and the action binds it from the persisted parent row (the subscription owner). When it cannot be resolved the row is written after the provider answers instead.
- **A provider whose subscription starts on a hosted form leaves the row `pending_provider`** (iyzico). The subscribe opens iyzico's subscription Checkout Form; the answer is `pending_provider` under `pending:checkout:<token>` plus `checkoutForm`, and the flip writes exactly that, with no `subscription.created` event (so no `afterSubscriptionCreated` yet). The action's result carries `checkoutForm`: return it to the frontend, which renders `checkoutForm.checkoutFormContent`. The service's subscription-checkout-return route confirms the row when the buyer finishes the form. iyzico opens its subscription customer from the signed-in caller's session (`email`, `name`, `surname`); a call with no session email is refused with `400 SUBSCRIPTION_BUYER_EMAIL_REQUIRED`. A `cancelSubscription` of a row still holding the form sentinel first reads the form from iyzico: a subscription the form produced is canceled at iyzico under its real reference, a form that produced none closes the row locally, and a failed read leaves the row `pending_provider` for a retry; a later finish of that form does not revive the `canceled` row; only an `ACTIVE` confirmation records `subscription.created`. See [payment providers](../providers/payment.md).
- **A first payment that needs the buyer answers `past_due` with `nextAction`** (Stripe). The subscription is created with `payment_behavior: "allow_incomplete"`, so Stripe charges the saved card at once. A first payment that needs 3-D Secure (or is declined) answers `statusLiteral: "past_due"` (never `trialing`) and a `nextAction` with `requiresAction`, `clientSecret`, `paymentStatus` and `hostedInvoiceUrl`; the row is `past_due`. The action's result carries `nextAction` (the row, the event and the hook resources do not), so a Business API that runs the action must return it to the frontend, which finishes the payment on the client with `nextAction.clientSecret` (Stripe's card-payment confirmation). Stripe's `invoice.paid` then moves the row to `active` through the generated webhook route; a first payment nobody finishes expires after 23 hours (`expired`). No designer action is needed for any of it. Grant the plan on `active` (`afterInvoicePaid` / `afterSubscriptionRenewed`), not on `afterSubscriptionCreated`, which fires at creation, paid or not. A later renewal that needs the buyer reaches `afterInvoicePaymentFailed` with `resource.requiresAction: true` and `resource.hostedInvoiceUrl`. See [payment providers](../providers/payment.md) and [3-D Secure and buyer redirects](../capabilities/payment-3ds-and-redirects.md).
- `cancelSubscription` and `refresh` get **no** pending row and never write ahead of the provider: their row already carries a true state, and a refused cancel leaves the subscription exactly as it was (still `active`, `cancelAtPeriodEnd` untouched) plus the typed error.

The hosted-form local close is a compare-and-set on the row id and its form
sentinel. If a checkout return wins, the action reloads that row, cancels its
adopted real reference at the provider, and persists the provider result.
Without a real reference it closes a `provider_failed` row, accepts an already
`canceled` row, or refuses `409 SUBSCRIPTION_IN_PROGRESS`. Provider failure
answers an error and leaves the live row available for a retry.

### One live subscription per order

The subscribe stage keeps the rule of the subscribe route: an order (the persisted parent row) has at most one live subscription, whatever status it is in except `canceled`, `expired` and `provider_failed`. Before the provider is called, the stage takes the order's claim through the object's generated payment layer:

- **No live row:** the order's next `sys_<X>Subscription` row is written `pending_provider` under the provider id `pending:subscribe:<row id>`, the provider is called, and the row is confirmed (or closed `provider_failed`). The row's owner and tenant come from the persisted order row.
- **A live row on the same plan:** the stage answers that subscription, with `metadata.replayed: true` and `metadata.subscriptionId` (the row id). The provider is not called, nothing is written and no event is recorded, so a retry after a lost answer reads success.
- **A live row still `pending_provider`:** `409 SUBSCRIPTION_SUBSCRIBE_PENDING` (a subscribe is in flight, or a hosted form is not finished).
- **A live row on another plan:** `409 SUBSCRIPTION_ALREADY_OPEN`. Change the plan of the open subscription instead.

Of two concurrent subscribes of one order only one claim lands; the other gets one of the answers above. After a cancel the order subscribes again into a new row. Both refusals carry `subscriptionId` and `statusLiteral`.

### A failed subscribe and its retry

What a failed provider create leaves depends on what the failure proves. The same rules apply to the subscribe route and to this stage:

| The create failed with | The attempt row | The order's next subscribe |
|---|---|---|
| A definite refusal: a decline, an answered provider 4xx (other than 408 / 409 / 425 / 429), a credential or permission refusal, a refusal the provider answered in its body, or a refusal before the call | `provider_failed`, reason prefixed `[subscription-definite-refusal] ` | Opens a new attempt row with a fresh provider key. The refused row stays as the record. |
| An unknown outcome (a timeout, a reset, a provider 5xx or throttle, an error nothing classifies), on a provider without verified subscription idempotency (every provider except Stripe and PayPal) | stays `pending_provider`, reason prefixed `[subscription-outcome-unknown] ` | `409 SUBSCRIPTION_SUBSCRIBE_PENDING` (an order claim) or `409 SUBSCRIPTION_IN_PROGRESS` (the common journal). The provider may hold the subscription, so it is not sent again. |
| An unknown outcome on Stripe or PayPal (`supportsSubscriptionIdempotency`) | `provider_failed`, reason prefixed `[subscription-outcome-unknown] ` | Stripe may revive the SAME row by a compare-and-set and re-send the SAME provider key only when its original `createdAt` is valid, not in the future, and less than 23 hours old. At exactly 23 hours or older, or with missing or invalid original time, it answers `409 SUBSCRIPTION_IN_PROGRESS` and retains the attempt. `updatedAt` and revival never restart this age window. PayPal and other providers without an established safe subscription retry horizon retain unknown attempts for reconciliation rather than blindly retrying. On a reused key only a decline counts as a definite refusal. |
| A failed row written before this rule (no prefix; its create carried no provider key) | unchanged | `409 SUBSCRIPTION_IN_PROGRESS` on every provider. |

The caller gets `502 SUBSCRIPTION_PROVIDER_REFUSED` for an unknown outcome, with a message that says whether the record stays `pending_provider`. A local cancel cannot clear an unknown direct-create outcome, including a legacy failed attempt or a stale pending claim: the provider may already hold a subscription. Cancel answers `409 SUBSCRIPTION_IN_PROGRESS` and retains the attempt; a young raw-route claim keeps its existing `409 SUBSCRIPTION_SUBSCRIBE_PENDING` response. A later subscribe cannot obtain a fresh claim through that cancellation. A definitely refused attempt still permits a successor, an iyzico hosted checkout form is read first (a form that produced no subscription cancels locally, one that did is canceled at iyzico), and a real or adopted provider subscription still receives provider cancellation. Reconcile unknown attempts against the provider; nothing reconciles or searches for them automatically yet. A create-API subscribe (`crudType: create`, `onActionError: throwError`) rolls the business row it created back when its subscribe fails definitely, so a retry starts on a new order. After an unknown outcome that leaves the attempt `pending_provider` it keeps the row instead: the order stays the anchor of the unresolved attempt, the request answers `201` with the row and the `502 SUBSCRIPTION_PROVIDER_REFUSED` entry in `actionFailures`, and a new subscribe of that order answers `409 SUBSCRIPTION_IN_PROGRESS` until the attempt is reconciled (`SubscribeRollbackSkippedAttemptPending` is logged). A client that creates yet another order instead is tied to the first attempt on a hosted provider: while an active `pending_provider` row, an unknown-outcome `provider_failed` row (including Stripe and PayPal), or a legacy failed row without a verdict of the same owner, provider and plan (and tenant) exists, the new order's subscribe answers `409 SUBSCRIPTION_IN_PROGRESS` naming the earlier `subscriptionId`, `orderId` and actual `statusLiteral`, without creating a journal row or calling the provider. A create-API refusal naming an earlier order rolls back the new business row; it retains the earlier order as the anchor. A new order never revives another order's attempt: retry the original order for the same-row, same-key revival described above. A definite-refusal row does not block a successor, and different owners, plans, providers and tenants remain independent. Once the earlier attempt is resolved a new subscription is allowed; this is not a limit on subscriptions per buyer.

### Property bindings

Every `PropRefer` slot on this action is resolved, in order, against: the loop item (inside a [`LoopAction`](./loop-action.md)), the request parameters, the persisted parent row, then the manager scope. An explicit request parameter of the same name therefore still overrides the declared binding.

**Dotted paths are supported.** A slot may name a nested path (`"selectedPlan.id"`, `"subscription.cancelAtPeriodEnd"`, as in the examples below) and the resolver walks it one segment at a time on each of those sources. A missing intermediate segment resolves to nothing (the binding falls through to the next source, then to `null`); it never raises a runtime error. The same rule applies to [`PaymentAction`](./payment-action.md), [`RefundAction`](./refund-action.md), and [`PayoutAction`](./payout-action.md).

When `stage = subscribe` and the action declares no `planProperty`, the compiler falls back to the parent data object's `subscription.configuration.planProperty` and resolves that name through the same chain.

> **Support for this fallback is not universal.** A compiler that does not implement
> the fallback emits a subscribe stage without it: the call may fail with a 500
> naming the missing `planProperty`, or be refused with 400 `SUBSCRIPTION_PLAN_REQUIRED`
> before reaching the provider.
> Validation permits the design and raises
> `SUBSCRIPTION_ACTION_PLAN_PROPERTY_INHERITED` as a warning naming the targets that lack it,
> so set `planProperty` on the action itself if any of them is a compile target.

### Stage matrix

| Stage | Required | Optional |
|---|---|---|
| `subscribe` | `planProperty`, unless the data object sets `subscription.configuration.planProperty` (see [Plan resolution](#plan-resolution)) | - |
| `cancelSubscription` | `subscriptionIdProperty` | `cancelAtPeriodEndProperty` |
| `refresh` | `subscriptionIdProperty` | none |

## Example

Start a new subscription:

```json
{
  "name": "startProSubscription",
  "stage": "subscribe",
  "planProperty": "selectedPlan.id",
  "contextPropertyName": "subscription",
  "writeToResponse": true
}
```

Cancel at period end:

```json
{
  "name": "cancelSubscription",
  "stage": "cancelSubscription",
  "subscriptionIdProperty": "subscription.id",
  "cancelAtPeriodEndProperty": "subscription.cancelAtPeriodEnd"
}
```

Refresh the local record from the provider:

```json
{
  "name": "syncSubscription",
  "stage": "refresh",
  "subscriptionIdProperty": "subscription.id"
}
```

## Errors

- Provider lacks `supportsSubscriptions`: `CapabilityLimitedError` raised by the payment runtime.
- `subscriptionIdProperty` missing on `cancelSubscription` / `refresh`: the action throws a clear error at runtime.
- `planProperty` missing on `subscribe`: validation reports `SUBSCRIPTION_ACTION_MISSING_PLAN_PROPERTY` only when neither the action nor the parent data object's `subscription.configuration.planProperty` is set. When the action inherits the data object's value instead, the runtime behaviour depends on the compiler (see the note above the [Stage matrix](#stage-matrix)): one that implements the fallback resolves the inherited property; one that does not fails the call with a 500 naming the missing `planProperty`, or refuses it with 400 `SUBSCRIPTION_PLAN_REQUIRED` before reaching the provider.
- `planProperty` resolved to a reference that matches no `sys_<X>SubscriptionPlan` row for the bound provider: the action throws before calling the provider, naming the unresolved reference and the provider. Seed the plan catalog for that provider.
- The order already has a live subscription: the open one is answered (`metadata.replayed`), or `409 SUBSCRIPTION_SUBSCRIBE_PENDING` / `409 SUBSCRIPTION_ALREADY_OPEN` (see [One live subscription per order](#one-live-subscription-per-order)).
- Provider rejects (plan not available, payment method missing, ...): the local row is marked `provider_failed` with the refusal attributed, and the caller receives the provider's own classified status where the adapters produced one, otherwise `502 SUBSCRIPTION_PROVIDER_REFUSED`. Also surfaced via `onActionError`. An unknown outcome keeps the attempt (see [A failed subscribe and its retry](#a-failed-subscribe-and-its-retry)).
- An earlier attempt of the order is pending or its outcome is unknown: `409 SUBSCRIPTION_SUBSCRIBE_PENDING` / `409 SUBSCRIPTION_IN_PROGRESS`, without calling the provider.
- Unknown `stage` slipped past compilation: defensive throw with the supported set.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PaymentAction`](./payment-action.md), [`RefundAction`](./refund-action.md), [`PayoutAction`](./payout-action.md): sibling payment-domain actions.
- [`PaymentProvider`](../../spec/PaymentProvider.md), [`PaymentCapabilities`](../../spec/PaymentCapabilities.md).
- [Payment workflow](../capabilities/payment-workflow.md).
- [3-D Secure and buyer redirects](../capabilities/payment-3ds-and-redirects.md).
