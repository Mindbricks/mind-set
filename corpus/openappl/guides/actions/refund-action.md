---
title: RefundAction
---

# RefundAction

`RefundAction` issues a refund against a previously captured payment via the bound `PaymentProvider`. It handles both full refunds (omit `refundAmountProperty`) and partial refunds (supply `refundAmountProperty`).

`BusinessApiActionStore` carries a dedicated `refundActions[]` slot, `RefundAction` is a first-class action type, not a payment-subsystem-only construct.

## When to use it

- Reverse a captured charge, full refund as part of an order cancellation.
- Issue a partial refund, return shipping, agreed goodwill amount, partial cancellation.
- Programmatically refund based on business rules (auto-refund a stuck booking after N minutes).
- Let a BUYER ask for a refund. The per-order refund route a checkout block injects (`POST /v1/<order>refundpayment/:orderId`) is an operator route by default (`checkout.configuration.refundRouteAccess: "operator"`): owning the order does not open it. An authored api with this action is where the buyer path, and the rules that guard it (refund window, order state, approval), belong.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` |   | Lookup key into `projectSettings.paymentProvidersSettings.paymentProviders[].name`. When omitted, the runtime reads `providerName` from the parent data object's `CheckoutConfig`. |
| `paymentIntentIdProperty` | `PropRefer` | ✓ | Property holding the payment-intent / payment-ticket id to refund. Resolved at runtime. When no binding resolves an intent id, the action refunds the payment recorded on the `sys_<Order>Payment` ticket of the order the api acts on (its own row, or the row's single relation to the order; never inside a loop). An order without a payment ticket answers 404 `NOT_FOUND`. |
| `refundAmountProperty` | `PropRefer` |   | Optional. When set, issues a partial refund for the resolved amount. When omitted, issues a full refund. |
| `reasonProperty` | `PropRefer` |   | Optional. One of `duplicate`, `fraudulent`, `requested_by_customer`, `other`. Passed through to the provider when supported. |
| `providerOnly` | `Boolean` |   | Default `false`. Opt-in for a refund-only service that owns no checkout object: the refund goes straight to the provider (see "Where the RefundAction lives" below). Requires `providerName`, `paymentIntentIdProperty` and `ownershipGuard`.  |
| `ownershipGuard` | `MScript` |   | Required when `providerOnly` is `true`. A boolean expression evaluated before the provider is resolved or called; a falsy result refuses the call 403 `NOT_OWNER`. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Where the RefundAction lives

A RefundAction refunds a payment this service recorded: it needs a checkout target in its own service, the api's own data object with a `checkout` block, a checkout object the api's object references through a relation, or the service's single checkout object. That target supplies the `sys_<Order>Payment` ticket the preflight reads and the `sys_<Order>Refund` ledger the refund is written to. A service with no checkout object is refused at validation with `PAYMENT_NOT_CONFIGURED`.

The preferred design keeps the RefundAction on the service that owns the checkout object. A refund api in another service reaches it through an inter-service call, so the ticket preflight below (404 for an unknown intent, 403 for a foreign owner, 400 / 409 for a terminal or fully refunded payment) still runs.

When a service exists only to issue refunds for charges other services took, set `providerOnly: true`:

- `providerName` must name a provider declared in `projectSettings.paymentProvidersSettings.paymentProviders[]`, and `paymentIntentIdProperty` must carry the provider intent id. Without either one, validation reports `REFUND_PROVIDER_ONLY_BINDING_INCOMPLETE`.
- `ownershipGuard` is mandatory (`REFUND_PROVIDER_ONLY_GUARD_REQUIRED`). No local ticket exists, so the guard is the only check that this caller may refund the intent. It runs first in the action, before the provider is resolved or called. A falsy result refuses the call with 403 `NOT_OWNER` and makes no provider call. No role skips it, so grant operators inside the expression. Example: `this.session.userId === this.charge.ownerId`, after an earlier action fetched the charge from the service that owns it.
- The action writes no `sys_<Order>Refund` row and runs no close-out: no `afterPaymentRefunded` hook, no settlement clawback and no ticket move in this service. The provider's idempotency key is still derived from the intent and the amount. When the provider's refund webhook reaches the service that owns the payment, that service records the refund on its own ticket.
- A checkout object in the same service is ignored by a `providerOnly` action. Validation warns `REFUND_PROVIDER_ONLY_CHECKOUT_TARGET_IGNORED`, because the designer may have meant the default, preflighted binding.
- A compiler that does not implement `providerOnly` refuses it (`REFUND_PROVIDER_ONLY_NOT_PORTED`).

## Behaviour

Provider capabilities are gated by the payment layer at request time:

- Full refund (no `refundAmountProperty`), provider must declare `capabilities.supportsRefundsFull = true`.
- Partial refund (`refundAmountProperty` set), provider must declare `capabilities.supportsRefundsPartial = true`.

When the capability is missing, the manager raises `CapabilityLimitedError` from inside the action; downstream webhook events then keep the `sys_<X>Payment` row in sync with the provider.

At runtime the action:

1. Resolves `providerName` from the action config or, when omitted, from the parent DataObject's `checkout.providerName`.
2. Looks up the bound `PaymentProvider` and guards `supportsRefundsFull` (full refunds) or `supportsRefundsPartial` (when `refundAmountProperty` is set).
3. Resolves `paymentIntentIdProperty`, optional `refundAmountProperty`, and optional `reasonProperty` against the current request context.
4. Asks the payment layer to process the refund (provider intent id, amount, reason, idempotency key, lifecycle hooks). Before the provider is called, the preflight resolves the `sys_<X>Payment` ticket for the intent id (404 when none is recorded), checks the caller owns it (see "Who may refund" below), refuses a `failed` / `canceled` ticket (400), and checks the refund headroom (below). Then the refund row is written to `sys_<X>Refund` as a `pending` reservation (below), and only after that is the provider called. The provider's answer settles that row, and the refund is closed out.
5. Returns the normalized refund (`NormalizedRefund`): provider, status, amount and reason. It is stored on `this.<contextPropertyName>` when set.

### Who may refund

The preflight compares the caller with the owner of the payment ticket: a caller who does not own it is refused 403 `NOT_OWNER`, and a request with no caller 401. Two callers skip only that ownership comparison:

- a payment absolute role (`admin` / `superAdmin`; `superAdmin` / `saasAdmin` in a multi-tenant project);
- a caller the authored api's own role gate admitted (an `absoluteRoles` or `checkRoles` holder, for example a `finance` staff role), when the api requires login, is not a `create` api, and its own data object IS the order. The grant covers only the ticket of the order the api acts on: an intent id that points at another order's payment is still compared with its owner.

On any other refund api (one on a related record such as a refund request, or a `create` api) the caller must own the payment. The 404, terminal-state and headroom refusals apply to every caller.

### A synchronous success closes the refund out

Most providers (Stripe among them) answer a refund `succeeded` in the create call. The action then records a `refund.succeeded` payment event and dispatches it right away, the same way a synchronous capture records `payment.captured`. It does not wait for a webhook. That event is what runs the order-side effects of a refund:

- the `afterPaymentRefunded` lifecycle hooks,
- the settlement-ledger clawback on a platform-settled marketplace object,
- the ticket's move to `partially_refunded`, or to `refunded` once the succeeded refunds cover the captured amount,
- the refund row's own status.

A `failed` answer records `refund.failed` the same way. A `pending` or `canceled` answer dispatches nothing, and the provider's webhook stays authoritative for a refund still in flight.

The event is keyed on the order and the provider refund id. A vendor webhook for the same refund and outcome is stored for its payload and not dispatched again, so the hooks and the clawback run once per refund. The database decides this, not a read taken before the write: see "One row, one hook, one clawback per real refund" below. The action returns only after the event settles, bounded by the synchronous settle timeout (default 10 s). The provider has already moved the money when the close-out runs, so a close-out failure is logged (`RefundLifecycleUnrecorded`) and the refund is still returned. The event stays queued for the replay worker. The per-order refund route (`POST /v1/<order>refundpayment/:orderId`) closes out the same way.

### Refund headroom

Before the provider is called, the refunds already recorded for the intent are weighed against the ticket's captured amount. Both refund entry points (this action and the refund route) apply the same rules:

| Refusal | Status | `errorCode` |
|---|---|---|
| The ticket already reads `refunded`, a FULL refund of the intent is already recorded, or a full refund is asked when the recorded refunds already cover the capture | 409 | `PAYMENT_ALREADY_REFUNDED` |
| The recorded refunds plus this partial amount exceed the captured amount | 409 | `REFUND_EXCEEDS_CAPTURED` |
| A second refund of the same amount that nothing distinguishes from a recorded one (below) | 409 | `REFUND_POSSIBLE_DUPLICATE` |

`failed` and `canceled` refunds never count. A `pending` refund does count, because it is money in flight. If a refund stays `pending` because its webhook never arrived, it blocks further refunds of that payment until it settles. It settles when the provider's webhook for it arrives (the refund lifecycle advances the row to the status the provider reports), or when an operator reads the provider's current status (the refund manager's refresh) and sets the row's `statusLiteral` to match. Choosing the refusal here is deliberate: a refund an operator can re-issue is recoverable, and a refund paid twice is not.

### Idempotency: a re-issue is answered, never paid again

Every refund is requested under an idempotency key derived from what the refund is, not from the request that carries it: the intent, the amount, and an anchor that names the refund request.

- This action anchors on the id of the api's own row when that row is not the order itself (a refund request, a return).
- The refund route anchors on the caller's `Idempotency-Key` request header.

The key is sent to the provider and recorded on the `sys_<X>Refund` row (`metadata.refundIdempotencyKey`). A re-issue of an anchored refund (a retry, a redelivered event, a sweeper re-issuing a refund that still looks unfinished) finds its own recorded row and is answered with that refund before the provider is called. The close-out still runs for it, which closes out a refund whose first close-out never happened.

### The refund row is written before the provider is called

A re-issue that arrives while the first request's provider call is still in flight (a double-click, a client retry after a timeout shorter than the call) finds no finished row to answer from. So the refund row is written first, as a `pending` reservation, under the unique column `refundRequestKey`, and only the request whose insert wins calls the provider. The unique index decides, so this holds for two requests that arrive at the same instant:

| The other request's row | Answer to the request that lost the insert | Provider called |
|---|---|---|
| Still in flight (no provider answer yet) | 409 `REFUND_IN_PROGRESS` | no |
| Settled (same refund request) | 200, that refund | no |
| Same `Idempotency-Key`, different amount (route) | 409 `IDEMPOTENCY_KEY_REUSED` | no |
| Same amount, no anchor, inside 24 hours | 409 `REFUND_POSSIBLE_DUPLICATE` | no |

`refundRequestKey` is the refund's idempotency key. On the route, with an `Idempotency-Key` header, it is the payment plus the header value, without the amount: one key names one refund request, and re-sending it with another amount is refused, never turned into a second refund.

This is what makes a re-issue move no money on a provider that ignores idempotency keys. iyzico and Lemon Squeezy send no key with a refund; Stripe, PayPal, Adyen, Paddle and Mangopay do. The reservation applies to every provider, so the answer does not depend on which one is bound.

- A provider call that fails DEFINITELY moves the row to `failed` and clears its `refundRequestKey`, so the request can be issued again. A `failed` row is never the answer to its own re-issue. Definite means the provider answered no: a decline, a refused credential, a parsed body that says failure (iyzico's `status: failure`, on a status below 500), an answered 4xx other than 408, 409, 425 and 429, or the adapter refused before calling (a precondition, a capability). An answered 2xx is never definite by its status alone: a 2xx whose body could not be parsed or was cut short (iyzico and Lemon Squeezy throw on it) most likely carried a refund that was made, so it is ambiguous.
- A provider call that fails AMBIGUOUSLY (a timeout, a network error, a provider 5xx, a throttle, anything unclassified) may have made the refund before the answer was lost. The row stays `pending`, keeps its key and is marked `metadata.refundOutcome = "unknown"`; the error is on `failureReason` and logged `RefundOutcomeUnknown`. Every retry gets 409 `REFUND_IN_PROGRESS` and never reaches the provider. A `refund.succeeded` webhook settles the row only on evidence that it is this request's refund (`RefundOutcomeSettledByWebhook`):
  - the report carries the reservation's evidence token (`metadata.refundEvidenceToken`: random, minted with the reservation; the refund doors send it as refund metadata, and Stripe keeps refund metadata and reports it back). It is not the idempotency key: that key is a hash anyone can recompute from the payment, anchor and amount, so a copy of it on another refund proves nothing. The key sent as the provider's idempotency key stays deterministic, because a re-issue must reuse it. The token never leaves the payment layer: it is stripped from the refund an action or the refund route returns, and from the `resource` an `afterPaymentRefunded` hook receives;
  - or the report names a sub-transaction the request PLANNED. Before the provider call the refund doors record the plan on the reserved row (`metadata.refundPlan`; iyzico: each item `paymentTransactionId` and exact planned amount; a full refund's row takes the planned total). Each part also reserves its synthetic report ordinal. A matching vendor report at that ordinal is persisted as skipped evidence for that request, including while the provider call is still in flight. The request stays `pending` with its full planned headroom until every part is confirmed. After an ambiguous answer, the doors re-read the durable event evidence, so reports received before a later timeout are retained. Later reports complete the same aggregate; concurrent reports do not overwrite each other's evidence in refund metadata. A delayed equal-amount report of an older shared-ID request cannot settle a newer one.

  A report of the same payment and amount is not evidence, and a `refund.failed` report never settles the row: a failure we cannot tie to our request tells us nothing about it. A refund made in the provider's panel dispatches on its own and never takes over the row. Otherwise an operator settles the row. No adapter can look a refund up by its request (`refreshRefund` needs the provider refund id, which a lost answer never gave us), so there is no automatic lookup.
- A provider answer of `failed` or `canceled` clears the key the same way.
- After its insert wins, a request checks the headroom again against every row, other requests' reservations included. Two different refunds that race past the first check and together exceed the captured amount never both reach the provider. If both inserts land before either check, both are refused with 409, and the caller retries one of them.
- A reservation that stays `pending` without a provider answer and without `refundOutcome = "unknown"` means the request ended (a crash) between the insert and the answer. Its retries get `REFUND_IN_PROGRESS`, and the detail names the row. Check the refund at the provider, then set the row's `statusLiteral`: `failed` or `canceled` frees the request for a re-issue, and `succeeded` (with `providerRefundId`) records it.

Without an anchor (an api that runs on the order itself, or a route call with no `Idempotency-Key` header), nothing but the intent and the amount names the refund. A second refund of the same amount within 24 hours (Stripe's idempotency window, the longest among the adapters) is refused with `REFUND_POSSIBLE_DUPLICATE`, naming the refund it matched, instead of being collapsed by the provider into the first. A different amount is a new refund. To issue several equal partial refunds, refund from a refund-record api, or send a distinct `Idempotency-Key` per refund on the route.

### One row, one hook, one clawback per real refund

Not every provider gives each refund its own id. iyzico answers every partial refund of a payment with the refunded basket item's transaction id, and Lemon Squeezy answers with the order id. An adapter declares this (`refundIdsArePerRefund: false`), and for such a provider each refund is recorded under its own id, `<provider id>~<token>`, with the provider's id kept in `metadata.rawProviderRefundId`. That record id is the `providerRefundId` of the refund row, of the refund event and of the `resource` an `afterPaymentRefunded` hook receives. A later vendor webhook of such a provider is paired with the synchronous close-out it reports: same provider id, same payment, same amount (for Lemon Squeezy, the same cumulative refunded total). The pairing is one to one, so a different refund that shares the id is still dispatched.

iyzico also SPLITS one refund: it refunds a multi-item order per item transaction (a full refund takes each item's refundable remainder; a partial takes the items in basket order, each up to its remainder) and sends one REFUND webhook per item. The adapter's answer lists the parts (`metadata.refundParts: [{ providerRefundId, amount }]`), and the refund is still ONE refund. Before the money call, its exact planned parts reserve synthetic report ordinals with skipped `refund.planned` markers that claim no dispatch key or moved money. Matching item webhooks at those ordinals are stored as skipped evidence, so sync-first, vendor-first and concurrent orders all dispatch one request aggregate: one `afterPaymentRefunded`, one clawback of the exact moved total. The database-unique aggregate identity is stable across the synchronous answer, lost-response reconciliation and replay after a crash between settlement and event insertion. Item reports outside the request's exact plan and ordinals dispatch independently, including panel refunds and delayed reports of older requests. Where no runtime plan exists, the per-part reports are paired one by one. If a later item fails after an earlier one moved money, a definite refusal ends the refund with the moved parts (`metadata.refundIncomplete`, the reason on `failureReason`), and an ambiguous failure leaves the row `pending` as above. No other adapter splits a refund: Stripe, PayPal, Adyen, Paddle, Mangopay and Lemon Squeezy make one refund object per call. For a provider whose ids name one refund (Stripe, PayPal, Adyen, Paddle, Mangopay), every further report of the same refund id and outcome is stored and not dispatched.

The database decides which report dispatches. Every report of a refund (the synchronous close-out, each vendor webhook) is written to `sys_paymentEvent` under the refund's dispatch identity, the unique column `refundDispatchKey`. Only the row that wins it is dispatched. A row that loses is stored `skipped`, and its `errorMessage` names the winner. So a close-out and a webhook of the same refund that arrive at the same instant run the hooks and the clawback once. The winning row itself also runs them at most once: a retry, a re-claim or a replay of that row fires nothing again, and the admin replay refuses both the processed winner and a `skipped` loser with 409 `REPLAY_ALREADY_PROCESSED`. A credit note the `afterPaymentRefunded` hook issues through the generated credit-note manager should carry an `idempotencyKey` derived from the refund (for example `refund-<providerRefundId>`): the same key never issues a second credit note. On a service whose invoice object uses `issuePolicy: onPaymentCaptured` with a credit-note-capable provider, the refund bridge already issues that note for a paid invoice under the same key, so the hook is only needed for other issue policies.

- Where the provider's id names one refund, the identity is the provider, the refund id and the outcome. It does not include the payment id: PayPal's refund webhook names the capture, and the create call names the order.
- Where the id is shared, the reports of one provider id, payment, amount (or total) and outcome are counted. Each report first takes the next number on its own side, the n-th synchronous record or the n-th vendor report, under the unique column `refundReportKey`. The n-th record and the n-th vendor report then meet on the same dispatch identity. Two real refunds of the same amount reported at the same instant (yours and one made in the provider's panel) take numbers 1 and 2, and both are dispatched.

Stripe: each refund is reported by its own `refund.created` / `refund.updated` event, mapped by the refund's status (`succeeded` means `refund.succeeded`, `failed` or `canceled` means `refund.failed`, anything else settles nothing). `charge.refunded` is not treated as a refund, because its object is the charge.

### A refund that fails after it succeeded is undone

Stripe can report a refund `succeeded` and later `failed`. The refund was reversed, and the money is back with the merchant. When the `refund.failed` event is dispatched for a refund whose row reads `succeeded`, its effects are undone once:

- the refund row reads `failed`, so the headroom stops counting it;
- the ticket goes back to the status it had before that refund: `success` when no other refund stands, `partially_refunded` when others do. A payment that was under review before the refund returns to its review state: `captured_after_cancel` when the ticket carries `metadata.capturedAfterCancel`, or `amount_mismatch` when `metadata.amountMismatch.providerIntentId` matches the ticket's current `paymentId`. A mismatch record without an intent id also restores `amount_mismatch`. A mismatch retained from an earlier attempt does not put a restarted, fully paid ticket back under review. The payment can be refunded again;
- on a platform-settled marketplace object, the settlement ledger writes a `clawback_reversal` entry that gives back what the refund took from the seller's earnings, so they net back as if the refund never happened. That is the clawback's amounts, or, for a refund processed before the capture accrued, the part of the accrual that was netted for it. The entry is keyed on the failure event and written at most once per clawback. It reverses only a clawback that the failure report identifies unambiguously: on a provider whose refund id names one refund, the clawback recorded under that id (exactly one); on a provider that shares refund ids (iyzico: every refund of an item carries the item's transaction id), only a report that names our record id (`<provider id>~<token>`). A failure report carrying a shared raw id could be any refund of that item (a failed panel attempt of 10 is not the 30 that stood), so it reverses nothing. When a clawback of that item exists, the ledger logs `RefundReversalUnattributed` (payment, refund id, amount, order) for an operator;
- the reversal is logged as `RefundReversedAfterSuccess`.

The `afterRefundFailed` lifecycle hook runs for it once, with `reversal` true. `afterPaymentRefunded` has already run for that refund and does not run again, so `afterRefundFailed` is where the designer undoes what the `afterPaymentRefunded` hook did (re-open fulfilment, correct a credited wallet, tell the buyer). `reversal` is a boolean, read bare in the script and the condition (or as `this.reversal`). A refund that fails without ever succeeding does not change the ticket; `afterRefundFailed` runs for it with `reversal` false. A compiler that does not implement this trigger draws the validation warning `PAYMENT_LIFECYCLE_TRIGGER_NODEJS_ONLY`.

### A failure reported before its success

Reports can be processed out of order: a success row retried after its first attempt failed, or a delivery that arrived late. On a platform-settled marketplace object, a `refund.failed` for a refund that has no clawback yet records that failure on the payment's settlement balance (the `balance` earnings row, `metadata.refundOutcomes`, keyed by the provider and the refund id), and logs `SettlementRefundFailureRecorded`. When the `refund.succeeded` of the same refund is processed later, nothing is clawed back and the balance does not move: its earnings entry is booked at zero with `metadata.refundFailedFirst`, and the ledger logs `SettlementClawbackSuppressed`. The merchant kept the money, so the seller keeps the earnings.

- Either order ends the same: success then failure is a clawback and its reversal, failure then success is no clawback at all. Replays and further failure reports of the refund write nothing more.
- The failure is recorded only when the report names one refund: a refund id on a provider whose ids name one refund, or our record id `<provider id>~<token>` on a provider that shares ids. A raw shared id (an iyzico item's transaction id) records nothing, because it would stop a different refund of the same item from being clawed back.
- When the two reports are processed at the same instant, the balance's compare-and-set decides which came first. If the success's balance move landed first, the failure waits briefly for its entry to be booked and then reverses it. If that booking never lands (a crash), see the recovery below.

The same marker also decides the rest of that late success report: the refund row stays `failed` (its request key stays free, so the headroom does not count it), the ticket does not move to `partially_refunded` or `refunded`, and `afterPaymentRefunded` does not run. The dispatcher logs it as `RefundSucceededAfterFailure` (WARN) so an operator can reconcile with the provider. The marker plays no part for a refund that was never reported failed first. It exists only for a platform-settled marketplace object (it lives on the settlement ledger), so on other objects a success report processed after its failure still moves the row and the ticket.

A success whose clawback crashed between its balance move and its booking is not re-run by the dispatcher: an event's lifecycle fans out at most once per event row, and the admin replay refuses an event whose dispatch completed (409 `REPLAY_ALREADY_PROCESSED`). Such a row is marked instead: `sys_paymentEvent.lifecycleIncompleteAt` with `lifecycleIncompleteReason` `settlement-step-failed` (a ledger step failed: the ERROR `settlement earnings ledger failed`, or a refund failure whose reversal outlived its bound, `RefundReversalPending`) or `fan-out-failed-after-side-effect`. A platform operator finishes the settlement part with `POST /v1/payments/admin/settlement-redrive/:eventRowId`: it re-runs ONLY the settlement arm of that row (accrual, clawback or reversal), each step idempotent per entry, so a completed step books nothing and a half-done one is finished; no hook or invoice bridge runs again. The re-drive is audited and clears the marker once every step completed (422 `SETTLEMENT_REDRIVE_FAILED` and the marker stays when a step fails again). For a `RefundReversalPending` row, re-drive the refund's success row first (it books the clawback), then the failure row.

### Kafka consumers and system transports

The ownership check compares the caller with the ticket owner. It is skipped only for a system applier: a cron or internal call, or a kafka-triggered api declared `loginRequired: false`, which is how a kafka consumer says it applies events on the system's behalf (the event's producer is not the refund's caller). The 404, terminal-state and headroom refusals still run for these. A REST or MCP api with `loginRequired: false` still checks ownership, so an anonymous caller that knows an intent id is refused 401. An intent id is not a credential.

The provider's webhook still advances the `sys_<X>Payment` ticket for refunds this service never issued itself. See [payment workflow](../capabilities/payment-workflow.md).

## Example

A partial refund of a previously captured order:

```json
{
  "name": "refundReturnShipping",
  "paymentIntentIdProperty": "order.payment.intentId",
  "refundAmountProperty": "order.refundedShippingAmount",
  "reasonProperty": "return.reasonCode",
  "contextPropertyName": "refund",
  "writeToResponse": true
}
```

## Errors

- Provider lacks the relevant capability, `CapabilityLimitedError` raised by the payment layer at request time.
- `paymentIntentIdProperty` does not resolve to a value at runtime: the action reads the intent id from the payment ticket of the order the api acts on; an order with no payment ticket answers 404 `NOT_FOUND` before the provider is called. Where the api's order is unknown (no relation, or several, to the order object; inside a loop) the generated method throws a clear error.
- Original payment is not in a refundable state, provider returns a domain error; surfaced via `onActionError`.
- Refund amount exceeds the captured amount minus prior recorded refunds, or the payment is already fully refunded: refused 409 before the provider is called (`REFUND_EXCEEDS_CAPTURED` / `PAYMENT_ALREADY_REFUNDED`).
- A second equal-amount refund with no anchor (an api whose own object is the order, or a route call without `Idempotency-Key`), inside the 24-hour window: 409 `REFUND_POSSIBLE_DUPLICATE`.
- The same refund request while its first provider call is still in flight, or after that call failed without a definite answer: 409 `REFUND_IN_PROGRESS`. Retry later; the detail says which.
- A route `Idempotency-Key` re-sent with a different amount: 409 `IDEMPOTENCY_KEY_REUSED`.
- The provider fails while the refund is being PLANNED (iyzico reads the payment detail first): no money moved and the refund row reads `failed` with `failureReason: "refused while planning the refund: ..."`. A parsed provider refusal (iyzico `status: failure`, for example a payment the provider does not know, as the mock transport after a restart) answers 422 `REFUND_PLAN_REFUSED`, naming the row; a provider 4xx answers its status with `PAYMENT_PROVIDER_REQUEST_REJECTED`; an unusable answer or an outage answers 502 `PAYMENT_PROVIDER_UNAVAILABLE` (`retryable: true`). The provider's own sentence stays on the row and in the log, never in the body.
- No payment ticket for the intent id: 404. A failed or canceled ticket: 400. A caller who does not own the ticket: 403 (401 when no caller at all).
- `providerOnly`: the `ownershipGuard` answered false (or no guard was compiled): 403 `NOT_OWNER`, before the provider is called.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PaymentAction`](./payment-action.md), [`SubscriptionAction`](./subscription-action.md), [`PayoutAction`](./payout-action.md): sibling payment-domain actions.
- [`PaymentProvider`](../../spec/PaymentProvider.md), [`PaymentCapabilities`](../../spec/PaymentCapabilities.md).
- [Payment workflow](../capabilities/payment-workflow.md).
