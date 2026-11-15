---
title: 3-D Secure and buyer redirects by provider
---

# 3-D Secure and buyer redirects by provider

This page answers one question for every native payment provider: **when a payment
needs the buyer (a 3-D Secure challenge, a hosted payment page, a redirect), who
completes it, which generated route is involved, what the frontend renders, and
what the return page does.** It is written for the author who binds a provider and
for the frontend developer who builds the checkout. The [payment
workflow](payment-workflow.md) carries the authoring model; the per-provider
adapter detail belongs to the compiler in use (see
[the compiler specification](../../compiler/index.md)).

## The rule: completion is service-owned

A payment that waits for the buyer is completed by the generated service and the
provider, never by a Business API the author writes:

- **Stripe:** the browser finishes the PaymentIntent through Stripe.js
  (`stripe.handleNextAction`, `stripe.confirmPayment`,
  `stripe.confirmCardPayment`). Stripe confirms the intent itself; the generated
  webhook route records the capture. No server call completes a Stripe payment.
- **iyzico:** iyzico form-POSTs the buyer back to a generated route of the service
  (`/v1/payments/checkout-return/<providerName>` after the hosted Checkout Form,
  `/v1/payments/threeds-return/<providerName>` after a saved card's 3-D Secure).
  That route completes the payment (for a saved card it calls iyzico's
  `3dsecure/auth` itself), runs the lifecycle hooks, and only then redirects the
  buyer to the app.
- **Adyen:** the frontend runs Adyen's action with Adyen Web and sends what Adyen
  Web returns to the generated `PATCH /v1/complete<x>payment/:orderId` route, which
  calls Adyen's `/payments/details`.

So, for these three providers (and for Mangopay), a blueprint authors **no**
`complete`, `callback` or webhook Business API, and no "save my card" API. The
checkout opt-in on the order object (`objectSettings.checkout`) is enough; the
generated routes below are the default surface. A `PaymentAction` with stage
`start` (or `simple`) in the author's own Business API is optional: use it only
when the start must run inside the author's own workflow, or to save the card while
paying on Stripe and Adyen (see [Designer settings](#designer-settings)). PayPal is
the one provider whose capture needs an authored API (see
[Other providers](#other-providers)).

Throughout, `<x>` is the lowercase model name of the order object (`Order` ->
`/v1/startorderpayment/:orderId`) and `<providerName>` is the provider entry's
`name` in `projectSettings.paymentProvidersSettings.paymentProviders[]`.

## At a glance

What the frontend does after the start answer, and what completes the payment:

| Entry shape | Stripe | iyzico | Adyen |
|---|---|---|---|
| One-time, card entered now | Payment Element + `stripe.confirmPayment` on the start's `client_secret`; Stripe completes | navigate to the hosted Checkout Form (`redirectToUrl`); the checkout-return route completes. With `directCardEntry` on the entry: the author's own card form sends `paymentUserParams.cardInfo`; render the decoded `threeDSHtmlContent` (the saved-card step, the threeds-return route completes) or, below `newCardThreeDSThreshold`, nothing (`success` at once) | Drop-in card as `paymentMethodData`; an action goes to Adyen Web, its `details` to the complete route |
| One-time, saved card | `stripe.handleNextAction` when the answer is `requires_action`; Stripe completes | render the decoded `threeDSHtmlContent` page; the threeds-return route completes (`3dsecure/auth`). When the entry's `savedCardThreeDSMode` skips 3-D Secure for this charge (a verified card under `verifyOnce`, below the `threshold`): nothing to render, the start answers `success` (`/payment/auth`) | Adyen Web runs the action; the complete route completes |
| Hosted payment page | not implemented (every start is a PaymentIntent) | this is the "card entered now" shape above | not implemented on the generated surface |
| Save the card while paying | a checkout or subscription `storePaymentMethod` switch plus a `PaymentAction` start / simple; the `payment_method.attached` webhook files the card | a checkout or subscription `storePaymentMethod` switch; the buyer ticks "save" on the hosted form; filed when the payment settles | a checkout or subscription `storePaymentMethod` switch makes a `PaymentAction` start / simple, and the start route with a first card, send `storePaymentMethod: true`; the paid card is filed in the buyer's wallet (see the Adyen section) |
| Add a card from the account page | `stripe.createPaymentMethod`, then `POST /v1/payment-methods/add`; no 3-D Secure at save time | `POST /v1/payment-methods/add` with `cardInfo` (server-side card storage); no 3-D Secure at save time | no standalone add-card step: Adyen stores a card during a payment |
| Subscription, first payment | answer `past_due` + `nextAction`; `stripe.confirmCardPayment(nextAction.clientSecret)`; `invoice.paid` makes it `active` | hosted mode: answer `pending_provider` + `checkoutForm`; show iyzico's hosted subscription form; the subscription-checkout-return route confirms it. tokenized mode: the first payment is the order's own start that saved the card; recharges are merchant-initiated, never 3-D Secure | tokenized: the first payment is the checkout payment that enrolled the card; recharges are merchant-initiated |

## The common contract (every provider)

**Start.** The generated `PATCH /v1/start<x>payment/:orderId` (session, order
ownership, the checkout role gate) with:

```json
{
  "paymentUserParams": {
    "paymentMethodId": "<a saved method id from GET /v1/payment-methods/list, or omit>",
    "return_url": "https://app.example/checkout/done?orderId=<orderId>",
    "providerOptions": {}
  }
}
```

The amount, currency and customer come from the persisted order row, never from the
body. An author-written Business API that runs a `PaymentAction` with stage `start`
takes the same inputs as its own flat request parameters (`return_url`,
`paymentMethodId`, `providerOptions`).

**The buyer step: one `nextAction` on every answer.** Every answer that can hand the
buyer a step carries it in ONE shape: the generated start route and its resume, a
`PaymentAction` start / simple, and the buyer status read below. Read this block
first; the older per-answer keys are kept beside it (legacy, see the tables below)
so nothing a shipped frontend reads has moved. Those legacy keys
(`paymentIntentInfo` on the start route and its resume, `requires_redirect` /
`next_action` on the buyer status read) are **deprecated**: a frontend reads
`nextAction` only.

```json
"nextAction": {
  "requiresAction": true,
  "requiresRedirect": true,
  "redirectToUrl": "https://sandbox-cpp.iyzipay.com/…",
  "clientSecret": null,
  "raw": { "paymentPageUrl": "…", "checkoutFormToken": "…", "tokenExpireTime": 1800, "conversationId": "…" },
  "actionExpiresAt": "2026-10-05T12:30:00.000Z"
}
```

| Key | Meaning |
|---|---|
| `requiresAction` | the buyer must act before the payment can settle |
| `requiresRedirect` | the step is a full-page navigation to `redirectToUrl` (iyzico hosted form, PayPal, an Adyen redirect action) |
| `redirectToUrl` | where to send the browser when `requiresRedirect`; else `null` |
| `clientSecret` | Stripe's client secret for Stripe.js; on Adyen this slot carries `paymentData`, not a secret; `null` for a redirect / HTML step |
| `raw` | the provider's step, verbatim: Stripe's `next_action`, iyzico's `paymentPageUrl` or `threeDSHtmlContent`, Adyen's `action`; `null` when there is none |
| `actionExpiresAt` | the instant the recorded step stops being handed back (iyzico: the hosted page's token lifetime, the 3-D Secure form's time-to-live); `null` when nothing is recorded (Stripe, a terminal answer) |

`nextAction` is `null` when there is no step (a terminal answer on the route, an
expired or absent step on the status read). The same ticket state answers the same
keys and values on every door; a resumed step and the status read hand back the very
same recorded `raw` (with `raw.actionExpiresAt` inside it as well, as the resume
always answered).

**Start answer: the generated route.** `PATCH /v1/start<x>payment/:orderId` answers
the payment result directly (no `data` envelope). Branch on `statusLiteral`; the
buyer step is in `nextAction` (above):

| Field | Meaning |
|---|---|
| `statusLiteral` | `success` (captured; the hooks already ran unless `lifecyclePending: true`), `started` (the buyer must act), `failed`, `amount_mismatch` (captured for the wrong amount: not paid, under review), `captured_after_cancel` (a payment canceled on this side that the provider reports captured: not paid, under review) |
| `nextAction` | the buyer step, canonical shape (above) |
| `paymentIntentInfo` | **legacy**, **deprecated**: the same step in snake_case, `{ requires_redirect, redirectToUrl, client_secret, next_action }` = `nextAction.requiresRedirect` / `redirectToUrl` / `clientSecret` / `raw` |
| `pendingIntentReused` | `true` when the start resumed the order's open payment instead of opening a new one ([Resuming](#resuming-an-open-payment)) |
| `provider` / `providerName` | the provider TYPE and the configured provider entry name |

**Start answer: a `PaymentAction`.** A `PaymentAction` with stage `start` or
`simple` (the `payOrder`-style workflow action) answers the provider intent (the
normalized intent) merged with `paymentTicketId`, for a checkout order object, or
the same intent without a ticket for an action with no checkout object behind it:

| Field | Meaning |
|---|---|
| `providerIntentId` | the provider's own intent/payment id (what the route calls `paymentId`) |
| `providerStatus` | the raw provider-side status string |
| `statusLiteral` | the same literal the route answers (see above) |
| `amount` / `currency` | what the provider was charged, read off the intent |
| `nextAction` | the canonical block (above); this answer's `nextAction` always had the first five keys, `actionExpiresAt` was added, and its two older keys `requiresConfirmation` / `publishableKey` stay (legacy) |
| `paymentTicketId` | the `sys_<X>Payment` ticket id (absent on an action with no checkout object) |
| `lifecyclePending` | additive `true`, same meaning as the route |
| `pendingIntentReused` | additive `true`, same meaning as the route |

A frontend that drives both the mounted route and a `payOrder`-style Business API
reads `nextAction` on both. Both answers strip the provider-only `buyer`,
`billingAddress` and `shippingAddress` blocks out of `metadata` before the client
sees it, and out of the echoed `paymentUserParams` and its `providerOptions` too
(iyzico accepts these blocks as `providerOptions` extras; the provider request still
carries them). See [`PaymentAction`](../../spec/PaymentAction.md) for the full
behaviour.

**Return page.** The author's `return_url` page is the first code of the author's
that runs after the buyer step. Never trust a query hint as proof of payment: read
the buyer's own payment status and branch on its `statusLiteral`. The buyer read
`GET /v1/<x>paymentstatusbyorderid/:orderId` answers only the order's owner and an
absolute role (any other caller, a subject-less machine caller included, and a
missing order get the same `404`), is not behind the checkout role gate, and
answers:

```json
{
  "orderId": "…",
  "statusLiteral": "started",
  "amount": 150,
  "currency": "TRY",
  "nextAction": {
    "requiresAction": true,
    "requiresRedirect": true,
    "redirectToUrl": "https://sandbox-cpp.iyzipay.com/…",
    "clientSecret": null,
    "raw": { "paymentPageUrl": "…", "checkoutFormToken": "…", "tokenExpireTime": 1800, "conversationId": "…", "actionExpiresAt": "2026-10-05T12:30:00.000Z" },
    "actionExpiresAt": "2026-10-05T12:30:00.000Z",
    "requires_redirect": true,
    "next_action": { "paymentPageUrl": "…", "checkoutFormToken": "…", "tokenExpireTime": 1800, "conversationId": "…", "actionExpiresAt": "2026-10-05T12:30:00.000Z" }
  },
  "updatedAt": "…"
}
```

`statusLiteral` is `null` before any start. `nextAction` is `null` unless the
payment is `started` AND the ticket's recorded buyer step (`metadata` on the
`sys_<X>Payment` row) has not expired. When present it is the canonical block
(above) plus, **legacy**, the snake_case keys this read answered first
(`requires_redirect`, `next_action` = `raw`; `redirectToUrl` is shared). Read the
canonical keys; the legacy ones are **deprecated**. It reads the recorded payment
and does not ask the provider (the checkout return route and the webhook record the
outcome).

The service-completed returns (iyzico's hosted Checkout Form return and its 3-D
Secure return) redirect the buyer with `303` to the author's `return_url` and append
two query hints, the same keys on both routes:

| Hint | Value |
|---|---|
| `orderId` | the order the ticket belongs to |
| `status` | the ticket's `statusLiteral` after the return: `success`, `failed`, `amount_mismatch` (captured for the wrong amount, under review), `captured_after_cancel` (the ticket was canceled and the provider reports the payment captured anyway: under review, not paid), or `started` (nothing settled yet: an open form, the provider could not be reached, or a 3-D Secure completion the provider refused while its payment detail could not be read, so whether money moved is unknown; the webhook or a refresh settles it). On a repeated callback the ticket may have moved on since, and the hint carries whatever it reached, without the return rewriting it: `canceled`, `refunded`, `partially_refunded`, `disputed`, or, for an adapter-reported status the state machine still treats as not yet settled (same as `started`), `unhandled` or `unknown-<status>`. |

The hints are appended after any query the `return_url` already has, and before its
`#fragment`. The subscription Checkout Form return appends `subscriptionId` and
`status` (the row's status, for example `active`, `trialing`, `past_due`,
`provider_failed`, `canceled`, or `pending_provider` while nothing is settled). A
return whose provider call fails still redirects the buyer, with the status the row
holds; only a request that is not a valid return at all (no token, an unknown
provider, a token or payment no ticket resolves) is answered with a `problem+json`
error. A REPEATED hosted Checkout Form return (the form posted again after it
settled: a refresh, the back button) finds its ticket without iyzico: the first
settle records the swap of the form token for the payment id on the ticket
(`metadata.checkoutFormSwap`), so an iyzico outage at that moment still redirects
with the status the ticket holds, and the operator gets a log line. A token that no
ticket resolves while iyzico cannot be read is still a `404` problem+json, with the
same operator line. The subscription form posted again after it settled is still
found only through iyzico's answer, so an iyzico outage at that moment is an error
there.

A repeated hosted-form return, or a late or re-delivered `CHECKOUT_FORM_AUTH`
webhook, never writes a ticket that a refund, a dispute or a review moved past the
capture (`refunded`, `partially_refunded`, `disputed`, `amount_mismatch`,
`captured_after_cancel`) back to `success`, although iyzico's form detail keeps
reporting the form paid.

**A canceled payment that is captured anyway is not paid.** When the buyer pays at
the last moment while the author's side canceled the ticket, the provider later
reports the payment captured. Whichever path sees that first (the hosted-form return
or its webhook, the provider webhook, the refresh or complete route, an in-workflow
`PaymentAction` stage) writes the ticket `captured_after_cancel`, once: the ticket
keeps the evidence in `metadata.capturedAfterCancel` (the provider status, the
captured amount and currency and whether they match the order, the payment id, the
path that saw it, when), and the service logs one error line. No success lifecycle
runs (no `afterPaymentCaptured` hook, no invoice, no settlement accrual), no
lifecycle hook fires (the log line and the review state are the signal), and nothing
is refunded automatically: an operator decides whether to refund the capture (the
payment stays refundable) or to fulfil the order. A later report of the same payment
changes nothing, and a new start for the order is refused (`400`) so the buyer is
not charged twice. The 3-D Secure return cannot reach this state: it calls the
provider's `3dsecure/auth` (which takes the money) only for a `started` ticket, so a
bank success that arrives after the cancel moves no money and the ticket stays
`canceled`.

```js
// on the return_url page (any provider)
const params = new URLSearchParams(window.location.search);
const orderId = params.get("orderId");   // appended by iyzico's returns; encode it into return_url for other providers
const res = await fetch(`${serviceBaseUrl}/v1/<x>paymentstatusbyorderid/${orderId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const ticket = await res.json();
if (ticket.statusLiteral === "success") { /* paid: show the confirmation */ }
else if (ticket.statusLiteral === "failed" || ticket.statusLiteral === "canceled") { /* offer a retry */ }
else if (ticket.statusLiteral === "amount_mismatch" || ticket.statusLiteral === "captured_after_cancel") { /* not paid, under review: stop polling */ }
else { /* started: poll again in a moment */ }
```

The staff routes `PATCH /v1/refresh<x>payment/:orderId` (asks the provider) and
`GET /v1/<x>paymentbyorderid/:orderId` (the whole ticket) carry the checkout role
gate whenever the order object has one (`checkRoles`, or the default
`routeAccess: inherit` deriving it): a buyer whose session holds none of those roles
is answered `403 PAYMENT_ROLE_REQUIRED` there, so a buyer page uses the buyer read
above.

When a buyer page needs the provider asked again (the payment stays `started`: a
late notification, or a payment the provider holds for its review), it calls the
buyer's own refresh, `PATCH /v1/<x>paymentstatusrefresh/:orderId`. It carries the
buyer read's guards (login and the order's owner column, never the checkout role
gate, the same `404` for another buyer's order), reads the provider only for a
`started` payment, through the staff refresh's own reconcile (nothing written beyond
what the provider read says, the capture lifecycle at most once), and answers the
buyer read's fields plus `refreshed` (`true` only when the provider was read now;
`false` for a settled payment, a failed read, or a provider with no payment read such
as Adyen). It is rate-limited per order, keyed on the order row it proved, and per
buyer (defaults: 6 per minute per order with a burst of 3, 30 per minute per buyer):
over a limit the answer is `429 TOO_MANY_REQUESTS` with `retryAfterSeconds` and a
`Retry-After` header, and nothing is asked of the provider. A compiler documents
which target languages provide this route.

A ticket already past the capture (`refunded`, `partially_refunded`, `disputed`,
`amount_mismatch`, `captured_after_cancel`) is never moved back by a provider read:
the provider keeps reporting such a payment paid (an iyzico form detail reads
`SUCCESS` after a refund, a Stripe PaymentIntent stays `succeeded`). The refresh
route still reads the provider but applies only a forward move of the payment state
machine (a reviewed capture the provider then refunds becomes `refunded`, a refunded
payment that is disputed becomes `disputed`); any other read is answered from the
ticket (`refreshedFrom: "ticket"`, nothing written, no hook). The complete route
refuses such a ticket with `400` (a `PaymentAction` stage `complete` is refused the
same way, before the provider is called), and a `PaymentAction` stage `refresh` /
`callback` answers the stored status. A `canceled` ticket the provider reports
captured is written once as `captured_after_cancel` for review, with no success
lifecycle.

**Webhook.** `POST /v1/payments/webhook/<providerName>` is generated for every
provider entry. It verifies the signature, stores the event in `sys_paymentEvent` and
drives the ticket and the lifecycle hooks. Authors write nothing for it; the provider
must be configured to deliver its notifications to that URL.

**Hooks run once.** `afterPaymentCaptured` / `afterPaymentFailed`, the invoice bridge
and the settlement accrual run once per payment, whichever of the return route, the
synchronous start answer, the refresh and the webhook records it first. The generated
payment layer does not write the order's status property itself: write it from those
hooks.

## Stripe

Stripe is **client-completed**: the buyer never leaves the SPA, and there is no
service-side return route. Every one-time start is a PaymentIntent, created with
`automatic_payment_methods` and `allow_redirects: "never"`, so only methods that
complete on the page are offered.

| Entry shape | Start | Frontend renders | Who completes | Buyer lands on | Webhook / backstop | Statuses |
|---|---|---|---|---|---|---|
| One-time, card entered now (path A, recommended) | no `paymentMethodId`; answer `started`, `paymentStatus: "requires_payment_method"`, `client_secret` | the Payment Element on `client_secret`, then `stripe.confirmPayment({ elements, redirect: "if_required" })` | Stripe, inside `confirmPayment` | stays in the SPA | `payment_intent.succeeded` -> `afterPaymentCaptured`; `PATCH /v1/refresh<x>payment/:orderId` when the webhook is late | `started` -> `success`; `payment_intent.payment_failed` -> `failed` |
| One-time, card entered now (path B) | `stripe.createPaymentMethod`, then start with that `pm_...` as `paymentMethodId`; the service confirms at create | as for a saved card below | Stripe | stays in the SPA | as above | as below |
| One-time, saved card | `paymentMethodId` = a `pm_...` the caller owns (else `403 PAYMENT_METHOD_NOT_OWNED`); confirmed at create | nothing when the answer is `success`; on `started` + `paymentStatus: "requires_action"`, `stripe.handleNextAction({ clientSecret })` | Stripe, after the challenge | stays in the SPA | as above; a card that needs no challenge is recorded before the start answers | `success` at once, or `started` -> `success` / `failed` |
| Hosted checkout page | not implemented | - | - | - | - | - |
| Save the card while paying | a `PaymentAction` start / simple on an order object with a `storePaymentMethod` switch; Stripe gets `setup_future_usage: "off_session"` | as path A or the saved-card row | Stripe | stays in the SPA | `payment_method.attached` files the card in `sys_paymentMethod` for the owner of the Stripe customer | as above |
| Add a card from the account page | `stripe.createPaymentMethod`, then `POST /v1/payment-methods/add` with `paymentMethodId` (`customerId` optional) | the author's card form | no payment, no 3-D Secure at save time | - | - | the saved method record |
| Subscription, first payment | `POST /v1/subscribe<x>/:orderId` or a `SubscriptionAction` stage `subscribe`; Stripe charges the first invoice at once (`allow_incomplete`) | when `nextAction.requiresAction`: `stripe.confirmCardPayment(nextAction.clientSecret)` (another card when `paymentStatus` is `requires_payment_method`) | Stripe | stays in the SPA, or Stripe's `nextAction.hostedInvoiceUrl` page | `invoice.paid` -> row `active`, `afterInvoicePaid` | `active` at once, or `past_due` -> `active`; unfinished: `expired` after 23 hours |
| Subscription renewal that needs the buyer | Stripe charges the renewal | send the buyer the hook's `resource.hostedInvoiceUrl` | Stripe, on its hosted invoice page | Stripe's page | `invoice.payment_action_required` -> `afterInvoicePaymentFailed` with `resource.requiresAction: true`; paying sends `invoice.paid` | `active` -> `past_due` -> `active` |

Notes:

- An abandoned challenge leaves the intent at `requires_payment_method`, which reads
  `started`. A refresh alone keeps it `started`; only Stripe's
  `payment_intent.payment_failed` moves the ticket to `failed`.
- The generated start route never saves a card. On that route the "save this card"
  screen is `stripe.createPaymentMethod` plus `POST /v1/payment-methods/add`.
- The subscribe answer's `nextAction` (`requiresAction`, `clientSecret`,
  `paymentStatus`, `hostedInvoiceUrl`) exists only on that answer, never on the row,
  the event or a hook resource. Stripe `incomplete` is stored `past_due`; grant the
  plan on `active`, not on `afterSubscriptionCreated`.
- **Off-session charging** (`savedCardOffSession`, off by default). Under SCA an
  on-session Stripe charge can never be forced to skip 3-D Secure; the only charge
  with no buyer step is a merchant-initiated transaction (MIT, `off_session: true`).
  With `savedCardOffSession: "verified"` beside `savedCardThreeDSMode: "verifyOnce"`,
  a `PaymentAction` start or simple declared `buyerAbsent: true` (a scheduled or
  merchant-triggered charge) on a stored card whose row is already 3-D Secure
  verified is sent `off_session` + `confirm`: the answer is `success` at once with no
  `nextAction`, or a `402 PAYMENT_DECLINED` with `providerErrorCode:
  "authentication_required"` when the issuer still wants the buyer (the claim is
  released; start again on-session). A scheduled or system run (cron, internal, a
  Kafka consumer declared `loginRequired: false`) proves the card from the order
  owner; an HTTP call proves it with the caller's token, and an anonymous HTTP call
  stays on-session. An action without `buyerAbsent`, the generated start route, an
  unverified card and a caller body never go off-session (`off_session` stays
  refused, `400`). An MIT carries NO 3-D Secure liability shift, and card-network
  rules allow it only while the buyer is absent under a stored-credential agreement,
  never as a buyer-present one-click.
- **3-D Secure policy.** Stripe and the card issuer decide 3-D Secure. The provider
  entry can only FORCE it: at or above `newCardThreeDSThreshold` (path A and path B)
  or `savedCardThreeDSThreshold` (a saved card, `savedCardThreeDSMode: "threshold"`)
  the start's PaymentIntent carries `payment_method_options.card.request_three_d_secure`
  (`threeDSRequestLevel`, default `any`), so the answer is `started` +
  `requires_action` and the browser runs the challenge as in the rows above. Below
  the threshold nothing is written and Stripe and the issuer decide: the service
  cannot skip a challenge. Unset keys force nothing; an unreadable value forces (fail
  closed); a caller cannot set or skip it (`400`).
- **verifyOnce** (`savedCardThreeDSMode: "verifyOnce"`). Every charge of a stored
  card is forced until one is authenticated; the card is then marked verified
  (`sys_paymentMethod.threeDSVerified`) and its later charges are not forced. Stripe
  may still challenge them: Stripe and the issuer decide, and a charge completed
  without 3-D Secure carries no liability shift. There is no service-side return
  route on Stripe, so the mark is written after the payment settles, by the stored
  report that claims its capture lifecycle (webhook, refresh, sweeper or the start),
  and only when a live read of the PaymentIntent shows
  `three_d_secure.result: "authenticated"` on that very card. Only the generated start
  route and a `PaymentAction` relax a verified card (they prove the caller owns it);
  the thin shims always force.
- **Radar review** (`honourRadarReview`, default on). Stripe captures automatically,
  so a payment Radar places in review is already `succeeded` at Stripe. Every
  PaymentIntent read expands the charge and its review, and such a payment reads
  `started` with `paymentStatus` `FRAUD_REVIEW` on every path: the saved-card start
  answer, the complete answer, the refreshes. No `afterPaymentCaptured`, invoice or
  accrual runs, and a later start of the order is `409 PAYMENT_START_INTENT_PENDING`.
  A `payment_intent.succeeded` webhook is always confirmed by a live read first: under
  review it is refused (stored `skipped`, never counted as the recorded capture) and
  the ticket records the hold. `review.closed` `approved` settles `success` with
  `afterPaymentCaptured` exactly once; `refunded_as_fraud` or `refunded` settles
  `failed` (`FRAUD_REJECTED`, `afterPaymentFailed`) and Stripe's refund of it runs no
  refund lifecycle, also when it arrives before `review.closed`. The service's review
  sweeper and the buyer's own refresh back up a lost `review.closed`. The return page
  polls as for any `started` payment. `honourRadarReview: false` turns the behaviour
  off.

## iyzico

iyzico is **service-completed**: both card shapes leave the SPA and end on a route of
the service, which completes the payment before it redirects. The shape is chosen by
whether the start names a saved card.

| Entry shape | Start | Frontend renders | Who completes | Buyer lands on | Webhook / backstop | Statuses |
|---|---|---|---|---|---|---|
| One-time, no saved card (hosted Checkout Form) | no `paymentMethodId`, `return_url` set; answer `started`, `nextAction.requiresRedirect: true`, `nextAction.redirectToUrl` = iyzico's page, `nextAction.raw.paymentPageUrl` (legacy: `paymentIntentInfo.requires_redirect` / `redirectToUrl` / `next_action`) | navigate to `redirectToUrl`; the buyer enters the card and passes 3-D Secure on iyzico's page | the service: iyzico POSTs the form `token` to `POST /v1/payments/checkout-return/<providerName>`, which reads the form detail, runs the capture-amount gate and the hooks | `303` to `return_url` plus the `orderId` and `status` hints (see Return page) | `CHECKOUT_FORM_AUTH` webhook settles a buyer who never came back (same logic, once); else `PATCH /v1/refresh<x>payment/:orderId` | `started` -> `success` / `failed` / `amount_mismatch` |
| One-time, saved card (3-D Secure) | `paymentMethodId` = `<cardUserKey>:<cardToken>` from `GET /v1/payment-methods/list`, `return_url` set; answer `started`, `nextAction.requiresRedirect: false`, `nextAction.redirectToUrl: null`, `nextAction.raw.threeDSHtmlContent` (base64 HTML; legacy: `paymentIntentInfo.next_action.threeDSHtmlContent`) | decode `threeDSHtmlContent` and render it as a document (it auto-submits to the bank); never navigate to its form `action` | the service: iyzico POSTs to `POST /v1/payments/threeds-return/<providerName>`; with `mdStatus=1` it calls `3dsecure/auth` (forwarding `conversationData`), otherwise it settles `failed`; a cancel on the bank page arrives without `paymentId` and is matched by the attempt key (`conversationId`), never authorised, and settles `failed` on iyzico's detail read; an unmatched POST answers an HTML `404` | `303` to `return_url` plus `orderId` and `status` | `THREE_DS_AUTH` webhook is stored `skipped` (or makes the route's event the skipped one); hooks run once | `started` -> `success` / `failed` / `amount_mismatch` |
| One-time, saved card, no 3-D Secure (`savedCardThreeDSMode` on the provider entry only: a verified card under `verifyOnce`, or below `savedCardThreeDSThreshold`) | `paymentMethodId` as above; the service calls iyzico `POST /payment/auth` (no callbackUrl); answer `success` at once, no `nextAction` | nothing to render: show the result | the service, synchronously: the start itself captures (capture-amount gate, `afterPaymentCaptured`) | the author's own next page; no return route is involved | a refusal is `422 PAYMENT_PROVIDER_REQUEST_REJECTED` with iyzico's code, no ticket | `success` / `amount_mismatch`; a refusal leaves the order unchanged |
| One-time, a card entered on the author's own frontend (`directCardEntry: true` on the provider entry; widens the PCI scope) | no `paymentMethodId`; `paymentUserParams.cardInfo` = `{ cardHolderName, cardNumber, expireMonth, expireYear, cvc }`, optional `saveCard: true`, `return_url` set. At or above `newCardThreeDSThreshold`, or with none set: answer `started` with `nextAction.raw.threeDSHtmlContent`, exactly the saved-card 3-D Secure answer; below a set threshold: `success` at once | 3-D Secure: decode `threeDSHtmlContent` and render it (as for a saved card); below the threshold: nothing | the service: the threeds-return route (`3dsecure/auth`, the capture gate, the hooks once, the cancel and late-capture rules) as for a saved card; below the threshold the start itself (`POST /payment/auth`) | 3-D Secure: `303` to `return_url` plus `orderId` and `status`; otherwise the author's own next page | a decline is `422 PAYMENT_PROVIDER_REQUEST_REJECTED` with iyzico's code, no ticket; with `saveCard` the card is filed in the ticket owner's wallet once the payment reads success (the start, or the return) | as the saved-card rows; every entry without `directCardEntry` (iyzico without it, and every other brand) refuses `cardInfo` or `saveCard` `400 PAYMENT_DIRECT_CARD_NOT_ENABLED` before the provider is called |
| Save the card while paying | a `storePaymentMethod` switch (checkout or subscription) on the order object; the start route and a `PaymentAction` start open the form with the buyer's own card key | the hosted form; iyzico lists the buyer's saved cards and offers "save" | the service, at settle (the browser return or the Checkout Form webhook, once) | as the hosted form | the card is filed in the ticket owner's wallet through the authentication service's machine-only API | as the hosted form |
| Add a card from the account page | `POST /v1/payment-methods/add` with `cardInfo` (`cardNumber`, `expireMonth`, `expireYear`) and `cardHolderName`; `customerId` optional | the author's card form, posted straight to the route over HTTPS | no payment, no 3-D Secure at save time (iyzico card storage) | - | - | the saved method, id `<cardUserKey>:<cardToken>` |
| Subscription, first payment (hosted mode, the default) | `POST /v1/subscribe<x>/:orderId` (with `returnUrl`, buyer details in `metadata`) or a `SubscriptionAction` stage `subscribe`; answer `statusLiteral: "pending_provider"`, `providerSubscriptionId: "pending:checkout:<token>"`, `checkoutForm` | insert `checkoutForm.checkoutFormContent` and let its script run (or navigate to `checkoutForm.paymentPageUrl` when it is set) | the service: iyzico POSTs the token to `POST /v1/payments/subscription-checkout-return/<providerName>`, which reads the result from iyzico | `303` to `returnUrl` plus `subscriptionId` and `status` (JSON without a `returnUrl`, always on the `SubscriptionAction` path) | renewals: `subscription.order.success` / `failure` -> `invoice.paid` / `invoice.payment_failed` | `ACTIVE` -> `active` and `afterSubscriptionCreated` once; `UNPAID` -> `past_due`; `PENDING` -> `trialing`; refused -> `provider_failed` |

A subscription in tokenized mode (`subscriptionMode: "tokenized"`, the mode of a
marketplace-activated account) has no row of its own: its first payment is one of the
one-time rows above that saves the card, the buyer then subscribes with
`POST /v1/subscribe<x>/:orderId` (JSON answer, no form) once that payment reads
`success`, and every recharge is a merchant-initiated `/payment/auth` that never opens
3-D Secure.

Requirements and limits:

- The service's public URL must be configured: every callback URL is derived from it,
  and a start (or subscribe) without it is refused `400` before iyzico is called. The
  caller can never set a callback URL.
- Always send `return_url` (`returnUrl` on the subscribe route). Without it the payment
  still completes, but the buyer's browser stops on a JSON confirmation at the service
  URL.
- iyzico's POST lands on the service, never on the author's SPA, so the SPA needs no
  route that accepts a form POST.
- The provider must be configured to deliver its notifications to
  `<service URL>/v1/payments/webhook/<providerName>`; without it a hosted-form buyer
  who closed the tab is recorded only by a refresh.
- A saved card stored before the `<cardUserKey>:<cardToken>` format (a bare token) is
  refused on a start with `400 PAYMENT_METHOD_ID_INVALID`: the buyer saves the card
  again.
- **Saved cards without 3-D Secure** (`savedCardThreeDSMode`). Off by default (every
  saved card through 3-D Secure). Set on the provider entry only after iyzico confirms
  that the merchant account allows non-3DS charges. `verifyOnce`: the first charge on a
  card goes through 3-D Secure, and once one settles success at the 3-D Secure return
  the stored method is marked `threeDSVerified` (machine-written only, reset when the
  card is added again); later charges on it skip 3-D Secure with no amount limit. A new
  card saved by a 3-D Secure payment (`directCardEntry`, `saveCard`) is marked by that
  payment, once filed; one saved without 3-D Secure is not. `threshold`: a charge
  below `savedCardThreeDSThreshold` skips it, one at or above it goes through 3-D
  Secure as above. The retired `threeDSMode` / `nonThreeDSMaxAmount` keys are not read
  (validator warning `PAYMENT_PROVIDER_THREE_DS_KEYS_RETIRED`). The client can never
  choose it: there is no request or `providerOptions` field for it (a `threeDS*`,
  `cardUserKey`, `cardToken` or `paymentCard` option is refused `400`), because without
  the challenge any caller that may start a payment on a saved card (a session, an AI
  agent's tool call) charges the card with no cardholder confirmation, and the issuer's
  fraud liability shift is lost: card-not-present fraud becomes the merchant's
  chargeback. The validator warns on every entry that can skip it
  (`PAYMENT_PROVIDER_THREE_DS_DISABLED`). Each such charge is logged (order, amount; no
  card data). Only the starts that prove the caller owns the saved card honour `never`
  (the start route and a `PaymentAction` stage on a checkout order object); a
  `PaymentAction` with no checkout order object keeps 3-D Secure. A charge iyzico holds
  for fraud review (`fraudStatus: 0`) stays `started`; a fraud rejection (`-1`) is
  refused (see the fraud review bullet below). A start that retakes a stale claim looks
  the earlier `/payment/auth` up first and adopts it, so a lost answer is never charged
  twice.
- **Fraud review** (`fraudStatus`, every iyzico payment read). A payment iyzico holds
  for its fraud review (`fraudStatus: 0`) reads `started` with `paymentStatus`
  `FRAUD_REVIEW` on every path: the non-3DS start, the 3-D Secure return (it writes only
  the `paymentStatus`, dispatches nothing, answers `status=started`, and a repeated
  callback calls nothing), the refresh and the hosted-form detail. A capture webhook
  during the review is refused by the capture gate's read-back (stored `skipped`, never
  counted as the recorded capture), and a later start of the order is
  `409 PAYMENT_START_INTENT_PENDING`. A rejection (`-1`) is the typed refusal on a
  settle and `failed` on a read. A refresh after the review settles the ticket
  (`success` with `afterPaymentCaptured` exactly once, or `failed`; later reports of the
  capture run nothing); which notification iyzico sends when a review ends is not
  specified, so the service's review sweeper refreshes such tickets on a backoff (5
  minutes doubling to 6 hours, for up to 7 days) and the return page can poll the
  buyer's own refresh (`PATCH /v1/<x>paymentstatusrefresh/:orderId`).
- **A card entered on the author's own frontend** (`directCardEntry`). The frontend
  contract:
  1. Show the author's own card form and send, over HTTPS,
     `PATCH /v1/start<x>payment/:orderId` with
     `{ "paymentUserParams": { "return_url": "...", "cardInfo": { "cardHolderName": "...", "cardNumber": "...", "expireMonth": "MM", "expireYear": "YYYY", "cvc": "..." }, "saveCard": true } }`
     (`saveCard` optional, a boolean beside `cardInfo`). Never put the card or
     `saveCard` anywhere else in the body (a card or `saveCard: true` at the root is
     refused), never in `providerOptions`, never with a `paymentMethodId`. A save asked
     in a shape that cannot save (`saveCard` at the root, `storeCard` / `registerCard` /
     `save_card` beside the card, `saveCard: true` with no `cardInfo`) is refused
     `400 PAYMENT_CARD_INVALID`, never paid without saving. Send it only to an order
     whose provider entry is iyzico with `directCardEntry: true`: every other entry
     (iyzico without it, and every other brand) refuses `cardInfo`, or `saveCard` with or
     without one, with `400` `PAYMENT_DIRECT_CARD_NOT_ENABLED` before the provider is
     called, on the start route and on a `PaymentAction` start alike. A `payOrder`-style
     Business API must DECLARE `cardInfo` (Object) and `saveCard` (Boolean) as body
     request parameters, beside `return_url`; an undeclared card is silently dropped and
     the hosted form opens. Keep a `return_url` guard on the API for a call that carries
     `cardInfo`: the 3-D Secure return redirects there.
  2. A `400` names the field (`PAYMENT_CARD_INVALID`, `PAYMENT_CARD_EXPIRED`,
     `PAYMENT_CARD_EXPIRY_INVALID`, `PAYMENT_CARD_WITH_SAVED_METHOD`,
     `PAYMENT_DIRECT_CARD_NOT_ENABLED`, `PAYMENT_BUYER_EMAIL_REQUIRED`,
     `PAYMENT_CARD_SAVE_NOT_SUPPORTED`); show it, never echo the card.
  3. `statusLiteral: "started"`: base64-decode
     `paymentIntentInfo.next_action.threeDSHtmlContent` (or
     `nextAction.raw.threeDSHtmlContent`) and render the HTML as a document (it
     auto-submits to the bank), exactly as for a saved card; the buyer returns to
     `return_url` with `orderId` and `status`. Never navigate to the form's `action`.
  4. `statusLiteral: "success"`: the payment is captured; show the result. A
     `422 PAYMENT_PROVIDER_REQUEST_REJECTED` is a decline (`providerErrorCode`).
  5. With `saveCard: true` the card shows in `GET /v1/payment-methods/list` once the
     payment reads `success`. Under `savedCardThreeDSMode: verifyOnce` a card saved by a
     3-D Secure payment (its own `3dsecure/auth` at the return) is marked verified, so
     its next charge skips 3-D Secure; a card saved below the threshold (no 3-D Secure)
     is not.

  The card never persists in the service and is never logged or echoed; the frontend
  must not keep it either (no storage, no analytics, no error reporting of the form
  fields).
- A subscription form nobody finishes leaves the row `pending_provider`; it grants
  nothing, and a cancel completes locally. A buyer who finished the form but never made
  the return POST is not picked up automatically; check the provider's merchant panel.

### iyzico: verifyOnce and buyer journeys

- **Webhook URL.** The provider's merchant-panel notification URL must point at the
  service's webhook route, in the field the provider designates for payment
  notifications; a URL in the wrong field (the browser-return callback field, which the
  service does not use because it sends a callback URL on every request) means zero
  deliveries and no error. Re-check it after the provider approves a change, and read
  `GET /v1/payments/admin/events` (the panel keeps no history).
- **verifyOnce, two journeys.** A card saved by a charge below `newCardThreeDSThreshold`
  (no 3-D Secure) gets ONE 3-D Secure on its first saved-card charge; a card saved
  during a 3-D Secure charge is verified at once. Both are marked only when the return's
  own `3dsecure/auth` answered the capture; a success proven otherwise (a detail read
  after a lost auth answer, the webhook, a refresh) leaves one more 3-D Secure.
- **Off the happy path.** A cancel on the bank page, an abandoned hosted form, a retry, a
  stale 3-D Secure step, a late capture or double payment and a lost start answer each
  end differently for the buyer and show up in different places for the operator. The
  late-capture hook payload carries the fact as `resource.metadata.lateCapture`, while
  the ticket stores `capturedAfterCancel` / `retiredAttemptCaptures` (see the
  [`afterPaymentCapturedAfterCancel` hook](payment-workflow.md#the-afterpaymentcapturedaftercancel-hook)).
- The authentication service owns `sys_paymentMethod` and its machine routes, so it is
  built together with the order service: an order-only build can leave every saved-card
  charge asking for 3-D Secure under `verifyOnce`.

## Adyen

Adyen is **frontend-relayed**: Adyen Web runs the buyer step, and the frontend sends its
result to the generated complete route, which exists only on Adyen-bound checkout
objects.

| Entry shape | Start | Frontend renders | Who completes | Buyer lands on | Webhook / backstop | Statuses |
|---|---|---|---|---|---|---|
| One-time, card entered now | `paymentUserParams.paymentMethodData` = Drop-in's `state.data.paymentMethod` (encrypted fields), `return_url` required; an action answers `started`, `next_action` = Adyen's `action`, `requires_redirect` for a redirect action | `checkout.createFromAction(next_action)`; on `onAdditionalDetails` send `state.data.details` to the complete route; after a full-page redirect send the `redirectResult` from the return page | the service: `PATCH /v1/complete<x>payment/:orderId` with `{ paymentUserParams: { details } }` calls `/payments/details` | the SPA, or `return_url` after a redirect action | notifications: AUTHORISATION keeps `started`; CAPTURE or the complete route marks it paid; refresh answers the ticket as recorded | `started` -> `success` / `failed` / `amount_mismatch` |
| One-time, saved card | `paymentMethodId` = `<shopperReference>:<recurringDetailReference>`; a challenge answers an action as above | as above | the complete route | as above | as above | as above |
| Save the card while paying | on an order object with a `storePaymentMethod` switch, a `PaymentAction` start / simple, and the start route with a first card (`paymentMethodData`), send `storePaymentMethod: true`; once paid, the card is filed as `<shopperReference>:<recurringDetailReference>` in the ticket owner's wallet | as above | the complete route | as above | as above | as above |
| Add a card from the account page | no standalone step: `POST /v1/payment-methods/add` records the id only; Adyen stores a card during a payment | - | - | - | - | - |
| Subscription, first payment | tokenized: the recharge scheduler charges a stored method merchant-initiated (`ContAuth`, no challenge expected); the customer-initiated checkout payment under `subscription.configuration.storePaymentMethod: true` enrolls it | as the one-time rows | the complete route | as above | AUTHORISATION / REFUSED notifications on the subscription's ticket | the recharge ticket on `sys_<X>Payment` |

Complete-route answers: `400 PAYMENT_DETAILS_INVALID` (a key outside `redirectResult`,
`threeDSResult`, `threeds2.fingerprint`, `threeds2.challengeResult`, `MD`, `PaRes`),
`409 PAYMENT_NOT_AWAITING_DETAILS` (the payment is not waiting for this step),
`409 PAYMENT_DETAILS_ORDER_MISMATCH` (Adyen's answer names another order or an earlier
attempt). A first card (`paymentMethodData`) is taken by the start route and by a
`PaymentAction` start / simple on the order object, and saved under the
`storePaymentMethod` switch; the tokenized subscribe then pins one of the buyer's own
saved cards on the subscription row (a named card that is not the buyer's is refused
`403 PAYMENT_METHOD_NOT_OWNED`; none named, the default saved card). Details:
[Payment workflow](payment-workflow.md#adyen-a-first-card-and-the-3-d-secure-round-trip).

## Other providers

PayPal, Mangopay, Paddle and Lemon Squeezy have no generated complete route (it is
mounted only for Adyen-bound objects) and no adapter that uses the iyzico return routes;
the buyer returns straight to the author's `return_url`. Their webhook URL
`<service URL>/v1/payments/webhook/<providerName>` is registered by hand at the provider.

| Provider and shape | Start answer | Frontend renders | Who completes | Buyer lands on | Webhook / backstop | Authored API |
|---|---|---|---|---|---|---|
| PayPal, one-time | `requires_redirect: true`, `redirectToUrl` = PayPal's approve link, `paymentId` = the PayPal order id | navigate to `redirectToUrl` | the capture: a session Business API with a `PaymentAction` stage `complete`, called by the return page with the buyer's bearer and the `paymentId`; an approved order stays `started` until then | the `return_url` | `PAYMENT.CAPTURE.COMPLETED` / `CHECKOUT.ORDER.COMPLETED` -> `payment.captured`; refresh only reads the order | **yes**: the one provider that needs an authored `complete` |
| Mangopay, one-time | `requires_redirect: true`, `redirectToUrl` = Mangopay's `RedirectURL` (hosted web pay-in) or `SecureModeRedirectURL` (a saved `CardId`) | navigate to `redirectToUrl` | Mangopay: the pay-in settles by itself | the `return_url` | `PAYIN_NORMAL_SUCCEEDED` -> `payment.captured`; refresh reads the pay-in and records it | no |
| Paddle, one-time | `redirectToUrl` = the transaction's `checkout.url` when Paddle returns one | navigate to `redirectToUrl` | Paddle, at its checkout; whether a buyer can pay the manual-collection transaction the start creates is not yet confirmed | Paddle's checkout | `transaction.paid` / `transaction.completed` -> `payment.captured` | not specified |
| Lemon Squeezy, one-time | `requires_redirect: true`, `redirectToUrl` = the checkout URL, `paymentId` = the checkout id | navigate to `redirectToUrl` | Lemon Squeezy, at its checkout | Lemon Squeezy's checkout, then the `return_url` | the ticket is first keyed by the checkout id; the signed `order_created` report is bound to it through the framework order id, and until a vendor order is recorded a refresh reads the ticket | not specified |

## Designer settings

| Setting | Where | Effect |
|---|---|---|
| `checkout.objectIsAnOrderObject: true` + `checkout.configuration.providerName` | the order object's `objectSettings` | mounts the start, refresh and ticket-read routes, the complete route on an Adyen-bound object, and the iyzico return routes when an iyzico provider is configured |
| `checkout.configuration.storePaymentMethod: true` | a checkout-only order object | save the card while paying: Stripe and Adyen through a `PaymentAction` start / simple; iyzico on the hosted form (start route and `PaymentAction` alike) |
| `subscription.configuration.storePaymentMethod: true` | an order object that also carries a subscription block | the same switch; either one enrolls. Adyen: recharges need it |
| `checkout.configuration.lifecycleHooks` (`afterPaymentCaptured`, `afterPaymentFailed`) | the order object | where the order status is written; they have run before any return route redirects the buyer |
| `checkout.configuration.checkRoles` / `routeAccess` | the order object | the role gate on start, refresh and complete |
| the service's public URL | the service's deployment configuration | required by iyzico (every callback URL) |
| Stripe `newCardThreeDSThreshold` | the Stripe provider entry's `configuration` (server only) | new cards (path A, path B) at or above it are forced through 3-D Secure; below it Stripe and the issuer decide. Unset: never forced |
| Stripe `savedCardThreeDSMode: "threshold"` + `savedCardThreeDSThreshold` | the Stripe provider entry's `configuration` (server only) | saved cards at or above the threshold are forced through 3-D Secure |
| Stripe `savedCardThreeDSMode: "verifyOnce"` | the Stripe provider entry's `configuration` (server only) | a stored card is forced through 3-D Secure until a charge on it is authenticated (live read after the settle), then not forced; Stripe and the issuer still decide; needs the authentication service (the marker's owner) |
| Stripe `threeDSRequestLevel` / `threeDSThresholdCurrency` | the Stripe provider entry's `configuration` (server only) | the forced level (`any` default, `challenge`); a charge in a currency other than `threeDSThresholdCurrency` is forced |
| Stripe `savedCardOffSession: "verified"` (beside `verifyOnce`) | the Stripe provider entry's `configuration` (server only) | a charge from a `PaymentAction` declared `buyerAbsent: true` on a verified stored card is a merchant-initiated `off_session` charge: no buyer step, no liability shift, buyer-absent use only; `authentication_required` answers `402` and releases the claim |
| Webhook endpoint at the provider | the provider's dashboard or API | `<service URL>/v1/payments/webhook/<providerName>`; the provider must deliver the events the adapter maps |
| iyzico 3-D Secure step lifetime | the service's deployment configuration | how long a resumed iyzico start hands back the 3-D Secure form (default 10 minutes) |
| Adyen action lifetime | the service's deployment configuration | how long an open Adyen action is resumed (default 30 minutes) |

A minimal checkout-only order object that saves the card while paying. The hook calls a
same-service Business API that declares an internal-call controller (`markOrderPaid`
here is the author's own API); hook scripts use bare names (`resource`, `payment`), never
`this.`:

```json
{
  "objectSettings": {
    "checkout": {
      "objectIsAnOrderObject": true,
      "configuration": {
        "providerName": "defaultIyzico",
        "orderIdProperty": "id",
        "amountProperty": "totalAmount",
        "currencyStaticValue": "TRY",
        "orderOwnerIdProperty": "userId",
        "storePaymentMethod": true,
        "lifecycleHooks": [
          {
            "name": "markPaid",
            "trigger": "afterPaymentCaptured",
            "script": { "js": "await API.markOrderPaid({ orderId: resource.orderId })" }
          }
        ]
      }
    }
  }
}
```

## Resuming an open payment

A start of an order whose payment still waits for the buyer never opens a second charge.
The same order, amount, currency and payment method answer the open payment again
(`pendingIntentReused: true`, with its buyer step); a changed amount or method answers
`409 PAYMENT_START_INTENT_PENDING`, except where noted:

| Provider | The resumed step | A changed method or amount |
|---|---|---|
| Stripe | read live: the current `nextAction.clientSecret` and `nextAction.raw` | `409`; to pay with another card, confirm the open intent in the browser on its `client_secret` |
| iyzico | kept on the ticket (`metadata.resumeAction`): the hosted page until its token expires, the 3-D Secure form until its time-to-live; `nextAction.actionExpiresAt` names the instant (also inside `raw` / the legacy `next_action`). Never a 3-D Secure form whose bank callback already reached iyzico (see below) | a new attempt when the open payment provably cannot capture (an expired hosted page nobody started paying on, a 3-D Secure payment the bank never answered), and at once for a start with another method than an untouched hosted page (the page is retired, see below); otherwise `409` |
| Adyen | kept on the ticket while the action's time-to-live has not passed | `409`, also after the local expiry, until Adyen ends the attempt or a platform operator releases it (`POST /v1/payments/admin/adyen-attempts/:objectName/:orderId/release`) |

### Retrying after an abandoned step (iyzico)

A buyer who closed or cancelled a step and starts again is never handed a step that can no
longer work, and is never told "pay there" after being told the payment failed. The start
reads the open payment from iyzico first:

- **A 3-D Secure step past the bank's callback.** iyzico reads the payment
  `CALLBACK_THREEDS`. The bank form is one-time, so it is never shown again. iyzico reads
  the same while the return route is completing the payment, so until the step is provably
  stale (its `actionExpiresAt` plus 3 minutes) the start answers
  `409 PAYMENT_START_INTENT_PENDING` with `retryAfter` and charges nothing. After that
  instant the step was abandoned (the tab was closed, or the bank's POST to the return route
  was lost): the start settles the ticket `failed` (`paymentStatus`
  `THREEDS_STEP_ABANDONED`, `afterPaymentFailed` once) and opens a new attempt with the
  method it names, the same card included. The start never sends `3dsecure/auth`.
- **A payment iyzico already reads captured or failed.** A captured 3-D Secure payment is
  recorded through the capture-amount gate and `afterPaymentCaptured` runs once; the start
  then answers `400 PAYMENT_ALREADY_COMPLETED` ("Payment already completed") (also `400`
  when the gate refuses the captured amount: an operator decides). A failed one is settled
  `failed` and the start opens a new attempt.
- **An open hosted page and a start with another method.** For example, a buyer cancelled
  on the hosted page and now pays with a saved card. While nobody is paying on the page
  (iyzico reads it untouched), the start retires it: the ticket is written `canceled`
  (`paymentStatus` `CHECKOUT_FORM_RETIRED`) and the new method is charged at once. A page on
  which a payment is under way keeps the `409`, because that payment may still capture.

Every new attempt gets a new attempt key, which is a new provider idempotency key and a new
iyzico `conversationId`. The payment left behind is recorded on the ticket in
`metadata.retiredAttempts`. If it captures after all, the checkout return, the hosted-form
webhook and the 3-D Secure return find the order through that record:

- if the order is not paid yet, its ticket moves to `captured_after_cancel`;
- if the order is already paid, the ticket stays `success` and lists the capture under
  `metadata.retiredAttemptCaptures`;
- if the new attempt is still being charged at that moment, the capture is listed beside it
  first. When that attempt captures, the order is paid twice and the list is what the
  operator refunds from. When the provider holds it for review, it stays on the ticket until
  the review ends, and the same rule then applies, whoever reads the outcome first (the
  review sweeper, a refresh, a webhook, or the buyer's next start, which answers `409` while
  the attempt is open and `400` once it is settled, and never charges again). When it does
  not capture (a refused charge, a 3-D Secure step or a hosted page still to complete, or a
  rejected review), the ticket moves to `captured_after_cancel` and the new attempt is
  retired: the start answers `statusLiteral: "captured_after_cancel"` with no `nextAction`,
  so there is no step to show, and the next start answers `400`.

Either way the capture is never recorded as a second success and is never lost. No capture
lifecycle runs for it, and one error log line asks an operator to refund it or fulfil the
order.

### The 409's step fields

`409 PAYMENT_START_INTENT_PENDING` carries the open step as members beside `detail`, so a
frontend can show the time without parsing the sentence. A `PaymentAction` start that fails
this way carries the same members on its `actionFailures` entry, next to `error` and
`errorCode`:

| Member | Meaning |
|---|---|
| `stepKind` | `hosted` (a hosted payment page) or `threeds` (a 3-D Secure step); `null` when no step is recorded |
| `actionExpiresAt` | when the recorded step stops being handed back; `null` when unknown |
| `retryAfter` | the instant a new start with other figures or another method is accepted (an open hosted page: its expiry plus a minute; a 3-D Secure step past the bank callback: its expiry plus 3 minutes); `null` when no instant is known (for example, a payment under way on a hosted page) |

```json
{
  "status": 409,
  "errorCode": "PAYMENT_START_INTENT_PENDING",
  "detail": "The payment of o1 still has an open provider intent (...)",
  "stepKind": "hosted",
  "actionExpiresAt": "2026-10-16T18:40:00.000Z",
  "retryAfter": "2026-10-16T18:41:00.000Z"
}
```

## What not to author

Blueprints have authored each of these; none is needed:

- a `complete`, `callback` or webhook Business API for Stripe, iyzico, Adyen or Mangopay (a
  `PaymentAction` with stage `complete`, `refresh` or `callback` refuses an anonymous caller,
  so a provider cannot call it anyway). The one exception is PayPal's capture: a session API
  with a `PaymentAction` stage `complete`, called by the buyer's return page, never by a
  webhook;
- a `VerifyWebhookAction` API for payment events: the generated webhook route verifies them;
- a "save my card" API, or an API that files the card a webhook reported;
- anything that handles iyzico's `cardUserKey`: it is never a request field, and
  `providerOptions.cardUserKey` / `cardToken` are refused;
- a `setup_future_usage` provider option: refused with
  `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED` (use a `storePaymentMethod` switch).

## Mock and non-production use

With the provider in mock mode (no credentials on the deployment; see
[Testing with mock mode](payment-workflow.md#testing-with-mock-mode)):

- `POST /v1/<x>mockauthenticate/:orderId` completes the order's open payment through the
  ordinary complete path (an iyzico hosted form, an Adyen action). It answers only in mock
  mode.
- The iyzico mock's saved-card `threeDSHtmlContent` posts to the real threeds-return route,
  so rendering it completes the payment exactly as live iyzico does; only the bank page is
  simulated.
- A start's `providerOptions.mockScenario` of `fraud_review`, `fraud_review_clears` or
  `fraud_reject` makes the iyzico mock answer that fraud verdict (`fraud_review_clears`: still
  under review on the charge answer and the first `/payment/detail` read, approved on every
  later read). The mock subscription form posts its token to the real
  subscription-checkout-return route.
- The Stripe mock takes `mockScenario` `fraud_review` (the charge is placed in a Radar review
  until a test resolves it as approved, `refunded_as_fraud` or `refunded` on the mock) and
  `fraud_review_clears` (in review on the create answer and the first retrieve, approved on the
  second). `requires_action_completes` starts the payment `requires_action` and lets the next
  retrieve find the buyer authenticated at Stripe (the intent `succeeded`), the state a signed
  `payment_intent.succeeded` needs to pass the webhook's read-back.
- A Stripe start that the entry's 3-D Secure threshold forces answers `requires_action` with a
  `use_stripe_sdk` next action on the mock; the next retrieve (a refresh) finds the buyer
  authenticated and the intent `succeeded`. Its charge then reports
  `three_d_secure.result: "authenticated"` (any other charge reports none), which is what lets
  a `verifyOnce` card be marked verified in a non-production deployment.

## See also

- [Payment workflow](payment-workflow.md)
- Patterns: [`CheckoutConfig`](../../spec/CheckoutConfig.md), [`SubscriptionConfig`](../../spec/SubscriptionConfig.md), [`PaymentAction`](../../spec/PaymentAction.md), [`SubscriptionAction`](../../spec/SubscriptionAction.md)
