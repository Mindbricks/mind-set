---
title: "Payment providers: behaviour rules"
---

# Payment providers: behaviour rules

This page states the payment provider behaviour that every conforming compiler
must honour: what a blueprint can rely on per brand, how webhooks are
verified, how amounts and ids are shaped, how provider states map to the
generated service's states, and the quirks found on real provider accounts.

It complements the generated provider catalogue,
[paymentProvider](../../spec/providers/paymentProvider.md), which lists every
configuration key per brand (type, secret, required, allowed values,
defaults), the per-brand live/test detection rule, the origin of a plan's
`providerPlanId` and whether a webhook endpoint can be provisioned by a
program. Those tables are not repeated here.

The flows that use these rules are described in
[Payment workflow](../capabilities/payment-workflow.md) and
[3-D Secure and buyer redirects](../capabilities/payment-3ds-and-redirects.md);
the actions in [PaymentAction](../actions/payment-action.md),
[RefundAction](../actions/refund-action.md) and
[PayoutAction](../actions/payout-action.md).

## Family rules

### Entries and selection

- A payment provider is a named entry in
  `projectSettings.paymentProvidersSettings.paymentProviders[]`: a unique
  `name` (a `codeName`), a `provider` brand (`stripe`, `paypal`, `iyzico`,
  `adyen`, `paddle`, `lemonsqueezy`, `mangopay`, `custom`), optional
  `capabilities`, a `configuration` list of `{ "name": <key>, "value": <value> }`
  items, and, for marketplace entries, `kycOnboarding` and `payoutCadence`.
- Several entries may share one brand (a test and a live account, a one-time
  account and a marketplace-only account).
- There is no project-wide default payment provider. Every payment action
  (`PaymentAction`, `RefundAction`, `SubscriptionAction`, `PayoutAction`) and
  every data-object `checkout` / `subscription` / `marketplace` opt-in names
  its entry with `providerName`; the name must resolve.
- A compiler validates: the name format and uniqueness, the required
  configuration keys per brand, that `providerName` resolves, that the
  action's stage (start, complete, refund, subscribe, payout, dispute) is
  supported by the resolved entry's capabilities, and that `kycOnboarding` /
  `payoutCadence` appear only on an entry with the matching capability.
- A secret configuration value is never written as a literal in the blueprint
  and a `{ "secretName": ... }` object is not a supported value for a payment
  key. The key item stays on the entry with an empty value and the deployment
  supplies the value. A required key whose item is deleted counts as missing,
  which puts the entry into mock mode.
- Payments run only through payment provider entries: there is no
  general-integration path for charging, refunding, subscribing or paying
  out. A non-PSP service (a market-data feed) is a general integration; its
  payment side, if any, is a `custom` payment entry.

### Capabilities

- Each brand has default capability flags: `supportsOneTime`,
  `supportsRefundsFull`, `supportsRefundsPartial`, `supportsSubscriptions`,
  `supportsProration`, `supportsMarketplace`, `supportsConnectedKYC`,
  `supportsDisputes`, `supportsSavedCards`, `supportsApplePayGooglePay`,
  `supports3DSecure`, `supportsDefaultCard`, `isMerchantOfRecord` and
  `webhookStyle` (`hmac`, `rsa-pub`, `cert`, `signature`, `refetch`; no brand
  uses `rsa-pub`). See [PaymentCapabilities](../../spec/PaymentCapabilities.md).
- An entry's `capabilities` may only NARROW the brand's defaults, never widen
  them. Leave it null unless narrowing (a Stripe entry used only for one-time
  donations sets `supportsSubscriptions: false`).
- A call against a capability the entry does not have is refused with
  `CapabilityLimitedError` (at design time where the compiler can see it, at
  run time otherwise; a generic saved-method route the brand cannot serve
  answers `400 CapabilityLimitedError` before the adapter runs).
- `isMerchantOfRecord: true` (Paddle, Lemon Squeezy): the provider owns tax.
  The generated service emits no tax lifecycle hooks and suppresses the host
  invoice / tax bridge, but the payment lifecycle, the capture amount gate,
  the ticket transition and settlement still run.
- `supportsSavedCards` on a brand that vaults on its own side (Paddle, Lemon
  Squeezy) means retention only; the separate flags `supportsMethodAttach`,
  `supportsMethodDetach` and `supportsMethodList` say what the generic
  saved-method routes can do.
- Each brand declares a `subscriptionSemantics`: `hosted` (the provider runs
  the billing cycle: Stripe, PayPal, Paddle, iyzico by default),
  `tokenized` (the generated service recharges a stored token every period:
  Adyen, iyzico in tokenized mode), `checkout-driven` (a subscription is
  created only by a hosted checkout the buyer completes: Lemon Squeezy) or
  `unsupported` (Mangopay).

### Required to construct versus required to verify webhooks

- Most required keys are required to CONSTRUCT the adapter: without them the
  entry is not built live (it runs in mock mode). `paypal.webhookId`, a webhook
  key by name, is one of them.
- A few keys verify inbound webhooks only (catalogued
  `requiredFor: "webhook"`): `adyen.hmacKey` and `paddle.webhookSecretKey`.
  The Stripe signing secret is not a configuration key at all: it is
  provisioning state captured when the endpoint is created.
- An entry missing only a webhook-verification key is constructed LIVE: it
  charges, refunds, reads intents and pays out against the real account and
  is not sent to the mock. The credential report names the missing value as
  webhook-only, and the webhook route refuses by name: `401`,
  `errorCode: SIGNATURE_UNVERIFIABLE`, detail beginning
  `webhook_verification_unconfigured`, never a silent `200`.
- `SIGNATURE_UNVERIFIABLE` (no signing key configured: no event will ever
  verify, so payment state will not advance by webhook) is a different answer
  from `SIGNATURE_INVALID` / `signature_verification_failed` (a delivery whose
  signature did not check out). Nothing is persisted in either case.

### Mock mode, test and live

- An entry whose required credentials are missing runs against an in-process
  mock of the brand (no network, no real money, mock state lost on restart),
  with a loud warning naming what is missing. On a production deployment this
  is reported at ERROR, never silently mocked away. `GET
  /v1/payments/mock-status` reports, per provider, whether it is on the mock
  (`"mock": false` for a live entry) and the detected key mode.
- Whether a credential moves real money is detected from the entry's own
  configuration by the brand's rule in the catalogue (`key-prefix`,
  `base-url`, `environment-field` or `none`). Only the catalogued prefix
  strings may ever be echoed into a log or an error, never any further part
  of a key.
- A credential detected `live` is refused on a non-production deployment
  unless the entry sets `allowLiveInPreview`. A non-production deployment of
  a project whose entry holds live keys can otherwise make real charges: test
  on a separate sandbox entry.
- A mock hint (`providerOptions.mockScenario`, `metadata.mockScenario`,
  `providerOptions.metadata.mockScenario`) reaches an adapter only on its
  in-process mock; on a live transport it is removed before the request is
  built, on every brand.
- A mock that cannot serve a call refuses it by name (`501
  MOCK_UNHANDLED_PATH`) and sends nothing.

### The webhook route

- The generated service mounts `POST /v1/payments/webhook/<providerName>` for
  every payment entry; nothing is authored for it. It verifies the delivery
  over the RAW body, parses it into the normalised event taxonomy, stores the
  event in `sys_paymentEvent` and dispatches it to the state machines of the
  objects that opted in (checkout intent, subscription, dispute, payout),
  which write the `sys_<X>Payment` / `sys_<X>Subscription` rows and run the
  `lifecycleHooks`.
- A Business API is never authored to receive a webhook, and no
  `PaymentAction` stage is run from a webhook: the stages that need the order
  owner's session (`complete`, `callback`) cannot be driven by a
  notification.
- A brand whose hooks are GET requests (Mangopay) gets
  `GET /v1/payments/webhook/<providerName>` instead.
- Events are deduplicated by event id: a redelivery records and runs nothing
  twice. A capture lifecycle (`afterPaymentCaptured`, the invoice bridge, the
  settlement accrual) runs exactly once per payment, whichever path recorded
  the capture first (start answer, return route, webhook, refresh, sweeper).
  The report that applied it is named on the ticket
  (`metadata.captureLifecycleEventId`) and every other capture report of the
  payment is refused.
- A webhook whose capture cannot be confirmed (the capture gate reads the
  payment back and it is not captured) is stored `skipped` with an error
  message starting `capture refused, lifecycle not applied:`; such a row never
  counts as the payment's recorded capture. A read-back that fails leaves the
  event for the replay worker; it is never refused or recorded as an amount
  mismatch on that account.
- A capture whose amount or currency differs from the ticket is recorded
  `amount_mismatch` and fires no capture lifecycle.

### When the provider refuses a live call

A present key is not necessarily an allowed key. Payment routes answer a
provider refusal with a named problem+json, never a bare `500`:

| Provider said | HTTP | `errorCode` | `detail` |
|---|---|---|---|
| credential wrong, expired, or not permitted this call | `502` | `PAYMENT_PROVIDER_UNAVAILABLE` | The payment provider could not complete the request |
| provider unreachable, 5xx or rate-limited | `502` | `PAYMENT_PROVIDER_UNAVAILABLE` | The payment provider could not complete the request |
| the money movement was declined | `402` | `PAYMENT_DECLINED` | The payment was declined by the provider |
| it rejected the request itself (bad parameter, unknown object, account not activated) | the provider's own `4xx` | `PAYMENT_PROVIDER_REQUEST_REJECTED` | The payment provider rejected the request |
| a refusal written into a SUCCESS answer (iyzico: HTTP 200 with `status: "failure"`) | `422` | `PAYMENT_PROVIDER_REQUEST_REJECTED` | The payment provider rejected the request |

- **The status is the service's own.** An upstream `401` / `403` is never
  reflected: the provider rejected the DEPLOYMENT's credential and has said
  nothing about the caller's authorisation.
- **Vendor text stays server-side.** The response carries the fixed detail
  and nothing else; the provider's message (which routinely names live
  objects), the provider name and a classified reason (`authentication`,
  `permission`, `declined`, `unavailable`) are logged at error level under
  `PaymentProviderFailure`; an unclassified rejection's vendor sentence is
  logged under `PaymentProviderRequestRejected`. A subscribe or plan change
  also logs its plan reference (`providerPlanId`, at most 128 characters;
  an unclassified subscription refusal carries it on
  `SubscriptionProviderRefusedCause`); it never enters the response.
- **Recognition is narrow.** Only a failure the adapter classified while it
  still held the raw provider error is mapped this way; every other error is
  a generic `500` with the message suppressed. The mapping covers every brand,
  including transport failures and PayPal's separate OAuth step. Each adapter
  must classify at the place its errors actually leave (a new brand must mark
  that egress).
- **Additive members.** A decline (`402`) and a request rejection may carry
  `providerErrorCode`: the provider's own error CODE, only when it is 1 to 64
  characters of `[A-Za-z0-9_.-]`, never its sentence. A card-validation
  refusal also carries a `reason`, one of: `card_number_invalid`,
  `card_expired`, `card_expiry_invalid`, `card_cvc_invalid`,
  `card_holder_name_invalid`, `card_not_supported`. A buyer UI branches on
  `reason` and shows a generic message when there is none. The per-brand code
  tables are under Stripe and iyzico below.
- The same members ride every surface: the generated payment routes, a
  `PaymentAction`'s `actionFailures` entry after the API's write, its
  `checkout.onPaymentError: "continueRoute"` failed outcome, and the
  request's own answer when the action runs before the write.

### Caller-supplied options a provider never receives

Money routing, capture mode, amount, payment source and 3-D Secure are the
generated service's decisions, never the caller's:

- `providerOptions` keys that would change them are refused with
  `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED` before the provider is called
  (the per-brand lists are below).
- Money-routing fields (a credited wallet, a fee, a sub-merchant key or
  price) sent by a caller are refused with `400 PAYMENT_ROUTING_FIELD_FORBIDDEN`.
- A start that carries card data (`cardInfo`) or a `saveCard` flag (any
  non-null value, `false` included) on an entry that does not take a card is
  refused `400 PAYMENT_DIRECT_CARD_NOT_ENABLED` before the card is read and
  before the provider is called, on every start door (the start route, in
  `paymentUserParams` or at the body root, a `PaymentAction` start, the
  marketplace arm, the thin action shims). Only an iyzico entry with
  `directCardEntry: true` takes a card. Card fields are kept out of order
  hints, intent metadata and start answers on every brand.

### Who completes a one-time payment

| Brand | Start answer | Who records the capture | Authored "complete" stage |
|---|---|---|---|
| Stripe | `client_secret`; the browser runs the 3-D Secure step | Stripe finishes the intent; the webhook or the refresh backstop records it | none |
| PayPal | approval link in `redirectToUrl` | a `PaymentAction` stage `complete` (one session Business API) captures | yes, exactly one |
| Adyen | an Adyen action, or a final result | the generated complete route sends the details; the notification settles | none (never author one) |
| Paddle | `redirectToUrl` to Paddle checkout | the webhook | see Paddle below |
| Lemon Squeezy | `redirectToUrl` to the hosted checkout | the webhook (`order_created`) | none |
| Mangopay | `redirectToUrl` to the hosted pay-in | the hook (re-read) or the refresh backstop | none |
| iyzico | hosted form URL, or 3-D Secure HTML | the generated return routes, else the webhook | none |

The generated `PATCH /v1/refresh<x>payment/:orderId` re-reads the payment and
is the backstop when a webhook is late. A generated
`/v1/complete<x>payment/:orderId` route exists only for Adyen-bound objects.

### Attempts, idempotency and resuming

- Each start attempt of an order carries the attempt key
  `mbs-<orderId>-<attempt>` (the idempotency key, and the `conversationId` /
  reference where the brand takes one). A retry of the SAME attempt carries
  the same key; only a new attempt gets a new one.
- A start that fails without a definite refusal (lost connection, timeout,
  5xx) is an UNKNOWN outcome, never a decline: it keeps its claim and its key
  (the buyer sees `502 PAYMENT_PROVIDER_UNAVAILABLE`). A retry inside the
  start-claim TTL (default 300000 ms, 5 minutes) answers `409
  PAYMENT_START_IN_FLIGHT`; the start that takes a stale claim over first
  looks the earlier charge up and adopts it, and answers `502` with
  `errorCode: PAYMENT_START_OUTCOME_UNKNOWN` (posting nothing) when it cannot
  decide. A new attempt key is minted only after a definite refusal.
- Every provider call is bounded by half the start-claim TTL, at most 60 s
  and at least 5 s, with no SDK-level network retry (the retake under the
  same key is the retry). Keep the TTL at 10 s or more; below that the 5 s
  floor is more than half of it.
- A capture webhook of a charge whose start answer was lost (the claim is
  held, the ticket never recorded the payment) is deferred while the claim is
  fresh (retried from 30 s on, up to the claim's stale instant, with no
  replay attempt spent) and then binds the payment to the claim whose key it
  carries: the ticket reads `success` and the capture lifecycle runs once,
  with no retake (log WARN `PaymentStartClaimBoundByCapture`).
- A start of an order whose payment is still open returns THAT payment
  (`pendingIntentReused: true`) when the amount, the currency and the
  payment method are unchanged. A start that names another method, a method
  where the open payment had none, or none where it had one is refused `409
  PAYMENT_START_INTENT_PENDING` before anything is charged (the ticket
  records the start's method as `metadata.startMethodRef`). A start never
  re-confirms an open payment with another method server-side.

### Stored payment methods

- A card is kept while paying only under a stored-method opt-in on the order
  object, read at design time, never from the request:
  `objectSettings.checkout.configuration.storePaymentMethod: true` (a
  checkout-only order) or
  `objectSettings.subscription.configuration.storePaymentMethod: true` (an
  order that also carries a subscription block). A `storeMethod` in the
  request body is ignored and a body-supplied recurring model / initiator is
  ignored.
- The generic save route `POST /v1/payment-methods/add` resolves the
  signed-in caller's own provider customer (creating the customer and the
  (userId, providerName) mapping on first use) when `customerId` is omitted;
  a `customerId` that is sent must be the caller's own, or the route answers
  `403` before the provider is called.
- The add route checks a raw card's expiry for every brand before the
  customer is resolved: an ended expiry month is `400 PAYMENT_CARD_EXPIRED`
  (`reason: card_expired`); a month outside 1 to 12, or a year that is not two
  (`30`) or four (`2030`) digits, is `400 PAYMENT_CARD_EXPIRY_INVALID`
  (`card_expiry_invalid`); a missing month or year is `400 MISSING_PARAMETER`.
  A card is valid through the last day of its expiry month; "this month" is
  read in UTC-12, so no card still valid anywhere is refused. A two-digit year
  is `20YY`.
- A start that names a saved method proves the caller owns it before the
  provider is called; a method of another customer is refused `403
  PAYMENT_METHOD_NOT_OWNED`, before any charge or enrolment.
- **The default card.** At most one live card per (`userId`, `providerName`)
  carries `isDefault: true` (the database enforces it; a buyer with cards on
  two entries has two defaults). The first card filed for a scope becomes its
  default on every filing path; a later card moves the default only when it
  asks (`makeDefault: true` beside `saveCard: true`, or `isDefault` /
  `makeDefault` on the add route; `makeDefault` without `saveCard: true` is
  `400 PAYMENT_CARD_INVALID`), or through
  `POST /v1/payment-methods/default/:paymentMethodId`, which clears the other
  default and retries when a concurrent set lands in between. Deleting the
  default promotes the most recently saved remaining card. A scope that holds
  cards and no default (cards filed before these rules) elects its most
  recently saved card once at boot (`PaymentMethodDefaultsElected`) and at its
  next save or delete. A card row with no `providerName` is outside these
  rules. A brand with no per-customer default (`supportsDefaultCard: false`)
  treats the stored `isDefault` as the source of truth and `setDefault` as a
  quiet no-op.
- **The 3-D Secure verified mark** (`threeDSVerified`, `threeDSVerifiedAt` on
  the stored-method row) is written only by the generated service through the
  identity owner's machine-only write; no request body, card attach or webhook
  payload can set it, and a human session or forwarded buyer token is refused
  there. It needs an identity owner (auth) service: without one no card is
  ever marked. Adding the same card again resets it before the row is
  persisted. Every start that charged a proven stored card records it on the
  ticket (`metadata.storedMethodCharged`), and the dispute machine resets
  that card's mark on `dispute.opened`, `dispute.evidence_required` and
  `dispute.lost` (`PaymentMethodThreeDSVerifiedReset`; an owner `4xx` is
  logged `PaymentMethodThreeDSResetNotRecorded`, a `5xx` fails the event so
  the replay retries it). A failed mark is logged
  `PaymentMethodThreeDSVerifyNotRecorded` and never changes a settled
  payment: the card is forced through 3-D Secure again on its next charge.
  The identity owner service must be built from the same generation as the
  services that carry the payment layer; an identity owner that lacks the
  machine routes leaves the mark unset (an unambiguous unknown-route `404`
  logs ERROR `PaymentIdentityOwnerOutdated`).
- **Operator reset of the mark.** After a chargeback confirmed out of band, a
  platform operator calls
  `POST /v1/payments/admin/reset-threeds/<objectName>/<orderId>` with
  `{ "reason": "..." }` (1 to 500 characters). The route resets the card in
  `metadata.storedMethodCharged` (else `metadata.threeDSVerifyMethod`); the
  ticket supplies the tenant, never the caller or the body. It is emitted for
  Stripe and iyzico checkout objects with an identity owner, behind the
  payment-operator gate and the platform role gate (`superAdmin`, `admin`,
  `saasAdmin`; on a multi-tenant project `superAdmin` and `saasAdmin`). The
  operator and reason are audited; a repeat is safe. Answers: `200` with
  `{ "status": "OK", "statusCode": 200, "objectName": ..., "orderId": ...,
  "threeDSVerified": false }`; `404` for an unknown object or ticket; `409
  THREEDS_RESET_METHOD_NOT_RECORDED`, `409 THREEDS_RESET_PROVIDER_MISMATCH`,
  `409 THREEDS_RESET_TENANT_REQUIRED`; `502 THREEDS_RESET_NOT_RECORDED` when
  the identity owner refused or was down (retry).
- **Mixed-brand objects.** A `PaymentAction` that names an entry of another
  brand than the order object's checkout proves ownership through that
  brand's manager, which does not read the mark: such charges keep 3-D
  Secure.

### Fraud review holds

A brand that captures before its fraud review ends (Stripe Radar, iyzico
`fraudStatus`) is held by one rule:

- While the review is open the ticket stays `started` with
  `paymentStatus: "FRAUD_REVIEW"`: no `afterPaymentCaptured`, invoice bridge
  or settlement accrual. A new start of the order answers `409
  PAYMENT_START_INTENT_PENDING`: neither the old intent nor a second charge.
- A rejected review settles the ticket `failed` with `paymentStatus:
  "FRAUD_REJECTED"` and `afterPaymentFailed`; an approved one settles
  `success` and runs the capture lifecycle exactly once.
- A checkout service bound to such a brand runs a review sweeper: it re-reads
  every ticket held `FRAUD_REVIEW` on a backoff (first on the next pass, then
  5 minutes, doubling per read up to 6 hours), and stops 7 days after it first
  saw the review with one `PaymentProviderReviewSweepExpired` WARN (a manual
  refresh still settles it). The schedule is kept on the ticket
  (`metadata.providerReviewSweep`, dropped when the payment is started again)
  and each read is claimed by a compare-and-set on the ticket's `updatedAt`,
  status and payment, so replicas never read one ticket twice. The default
  pass interval is 5 minutes; `0` disables it.

### Tokenized subscriptions

Where the generated service owns the cycle (Adyen, iyzico tokenized mode):

- A recharge scheduler makes one pass at boot and then one every interval
  (default 900000 ms, 15 minutes; `0` disables it, logged at boot). Each pass
  charges the rows whose `nextRechargeAt` is due (stamped at subscribe from
  the plan interval, advanced on every successful recharge) for the plan's
  amount on the subscription's stored method. A pass is single-flight per
  process; across replicas an overlap is one charge (idempotency key per
  cycle, a conditional cycle claim) and one stamp (anchor-guarded advance).
- A subscribe that cannot compute `nextRechargeAt` (the plan reference is not
  in the local catalog, or the row has no interval) logs
  `SubscriptionRechargeAnchorUnresolvable`: such a row is active but never
  selected.
- Every recharge is recorded on `sys_<X>Payment` as the subscription's own
  ticket (`orderId` = the subscription row id, re-pointed each cycle,
  `paymentId` = the provider's reference, `metadata.recharge: true`), so the
  provider's notifications reconcile a recharge through the same intent
  machine as a checkout. A tokenized subscription opt-in implies that table
  and machine even on an object with no checkout block.
- Dunning is bounded: a refused recharge moves the row to `past_due` and is
  retried once a day, at most `subscription.configuration.maxDunningAttempts`
  times (default 4); the attempt that reaches the cap applies
  `dunningExhaustedState` (`cancel`, the default, or `pastDue`) and clears
  `nextRechargeAt`. A stored method that cannot be resolved puts the row
  `past_due` at once, with one warning, instead of a retry every pass.

### Subscription state mapping across brands

- Delinquency normalises to `subscription.past_due` (row `active ->
  past_due`, `afterSubscriptionPastDue`). Only a healthy status (`active`,
  `trialing` / `on_trial`) on a generic update normalises to
  `subscription.renewed`; any other status on a generic update (`paused`,
  `canceled`, `expired`, missing, or one the provider adds later) normalises
  to `unknown`: recorded on `sys_paymentEvent`, moving no state and running no
  hook, so `afterSubscriptionRenewed` never runs for a paused or canceled
  subscription and a delinquent update never flips a `past_due` row back to
  `active`. The dedicated paused / canceled / expired events are the single
  producers of those transitions.
- `subscription.expired` fires only on brands that have an expired state;
  on Paddle and on iyzico webhooks a natural end arrives as `canceled`. This
  is a recorded provider difference, not a mapping gap: entitlement logic must
  read `statusLiteral: "canceled"` as well.
- Grant a plan on `active` (`afterInvoicePaid` / `afterSubscriptionRenewed`);
  `afterSubscriptionCreated` fires at creation on brands where creation and
  first payment are separate (Stripe), paid or not.

### Marketplace rules shared by every marketplace brand

- **One seller object, many order objects.** An order object that charges a
  seller onboarded on another object names it with `sellerAccountObject` in
  its marketplace block. Every seller lookup of the order object (the
  split-at-charge, the payout destination, the payout gate, the settlement
  release, the earnings ledger) then reads the seller object's
  connected-account table, keeping provider and tenant scoping (another
  tenant's seller matches nothing). The order row's `sellerAccountProperty`
  holds the seller's PROVIDER key (the connected-account row's
  `providerAccountId`), copied from the seller row at order creation; a local
  row id resolves as a fallback. Without the pointer the order object looks in
  its own (empty) table and the first paid checkout answers `400
  SELLER_ACCOUNT_UNRESOLVED`. The order object never provisions a seller at
  charge time; never create a connected account with an order object as
  `ownerModel`. The declaration is provider-neutral.
- Design time: `SELLER_ACCOUNT_OBJECT_SUGGESTED` (hint: another object of the
  service onboards sellers on the same provider); refused:
  `SELLER_ACCOUNT_OBJECT_NOT_FOUND`, `SELLER_ACCOUNT_OBJECT_SELF`,
  `SELLER_ACCOUNT_OBJECT_NOT_MARKETPLACE`,
  `SELLER_ACCOUNT_OBJECT_PROVIDER_MISMATCH`,
  `SELLER_ACCOUNT_OBJECT_SETTLEMENT_MODE_MISMATCH`,
  `SELLER_ACCOUNT_OBJECT_TENANT_MISMATCH`,
  `SELLER_ACCOUNT_OBJECT_WITH_ONBOARDING` (it would mint a seller per order
  row), and `SELLER_ACCOUNT_OBJECT_LANGUAGE_UNSUPPORTED` from a compiler that
  does not implement it. A chain or a cycle (a seller object that itself names
  a `sellerAccountObject`) is not refused at design time but resolves nothing:
  point straight at the object that onboards.
- **One routing per basket.** An order is either one seller's split or the
  platform's own sale; a basket that mixes sellers, or seller and own items,
  is not supported: split it into one order per seller.
- The routing is read from the PERSISTED order row, never from the request:
  whoever can write the order row's seller column decides which seller a sale
  belongs to, so protect that column with access rules.
- **Platform suspension.** `platformSuspended` on a seller's connected
  account is the platform's decision, set only by an operator through
  `POST /v1/payments/connected-accounts/:accountId/suspension` with
  `{ "suspended": true, "reason": "..." }` (a reason is required to suspend)
  or `{ "suspended": false }`. It is independent of the provider: `kycStatus`
  and `payoutEnabled` keep reporting the provider, and a refresh never changes
  the suspension. Every call is audited in `metadata.platformSuspension` and
  `metadata.platformSuspensionHistory` (the last 20; `actorId` is the
  operator session's user) and logged `PaymentConnectedAccountSuspension`. A
  new split charge to a suspended seller is refused `409
  SELLER_ACCOUNT_SUSPENDED` before the provider call; every payout is held
  (`seller_suspended`), and a `provider_driven` `PayoutAction` (which books
  nothing to hold) is refused `409 SELLER_PAYOUT_HELD`. The next payout pass
  after the suspension is lifted sends what was held.
- **Held payouts on the provider's word.** A brand whose account events set
  `payoutEnabled` both ways (capability `reportsSellerPayoutState`: Stripe,
  Mangopay, PayPal) holds a seller with `payoutEnabled: false`
  (`seller_payouts_disabled`). Adyen does not hold on it (a verdict-less
  notification can turn it off with no reliable way back); iyzico reports no
  such state.

## Stripe

The broadest surface: one-time charges, saved cards, subscriptions, full and
partial refunds, 3-D Secure, Apple Pay / Google Pay, Connect marketplace
(account creation, KYC onboarding, transfers, payouts) and disputes. The
reference adapter the other brands target for parity.

### Capabilities

All flags true except `isMerchantOfRecord` (the platform is the merchant);
`supportsDefaultCard: true`; `subscriptionSemantics: "hosted"`;
`webhookStyle: "hmac"`.

### Webhook signature

- The `Stripe-Signature` header is verified over the RAW body with the
  endpoint's signing secret (`whsec_...`).
- The signing secret is provisioning state, not an authored key: the create
  call of a webhook endpoint returns it ONCE and it is never readable again,
  only rotatable (rotation is create-then-delete). Until a secret exists the
  webhook route answers `401 SIGNATURE_UNVERIFIABLE`; intent create, start and
  read stay live.
- The provisioned endpoint subscribes to exactly the events the adapter maps.
  When an endpoint for the service URL already exists, provisioning adds the
  missing mapped events to it (keeping its id and secret, never removing an
  event, leaving a `*` endpoint as it is) and reports `eventsAdded` /
  `eventsNotAdded`. Re-run it after every upgrade that maps new events.

### Amounts, metadata and ids

- Amounts are given to the contract in major units and sent to Stripe in
  minor units: 100 per unit for two-decimal currencies, no decimal for
  JPY / KRW / VND / CLP, three decimals for BHD / KWD / JOD / OMR / TND.
- Stripe metadata has three limits, all enforced before the call: at most 50
  keys (the lexicographic tail is dropped, protected keys kept), key names at
  most 40 characters (an overlong key is dropped, never truncated, since a
  truncated name is a different identifier at read-back), values at most 500
  characters (truncated). Every dropped key is named in one structured warn.
  A PROTECTED (load-bearing) key longer than 40 characters REFUSES the call:
  Stripe cannot carry it and completing without it would break the tenant
  guarantee; rename the column to 40 characters or fewer.
- Numbers, booleans and objects are flattened. Control fields (`_stripe`,
  `idempotencyKey`, `description`, `destinationBankAccountId`, `method`,
  `connectType`, `businessType`, `capabilities`) are stripped before
  forwarding.
- Idempotency keys are a first-class input on intent create and refund, and
  `metadata.idempotencyKey` on transfers and payouts. A checkout start sets
  its own (`mbs-<orderId>-<attempt>`).

### Idempotency, retakes and lost answers

- Stripe stores a keyed answer, including a keyed `500`: after a genuine
  Stripe 500, retries under the same key keep failing until the key expires
  (24 hours).
- A call over its budget fails with Stripe's connection error, an UNKNOWN
  outcome: the start keeps its claim and key (`502
  PAYMENT_PROVIDER_UNAVAILABLE`), a refund keeps its reservation, nothing is
  read as a decline.
- **A retake past the key's lifetime.** Stripe keeps a key at least 24 hours
  and may forget it after that, so a retake of a claim older than 23 hours
  (measured from the attempt's FIRST post, recorded on the ticket as
  `metadata.startAttemptAtMs` and kept across retakes and processes) does not
  rely on it. Every keyed create writes its key on the PaymentIntent as
  `metadata.mbStartKey` (next to `metadata.orderId`; both are protected and
  never dropped by the 50-key cap). The retake first searches intents by
  `metadata['orderId']`:
  - an intent carrying this attempt's key is adopted and nothing is posted
    (WARN `StripeStartRetakeAdopted`); an adopted intent the earlier post was
    refused on (`requires_payment_method` with a card `last_payment_error`)
    answers the refusal: `402 PAYMENT_DECLINED` with that `providerErrorCode`,
    the claim released, no `started` ticket kept;
  - no such intent: the start posts (`StripeStartRetakeNoEarlierIntent`);
  - a search error, more result pages, or a charged intent of the order with
    no attempt key: `502`, nothing posted, the claim kept,
    `errorCode: PAYMENT_START_OUTCOME_UNKNOWN` (WARN
    `StripeStartRetakeUnresolved`).
  Search is eventually consistent (indexed within about a minute), which is
  why it is used only a day after the first post. An attempt claimed before
  the instant was recorded is retaken exactly as first posted (no
  `metadata.mbStartKey`), so Stripe replays it.
- **A refused key.** A retake that Stripe answers with its `400` idempotency
  error (the key was first used with other parameters, for example a changed
  amount or a changed 3-D Secure decision) looks the attempt up at once and
  adopts its intent, else answers the `502` above; it never posts a new
  charge on that answer. The adopted intent answers by its state: money moved
  (`succeeded`, `processing`, `requires_capture`) is recorded once; a buyer
  step (`requires_action`, `requires_confirmation`, `requires_payment_method`
  with no last error) answers `started`; a refused post answers `402
  PAYMENT_DECLINED` and releases the claim.
- **A lost answer and the webhook.** `metadata.mbStartKey` lets the
  `payment_intent.succeeded` webhook of a create whose answer was lost bind
  to its claim (see the family rule); a PaymentIntent without the key waits
  for a retake.

### Event mapping

- Event names (`payment_intent.succeeded`, `customer.subscription.created`,
  `charge.dispute.created`, `payout.paid`, `account.updated`, ...) normalise
  into the event taxonomy.
- Stripe has no `customer.subscription.past_due` event: delinquency arrives
  as `customer.subscription.updated` with the delinquent status. `past_due`
  (a renewal failed, Stripe still retrying) normalises to
  `subscription.past_due`; `unpaid` (retries exhausted, the account's
  setting marks it unpaid) normalises to `subscription.payment_failed` (row
  `past_due`, `afterSubscriptionPaymentFailed`). Under the setting that
  cancels an exhausted subscription it arrives as a delete with `status:
  "canceled"`: `afterSubscriptionCanceled` runs and
  `afterSubscriptionPaymentFailed` does not.
- `invoice.payment_failed` moves the row to `past_due` and fires
  `afterInvoicePaymentFailed`. Its `resource.failureReason` is the refused
  payment's decline code (else the charge's failure code, the issuer outcome,
  or the invoice's finalisation error). The body names the payment only by
  id, so the receiver reads it first: up to API version 2024-04-10 through the
  invoice's `payment_intent` / `charge`; from `2025-03-31.basil` on through its
  InvoicePayment entries (an inline `invoice.payments` list, else ONE invoice
  retrieve expanding the payment's intent / charge under the event's
  `api_version`, the open attempt read first). A lookup that fails leaves
  `failureReason` absent and never fails the delivery.
- An update with `active`, `trialing` or another non-delinquent,
  non-terminal status normalises to `subscription.renewed`; an update of a
  subscription still `incomplete` (first payment not done) normalises to
  `unknown` and moves nothing.
- `invoice.payment_action_required` (a renewal waiting on the buyer,
  typically 3-D Secure) normalises to `invoice.payment_failed` with
  `resource.requiresAction: true` and `resource.hostedInvoiceUrl`. Every
  Stripe invoice resource carries `hostedInvoiceUrl` when Stripe sends one.
  Stripe may report the same attempt as `invoice.payment_failed` too, so a
  notifying hook keys on `resource.providerInvoiceId`.
- Only an update or delete whose object says `incomplete_expired` (never took
  its first payment) reaches `subscription.expired`; a subscription that ends
  arrives as `canceled`. `afterSubscriptionCanceled` fires on both terminals.

### One-time flow

- The start creates a PaymentIntent (`confirm: true` when a `pm_` is named).
  Stripe completes the intent itself after the browser step: no server-side
  complete exists, and a `PaymentAction` stage `complete` is not part of a
  Stripe flow. A card with no challenge is `success` in the start answer and
  its hooks run before the answer returns.
- **Resuming.** A start of an order whose PaymentIntent is still open (a
  challenge the buyer closed, an unconfirmed Payment Element intent) returns
  that intent read live (`pendingIntentReused: true`, its current
  `client_secret` and `next_action`) under the family rule; to pay it with
  another card the browser confirms it on its `client_secret`.
- **Saving a card outside a payment.** The card is tokenized in the browser
  and the resulting `pm_...` id is saved through the add route; the backend
  never sees the card. The start route never stores a card.
- **Saving while paying.** Under a stored-method opt-in, a `PaymentAction`
  stage `start` or `simple` sends `setup_future_usage: "off_session"`
  (confirmed and unconfirmed creates alike); once the payment succeeds Stripe
  attaches the card to the buyer's customer and sends
  `payment_method.attached`, which the webhook mirror stores for the user that
  customer belongs to (with the opt-in off the event is acknowledged and
  nothing is stored). `providerOptions.setup_future_usage` at any depth is
  refused `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`.

### Radar review (`honourRadarReview`, default on)

Stripe captures automatically, so a payment Radar places in review is already
`succeeded` with `outcome.type: "manual_review"` and an open review. With the
key on (any value except `false`) the family fraud-review hold applies:

| The charge's review | A read reports |
|---|---|
| none, `outcome.type` not `manual_review` | the PaymentIntent's own status |
| open; or `manual_review` with no review; or a review the read could not expand | `started`, providerStatus `FRAUD_REVIEW`, `nextAction: null` |
| closed `approved` | `success` |
| closed `refunded_as_fraud` or `refunded` | `failed`, `FRAUD_REJECTED`, `failureReason: review_rejected` (one neutral value) |
| closed `disputed`, `redacted` or another reason | held as open: an operator decides |

- Every PaymentIntent read (create, confirm, capture, cancel, get) expands the
  latest charge and its review. Only a would-be `success` changes.
- `payment_intent.succeeded` names the charge only by id, so the capture gate
  always reads the payment back before settling (one extra read per webhook,
  also with no review). Under review the capture is refused (`skipped`, nothing
  runs, the ticket records the hold).
- `review.opened` and `review.closed` are mapped and provisioned; a review
  event names only its payment, which the dispatcher reads live. `approved`
  settles once, also after a refused `payment_intent.succeeded` and also when
  a refresh or the sweeper read the approval first.
- On a rejected review the refund Stripe makes arrives as `refund.created`
  and runs no refund lifecycle (nothing was captured on the service's side).
  Stripe does not order a refund against `review.closed`: a refund that
  arrives while the ticket still reads `FRAUD_REVIEW` reads the payment live;
  a review still open, or approved but not recorded yet, HOLDS it (listed
  under `metadata.refundsAwaitingCapture`); the capture that settles the
  payment makes held refunds due again and runs them right after the capture
  lifecycle. Nothing is lost to a review that outlasts the retry budget.
- `honourRadarReview: false` restores the earlier behaviour call for call (no
  expansion, no read-back, review events neither mapped nor provisioned).

### 3-D Secure policy

Under SCA, Stripe and the card issuer decide 3-D Secure. By default the
service writes nothing about it. An entry may add one server-side rule: FORCE
3-D Secure at or above an amount; it can never skip a challenge Stripe or the
issuer asks for.

- `newCardThreeDSThreshold` applies to a new card (the Payment Element, or a
  fresh unattached `pm_`); `savedCardThreeDSMode: "threshold"` with
  `savedCardThreeDSThreshold` to a stored card attached to the charge's
  customer; `savedCardThreeDSMode: "verifyOnce"` forces every charge of a
  stored card until a charge on it is authenticated. A forced create carries
  `payment_method_options.card.request_three_d_secure` with
  `threeDSRequestLevel` (`any`, the default, or `challenge`), set at create
  and persisting to the browser confirm.
- Thresholds are inclusive and compared in the charge currency's minor units
  (with a threshold of `500`, `500.00` is forced, `499.99` is not). With
  `threeDSThresholdCurrency` set, a charge in another currency is forced.
  Below the threshold, and on an entry with none of the keys, the create
  request is unchanged and no payment method is read.
- A named `pm_` is classified (read from Stripe) only when the two thresholds
  disagree for that charge; a method attached to another customer, or a read
  that fails (`StripeThreeDSMethodUnread`), is forced. Forcing needs no
  ownership proof and applies on every start seam.
- **Fail closed.** A threshold that is not 0 or positive reads as `0`; a
  `threshold` mode without threshold, or an unknown mode, reads as threshold
  `0` (never `verifyOnce`); a `savedCardThreeDSThreshold` beside `verifyOnce`
  is ignored; a threshold with no mode is threshold mode; an unknown request
  level reads `any`; a currency that is not three letters matches no charge,
  so every thresholded charge is forced. Each logs
  `StripeThreeDSConfigInvalid` and warns at design time
  `PAYMENT_PROVIDER_THREE_DS_CONFIG_INVALID`.
- **Caller keys.** `providerOptions.payment_method_options.card.request_three_d_secure`
  (or `moto`) is refused `400`. Stripe's form encoding turns bracketed key
  names into parameters, so every `providerOptions` key at any depth is
  checked for structure first: a key containing `[` or `]`, a key outside
  printable ASCII, and `__proto__` / `constructor` / `prototype` are refused
  `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`. Denied names
  (`request_three_d_secure`, `moto`, capture mode, amount, payment source,
  money routing) match case-insensitively and inside arrays. A bracketed key
  in the request's own `metadata` is dropped (named in a warn).
- A forced charge answers `started` with `paymentStatus: "requires_action"`
  and `nextAction.requiresAction: true`.
- **verifyOnce.** A stored card is marked verified (family rule) only when the
  report that claims the payment's capture lifecycle reads the PaymentIntent
  live and finds it succeeded,
  `latest_charge.payment_method_details.card.three_d_secure.result` exactly
  `authenticated`, and `latest_charge.payment_method` the recorded card
  (`metadata.threeDSVerifyMethod`). `attempt_acknowledged`, `exempted`,
  `failed`, no 3-D Secure, another card, an amount-gate refusal, a Radar hold
  (marked when the approval settles it), a replay mark nothing. Only a start
  that proves the caller owns the stored row (the start route, a
  `PaymentAction` start / simple) is relaxed; the thin shims and a
  mixed-brand arm always force. A card added from the account page is a plain
  attach with no authentication, so its first charge verifies it.
- **Liability.** A verified card only stops being forced; Stripe may still
  challenge. A later charge completed without 3-D Secure carries no liability
  shift: a fraud chargeback on it is the merchant's.

### Off-session charging (`savedCardOffSession`)

- Default `never`: no charge carries `off_session` and every saved-card charge
  is on-session.
- With `verified`, a charge is created `off_session: true`, `confirm: true`,
  without `use_stripe_sdk`, `return_url` or `setup_future_usage`, only when
  ALL hold: the entry also sets `savedCardThreeDSMode: "verifyOnce"`; the
  charge comes from a `PaymentAction` stage `start` or `simple` on a checkout
  order object; that action is declared `buyerAbsent: true` in the blueprint
  (never readable from a request); the card is a stored `pm_` whose proven
  row is `threeDSVerified`; the card is proven to belong to the paying user;
  and no threshold forces the charge.
- The paying user: for a scheduled or system run (cron, internal call, a
  Kafka consumer declared `loginRequired: false`, recognised from the
  transport the API was built for, never from a header or body) it is the
  ORDER OWNER (the `isOwnerField` column), proven through the identity
  owner's machine reads, which needs an identity owner and an owner column;
  for an HTTP call it is the forwarded bearer token's user; an anonymous call
  proves no card and stays on-session.
- Never off-session: an action without `buyerAbsent`, the start route, the
  thin shims, an unverified card, a fresh token, a typed card, a card the
  caller does not own (`403`). `providerOptions.off_session` stays refused
  `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`; a body `buyerAbsent` or
  `offSessionCharge` is ignored.
- The declaration is trusted: any call with the buyer's token through such an
  API is charged off-session, so `buyerAbsent` belongs only on an API the
  buyer does not call while paying (cron, internal, assistant-only), never on
  a checkout, including a one-click purchase.
- An off-session (merchant-initiated) charge carries no liability shift, and
  card networks allow it only while the buyer is absent under a
  stored-credential agreement. Design-time warnings:
  `PAYMENT_PROVIDER_OFF_SESSION_ENABLED` (whenever the key is `verified`),
  `PAYMENT_PROVIDER_OFF_SESSION_NO_BUYER_ABSENT_ACTION`, and
  `PAYMENT_ACTION_BUYER_ABSENT_INERT` (the action's provider is not Stripe; its
  entry does not set `verified` in the blueprint; its stage is `complete`,
  `refresh` or `callback`; its order is a marketplace order with a seller
  binding; no checkout order object is behind it; or the order is bound to
  another brand).
- An issuer that still wants authentication makes Stripe decline with `402`
  `authentication_required`, a definite refusal: the claim is released, no
  ticket is recorded, and the action answers `402 PAYMENT_DECLINED` with
  `providerErrorCode: "authentication_required"`. There is no automatic
  on-session fallback and no retry limit; do not retry such a decline through
  the action (networks count declined merchant-initiated retries). The buyer
  pays on-session instead.
- Each off-session charge logs `StripeOffSessionCharge` (`providerName`,
  `orderId`, `amount`, `currency`, `retake`; no card data, no `pm_`, no
  customer id). An unreadable value reads `never` and logs
  `StripeOffSessionConfigInvalid`.
- There is no Stripe recharge scheduler: use a Stripe subscription for
  scheduled recurring money.

### Subscriptions and 3-D Secure

The subscription is created with `payment_behavior: "allow_incomplete"` and
the first invoice expanded; Stripe charges the saved card at once:

| First payment | Subscribe answer | Row | Then |
|---|---|---|---|
| succeeds | `statusLiteral: "active"`, no `nextAction` | `active` | renewals |
| needs 3-D Secure | `statusLiteral: "past_due"`, `nextAction.requiresAction: true`, `paymentStatus: "requires_action"` | `past_due` | the browser confirms with `nextAction.clientSecret`; `invoice.paid` -> `active` |
| declined | as above, `paymentStatus: "requires_payment_method"` | `past_due` | confirm with another card and the same secret |
| never finished | - | `past_due` | Stripe expires it after 23 hours -> `expired` |

- `nextAction` (`requiresAction`, `clientSecret`, `paymentStatus` (`null` on
  API 2025-03-31 and later), `hostedInvoiceUrl`) exists only on the subscribe
  answer, never on the row, the event row or a hook resource.
- Stripe's `incomplete` reads `past_due`, never an entitled state; only
  `invoice.paid` moves it to `active`.
- A renewal that needs authentication follows the
  `invoice.payment_action_required` rule above: send the buyer
  `hostedInvoiceUrl`; paying there sends `invoice.paid`.

### Marketplace (Connect)

- Every marketplace call runs on the platform key without a
  `Stripe-Account` header, except a payout whose `destinationAccountId`
  starts with `acct_`, which runs under that account.
- Connected account: type `express` by default (`metadata.connectType`:
  `express`, `custom`, `standard`; match the account type your platform
  agreement covers), `metadata.businessType` default `individual`; a 2-letter
  ISO `country` is required. An update forwards `metadata._stripe` fields.
- KYC onboarding mints an `account_onboarding` link (`{ url, expiresAt }`).
  It needs `kycReturnUrl` (or a per-call `returnUrl`) or it is refused
  before Stripe is called; `kycRefreshUrl` falls back to it (the same URL for
  both is accepted).
- Transfers keep `transferGroup`. A payout may select a non-default external
  account (`metadata.destinationBankAccountId`) and `metadata.method`
  (`standard` / `instant`). Payout status mapping: `pending -> scheduled`,
  `in_transit`, `paid`, `canceled -> failed`, `failed`, `returned`.

### Disputes

- Fetch normalises status to `warning_needs_response`, `under_review`, `won`,
  `lost` or `accepted`.
- Evidence submission takes `evidence.fields`; `evidence.fields._submit:
  false` stages without finalising (the default submits).
- Accepting is irreversible (Stripe closes the dispute and applies the
  chargeback); the answer is forced to `statusLiteral: 'accepted'` because
  Stripe reports `lost` after close.

### Refusal codes

A card Stripe declines answers `402 PAYMENT_DECLINED`; a request refusal
keeps Stripe's own `4xx` with `PAYMENT_PROVIDER_REQUEST_REJECTED`.
`providerErrorCode` is Stripe's `decline_code` when sent, else its `code`;
never its `message` (it names live ids).

| Stripe code | `reason` |
|---|---|
| `incorrect_number`, `invalid_number` | `card_number_invalid` |
| `expired_card` | `card_expired` |
| `invalid_expiry_month`, `invalid_expiry_year` | `card_expiry_invalid` |
| `incorrect_cvc`, `invalid_cvc` | `card_cvc_invalid` |
| `card_not_supported`, `currency_not_supported` | `card_not_supported` |

Any other code (`insufficient_funds`, `card_declined`, `do_not_honor`) has no
`reason`. The decline codes Stripe asks merchants not to reveal (`fraudulent`,
`lost_card`, `stolen_card`, `pickup_card`, `merchant_blacklist`,
`restricted_card`) read `providerErrorCode: "generic_decline"` with no
`reason` on every client surface; the real code is only on the operator's
log line.

### Mock behaviour a compiler's Stripe mock honours

- The idempotency key on intent create and refund create behaves as at
  Stripe: same key and parameters replay the first answer (a stored decline
  included), other parameters are a `400` idempotency error, a concurrent
  same-key request is a `409`, keys expire after 24 hours; intent search on
  metadata clauses is answered; a second confirm of a succeeded intent is
  refused (`400 payment_intent_unexpected_state`).
- The read half of the provisioning sweeps (price and product lists, paged,
  honouring `active`, `type: "recurring"`, product expansion; webhook endpoint
  list / create / delete / update) is answered. Both sweeps are
  search-before-create, so a read that throws creates nothing at all (leaving
  every `providerPlanId` null). A created endpoint returns its secret once.
- Scenarios: `fraud_review` (held until resolved), `fraud_review_clears`
  (review on create and first read, approved on the second),
  `requires_action` (stays), `requires_action_completes` (the next read finds
  the intent succeeded). A forced 3-D Secure create answers `requires_action`
  and its charge reports `three_d_secure.result: "authenticated"` once the next
  read settles it. An off-session create succeeds, unless
  `authentication_required`, `requires_action` or
  `requires_action_completes` turns it into the `402` refusal.

### Owed before production

Measure a merchant-initiated charge in Stripe test mode on a verified card
Stripe always asks to authenticate (expect `402 authentication_required`) and
on a card set up for off-session use (expect success), and confirm a create
without `use_stripe_sdk` / `return_url` is accepted.

## PayPal

One-time (Orders v2), subscriptions, refunds, marketplace (Payouts API and
Partner Referrals) and disputes. PayPal and Mangopay are the most
surface-complete adapters.

### Capabilities

`supportsProration: false` (billing-plan changes do not proration-credit);
`supportsSavedCards: true` (Vault v3); `supportsDefaultCard: false` (Vault has
no per-customer default; the stored `isDefault` is the source of truth);
`supportsConnectedKYC: true` (Partner Referrals action link);
`subscriptionSemantics: "hosted"` (activation through a buyer-approval link,
PayPal drives the cycle after that); `webhookStyle: "cert"`. Everything else
true except `isMerchantOfRecord`.

### Webhook verification

- The local check is only a probe: `webhookId` configured, the five
  `PayPal-Transmission-*` / `PayPal-Cert-Url` / `PayPal-Auth-Algo` headers
  present, the body JSON. It authenticates nothing.
- The route and `VerifyWebhookAction` always then call PayPal's
  `/v1/notifications/verify-webhook-signature` with the configured
  `webhookId`, the inbound headers and body. The event is accepted only when
  PayPal answers `SUCCESS`; a failed, unreachable or throwing check is `401`
  and nothing is parsed or stored. Expect more latency than an HMAC check.
- Event names (`PAYMENT.CAPTURE.COMPLETED`, `BILLING.SUBSCRIPTION.CANCELLED`,
  `CUSTOMER.DISPUTE.CREATED`, ...) normalise into the taxonomy.

### Refund attribution

A v2 refund report (`PAYMENT.CAPTURE.REFUNDED` / `.REVERSED`,
`PAYMENT.REFUND.COMPLETED` / `.FAILED`) is attributed to the PayPal ORDER
(the id the ticket and its refunds are stored under), never to the capture
its `rel: up` link names. The refund's
`supplementary_data.related_ids.order_id` is used when present; otherwise the
event is stored as an id-only stub and hydrated by reading the capture for its
order before the refund lifecycle runs. A capture that names no order is
refused (`502`). A v1 Sale refund (`PAYMENT.SALE.REFUNDED` / `.REVERSED`)
carries no order and keeps its previous mapping.

### One-time flow: who captures

- Every order is created with `intent: "CAPTURE"`; the approval link is
  exposed as `redirectToUrl` while the order is `CREATED` or
  `PAYER_ACTION_REQUIRED`. PayPal returns the buyer to the start's
  `return_url` (the app's page, not a service route).
- An approved order is not paid. The refresh only reads it (an approved order
  still reads `started`), and `CHECKOUT.ORDER.APPROVED` normalises to
  `payment.authorized`, leaving the ticket `started`. An order the buyer never
  approves is never captured.
- The capture is a `PaymentAction` stage `complete`, authored as ONE session
  Business API called by the return page with the buyer's session: `401
  LOGIN_REQUIRED` without it, `403 NOT_OWNER` for another buyer. It must
  declare the PayPal order id as a caller-supplied parameter named
  `paymentId` (or `providerIntentId`), else every call fails and validation
  warns `PAYMENT_STAGE_NO_INTENT_ID_PARAM`. The id is the start answer's
  `paymentId` and is also on the order's ticket.
- The capture records the ticket and runs `afterPaymentCaptured`; the answer's
  `statusLiteral` is `success` or `amount_mismatch`. The later
  `PAYMENT.CAPTURE.COMPLETED` or `CHECKOUT.ORDER.COMPLETED` webhook names the
  same order and runs nothing a second time.

### Amounts

Orders v2 takes amounts as strings in major units; the adapter formats them.

## Adyen

Full surface: one-time, subscriptions through stored tokens (Recurring),
marketplace (Adyen for Platforms), KYC and disputes.

### Capabilities

All true except `supportsDefaultCard` and `isMerchantOfRecord`;
`subscriptionSemantics: "tokenized"`; `webhookStyle: "hmac"`. Refund and
payout reads may return reduced data depending on the account's permissions.

### Notifications

- Adyen sends HMAC-signed notification BATCHES; verification uses `hmacKey`
  (webhook-only: an entry without it is live but refuses its webhook route),
  and parsing yields one normalised event per notification item.
- An `AUTHORISATION` (success=true) is `payment.authorized` and reads
  `started`; only a `CAPTURE`, or the synchronous `Authorised` answer to the
  service's own immediate-capture request, reads `success`.
- Payouts and disputes reach the service through notifications only: Adyen
  has no endpoint to read a payout or fetch a dispute, so those calls answer a
  typed `501` on any transport.

### Amounts, references and metadata

- Every payment is captured immediately (`captureDelayHours: 0`); a caller
  cannot ask for manual or delayed capture, and a capture delay configured on
  the merchant account does not apply to payments the service starts: manual
  review must happen before the start.
- 3-D Secure / SCA are the service's: `executeThreeD`, `scaExemption`,
  `attemptAuthentication`, `authenticationData`, `threeDSRequestData` /
  `threeDS2RequestData`, `threeDSAuthenticationOnly` and `allowPartialAuth` in
  `providerOptions` (any depth) are refused `400
  PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`.
- Request metadata carries the caller's `providerOptions.metadata` plus
  `orderId` and `description` within Adyen's limits: 20 pairs, key 20
  characters, value 80 characters.
- Three-decimal currencies (BHD / KWD / JOD / OMR / TND) are handled.
- Saved-card / recurring-token ids are composite:
  `<shopperReference>:<recurringDetailReference>`; the reference half is sent
  as `storedPaymentMethodId`.
- **One reference per attempt.** Each start attempt is sent as `reference:
  "<orderId>:<attempt>"`, decoded back on answers and notifications:
  `orderId` is always the base order id (what the capture amount gate
  compares), the attempt rides in `metadata.adyenAttempt`. The ticket records
  its active attempt (`metadata.adyenAttempt`, `metadata.adyenReference`) and
  earlier ones in `metadata.adyenPriorAttempts`. Only the ACTIVE attempt is
  acted on: a late AUTHORISATION / CAPTURE of an earlier attempt runs no
  success lifecycle and is logged ERROR `PaymentAdyenAttemptEventUnmatched`. A
  legacy order-only reference settles only through an exact `pspReference`
  match and never binds a placeholder.
- Until Adyen assigns a `pspReference` the ticket holds the placeholder
  `adyen-action:<key>`.

### Adyen cannot be read back

Adyen Checkout has no payment read; the read answers a typed `501
PAYMENT_PROVIDER_READ_UNSUPPORTED` without a request. A refresh answers the
ticket as recorded from Adyen's answers and notifications
(`refreshedFrom: "ticket"`), with no provider call and no new lifecycle event.
Capture, cancel and refund take amount and currency from the service's
records (for a full refund, the captured amount less refunds already
recorded), never a default currency; a call without them is refused `400
PAYMENT_OPERATION_FIGURES_REQUIRED` before any request.

### One-time flow with 3-D Secure

- A first card is sent on the start as `paymentUserParams.paymentMethodData`
  (with a `return_url`), a stored one as `paymentMethodId`. `POST /payments`
  answers a final result or an action (redirect / challenge) the browser
  completes; the resulting `details` (or `redirectResult`) go to the generated
  `PATCH /v1/complete<x>payment/:orderId`, which sends `/payments/details`.
  The notification settles the ticket and runs the hooks.
- Never author a `PaymentAction` stage `complete` or `callback` for Adyen. A
  designer-authored `start` is optional. A `simple` stage stops after the
  create (Adyen's confirm needs the shopper's details): an action answer comes
  back `started` with `nextAction` and the complete route finishes it. A
  confirm without `details` is refused `400 PAYMENT_DETAILS_INVALID` on a
  live transport.
- **An abandoned challenge.** A recorded action gets an absolute local expiry
  (`metadata.adyenActionExpiresAt`, default 30 minutes, set once per
  attempt). Before it, a restart with the same amount, currency and method
  RESUMES the attempt (`pendingIntentReused: true`, nothing charged); a changed
  amount or another method answers `409 PAYMENT_START_INTENT_PENDING`. After
  it the restart still answers `409` (logged `PaymentAdyenActionExpired`): the
  expiry is local, not a cancellation at Adyen. The order is freed only by
  Adyen's confirmed end of the attempt (an AUTHORISATION `success=false`,
  CANCELLATION or EXPIRE notification with the attempt's reference, moving the
  ticket `failed` / `canceled`) or by an operator release. The complete route
  stays open for the attempt after the local expiry.
- **Operator release.** `POST
  /v1/payments/admin/adyen-attempts/:objectName/:orderId/release` with
  `{ "attempt": ..., "reason": ... }`, behind the payment admin guard
  (operator session with a platform role). It releases only an attempt still
  open on its placeholder (Adyen never named a payment), that is the one
  named, whose local expiry has passed: one compare-and-set moves the ticket
  `canceled` (`failureReason: ADYEN_ATTEMPT_RELEASED_BY_OPERATOR`) and records
  `metadata.adyenOperatorRelease` (`releasedBy` is the session user, never a
  header; logged `PaymentAdyenAttemptReleased` and audited). Refusals write
  nothing: `400 ADYEN_ATTEMPT_REQUIRED`, `400 ADYEN_RELEASE_REASON_REQUIRED`
  (1 to 500 characters), `404`, `409 ADYEN_ATTEMPT_MISMATCH`, `409
  ADYEN_ATTEMPT_NOT_RELEASABLE`, `409 ADYEN_ATTEMPT_NOT_EXPIRED`, `409
  ADYEN_ATTEMPT_MOVED`. A repeat answers `alreadyReleased: true`. Nothing is
  sent to Adyen: if Adyen still authorises the released attempt, its late
  event is refused and logged, and the buyer may have paid twice (refund at
  Adyen).

### Tokenized subscriptions

- The family recharge rules apply. A recharge is merchant-initiated:
  `shopperInteraction: ContAuth`, `recurringProcessingModel: Subscription`,
  the stored method and `shopperReference`; no shopper challenge is expected.
- The method must have been ENROLLED by the initial customer-initiated
  payment, and enrolment is the stored-method opt-in. The start then sends
  `storePaymentMethod: true` with a `recurringProcessingModel` of
  `Subscription` (when `planProperty` binds a plan with an interval) or
  `UnscheduledCardOnFile` otherwise (the checkout switch alone enrols card on
  file; recharges still need the subscription block). With the opt-in off a
  body `storeMethod` is dropped and validation warns
  `SUBSCRIPTION_STORE_PAYMENT_METHOD_OFF`; the payment is a plain
  `Ecommerce` charge.
- A first card under either switch is tokenized and, once paid, filed in the
  ticket owner's wallet (needs an identity owner). The subscribe pins a card on
  the row (`metadata.providerMethodId`): a body `providerMethodId` must be the
  caller's own saved Adyen card (`403 PAYMENT_METHOD_NOT_OWNED`), else the
  default card, else the most recently saved one; a caller with no saved card
  opens a subscription with no card and its recharges have nothing to charge.
- A recharge Adyen leaves in flight (`Received` / `Pending`, an asynchronous
  method) is neither charged nor dunned: the row keeps its anchor, the pass
  logs `charge-pending`, and the AUTHORISATION / REFUSED notification settles
  the cycle.
- Each subscribe mints `<shopperReference>:<planCode>:<uuid>`, so a buyer who
  canceled can subscribe again to the same plan (a new row); an older id
  without the suffix reads the same.
- **Open gaps of the generated subscribe route.** It does not write the card it
  was opened with onto the row, so a recharge falls back to the customer's
  default stored method, which a payment service cannot read when methods live
  in the identity owner (the first recharge then parks the row `past_due`,
  "method missing"); a `period_end` cancel makes no provider call and the row
  stays `active`, so the scheduler keeps charging, while an `immediately`
  cancel disables the contract at Adyen so recharges are refused and dunned
  to the cap; a paid recharge announces `subscription.renewed` but no
  `invoice.paid`, so `issuePolicy: onPaymentCaptured` issues no renewal
  invoice. Workaround: with an identity owner, prove the first recharge on a
  non-production deployment before going live; cancel `immediately` and also
  write a canceled flag of your own; invoice renewals from
  `subscription.renewed`.

### Mock coverage

The Adyen mock speaks Adyen's native JSON, so the adapter runs unchanged. The
mock-status entry lists every call family with `coverage: "present"` or
`"absent"`: `checkout`, `storedMethods`, `marketplace`, `transfer`, `payout`,
`dispute` (all present). They run over a brand-neutral marketplace state
machine (a new account holder is pending, `AWAITING_DATA`, payouts not
allowed, until onboarding completes; a payout never draws a balance past
zero; a defended dispute is under review, an accepted one lost). Scenarios:
`success`, `requires_action`, `decline`. A client must send Adyen's `test_`
card values (a mock client key cannot load Drop-in's secure fields); the
details fallback `{ paymentData: <payment id> }` is sent on the mock only.
Dispute calls send `merchantAccountCode` and read
`disputeServiceResult.success`: a closed dispute answers HTTP 200 with
`success: false` and is never reported as defended or conceded again. Defence
documents keep their type and content type only. Payout retries under the same
key return the first answer without drawing the balance again.

## Paddle

Merchant of record for SaaS billing: subscriptions and one-time charges; no
marketplace, connected account, KYC, transfer or payout surface.

### Capabilities

`isMerchantOfRecord: true`; `subscriptionSemantics: "hosted"`;
`supportsDisputes: true` (fetch, submit evidence, accept);
`supportsMarketplace`, `supportsConnectedKYC`, `supportsDefaultCard` false;
`webhookStyle: "hmac"`. Marketplace calls fall through to
`CapabilityLimitedError`.

Saved methods: Paddle vaults the card. `supportsMethodAttach: false` (the
add route is `400 CapabilityLimitedError`), `supportsMethodList: true`,
`supportsMethodDetach: true` only with the composite
`<customerId>:<methodId>` id that the list and the `payment_method.*` webhook
mirror hand out (a bare id or an empty segment is refused `400`, never a silent
no-op; a legacy row stored with a bare id is addressed under its proven
customer). `setDefault` is a quiet no-op.

### Configuration rules

- `environment` is `sandbox` (default) or `live`, case ignored; any other
  value is refused at construction. `vendorId` and `apiKey` are required to
  construct.
- `webhookSecretKey` (the notification destination's secret) is
  webhook-only: without it the adapter takes payments and the webhook route
  answers `401 SIGNATURE_UNVERIFIABLE`.
- `webhookPublicKey` (an RSA key of the provider's older platform) is retired:
  a blueprint that carries it validates with the warning
  `PAYMENT_PROVIDER_RETIRED_CONFIG` (never an error) and the value is ignored.
- `priceMode` (`auto` / `explicit`) is kept for compatibility and changes
  nothing on a one-time charge.

### Webhook signature

The `Paddle-Signature` header is `ts=<unix>;h1=<hex>`; `h1` is the hex
HMAC-SHA256 of `<ts>:<raw body>` keyed with `webhookSecretKey`. A delivery
verifies when ANY `h1` matches (several are sent during a secret rotation) and
`ts` is within 5 seconds of the service clock (the replay window). Anything
else is `401 SIGNATURE_INVALID`. The `Paddle-Version` header is fixed at `1`.

### One-time payments

- **The charge is always the order amount.** The transaction item is an
  inline, non-catalog price for the order's amount and currency; a catalog
  price is never taken from request input (`metadata.priceId`, or the caller's
  `paymentMethodId` under `priceMode: "explicit"`).
- The transaction's `custom_data` accepts `providerOptions.custom_data`
  extras; every protected key the persisted order carries (the tenant column
  included) is then restored from the row, followed by `orderId`. A protected
  key absent from the row may still come from the caller. Neither input map is
  mutated.
- The start creates a transaction with `collection_mode: "manual"` and the
  start's `return_url` as the checkout URL; Paddle's `checkout.url` is
  `redirectToUrl`, with `requires_redirect: true` while the transaction is
  `draft`, `ready` or `billed`.
- Mapping: `transaction.paid`, `transaction.completed` -> `payment.captured`
  (ticket `success`); `transaction.billed` -> `payment.authorized` (ticket
  stays `started`); `transaction.payment_failed`, `transaction.past_due` ->
  `payment.failed`; `transaction.canceled` -> `payment.canceled`.
- The adapter's confirm switches the transaction to
  `collection_mode: "automatic"`; only a `PaymentAction` stage `complete` (or
  `simple`) calls it, no generated route does. Owed before production: a
  sandbox run of the one-time path to confirm whether a design needs that
  complete call. Do not rely on a one-time Paddle checkout without testing it
  end to end.

### Subscriptions

- A subscribe resolves the plan in the local catalog and sends its
  `providerPlanId` (a Paddle price id); the subscription is created with
  `collection_mode: "automatic"` and bills the method Paddle holds for the
  customer (no per-subscription method is sent).
- Delinquency has ONE producer: the dedicated `subscription.past_due` event.
  A generic `subscription.updated` carrying `past_due` is `unknown`,
  whichever envelope arrives first; a healthy update (`active`, `trialing`) is
  `subscription.renewed`.
- Paddle has no `expired` state (statuses `active | trialing | past_due |
  paused | canceled`): a subscription that ends arrives as
  `subscription.canceled`, and `subscription.expired` never fires for a
  Paddle-bound object.
- `SubscriptionAction` stages are `subscribe`, `cancelSubscription` and
  `refresh`; there is no webhook-driven stage.

## Lemon Squeezy

Merchant of record for SaaS billing, narrower than Stripe: no marketplace, no
dispute API, no payouts or transfers.

### Capabilities

`isMerchantOfRecord: true`; `subscriptionSemantics: "checkout-driven"`;
`supportsDisputes`, `supportsMarketplace`, `supportsConnectedKYC`,
`supportsDefaultCard` false; `webhookStyle: "signature"`. The card is vaulted
by the provider: attach, detach and list are all off (the generic add and
delete routes are `400 CapabilityLimitedError`, list is never called,
`setDefault` is a quiet no-op). Confirm and capture are no-ops (the hosted
checkout auto-confirms). Dispute and marketplace calls throw
`CapabilityLimitedError`.

### Webhook signature

ONE key signs a delivery: `signingSecret`. The `X-Signature` header is
compared in constant time with `HMAC-SHA256(rawBody, signingSecret)`.
`signingSecret` is required to construct, so a live adapter can always
verify. `webhookSecret` (the secret quoted when registering a webhook
subscription) verifies nothing; no code path reads it, it is optional and is
not webhook-scoped.

### Subscriptions are checkout-driven

A subscription cannot be created programmatically: the customer completes a
hosted checkout and the provider emits `subscription_created`. No
`SubscriptionAction` stage creates one (its stages are `subscribe`,
`cancelSubscription`, `refresh`; none is webhook-driven).

### Event mapping

- `meta.event_name` (`order_created`, `subscription_created`,
  `subscription_payment_success`, `order_refunded`, ...) maps to normalised
  events; renewal payment events normalise to `invoice.*`.
- `subscription_updated` / `subscription_plan_changed` are read by
  `attributes.status`: `past_due` (retrying) and `unpaid` (retries exhausted)
  -> `subscription.past_due`; `active`, `on_trial` -> `subscription.renewed`;
  everything else -> `unknown`. The dedicated `subscription_paused`,
  `subscription_cancelled`, `subscription_expired` events drive those
  transitions exactly once in either arrival order;
  `subscription_payment_failed` -> `subscription.payment_failed`. One failed
  renewal therefore typically runs both `afterSubscriptionPastDue` and
  `afterSubscriptionPaymentFailed`, once each.

### One-time payments

- The start creates a hosted checkout for the order amount (`custom_price`,
  in cents), the start's `return_url` as the redirect URL, the order id in the
  checkout's custom data. A variant id is required: the start's
  `paymentMethodId` is read as the variant (not a payment instrument, so no
  ownership proof applies), else `metadata.variantId` (on the generated start
  route `metadata` is the persisted order row, so an order column `variantId`
  works).
- The answer: `requires_redirect: true`, `redirectToUrl` = the checkout URL,
  `paymentId` = the checkout id.
- A signature-verified `order_created` normalises to `payment.captured`; it
  carries the service's order id in `meta.custom_data.orderId` and the vendor
  order id in `data.id` (`attributes.identifier` is NOT the service's order
  id). For the same provider and active checkout ticket the intent machine
  checks the captured amount, records `metadata.lemonSqueezyOrderId` and binds
  the ticket to the vendor order before the lifecycle runs. The start records
  `metadata.lemonSqueezyCheckoutId`.
- Before the vendor order id is recorded, a refresh answers from the ticket
  without a vendor request and a repeated start stays pending; afterwards a
  refresh reads the recorded vendor order. It never reads an order by the
  checkout id or guesses a lookup endpoint.

## Mangopay

A wallet-based electronic money institution, marketplace first: every
Mangopay user, natural or legal, is already a sub-merchant. Strong on
connected accounts, KYC, transfers and payouts. No subscriptions.

### Capabilities

`supportsSubscriptions: false` (`subscriptionSemantics: "unsupported"`: bind
a second provider for subscription objects; subscription calls throw
`CapabilityLimitedError`); `supportsApplePayGooglePay: false`;
`supportsDefaultCard` and `isMerchantOfRecord` false; everything else true;
`webhookStyle: "refetch"`.

### Configuration rules

- `payInDefaultReturnUrl` is required to construct.
- `baseUrl` is the host the adapter calls, so it is what live detection reads
  (a production host on a non-production deployment is refused); behind an
  unrecognised host (a proxy) detection reads `environment`
  (`sandbox` / `production`), which otherwise only picks the KYC link host.
- **The credited wallet is configuration.** Every pay-in credits the
  deployment's configured escrow wallet with a fee of 0; sellers are paid from
  it by transfers. A start without it configured is a `400` naming the missing
  setting. A caller that sends `creditedWalletId`, `CreditedUserId` or
  `feeAmount` (in `providerOptions` or metadata) is refused `400
  PAYMENT_ROUTING_FIELD_FORBIDDEN`. The accepted caller extras are
  `useWebFlow`, `cardType`, `culture` and `templateUrlOptions`.
- Every pay-in sends `SecureMode: "DEFAULT"`; a caller `secureMode` is
  refused `400 PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`.

### Hooks: unsigned GET, re-read

Mangopay hooks are unsigned `GET` requests with `EventType`, `RessourceId`
(Mangopay's spelling; `ResourceId` is accepted too) and `Date` in the query.
The route:

1. validates the query shape (`400` otherwise);
2. re-reads the named resource with the entry's own credentials (pay-ins,
   refunds, payouts, disputes, users, KYC documents, mandates, transfers);
3. checks the answer is the object named (same `Id`; for transactions the
   matching `Type` / `Nature`, any refund `Nature: REFUND`) within a 1.5 s
   budget (on expiry `502`);
4. builds the event from that answer: the fetched `Status` (a user's
   `KYCLevel`) decides the event type, never the query's `EventType`, and the
   event id is keyed on the fetched state, so a late hook for an old state and
   the hook for the current one record one event.

A hook naming a resource the adapter does not re-read (UBO declarations,
dispute documents, account events) or an id Mangopay does not know is
acknowledged `200` with `ignored` and not recorded; a failed re-read answers
`502` so Mangopay retries. A `POST` to the hook URL is refused `401
SIGNATURE_INVALID`.

### Wallet model and lifecycle

- PayIn (card / bank -> wallet), Transfer (wallet -> wallet: seller and fee
  split), PayOut (wallet -> bank). A connected account is a natural or legal
  user, with a wallet provisioned alongside.
- **A pay-in completes itself**: no capture step, no complete call. The start
  creates a hosted card web pay-in, or, with a saved card (`paymentMethodId` =
  the Mangopay `CardId`), a direct pay-in unless `providerOptions.useWebFlow`
  is `true`. The answer is `requires_redirect: true` with `redirectToUrl` =
  Mangopay's `RedirectURL` (hosted) or `SecureModeRedirectURL` (3-D Secure on
  a direct pay-in) whenever one is returned. The buyer lands on the start's
  `return_url`, else `payInDefaultReturnUrl`.
- `PAYIN_NORMAL_SUCCEEDED` / `PAYIN_NORMAL_FAILED` (re-read) record the
  outcome and run `afterPaymentCaptured` / `afterPaymentFailed`; the refresh
  backstop reads the pay-in when the hook is late. The adapter's confirm only
  re-reads, so a `complete` stage would only refresh: author none.
- A payout to a real bank account is batched: it is created
  `statusLiteral: 'scheduled'` and `PAYOUT_NORMAL_SUCCEEDED` flips it to
  `paid` (`afterPayoutPaid`), typically days later.

## iyzico

A Turkish-market processor: one-time, subscriptions, saved cards, refunds and
marketplace (sub-merchants). Its rules below include the facts found on real
accounts; "not measured" marks behaviour modelled from the provider's
documentation and the mock but not yet observed on a live account.

### Account facts a compiler cannot read

These are properties of the merchant account; no blueprint key changes them,
and they must be confirmed with the provider in writing before go-live:

- **Marketplace product active?** A marketplace account refuses every basket
  item that names no sub-merchant and cannot run the provider's subscription
  module.
- **Non-3DS charges allowed?** Needed for `savedCardThreeDSMode`, for a direct
  card below `newCardThreeDSThreshold` and for every tokenized recharge;
  without it the provider refuses those charges.
- **Webhook signature V3 enabled?** The service accepts only
  `X-IYZ-SIGNATURE-V3`; until it is on every real webhook is refused `401
  SIGNATURE_INVALID`.
- **Automatic item approval off?** Needed only with `settlementRelease`: with
  it on the provider releases the seller's share itself and no hold applies.

### Capabilities

`supportsProration`, `supportsApplePayGooglePay`, `supportsConnectedKYC`,
`supportsDefaultCard`, `isMerchantOfRecord` false; everything else true;
`subscriptionSemantics: "hosted"` (or tokenized by configuration);
`webhookStyle: "hmac"`.

- `supportsDisputes: true` routes dispute calls to the adapter, which answers
  HTTP `501` directing callers to the merchant dashboard (a runtime answer,
  not a design-time refusal). `CHARGEBACK_NOTIFICATION` has no documented V3
  webhook format, so the webhook refuses it and no chargeback reaches the
  dispute lifecycle (and so no dispute resets a card's verified mark; the
  operator reset route is the way).
- A payout cannot be read per payout (payouts surface by webhook); KYC
  sessions are a throwing stub.
- Refund reasons are sent in the provider's vocabulary: `duplicate ->
  double_payment`, `fraudulent -> fraud`, `requested_by_customer ->
  buyer_request`, `other -> other`; no reason sends none.

### Webhook verification and events

- The `X-IYZ-SIGNATURE-V3` HMAC is verified with `secretKey`. The event type
  (`iyziEventType`, with an optional status discriminator) maps to normalised
  events, for example `THREE_DS_AUTH:SUCCESS -> payment.captured`.
- A saved-card or direct-card 3-D Secure payment sends `THREE_DS_CALLBACK`
  (the bank's callback, before the auth) and then `THREE_DS_AUTH:SUCCESS`.
  `THREE_DS_CALLBACK` verifies and is stored as `payment.threeds_callback`,
  `skipped` as informational; `CALLBACK_THREEDS` and failure reports move no
  ticket and fire no lifecycle. The direct event id is
  `iyz-v3:direct:<iyziEventType>:<paymentId>:<paymentConversationId>:<status>`,
  where `paymentConversationId` is the start's attempt key.
- `THREE_DS_AUTH` after a 3-D Secure return already settled the payment is
  stored `skipped` naming the return's `3ds-return-<paymentId>-success` event
  (a failed return is `3ds-return-<paymentId>-failed`, so it never absorbs a
  capture); when the webhook is first, the return's own event is the one
  stored `skipped`. The same holds for a payment the Checkout Form return
  settled. Exception: a webhook keyed by the numeric paymentId that arrives
  before the first Checkout Form return reaches no ticket (the ticket still
  carries the form token), runs no hook, and the return is dispatched as
  usual.
- `CHECKOUT_FORM_AUTH` (the hosted form's webhook) maps to `payment.captured`
  (`SUCCESS`) or `payment.failed` (`FAILURE`) and is keyed by the form
  `token`. It never runs the lifecycle itself: the service settles through the
  checkout return's own logic (read the form detail by token, capture amount
  check, swap the ticket from the token to the numeric paymentId, write and
  dispatch the same `cf-return-<token>` event). Whichever of return and
  webhook arrives first settles; the other writes nothing. A webhook that
  arrives before the form detail shows the outcome fails its dispatch and is
  retried by the replay worker; a webhook for a form no ticket owns writes
  nothing.
- The saved-card payment webhooks (`API_AUTH`, `THREE_DS_AUTH`) name the order
  by `paymentConversationId`. A capture webhook of a `/payment/auth` whose
  answer was lost binds to the claim (family rule) only when the key is
  exactly the claim's, on a claim stamped with the same entry that recorded
  its charge figures.
- `CONTRACT_APPROVED` and `SUBMERCHANT_UPDATE` have no documented V3 format
  and are refused (`401`).
- **One webhook URL per account.** The merchant account takes one URL. When
  several services carry the same entry (each has a checkout, subscription or
  marketplace block bound to it), only the webhook owner receives
  notifications: the entry's `webhookOwnerService` (a field of the ENTRY,
  beside `name` and `provider`; inside `configuration[]` it is not read and
  is reported as an unknown key), else the first carrier in project order. The
  owner verifies each event and relays the other services' events over the
  inter-service channel (`POST /v1/payments/webhook-relay/<providerName>`); a
  relay not from the owner's verified machine identity is refused `403
  WEBHOOK_RELAY_NOT_OWNER`. The owner relays BEFORE recording: when a carrier
  does not accept, it answers the provider `500` and records nothing, so the
  redelivery relays again (a carrier that already accepted answers
  `duplicate`; every carrier is tried on every attempt). An event whose carrier
  stays down past the provider's redelivery window (not documented, not
  measured) is lost; the returns and refreshes still settle payments the buyer
  comes back to. A subscription or invoice event that arrives before its row
  exists is relayed to no one. Design-time warnings:
  `PAYMENT_WEBHOOK_OWNER_UNDECLARED`, `PAYMENT_WEBHOOK_OWNER_NOT_A_CARRIER`.
  Watch `payment_webhook_relay_total{direction="sent",outcome="failed"}` and
  `PaymentWebhookRelayFailed`. A compiler that does not implement the relay
  must not let a shared entry span carriers it cannot relay to.
- A webhook URL that reaches a frontend instead of the service is answered
  `200` with HTML, so the provider believes it delivered: an unsigned `POST`
  to the right URL must answer `401 SIGNATURE_INVALID`.
- The subscription module publishes exactly two events,
  `subscription.order.success` and `subscription.order.failure` (`invoice.paid`
  / `invoice.payment_failed`; the dotted spelling is normalised). A failed
  renewal fires `afterInvoicePaymentFailed` (a NormalizedInvoice), never
  `afterSubscriptionPaymentFailed`. There is no cancel or expiry webhook:
  `EXPIRED` is a status read only by a refresh, so `subscription.expired`
  never arrives by webhook.

### Card payments: two shapes, both completed by the service

| | No saved card (hosted Checkout Form) | Saved card (`paymentMethodId`, 3-D Secure) |
|---|---|---|
| Start answer | `requires_redirect: true`, `redirectToUrl` = the payment page, `next_action.paymentPageUrl` | `requires_redirect: false`, `redirectToUrl: null`, `next_action.threeDSHtmlContent` (base64 HTML) |
| Frontend | navigate to `redirectToUrl` | decode and render the HTML (it auto-submits to the bank); never navigate to its form `action` |
| The provider POSTs to | `POST /v1/payments/checkout-return/<providerName>` | `POST /v1/payments/threeds-return/<providerName>` |
| The service then | reads the form detail by token, swaps the ticket to the numeric paymentId | calls `3dsecure/auth` (with the callback's `conversationData`) when the bank reports `mdStatus=1`; otherwise, or when the auth is refused, settles `failed` (a refused auth whose detail read fails stays `started`: money may have moved) |
| Lifecycle | `cf-return-<token>` event, dispatched before the redirect | `3ds-return-<paymentId>-success` / `-failed`, dispatched before the redirect |
| Buyer lands on | `303` to the start's `return_url` with `orderId` and `status` | the same |
| Provider unreachable on return | the buyer still gets the `303` with `status=started`, nothing written, `PaymentReturnUnsettled` error log; the webhook or a refresh settles (a re-posted form after settlement is found through `metadata.checkoutFormSwap`; a token no ticket resolves while the provider cannot be read is `404`) | the same: an unanswered `3dsecure/auth` is unknown, never `failed` (a detail read showing a capture settles `success`) |
| No `return_url` | a JSON confirmation | the same |

- A third shape, a saved card charged without 3-D Secure, exists only under
  `savedCardThreeDSMode` (below).
- No "complete" Business API is authored for either shape.
- Every callback URL (both returns, the subscription form return) is derived
  by the service from its own public URL (including the gateway prefix, else
  the bank's POST reaches the frontend); a caller cannot set them, and a
  service with no public URL configured refuses the start `400` before the
  provider is called. A start may omit `return_url`, but the buyer then ends on
  the JSON confirmation.
- The 3-D Secure return route is session-less. It accepts a callback only
  when the posted `paymentId` resolves a ticket of this service stamped with
  that provider AND the posted `conversationId` equals the attempt's key;
  anything else is `404` and nothing is called. The outcome never comes from
  the POST body: the `3dsecure/auth` answer or a server-side detail read
  settles. A ticket no longer `started` is a replay: nothing called or
  written, the same redirect. A miss answers `404` with one minimal HTML page
  (the caller is a browser), telling the buyer to return to the store. The
  routes are mounted only when an iyzico entry exists.
- **A buyer who never comes back** after paying on the hosted form is settled
  from `CHECKOUT_FORM_AUTH` exactly as the return would have (once; a later
  return redirects and runs nothing). Without the webhook such a payment is
  recorded only by a refresh. There is no scheduled sweep of `started` forms,
  except the one read of a retired form (below).

### The buyer cancels the 3-D Secure challenge

The cancel callback carries `status=failure`, `conversationId` and `mdStatus`
but NO `paymentId` (seen in production; the exact live field list is not
measured). The route:

- resolves the ticket by the `conversationId` alone, which must be the
  ticket's own attempt key on a ticket stamped with this provider and naming a
  3-D Secure payment; the orderId is read out of the key and the key compared
  in full, so a guessed value resolves nothing and learns no `returnUrl`; a
  ticket without an attempt key is never resolved this way (no match is the
  same HTML `404`);
- never calls `3dsecure/auth`, whatever the body claims;
- reads the payment detail and settles `failed` (`paymentStatus:
  THREEDS_NOT_AUTHENTICATED`, `afterPaymentFailed`) when the provider reads it
  failed, cancelled or still `INIT_THREEDS`; the buyer gets `status=failed`
  and can pay again at once;
- writes nothing when the detail cannot be read, reads `SUCCESS` or a review
  hold, or records an authenticated bank answer (`CALLBACK_THREEDS` with
  `mdStatus` 1): the buyer gets `status=started` (WARN
  `PaymentThreeDsCancelLeftOpen`).

A 3-D Secure payment at `INIT_THREEDS` or `CALLBACK_THREEDS` whose `mdStatus`
is anything but `1` can never be authorised, so every payment read (refresh,
start, return, Checkout Form detail) reads it `failed`
(`THREEDS_NOT_AUTHENTICATED`). `INIT_THREEDS` with no `mdStatus` stays
`started`. A form with no `paymentStatus` (the provider refuses the detail of
a form nobody paid on) stays open. Whether the same form token can be paid
again after a refused 3-D Secure step is not measured.

### Fraud check (`fraudStatus`)

The provider reports `fraudStatus` on every payment answer: `1` approved, `0`
held for manual review, `-1` rejected. A payment under review can read
`paymentStatus: SUCCESS`, so `paymentStatus` alone never settles; `1` or no
`fraudStatus` keeps the mapping by `paymentStatus` (an answer without the
field reads approved; measure before production).

| Read | `fraudStatus: 0` | `fraudStatus: -1` |
|---|---|---|
| `/payment/auth` (saved card without 3-D Secure) | start answers `started`, no `next_action` | refused `422`, `providerErrorCode: FRAUD_REJECTED`, no ticket |
| `/payment/3dsecure/auth` (3-D Secure return) | ticket stays `started` | the refusal, then the detail read settles `failed` |
| `/payment/detail` (refresh, later start, webhook re-read) | `started` | `failed` |
| hosted form detail (return, form webhook) | `started` | `failed` |

The family fraud-review hold applies. In addition: the 3-D Secure return writes
only `paymentStatus: FRAUD_REVIEW`, dispatches nothing and answers `303` with
`status=started`; an `API_AUTH` / `THREE_DS_AUTH` notification reports
`SUCCESS` without the verdict or an amount, so the capture gate's read-back
refuses it (`PaymentCaptureNotConfirmed`); a later start answers `409
PAYMENT_START_INTENT_PENDING`. A review is resolved by a refresh after the
provider ended it: the review sweeper, the buyer's own refresh
(`PATCH /v1/<order>paymentstatusrefresh/:orderId`: login and the order's owner
column, another buyer's order is `404`, only a `started` payment is read,
rate-limited per order 6 a minute with a burst of 3 and per buyer 30 a minute,
`429 TOO_MANY_REQUESTS` with `retryAfterSeconds`; it answers the status
fields plus `refreshed`, never the provider's answer), or an operator's
refresh. Approval records `sync-<orderId>-<paymentId>-success` and runs the
capture lifecycle once; a notification refused during the review cannot
swallow it. Which notification the provider sends when a review ends is not
documented: do not rely on a webhook for it.

### Saved cards

- The provider has no browser tokenizer. A card is saved through
  `POST /v1/payment-methods/add` with `cardInfo` (`cardNumber`,
  `expireMonth`, `expireYear`, `cardHolderName`; a top-level `cardHolderName`
  is read only when `cardInfo` carries none). The provider's card storage
  takes no CVC; only the answered token and display descriptors are
  persisted, never the number. The card storage does not check expiry (it
  stores an `11/2020` card), which is why the add route's expiry rule exists.
- All of a buyer's cards are filed under ONE `cardUserKey`, minted by the
  provider on the buyer's first save and stored on the buyer's payment-customer
  mapping (`cardStorageKey`) only by the service's machine-only write, set
  once; the buyer's own payment-customer routes do not accept it. The first
  save sends the session email (never one from the body); none is `400
  PAYMENT_BUYER_EMAIL_REQUIRED`. Later saves send the stored key; a
  `paymentMethodId` under another key is `400 PAYMENT_METHOD_KEY_MISMATCH`.
  Two first saves at the same moment keep one key: the other re-files its card
  under it and deletes its own; a token attach that loses the race answers
  `409 PAYMENT_METHOD_SAVE_RACED`.
- The stored id is `<cardUserKey>:<cardToken>`, one opaque string. Use is
  decided from the buyer's stored key, never from the id: the row's customer
  must be the caller's mapping, the id's `cardUserKey` must EQUAL the stored
  key, and the card must be listed at the provider under that key (`403
  PAYMENT_METHOD_NOT_OWNED` on a start, `404` on delete / default). A card in
  the older bare-token format is refused on a start `400
  PAYMENT_METHOD_ID_INVALID` (save again); deleting it removes the row without
  a provider call. Stored descriptors: `brand`, `last4`, `bin`, `type`,
  `issuer`, `label`.

Card refusal codes (an HTTP 200 `status: "failure"` answer is `422`; a
provider `4xx` keeps its status; both `PAYMENT_PROVIDER_REQUEST_REJECTED`;
`providerErrorCode` is the provider's `errorCode`, never its `errorMessage`,
which can quote card or buyer fragments):

| `errorCode` | `reason` |
|---|---|
| `12`, `10215`; `1401` (card storage, measured live) | `card_number_invalid` |
| `13`, `14`, `10229` | `card_expiry_invalid` |
| `10054` | `card_expired` |
| `15`, `10084` | `card_cvc_invalid` |
| `16`, `19` | `card_holder_name_invalid` |
| `10233`, `10221`, `10235`, `10213` | `card_not_supported` |

Any other code (a decline such as `10051`) has no `reason`. Other measured
codes: `5077` (sub-merchant key mandatory on a marketplace account), `5068`
(settlement refused for a sub-merchant with no IBAN), `5087` (no such payment,
on a detail read), `2005` (an IBAN refusal on a sub-merchant update),
`1000` to `1009` (authentication).

### Charging a saved card without 3-D Secure (`savedCardThreeDSMode`)

By default every saved-card start goes through 3-D Secure. Only an account
the provider allows to take non-3DS charges may use a model:

- **`verifyOnce`.** The first charge on a newly saved card goes through 3-D
  Secure (`IyzicoThreeDSVerificationCharge`); later charges on a verified card
  skip it with NO amount limit. A card is marked verified (family rule) only
  when the 3-D Secure return's OWN `3dsecure/auth` (bank `mdStatus` 1, inside
  the auth cutoff) answered the capture and the ticket reads `success` past
  the capture amount gate. Never marked: a success proved only by a detail read
  after a lost auth answer, by a callback with no auth of its own, by the
  webhook, a refresh or the backstop; a declined, fraud-held or rejected
  payment; `amount_mismatch`, `captured_after_cancel`; a card saved by a
  synchronous non-3DS payment; a card that was not filed. The row that counts
  is the one the start's ownership proof proved. A card saved before the mark
  existed stays unverified until a charge on it passes 3-D Secure at the
  return.
- **`threshold`.** A saved-card charge below `savedCardThreeDSThreshold`
  skips 3-D Secure; at or above it goes through (`IyzicoNonThreeDSCapExceeded`).
  `0` means always.
- **Fail closed.** Any other mode, or a threshold mode without a readable
  threshold, is always 3-D Secure (`IyzicoThreeDSConfigInvalid`). An `auto`
  fallback on a "3-D Secure required" refusal is not implemented (the
  provider has not named that code).
- **Retired keys.** `threeDSMode` and `nonThreeDSMaxAmount` are no longer
  read; an entry with `threeDSMode: never` charges every saved card through
  3-D Secure until `savedCardThreeDSMode` is set. Design-time warning
  `PAYMENT_PROVIDER_THREE_DS_KEYS_RETIRED` (note: a charge AT the threshold now
  goes through 3-D Secure; the old cap itself was charged without it).
- A non-3DS start calls `/payment/auth` with the stored `cardUserKey` +
  `cardToken`, the same buyer, address and basket blocks, no `callbackUrl`,
  and is synchronous: `success` settles at once (capture amount gate
  applies, `statusLiteral: "success"`, no `next_action`); `failure` is `422`
  with the provider's code, no ticket, no event, the order startable again;
  `fraudStatus -1` the same with `FRAUD_REJECTED`; `fraudStatus 0` not
  settled (`started`, `FRAUD_REVIEW`).
- **Who decides.** Only server configuration and, for `verifyOnce`, the
  proven row's machine-written mark, passed on typed fields a request cannot
  reach. `providerOptions` `threeDSMode`, `threeDS`, `forceThreeDS`,
  `cardUserKey`, `cardToken`, `paymentCard` are refused `400
  PAYMENT_PROVIDER_OPTION_NOT_ALLOWED`.
- **Which starts may skip.** Only starts that prove ownership of the saved
  card first: the start route (marketplace orders included) and a
  `PaymentAction` start / simple on a checkout order object (also when the
  action names the iyzico entry on an order bound to another brand). A
  `PaymentAction` with no checkout order behind it keeps 3-D Secure.
- **A lost answer is never charged twice.** The provider does not deduplicate
  on `conversationId`. The start that takes a stale claim over first reads the
  detail by `paymentConversationId`: `SUCCESS` is adopted
  (`IyzicoNonThreeDSRetakeAdopted`), nothing posted; `errorCode 5087` (no such
  payment, whatever the locale's sentence) or an earlier decline lets the new
  charge go; anything else is `502 PAYMENT_START_OUTCOME_UNKNOWN`
  (`IyzicoNonThreeDSRetakeUnresolved`). Each call is aborted at its budget, so
  a charge cannot still be in flight when a later start takes its claim.
- Every non-3DS charge logs `IyzicoNonThreeDSCharge` (provider, `orderId`,
  amount, currency, `initiatedBy`; never card data).
- **Merchant-initiated charges** (`initiatedBy: "merchant"`, no shopper)
  complete without the shopper when the model skips 3-D Secure for them, and
  are otherwise NEVER sent to 3-D Secure: settled `failed` with
  `RECHARGE_REQUIRES_3DS_VERIFIED_CARD`, nothing posted
  (`IyzicoMerchantInitiatedChargeNeedsThreeDS`).
- **Liability.** Without 3-D Secure a fraudulent charge is the merchant's
  chargeback, and anything that can start a payment (a session, a stolen
  session, an assistant's tool call) charges the card without the cardholder
  confirming. The validator warns on every `verifyOnce` entry, every threshold
  above 0 and every `never` entry (`PAYMENT_PROVIDER_THREE_DS_DISABLED`).
- A compiler that does not implement the models keeps 3-D Secure.

### New cards on the hosted form (`newCardThreeDSThreshold`)

The card never reaches the service on the hosted form, so the service cannot
skip 3-D Secure per payment; it can only force it. At or above the threshold
the form is opened with `forceThreeDS: 1` (`IyzicoNewCardThreeDSForced`; the
field is in the provider's SDK request models but not its public reference,
so its effect must be measured before production). Below it, or unset, nothing
is sent and the form follows the account's own setting: "no 3-D Secure below
the threshold" cannot be promised for a new card. A caller can never send
`forceThreeDS`. For per-payment control, save the card first and charge it
under `savedCardThreeDSMode`.

### A card entered on the app's own frontend (`directCardEntry`)

- Off by default. With it on, the app's frontend takes the card, the start
  sends it to the service and the service sends it to the provider. The card
  passes through the frontend and the service in transit, so the PCI DSS scope
  grows from the hosted-page scope to that of a merchant handling card data.
- The start carries `paymentUserParams.cardInfo` (closed schema: exactly
  `cardHolderName`, `cardNumber`, `expireMonth`, `expireYear` (2 or 4
  digits), `cvc`; strings, month and year may be integers) and optionally
  `paymentUserParams.saveCard`. Without `cardInfo` the start is the hosted
  form, the same request bytes as before. A `PaymentAction` start takes them
  as declared request parameters (`cardInfo` Object and `saveCard` Boolean at
  the root of the parameter blob, or one `paymentUserParams` Object); declare
  one shape, not both (a declared flat `saveCard` that binds `false` hides a
  nested `true`). Undeclared parameters are silently dropped and the buyer is
  sent to the hosted form; guard on the API that a call carrying a card also
  carries `return_url`. The thin action shims refuse a card.
- Refusals, before any provider call: `cardInfo` with a saved
  `paymentMethodId` is `400 PAYMENT_CARD_WITH_SAVED_METHOD`; a card at the
  body root is `400 PAYMENT_CARD_INVALID`; a save asked in another shape is
  refused, never dropped (`saveCard: true` at the body root; a save flag under
  another name beside `cardInfo`: `storeCard`, `registerCard`, `save_card`,
  `rememberCard`, `keepCard`, `savePaymentMethod`, `storePaymentMethod`, any
  casing or separator; `saveCard: true` with no `cardInfo`), each `400
  PAYMENT_CARD_INVALID`. `saveCard: false` or `null` equals leaving it out; a
  misnamed flag without `cardInfo` is not read; `storeMethod` is a different
  field. The card is validated first (12 to 19 digits passing Luhn, an expiry
  that has not ended, a 3- or 4-digit `cvc`, a holder name); every refusal is
  a typed `400` naming the field, never its value.
  `PAYMENT_DIRECT_CARD_NOT_ENABLED` wins over all of these on an entry that
  takes no card.
- 3-D Secure is fail closed: at or above `newCardThreeDSThreshold`, OR with no
  threshold set, the start is a 3-D Secure initialize with the card (the same
  step as a saved card); only below a set threshold is it a synchronous
  `/payment/auth` (`success` at once, or a decline `422` with the provider's
  code and mapped `reason`), which needs the account's non-3DS permission and
  loses the liability shift. (On the hosted form an unset threshold means
  "never forced"; for a direct card it means "always".)
- **Saving.** `saveCard: true` sends `registerCard: 1` and the buyer's own
  `cardUserKey` when they have one (read from their mapping, never the
  request); a buyer with none needs an email (session or
  `metadata.buyer.email`) or `400 PAYMENT_BUYER_EMAIL_REQUIRED`. Without an
  identity owner (wallet) `saveCard: true` is `400
  PAYMENT_CARD_SAVE_NOT_SUPPORTED`. Once the payment settles `success` the
  registered `<cardUserKey>:<cardToken>` is filed in the ticket owner's
  wallet: a synchronous payment files in the start, a 3-D Secure payment at
  the return from the `3dsecure/auth` answer, once; a declined, refused,
  cancelled or reviewed payment saves nothing. Under `verifyOnce` a card saved
  by a 3-D Secure payment is marked verified right after it is filed (its first
  saved-card charge skips 3-D Secure); one saved by a synchronous payment is
  not. Logs: `IyzicoDirectCardPayment` (with `saveCard`), `DirectCardSaveFiled`,
  `DirectCardSaveRefused`, `DirectCardSaveRaced`, `DirectCardSaveNotKept`.
- **What never holds the card.** Number, expiry, code and holder name ride the
  one provider request only: never the ticket or metadata (the method is
  recorded as `startMethodRef: "new-card"`), the resume step, an event row, a
  log line, an error message or `actionFailures` (a refusal quoting the card is
  scrubbed), the idempotency key, a retake (which never re-sends a card it did
  not receive in that request), the start answer, a lifecycle event or the
  mock's state (BIN and last four only). The start route logs no body; a
  Business API's request log redacts every card field of a `cardInfo` that
  carries a number or a code.
- A start with a new card never resumes an open step. Velocity limits against
  card testing are not part of this feature.
- Not measured: where the provider answers the registered pair (modelled: the
  `/payment/auth` and `3dsecure/auth` answers, never the initialize answer);
  whether a card is registered on a payment held for review; whether a detail
  read carries the pair (a return whose auth answer was lost settles from the
  detail and files no card).

### Saving the card on the hosted form

Under a stored-method opt-in (with an identity owner) the form is opened with
the buyer's own `cardUserKey` from their mapping (none for a buyer without
one; `cardUserKey` / `cardToken` in `providerOptions` stay refused), so the
form lists saved cards and offers to save. When the paid form's detail names
the saved card, whichever of the return or the form webhook settles files it,
once, in the ticket owner's wallet: a card filed under another key than the
one the form was opened with is refused (`CardSavedWhilePayingRefused`); a
key minted by this save is stored on the mapping once, and if another save
stored a key first the minted card is deleted at the provider and nothing is
filed (`CardSavedWhilePayingRaced`); a card id already in another wallet is
refused and never moved. Without the opt-in, a card saved on the form stays
only in the buyer's provider wallet.

### Resuming and abandoned steps

- The provider's status reads return no buyer step, so the ticket keeps it
  (`metadata.resumeAction`) and a resumed start (`pendingIntentReused: true`)
  hands it back in `next_action` with `next_action.actionExpiresAt`: the hosted
  form's `paymentPageUrl` until the token's expiry (30 minutes), the 3-D Secure
  HTML for a default of 10 minutes. A 3-D Secure form larger than 32768
  characters is not kept (`PaymentResumeActionNotKept`).
- When the provider cannot be read (`PaymentStartPendingIntentUnreadable`), the
  same start (order, amount, currency, method) still resumes from the kept
  step while unexpired (`PaymentStartResumedFromRecordedStep`): one form token
  or one 3-D Secure payment captures at most once. A changed figure or an
  expired step answers `409 PAYMENT_START_INTENT_PENDING` until the provider can
  be read.
- A start with another method becomes a NEW attempt only when the open payment
  provably cannot capture, or is an untouched hosted form (retired); otherwise
  `409 PAYMENT_START_INTENT_PENDING` with `stepKind`, `actionExpiresAt` and
  `retryAfter`. A hosted form is provably dead once its token expired (plus 60
  s) and the form detail still reads `INIT_CHECKOUT_FORM`; the provider's
  "No payment details found" refusal on an untouched form is read as exactly
  that open form, never as an unreadable payment. A form whose detail reads
  `INIT_THREEDS` / `CALLBACK_THREEDS` has a payment under way and is never
  replaced or retired. A 3-D Secure payment at `INIT_THREEDS` is provably dead
  (it captures only through the service's own `3dsecure/auth`, never sent for a
  replaced payment); a failed one never blocks.
- **Past the bank's callback** (`CALLBACK_THREEDS`): the kept HTML carries a
  one-time bank session and is never handed back. Until the step is stale (its
  kept expiry plus 3 minutes, three times the 60-second call bound; for an
  older ticket its creation time plus the TTL) the start answers `409` with
  `stepKind: threeds` and `retryAfter`. After it the start settles `failed`
  (`THREEDS_STEP_ABANDONED`, `afterPaymentFailed` once) and opens a new
  attempt; the start never calls `3dsecure/auth`, and the return stops calling
  it two call budgets (2 minutes) before the stale instant, so a later bank
  callback is never authorised: its detail decides (captured: recorded; else
  `failed`, buyer redirected `status=failed`).
- A 3-D Secure payment the provider reads `SUCCESS` (an auth whose answer was
  lost) is recorded through the amount gate and the start answers `400
  PAYMENT_ALREADY_COMPLETED`; an `amount_mismatch` answers `400` too (an
  operator decides). A payment read failed or cancelled is settled so and a new
  attempt opens. An untouched hosted form plus another method retires the form
  (ticket `canceled`, `CHECKOUT_FORM_RETIRED`) and charges the new method.
- Every settle, and every other writer (both returns, the form webhook, the
  complete, the refresh), is a compare-and-set on the payment the ticket names
  AND the status read (a new attempt's claim is `started` too). Every new
  attempt gets a new key and `conversationId`. A step is only ever read from
  the order's own ticket after the ownership proof. A changed amount, or a
  resume after the kept step expired, also becomes a new attempt
  (`PaymentStartAttemptSuperseded`).

### Late captures on a payment the order left behind

- The ticket records the payments a start left behind
  (`metadata.retiredAttempts`: payment id, form token, step kind, settled
  status; the newest five; kept across restarts; a declined takeover of a
  crashed start leaves a `canceled` tombstone `start-released:<ms>:<attempt>`
  instead of deleting). A capture of such a payment (an old hosted-page tab, a
  long-lost auth) is found through that record (by the order the payment names
  and the recorded token or paymentId; an order id alone resolves nothing) and
  recorded once, with no capture lifecycle and no refund:
  - the new attempt is still being charged (the claim is held): listed under
    `metadata.retiredAttemptCaptures` with `orderNotYetPaid: true`, the claim's
    `paymentStatus` reading `start_claimed_late_capture` (`:2`, `:3` for
    further listings). If the new attempt captures, the order is paid twice
    (`orderPaidTwice: true`; refund the listed one); if it may still capture
    (review, bank fraud check, `CALLBACK_PECCO`, an unmapped status) it is
    recorded as usual with the list kept, and whichever writer settles it
    applies the same rule (approved: paid twice; rejected or failed:
    `captured_after_cancel`, with no `afterPaymentFailed`); if it cannot
    capture (refused, or a step only this service completes) the ticket moves
    to `captured_after_cancel`, `metadata.capturedAfterCancel` records the
    late payment (`newAttemptPaymentId`, `newAttemptStatus`), the new attempt is
    retired and its step dropped (the start answers `statusLiteral:
    captured_after_cancel`, a further start `400`); a charge refused before it
    was recorded also ends in `captured_after_cancel`, never deleted;
  - the new attempt is recorded and may still capture: listed beside it, the
    ticket not moved;
  - not captured otherwise: the ticket moves to `captured_after_cancel`
    (`otherPayment: true`, `retiredAttempt: true`); a still-open new attempt
    cannot complete over it;
  - the order already captured: it stays `success` and lists the capture.
- Each listing names `orderId`, `paymentId`, `amount`, `currency`,
  `capturedAt`; nothing is cancelled at the provider. One
  `PaymentCapturedAfterCancel` ERROR line asks an operator to refund at the
  provider or fulfil. Every writer of a listing compare-and-sets (on the
  `paymentStatus` it read, or on `updatedAt` where no status moves), so
  concurrent arrivals record each capture once with one ERROR line and no
  entry is lost.
- **`afterPaymentCapturedAfterCancel`** runs once per recorded capture, on
  every path, including a capture of the payment a `canceled` ticket records.
  `resource.metadata.lateCapture.case` is `capturedAfterCancel`, `paidTwice`
  or `pending`; a `pending` listing gets ONE follow-up when its attempt is
  decided (`resolves: 'pending'` with the decided case); a listing never
  decided gets none. A hook reads `resource.metadata.lateCapture`, never the
  ticket's field names; guard missing levels with `?.` and narrow values
  before use.
- **The retired-form backstop.** The provider cannot invalidate a form token,
  so the review sweeper's tick makes ONE detail read of each retired form, 5
  minutes after its expiry plus the 1-minute grace (the token's expiry, else 30
  minutes after retirement), kept as `formCheck` and
  `metadata.retiredFormCheck.dueAt`: paid is recorded through the checkout
  return's seam; untouched or failed is marked (`untouched` / `refused`) and
  never read again; a failed read or a payment still under way is retried
  after 5 minutes doubling, at most 5 reads, then `PaymentRetiredFormCheckGaveUp`
  (`gave-up`). The read uses the entry the attempt was started with
  (`formCheck.readWith`); an unregistered entry is a failed read; a due ticket
  naming no order is closed (`PaymentRetiredFormCheckUnprocessable`). A retired
  3-D Secure step needs no backstop. The backstop never cancels or refunds.
- Operator view: event rows carry a `source` (`vendor` for provider webhooks,
  `return` for the browser returns, `start` and `sync` for the service's own
  writes, `backstop` for the retired-form check).

### Marketplace (sub-merchants)

- **`marketplaceActive: true`** declares a marketplace-activated account. Such
  an account refuses a `PRODUCT` item with no `subMerchantKey` (`5077`,
  measured) on every endpoint (hosted form, 3-D Secure initialize, `/payment/auth`;
  saved card, direct card, recharge alike). With the key on, every basket is
  routed from the persisted order row and `paymentGroup` is the service's (a
  caller's `providerOptions.paymentGroup` is accepted and overwritten; a
  caller `subMerchantKey` / `subMerchantPrice` is refused
  `400 PAYMENT_ROUTING_FIELD_FORBIDDEN`; an internal contradiction is `400
  IYZICO_MARKETPLACE_ROUTING_CONFLICT`). Without the key every request is as
  on a plain account.

  | The order row | Routing | Sent |
  |---|---|---|
  | names a seller | split | `paymentGroup: PRODUCT`, the seller's `subMerchantKey` and share as `subMerchantPrice` on every item |
  | no seller, `ownSaleStrategy: listing` (default) | own | `paymentGroup: LISTING`, no key on any item (a key on a LISTING payment is refused) |
  | no seller, `ownSaleStrategy: ownSubMerchant` | own | `paymentGroup: PRODUCT`, `ownSubMerchantKey` on every item, `subMerchantPrice` = item price |

- LISTING is verified on the sandbox (non-3DS `/payment/auth`, one VIRTUAL
  item): the detail reports the item `transactionStatus: 2`, `subMerchantKey:
  null`, `subMerchantPrice: 0`, `subMerchantPayoutAmount: 0`, the whole payout
  to the merchant; it needs no approval. The same through 3-D Secure or the
  hosted form is not measured.
- After a capture the service approves own-sale items
  (`/payment/iyzipos/item/approve`) ONLY when the provider reports them awaiting
  approval (`transactionStatus: 1`), so in practice only `ownSubMerchant`
  items; idempotent, never failing the capture (`IyzicoOwnSaleApprovalFailed`,
  retried on the next read; `IyzicoOwnSaleItemApproved`). A retake that adopts
  a lost charge does not approve; the next detail read does. Two concurrent
  reads may both approve; the second is refused and ignored. Switching to
  `listing` AND removing `ownSubMerchantKey` makes old own items look like
  seller items: keep the key while old sales can be read. An own sale books no
  seller payout, release row or earnings.
- Refusals: an own sale under `ownSubMerchant` without a key, or an invalid
  strategy, is `400 IYZICO_OWN_SALE_NOT_CONFIGURED`. Design time:
  `PAYMENT_PROVIDER_OWN_SUB_MERCHANT_KEY_MISSING` (ERROR),
  `PAYMENT_PROVIDER_OWN_SALE_STRATEGY_INVALID` (ERROR),
  `PAYMENT_PROVIDER_OWN_SALE_KEYS_INERT` (WARNING, without
  `marketplaceActive`).
- **Subscriptions and sub-merchants cannot share an account**: plan
  provisioning and the subscription form fail there ("Sistem hatasi"). A
  hosted-mode subscription bound to a marketplace entry (`marketplaceActive`,
  or a marketplace opt-in on the same entry) is an ERROR reported twice,
  `PAYMENT_PROVIDER_MARKETPLACE_SUBSCRIPTION_INTERLOCK` (entry) and
  `IYZICO_SUBSCRIPTION_MARKETPLACE_INTERLOCK` (subscription, naming
  `subscriptionMode: "tokenized"`). Use a separate entry for a plain account,
  or tokenized mode. Two entries pointing at one account cannot be told apart
  at design time.
- **Sub-merchant onboarding.** `subMerchantExternalId =
  <subMerchantPrefix><connected account id>` (the provider has no prefix
  concept; changing the prefix does not migrate). A provisioning attempt under
  a known external id returns the existing sub-merchant; a hand-onboarding
  create gets the provider's duplicate refusal; a hand-supplied external id
  containing `:` is `400 CONNECTED_ACCOUNT_EXTERNAL_ID_RESERVED`. An unknown
  `subMerchantType` is `400 CONNECTED_ACCOUNT_SELLER_TYPE_INVALID`; a missing
  mandatory field `400 CONNECTED_ACCOUNT_FIELDS_REQUIRED` (both local). On a
  plain account the provider refuses ("only available for marketplace"): `409
  PROVIDER_MARKETPLACE_NOT_ACTIVATED`, keeping that first refusal even when a
  retry fails with a generic error (the record is per replica memory; a restart
  forgets it). A sub-merchant without an IBAN is accepted but cannot be settled
  to (`5068`).
- **Updating a sub-merchant** is `PUT /onboarding/submerchant` with the
  `subMerchantKey` in the body, signed over that path (the earlier
  `/onboarding/submerchant/update` POST is not served). An update is a full
  statement (`iban`, `email`, `gsmNumber`, `address` and the type's identity
  fields every time): a sparse patch is completed from the provider's detail
  read (by the stored external id), the patch's fields winning. The read
  returns no `contactName`, `contactSurname` or `taxNumber`, so a PERSONAL
  update carries the contact name, a LIMITED_OR_JOINT_STOCK_COMPANY update the
  tax number. `subMerchantType` is never sent and cannot change (another type
  is a typed `400`). A provider refusal is a typed `422` naming the field and
  listing the type's missing fields; an authentication code (1000 to 1009) or
  HTTP 401 stays a `502` provider authentication failure.
- **Sub-merchant state.** No usable change notification exists; the onboarding
  progress read re-reads the sub-merchant and maps its state fail safe:
  `ACTIVE` -> `verified`, payouts and charges on; `PASSIVE`, `INACTIVE`,
  `SUSPENDED`, `BLOCKED`, `RESTRICTED`, `DEACTIVATED`, `REJECTED`, `CLOSED`,
  `DELETED` and any unknown value -> `restricted`, off; `PENDING`,
  `WAITING_FOR_APPROVAL`, `UNDER_REVIEW`, `IN_REVIEW`, `CREATED` -> `pending`,
  off; no state -> unchanged. Charges are reported as
  `metadata.chargesEnabled` (no column). The state field name is not measured
  (read as `subMerchantStatus`); a live read most likely carries none, so use
  the platform suspension to stop a seller. `payoutEnabled` and KYC are not
  read for holds on this brand.
- **Releasing the seller's share (`settlementRelease`).** There is no
  standalone payout: a seller's split share is released by approving the
  charge's split items (keyed by `paymentTransactionId`). With
  `settlementRelease` (`mode`: `onDate` + `releaseAtProperty`, `onStatus` +
  `statusProperty` + `releaseOnStatus` (exact, case-sensitive), `manual`,
  `onCapture`) the capture books ONE `sys_<X>Payout` row per sale, `held`
  (`metadata.payoutGate.holdReason: awaiting_release_date` for `onDate`),
  with the split items' ids (`metadata.providerItemIds`, from the capture's
  item transactions, else resolved from the detail at release) and the sale id
  at `metadata.orderId` and `metadata.settlementRelease.orderId` (both strings,
  never sent to the provider). The payout scheduler approves the stored items
  exactly once when the condition holds (`manual`: a payout created for the
  sale with `metadata.orderId`).
  - Before every release, and on every tick even under another hold, the sale
    is re-checked from the service's own records: fully refunded, canceled or
    a lost dispute cancels the row (`failed`, `canceledReason`
    `sale_refunded` / `sale_canceled` / `dispute_lost`,
    `failureReason: SETTLEMENT_RELEASE_CANCELED`, `afterPayoutFailed`); an
    open dispute holds it (`dispute_open`); a pending refund holds it
    (`sale_refund_pending`, not liftable by an operator); a partial refund
    holds it (`sale_partially_refunded`) until an operator creates a payout
    for the sale, provided a positive succeeded refund amount is recorded (with
    no authoritative amount it stays `sale_refund_amount_unknown`). The
    released row books the remaining share, `share - share x refunded / sale
    amount` (a 200 share of a 250 sale with 50 refunded books 160;
    `originalAmount` and `refundedAmount` recorded; without a sale amount the
    whole refund is deducted), recomputed under the scheduler's claim. What the
    provider's approval pays for a partially refunded item is not measured:
    reconcile with its settlement report.
  - An operator payout naming the sale moves the row to `scheduled`; the next
    scheduler pass (default every 60 seconds) sends it. The caller's amount is
    neither used nor compared; the row's amount is sent. A suspended seller
    holds the row (`seller_suspended`). A refund made after the release was
    sent does not touch the row (it stays `in_transit`): recover at the
    provider.
  - A payout naming an item of a booked, unsent release row directly is `409
    SETTLEMENT_RELEASE_ITEM_HELD`; a `manual` payout naming a sale with no
    booked row is `409 SETTLEMENT_RELEASE_NOT_BOOKED`.
  - Design time: `SETTLEMENT_RELEASE_PROVIDER_DRIVEN_CADENCE` (the brand's
    default `payoutCadence` is `provider_driven`, which books nothing; set
    `on_demand` or `scheduled`), `SETTLEMENT_RELEASE_PLATFORM_SETTLED`,
    `SETTLEMENT_RELEASE_DATE_PROPERTY_REQUIRED`,
    `SETTLEMENT_RELEASE_STATUS_REQUIRED`,
    `SETTLEMENT_RELEASE_WITHOUT_SELLER_BINDING`,
    `SETTLEMENT_RELEASE_WITHOUT_CHECKOUT`, and
    `SETTLEMENT_RELEASE_LANGUAGE_UNSUPPORTED` from a compiler that does not
    implement it. Do not run an older "cron creates a payout per ended sale"
    workaround beside a release.
- **Ordinary payouts** name what they approve in metadata
  (`paymentTransactionIds`, `paymentTransactionId`, or `transferGroup` read as
  one, or `paymentId`), kept when the payout is booked for later and sent at
  release; naming nothing is a typed `422` and the row ends `failed`. Named
  transactions need `metadata.paymentId`: the adapter reads that payment and
  approves only when every id is its item paid to the payout's destination
  (`422 PAYOUT_TRANSACTION_NOT_DESTINATION`; `422
  PAYOUT_TRANSACTION_UNVERIFIED` without `paymentId`, no call at all).
  `paymentId` / `orderId` must be a string or number (a numeric paymentId is
  read as its digits); an array or object is refused `422`
  (`PAYOUT_SALE_ID_INVALID` at booking, `PAYOUT_PAYMENT_ID_INVALID` at the
  adapter). The keys `settlementRelease`, `providerItemIds`, `payoutGate` and
  `idempotencyKey` are the service's own and are dropped from caller metadata.
  If one approval succeeds and a later item fails, the payout reports
  `PAYOUT_PARTIALLY_APPROVED`, stays `outcome_unknown`, is never resent
  automatically, and keeps `metadata.partialPayout.approvedTransactionIds` and
  `requestedTransactionIds` (complete lists, beyond the 255-character
  `failureReason`) for reconciliation.

### Subscriptions in hosted mode (default)

- There is no server-side card path (the direct subscription call takes a card
  number, which the service never holds): every subscribe (raw route or
  `SubscriptionAction` stage `subscribe`) opens the hosted subscription
  Checkout Form.
- An email is required (the subscription customer is keyed on it): from
  `metadata.buyer`, else the session (`email`, `name`, `surname`; a `buyer`
  key in the body is ignored); none is `400 SUBSCRIPTION_BUYER_EMAIL_REQUIRED`.
  Other buyer and address fields fall back to placeholders; send real values.
  `gsmNumber` is sent only when given; `shippingAddress` defaults to
  `billingAddress`. `returnUrl` (raw route only) is stored on the row, never
  sent. The form's callback is the service's own subscription return route; a
  body `checkoutCallbackUrl` is overwritten; with no public URL configured the
  subscribe is `400 SUBSCRIPTION_CHECKOUT_CALLBACK_MISSING`.
- The subscribe answers a subscription that is NOT live:
  `providerSubscriptionId: "pending:checkout:<token>"`, `statusLiteral:
  "pending_provider"`, plus `checkoutForm` (`token`, `checkoutFormContent`,
  `paymentPageUrl`, `tokenExpireTime`). It grants nothing: no
  `subscription.created`, no `afterSubscriptionCreated`. A Business API that
  runs the action must return `checkoutForm`.
- The return reads the form result by token, never from the POST body:
  `ACTIVE` -> the provider's reference, `active`, one `subscription.created`
  (`cf-return-subscription-<token>`), `afterSubscriptionCreated` once; another
  status (`UNPAID`, `PENDING`) -> mapped status, no lifecycle; `failure` ->
  `provider_failed` with `failureReason`; no answer -> unchanged, 5xx, a later
  POST settles. Then `303` to `returnUrl` with `subscriptionId` and `status`,
  or a JSON `{ ok, orderId, subscriptionId, providerSubscriptionId,
  statusLiteral }`. A repeated POST writes nothing and never moves the row
  back; an unknown token or another provider's route is `404`.
- A form nobody finishes stays `pending_provider` and the recharge scheduler
  ignores it. A cancel first reads the form: a subscription it produced is
  canceled at the provider under its real reference; none produced closes the
  row locally (`canceled`, `cancelAtPeriodEnd: false`, `?when=` ignored, the
  sentinel kept); a failed read or cancel answers an error and the row stays
  pending. Contention ends in `409 SUBSCRIPTION_IN_PROGRESS` when it cannot be
  decided. A `canceled` row stays canceled if the buyer finishes the form
  later (status `canceled`, `SubscriptionCheckoutConfirmedAfterCancel` names
  the provider subscription an operator must cancel).
- While a row is pending, another subscribe by the same owner for the same
  plan is `409 SUBSCRIPTION_IN_PROGRESS` naming the earlier ids. A pending
  sweep settles a form the buyer finished without the return.
- On a hosted subscription every cancel is immediate (no period-end cancel at
  the provider), so `nonOperatorImmediateCancel: false` cannot hold a buyer to
  period end: keep the buyer off the route with `cancelRoles`.
- **Built-in reconcile.** Because no cancel or expiry webhook exists, the
  recharge worker reads open rows (`trialing`, `active`, `past_due`, never a
  `pending:` sentinel) back once `currentPeriodEnd` has passed, otherwise at
  most once per hour per process (a row first seen waits one interval; `0`
  disables). A changed status is recorded as the event a webhook would carry
  (`subscription.canceled`, `.expired`, `.past_due`, `.paused`, `.renewed`),
  once per observed status, and dispatched like a webhook; a failed read is
  one `SubscriptionReconcileFailed` WARN. `POST
  /v1/<object>subscription/:subscriptionId/refresh` (a payment operator or a
  service caller) does it at once and answers `{ outcome: "changed" |
  "unchanged", providerStatus, eventType, subscription }`; `404` unknown, `409
  SUBSCRIPTION_NOT_REFRESHABLE` for a row naming nothing confirmed.
- A hosted renewal's `invoice.paid` issues ONE invoice per provider order when
  the subscription object is its own invoicing object with `issuePolicy:
  "onPaymentCaptured"` (the order reference is the key; redelivery issues
  nothing twice). An invoicing object sourced from another subscription object
  uses `issuePolicy: "onSubscriptionInvoicePaid"` with `sourceObjectName`;
  each provider invoice is claimed once. Merchant-of-record events never issue
  a second invoice.

### Subscriptions in tokenized mode (`subscriptionMode: "tokenized"`)

The provider's subscription module is not used: the buyer pays the first
period with an ordinary payment that saves the card, and the recharge
scheduler charges that card merchant-initiated every period (family rules).
This is the mode for a marketplace account; every recharge there is an own
sale (`marketplaceRouting: { mode: "own" }`, basket by `ownSaleStrategy`). An
invalid `subscriptionMode` value warns `PAYMENT_PROVIDER_SUBSCRIPTION_MODE_INVALID`.

- **Plans** stay in the service's catalog; provisioning stamps
  `providerPlanId` = the plan `code` and calls nothing at the provider.
- **The opening payment** must SAVE the card (direct card with
  `saveCard: true`, or the hosted form with `storePaymentMethod: true`);
  neither possible is `IYZICO_TOKENIZED_SUBSCRIPTION_NO_CARD_SAVE` (ERROR). Its
  amount is the first period: make it the plan amount.
- **3-D Secure prerequisite.** A recharge is never sent to 3-D Secure. It
  succeeds only when the entry's model allows it (`verifyOnce`, so the opening
  payment's 3-D Secure marks the card, or `threshold` above the plan amount)
  AND the account allows non-3DS charges. Otherwise it is settled `failed`
  (`RECHARGE_REQUIRES_3DS_VERIFIED_CARD`). No `savedCardThreeDSMode` warns
  `IYZICO_TOKENIZED_SUBSCRIPTION_THREE_DS_MODE_MISSING`.
- **The subscribe** must use the generated route (signed in as the buyer,
  body `{ "providerPlanId": "<plan code>" }`), which proves the card; a
  `SubscriptionAction` stage `subscribe` proves nothing and is an ERROR
  (`IYZICO_TOKENIZED_SUBSCRIPTION_ACTION_SUBSCRIBE`; `cancelSubscription` and
  `refresh` actions are fine). It opens the row locally
  (`providerSubscriptionId: itok_<uuid>`, `active`, or `trialing` with a trial
  end) and stamps `nextRechargeAt` one interval out, after checking: the
  order's payment is `success`, else `409
  SUBSCRIPTION_OPENING_PAYMENT_NOT_SETTLED`; the buyer has a provably own
  stored card (`403 PAYMENT_METHOD_NOT_OWNED` for a named card that is not;
  else the default, else the most recent; none: `409
  SUBSCRIPTION_STORED_CARD_REQUIRED`); the plan is in the catalog (`409
  SUBSCRIPTION_PLAN_NOT_PROVISIONED`); the caller holds the route's roles
  (`403 PAYMENT_ROLE_REQUIRED`).
- **The verified fact is read ONCE, at subscribe**, and kept on the row with
  the card and the session buyer's email / name / surname. The buyer must
  subscribe AFTER the 3-D Secure return settled the opening payment (the
  return writes `success`, files and marks the card, then redirects). Within
  30 seconds of the settlement a card not filed or not verified yet is re-read
  up to 8 times 250 ms apart (about 2 seconds), then `409
  SUBSCRIPTION_OPENING_PAYMENT_NOT_SETTLED` (retry); the subscribe never pins
  early. Past 30 seconds the card found is the answer, and an unverified card is
  pinned as it is: every recharge fails and dunning ends the subscription. A
  card added later through the add route is not verified.
- **One live subscription per order** (live = not `canceled`, `expired`,
  `provider_failed`, not archived): a repeat answers `200` with the open
  subscription and `metadata.replayed: true` (nothing written or charged, no
  hook); concurrent subscribes insert under an order-derived key so one lands;
  another plan is `409 SUBSCRIPTION_ALREADY_OPEN` (extras `subscriptionId`,
  `providerSubscriptionId`, `planId`, `statusLiteral`); a hosted row still
  opening is `409 SUBSCRIPTION_SUBSCRIBE_PENDING`; after a cancel or expiry a
  new row opens. Every answer carries `metadata.subscriptionId`. The subscribe
  records `subscription.created` itself and runs `afterSubscriptionCreated`
  once. With `statusProperty` set the status is mirrored on the order row
  (`pending_provider` and `provider_failed` never). The subscription table's
  database events are row-change events (one `-created` per row, one
  `-updated` per later write, even a write that changes nothing); prefer the
  lifecycle events or the status mirror for a subscription feed. A paid opening
  order whose subscribe never ran has no subscription and none is opened
  automatically: the client subscribes when it finds one (safe to repeat).
- **Every period** the recharge charges the plan amount with `/payment/auth`,
  merchant-initiated, on the PINNED card (`metadata.providerMethodId`), never
  the wallet's current default. Success announces `subscription.renewed` and
  `invoice.paid` (with `issuePolicy: onPaymentCaptured` the cycle invoice is
  keyed `recharge:<subscriptionId>@<cycle>`). A refused recharge (declined or
  removed card, fraud check) is settled `failed` with the provider's code and
  takes a dunning step; only a fraud-review hold stays `started`. A transport
  error leaves the outcome unknown: the next pass looks the cycle's charge up
  by its conversationId first and adopts it.
- **One charge per cycle.** A pass claims the cycle with a conditional write
  (`SubscriptionRechargeClaimHeld` for a skipped holder,
  `SubscriptionRechargeClaimLost` for a pass whose claim was taken). A claim
  older than the start-claim TTL is taken over with the look-up first. The
  remaining window: a first-pass request that reaches the provider after the
  takeover's look-up (more than about four minutes after the claim) can
  charge the cycle twice; lowering the TTL widens it.
- **Cancel and re-price** write only the row, with no provider call:
  `?when=immediately` ends it (`canceled`, `canceledAt`, `nextRechargeAt`
  cleared); `period_end` (default) sets `cancelAtPeriodEnd`, which stops
  recharges, but the row stays `active` after the period (nothing moves it to
  `canceled`). `:id` is the row id (tried first) or `itok_<uuid>`. The answer
  is built by the adapter, not read from the row (a `period_end` cancel
  answers `canceled` with empty `customerId` and `planId`): show the row. A
  re-price names a catalog plan (`409 SUBSCRIPTION_PLAN_NOT_PROVISIONED`);
  `{ "cancelAtPeriodEnd": true|false }` is accepted.
- **Roles.** `subscribeRoles` gates the subscribe route, `cancelRoles` the
  `DELETE`, `changeRoles` the `PATCH` and the card change and card read routes;
  without them the shared `checkRoles` (else `routeAccess`) applies, and a
  buyer role in `checkRoles` alone can also re-price to a cheaper plan and
  cancel at once. Once any per-route list is declared, a `providerPlanId` on
  the `PATCH` and `?when=immediately` are kept for a platform payment operator
  (`superAdmin`, `admin`, `saasAdmin`; `superAdmin`, `saasAdmin` on a
  multi-tenant project) or a service caller, else `403
  SUBSCRIPTION_OPERATOR_REQUIRED`; `nonOperatorReprice` /
  `nonOperatorImmediateCancel` widen (`true`) or narrow (`false`) this. The
  card change route serves only the subscription's own buyer, so put the
  buyer's role in `changeRoles` and leave `nonOperatorReprice` unset (the
  buyer may then toggle `cancelAtPeriodEnd`).
- **Changing the card**
  (`POST /v1/<object>subscription/:subscriptionId/payment-method`, the buyer
  only; anyone else `404`; emitted only for tokenized iyzico objects). The body
  is exactly one of `{ "paymentMethodId": ... }` or `{ "paymentUserParams":
  { "cardInfo", "saveCard": true, "return_url" } }` (neither or both: `400
  SUBSCRIPTION_PAYMENT_METHOD_CHANGE_INVALID`; a closed subscription: `409
  SUBSCRIPTION_NOT_CHANGEABLE`).
  - A saved card must be the caller's own (`403 PAYMENT_METHOD_NOT_OWNED`) and,
    under `verifyOnce`, verified (`409 PAYMENT_METHOD_NOT_VERIFIED`). An active
    or trialing subscription is re-pinned at once, nothing charged
    (`outcome: "repinned"`, or `"unchanged"` for the same card).
  - A past_due subscription pays its outstanding cycle on the new card at once,
    buyer present, through the scheduler's cycle claim (`409
    SUBSCRIPTION_RECHARGE_IN_FLIGHT` while another charge runs): success stamps
    the period (`active`, `dunningAttempts` 0), pins the card and announces
    `invoice.paid` once (`outcome: "paid"`); a refusal is `422
    SUBSCRIPTION_RECHARGE_REFUSED` and changes nothing (the old card stays
    pinned, the dunning schedule is untouched); a 3-D Secure step answers
    `outcome: "action_required"` with `nextAction`, and the return settles the
    cycle, files and pins the card and redirects (`orderId` = the subscription
    id). The scheduler leaves such a settled cycle to its writer for a short
    grace; if the writer never returns the scheduler stamps it and still pins
    the change's card (`SubscriptionCardChangeSettledByScheduler`; a new card
    nobody filed leaves the old one, `SubscriptionCardChangeSettleMissed`). An
    abandoned step stops holding the cycle past its expiry, a refused one at
    once. A parked subscription (dunning ended `pastDue`, or a missing card)
    has its cycle opened by the change and is parked again exactly as it was
    if the change fails; a lost answer releases the cycle and the next pass
    only LOOKS the charge up (never charging the old card).
  - A new card needs `saveCard: true` (`makeDefault: true` also makes it the
    wallet default) and is charged as a direct card; under `verifyOnce` it is
    ALWAYS charged through 3-D Secure so the pinned card is verified. On an
    active or trialing subscription a new card is proven by a verification
    charge of `1` of the plan's currency (configurable), always 3-D Secure, on
    the subscription's ticket under its own anchor: the answer is
    `action_required` with `verification: { amount, currency }`; the return
    files, marks and pins the card (audited) and voids the charge
    (`/payment/cancel`, recorded so it is voided once); no period is paid and
    the next recharge date does not move. A void the provider refuses logs
    `SubscriptionCardVerificationVoidFailed` (refund manually). While a
    recharge is due or a step is open: `409 SUBSCRIPTION_RECHARGE_IN_FLIGHT`.
    An object that files no new card refuses one `409
    SUBSCRIPTION_NEW_CARD_NOT_ACCEPTED`. Whether the provider accepts a smaller
    or zero amount and a same-day cancel on a live account is not measured.
  - Every re-pin is audited in `metadata.paymentMethodChanges` (the 20
    newest: `by`, `at`, `via`, `providerMethodId`, `previousProviderMethodId`,
    `threeDSVerified`; no card data). The answer: `outcome`,
    `subscriptionId`, `statusLiteral`, `nextRechargeAt`, `paymentMethod`
    (`providerMethodId`, `threeDSVerified`) and, after a charge, `paymentId`
    (and `nextAction`).
- **Reading the pinned card**: `GET` on the same path (same gate, owner only)
  answers `{ subscriptionId, statusLiteral, paymentMethod, reason }` with
  `paymentMethod: { paymentMethodId, last4, brand, threeDSVerified }`, never
  card data; `null` with `reason: "NO_CARD_PINNED"` or
  `"PAYMENT_METHOD_NOT_IN_WALLET"`.
- **Recharge now (test tool).** On a non-production deployment only, a
  platform operator can run a subscription's next recharge at once through the
  scheduler's own path against the bound account
  (`POST /v1/payments/admin/recharge-now/<object>/:subscriptionId`); anything
  else is `404`. It is idempotent per period (`outcome: "already-charged"`
  for a cycle already charged; a due recharge is always charged; a dunned one
  one attempt per call) and answers `outcome` (`recharged`, `failed`,
  `replayed`, `already-charged`), `reason`, `subscription` and `payment`; `409
  RECHARGE_NOT_DUE` when there is nothing to run.
- Tokenized-mode objects have no hosted refresh route or reconcile pass. A
  compiler that does not implement the mode refuses it
  (`IYZICO_TOKENIZED_SUBSCRIPTION_LANGUAGE_UNSUPPORTED`).

### Testing without card data

- The detail read (`POST /payment/detail` by `paymentId` or
  `paymentConversationId`) is the source of truth for what the provider did:
  `paymentStatus`, `fraudStatus` and `itemTransactions[]` (`transactionStatus`
  2 = settled, 1 = awaiting approval; `subMerchantKey`, `subMerchantPrice`,
  `merchantPayoutAmount`, `subMerchantPayoutAmount`).
- A probe that prints provider answers prints only call, `status`,
  `errorCode`, `paymentId`, `fraudStatus`, `paymentStatus` and the item
  transaction figures: never a request body, card, key, auth header,
  `cardToken`, `cardUserKey` or `errorMessage`.
- `POST /v1/payments/admin/simulate-capture/<object>/<orderId>` drives a
  started payment to captured only on the mock; on real sandbox credentials it
  is `409 SIMULATE_CAPTURE_REAL_PROVIDER` and writes nothing. A simulated
  capture's ticket, invoice and fiscal source are marked simulated, and a real
  fiscal integrator refuses a simulated source off production
  (`FISCAL_SIMULATED_SOURCE_REFUSED`). In mock mode
  `POST /v1/<object>mockauthenticate/:orderId` completes a hosted form through
  the ordinary complete path, and the mock's 3-D Secure HTML posts to the real
  return route.
- The iyzico mock applies the marketplace basket rule (`5077` for an unkeyed
  PRODUCT item, a refusal for a keyed LISTING item), answers LISTING items as
  measured, keeps `ownSubMerchant` items awaiting approval until approved,
  models a 3-D Secure cancel as exactly `status`, `conversationId` and
  `mdStatus`, assumes one payment per form, carries no sub-merchant state by
  default (a non-`ACTIVE` state refuses keyed charges and approvals,
  `MOCK_SUBMERCHANT_NOT_ACTIVE`), and offers the fraud scenarios
  `fraud_review`, `fraud_review_clears` and `fraud_reject`.

### Owed before production

Measure on the sandbox: what `/payment/auth` and `/payment/detail` carry for a
payment under review; the effect of `forceThreeDS`; the live field list of a
3-D Secure cancel; the registered-card pair locations; the sub-merchant state
field; the approval amount of a partially refunded item; the verification
charge amount and void; a chargeback payload.

## custom

A configurable adapter that wraps the project's own payment implementation
behind the same contract (`baseUrl` required; `apiKey`, `webhookSecret`
optional). `capabilitiesOverride` is the explicit escape hatch for its
capability flags.

## Operations

Environment variables, console configuration, webhook registration and the
go-live checklist are operations of a compiler and are not part of the
language; see the documentation of your compiler for them.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.
