---
title: "Building payments end to end: a playbook"
---

# Building payments end to end: a playbook

Read this page first when a project takes money. It is a map: for each flow
it gives the order of calls, where each setting lives and the error codes you
will meet, and it links to the page that holds the detail. It does not repeat
those pages; follow the links for the rules behind each step.

A compiler refuses a construct it does not implement, so a design that uses a
feature the chosen compiler lacks is refused at design time instead of failing
at run time.

## Where each setting lives

A payment design has three places to put a value, and putting a key in the
wrong one is the most common silent mistake: the key is then ignored, or
reported only as an unknown-key warning.

| Level | Where | Examples |
|---|---|---|
| **Provider entry field** | `projectSettings.paymentProvidersSettings.paymentProviders[]`, beside `name` and `provider` | `name`, `provider`, `webhookOwnerService`, `payoutCadence`, `capabilities` |
| **Provider configuration item** | the same entry's `configuration[]`, as `{ "name": ..., "value": ... }` | `apiKey`, `secretKey`, `baseUrl`, `directCardEntry`, `newCardThreeDSThreshold`, `savedCardThreeDSMode`, `savedCardThreeDSThreshold`, `marketplaceActive`, `ownSaleStrategy`, `ownSubMerchantKey`, `subscriptionMode`, `subMerchantPrefix` |
| **Object setting** | the data object's `objectSettings.checkout` / `subscription` / `marketplace` block | `providerName`, the property bindings, `checkRoles`, `subscribeRoles`, `changeRoles`, `cancelRoles`, `nonOperatorReprice`, `nonOperatorImmediateCancel`, `routeAccess`, `refundRouteAccess`, `storePaymentMethod`, `statusProperty`, `sellerAccountProperty`, `sellerAccountObject`, `settlementRelease`, `sellerOnboarding` |

- A request body can only ask for what the entry allows. For example, `cardInfo` and `saveCard`
  travel in `paymentUserParams`, but only an entry with `directCardEntry: true`
  accepts them. See
  [A card entered on the app's own frontend](../providers/payment.md#a-card-entered-on-the-apps-own-frontend-directcardentry).
- Keep each secret on the entry with an EMPTY value and let the hosting
  platform inject the real value. A key removed from the entry counts as
  missing and forces mock mode. See the iyzico section of
  [Payment providers](../providers/payment.md#iyzico).

The injected payment routes (start, refresh, status, subscribe, cancel,
refund, webhook, the browser returns) exist once an object opts in; you do
not author them. Their role gates come from the object block, not from a
Business API. See
[Role gates on the injected routes](./payment-workflow.md#role-gates-on-the-injected-routes).

## Flow 1: a one-time sale

### With the hosted form (the default)

1. **Design.** Add a provider entry and a `checkout` block on the order object.
   The order owner must be session-fed (`sessionSettings.isOwnerField`), or a
   buyer cannot start the order. See
   [One-time payments](./payment-workflow.md#one-time-payments-checkout).
2. **Create the order** through your own create API. The amount and
   currency are read from the stored row, never from the start request.
3. **Start:** `PATCH /v1/start<object>payment/:orderId` with
   `{ "paymentUserParams": { "return_url": "https://app/pay/return" } }`.
   Render what the answer asks for (a hosted form, a 3-D Secure step). See
   [3-D Secure and buyer redirects](./payment-3ds-and-redirects.md).
4. **The buyer comes back** to `return_url` with `orderId` and `status`. The
   service completed the payment itself; a design never authors a complete,
   callback or webhook API for Stripe, iyzico or Adyen.
5. **Read the result:** `GET /v1/<object>paymentstatusbyorderid/:orderId`. If
   it is unclear, refresh with `PATCH /v1/refresh<object>payment/:orderId`,
   which reads the provider's own record.
6. **Write your order status** in an `afterPaymentCaptured` hook (and
   `afterPaymentFailed` / `afterPaymentCanceled`). The payment layer keeps
   its own ticket, `sys_<object>Payment`, and does not write the order
   status itself.

### With a card typed on your own page (iyzico `directCardEntry`)

1. **Design:** `{ "name": "directCardEntry", "value": true }` in the iyzico
   entry's `configuration[]`. This widens your PCI scope. Set
   `newCardThreeDSThreshold` when charges below a limit may skip 3-D Secure.
   An unset threshold means ALWAYS 3-D Secure for a direct card. The
   service's public base URL (with any gateway prefix) must be configured, or
   the start is refused before iyzico is called.
2. **Start** with the card:
   `PATCH /v1/start<object>payment/:orderId` and
   `{ "paymentUserParams": { "return_url": "...", "cardInfo": { "cardHolderName", "cardNumber", "expireMonth", "expireYear", "cvc" } } }`.
3. **Answer `started`:** base64-decode
   `paymentIntentInfo.next_action.threeDSHtmlContent` and render it. The bank
   posts to the service's own 3-D Secure return, which settles the payment
   and redirects to `return_url`. **Answer `success`:** the charge was below
   the threshold and is already settled.
4. **Saving the card:** add `"saveCard": true` INSIDE `paymentUserParams`,
   beside `cardInfo`. Every other spelling or place is refused
   `400 PAYMENT_CARD_INVALID`; a save flag on an entry without
   `directCardEntry` is refused `400 PAYMENT_DIRECT_CARD_NOT_ENABLED`. The
   card is filed in the buyer's wallet when the payment reads `success`.
   After a 3-D Secure payment it is filed at the return, and under
   `savedCardThreeDSMode: verifyOnce` it is also marked verified there. The
   buyer's first card on an entry becomes the default; a later one only
   with `makeDefault: true` beside `saveCard: true`.
5. **A PaymentAction start** takes `cardInfo` and `saveCard` as request
   parameters at the root of its parameter blob, or one `paymentUserParams`
   Object parameter. Declare one shape, not both.

Detail: the iyzico sections
[A card entered on the app's own frontend](../providers/payment.md#a-card-entered-on-the-apps-own-frontend-directcardentry),
[Saved cards](../providers/payment.md#saved-cards) and
[Charging a saved card without 3-D Secure](../providers/payment.md#charging-a-saved-card-without-3-d-secure-savedcardthreedsmode),
and [PaymentAction](../actions/payment-action.md).

**Codes you will meet:** `400 PAYMENT_CARD_INVALID`, `PAYMENT_CARD_EXPIRED`,
`PAYMENT_CARD_EXPIRY_INVALID`, `PAYMENT_CARD_WITH_SAVED_METHOD`,
`PAYMENT_DIRECT_CARD_NOT_ENABLED`, `PAYMENT_BUYER_EMAIL_REQUIRED`,
`PAYMENT_CARD_SAVE_NOT_SUPPORTED`; `422 PAYMENT_PROVIDER_REQUEST_REJECTED`
(a decline, with iyzico's code in `providerErrorCode`); `403 NOT_OWNER`;
`403 PAYMENT_ROLE_REQUIRED`.

## Flow 2: a marketplace sale split to a seller

1. **Account:** ask iyzico whether the marketplace product is active, and
   set `marketplaceActive: true` in the entry's `configuration[]` when it
   is. See
   [Account facts a compiler cannot read](../providers/payment.md#account-facts-a-compiler-cannot-read).
2. **Seller object:** a `marketplace` block with `sellerAccountProperty`
   (where the seller's provider key lives), `allowedSellerTypes` and
   `sellerOnboarding` (the roles the sub-merchant is created from, the IBAN
   included). Saving the seller row provisions the sub-merchant. A refusal
   never fails the save: read it on
   `GET /v1/payments/connected-accounts` (`provisioningFailures`). See
   [Seller onboarding](./payment-workflow.md#seller-onboarding-provisioning-the-connected-account).
3. **Order objects:** a `checkout` block plus a `marketplace` block that
   names the seller object in `sellerAccountObject`, with
   `sellerAccountProperty` and `applicationFeeProperty` on the order. Do not
   put `sellerOnboarding` on the order block. See
   [Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants).
4. **Create the order** and copy the seller's `subMerchantKey` (the
   connected account's `providerAccountId`) onto it. The routing is read
   from the STORED order row, so protect that column. A caller that sends
   `subMerchantKey` or `subMerchantPrice` is refused.
5. **Start and complete** as in Flow 1. iyzico receives `paymentGroup:
   PRODUCT` with the seller's key and share on every item.
6. **The seller's share** is released when the release condition holds
   (Flow 4), or by iyzico's own settlement when there is no release block.
7. **Stopping a seller:** an operator suspends it with
   `POST /v1/payments/connected-accounts/:accountId/suspension`
   (`{ "suspended": true, "reason": "..." }`). Its new split charges are
   then refused before the provider call, and its payouts and released
   shares are held (`holdReason: seller_suspended`); lift it with
   `{ "suspended": false }` and the next payout-scheduler pass sends what
   was held. The onboarding progress read
   (`GET .../:accountId/onboarding/progress`) re-reads the sub-merchant at
   iyzico first. See
   [Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants).

**Codes:** `400 SELLER_ACCOUNT_UNRESOLVED` (no seller found: a missing
`sellerAccountObject`, a key of another tenant, or a chain of pointers),
`409 SELLER_ACCOUNT_SUSPENDED` (the platform suspended the seller),
`400 PAYMENT_ROUTING_FIELD_FORBIDDEN`, `400 IYZICO_MARKETPLACE_ROUTING_CONFLICT`,
`409 PROVIDER_MARKETPLACE_NOT_ACTIVATED` (the account has no marketplace
product), iyzico `5068` (a seller without an IBAN cannot be settled). See
[Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants).

## Flow 3: the platform's own sale on a marketplace account

A marketplace-activated iyzico account refuses a basket item that names no
sub-merchant (`5077`, surfaced as `422 PAYMENT_PROVIDER_REQUEST_REJECTED`).
With `marketplaceActive: true`, an order that names no seller is sent as an
own sale:

- `ownSaleStrategy: listing` (the default): `paymentGroup: LISTING` with no
  key on any item. Verified on the iyzico sandbox: the item settles as
  `transactionStatus: 2` and needs no approval step.
- `ownSaleStrategy: ownSubMerchant` with `ownSubMerchantKey`: the items are
  keyed to the platform's own sub-merchant and approved after the capture.

An order object with no marketplace block (a ticket object on the same
entry) only makes own sales. A basket is either one seller's split or an
own sale; split mixed baskets into one order per seller. See
[Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants)
for the own-sale basket rules.

**Codes:** `400 IYZICO_OWN_SALE_NOT_CONFIGURED`; design time
`PAYMENT_PROVIDER_OWN_SUB_MERCHANT_KEY_MISSING`,
`PAYMENT_PROVIDER_OWN_SALE_STRATEGY_INVALID`,
`PAYMENT_PROVIDER_OWN_SALE_KEYS_INERT`.

## Flow 4: holding the seller's share (`settlementRelease`)

1. **Design:** `settlementRelease` on the order object's marketplace block
   (`mode`: `onCapture`, `onDate` + `releaseAtProperty`, `onStatus` +
   `statusProperty` + `releaseOnStatus`, or `manual`). Set the entry's
   `payoutCadence.mode` to `on_demand` or `scheduled` (iyzico's default,
   `provider_driven`, books nothing). Ask iyzico to switch automatic item
   approval OFF for the account.
2. **At capture** the payment layer books one `sys_<object>Payout` row per
   sale, `held` (`metadata.payoutGate.holdReason`), with the sale id at
   `metadata.orderId` and `metadata.settlementRelease.orderId`.
3. **The payout scheduler** (every 60 s by default) releases the row once
   the release rule holds. For `manual`, create a payout naming the sale
   (`metadata.orderId`). The call answers `scheduled`, and the next pass
   sends it.
4. **Refunds and disputes:** a full refund, a cancel or a lost dispute
   cancels the row (`failed`, `afterPayoutFailed`). An open dispute holds it.
   A partial refund holds it until an operator payout for the sale. The
   refund is read from the sale's refund records, so the operator payout
   works right after the refund, before any scheduler pass. The released
   row books the remaining share: the original share less the seller's
   part of the refunds, pro rata to the sale amount. A refund still
   `pending` holds the row (`sale_refund_pending`) until its outcome is
   known.
5. **The seller's state:** a suspended seller (`platformSuspended`) is held
   `seller_suspended` on every payout path; the next pass after the
   suspension is lifted sends it. `payoutEnabled: false` holds
   (`seller_payouts_disabled`) only on a provider that reports it; iyzico
   does not yet, so it holds nothing there.

Detail: the iyzico section
[Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants)
(releasing the seller's share, payouts and the held seller), and
[PayoutAction](../actions/payout-action.md).

**Codes:** design time `SETTLEMENT_RELEASE_PROVIDER_DRIVEN_CADENCE`,
`SETTLEMENT_RELEASE_PLATFORM_SETTLED`, `SETTLEMENT_RELEASE_DATE_PROPERTY_REQUIRED`,
`SETTLEMENT_RELEASE_STATUS_REQUIRED`, `SETTLEMENT_RELEASE_WITHOUT_SELLER_BINDING`,
`SETTLEMENT_RELEASE_WITHOUT_CHECKOUT`, `SETTLEMENT_RELEASE_LANGUAGE_UNSUPPORTED`;
run time `409 SETTLEMENT_RELEASE_NOT_BOOKED`, `409 SETTLEMENT_RELEASE_ITEM_HELD`
(a payout naming a release row's item directly), `409 SELLER_PAYOUT_HELD`
(a `provider_driven` PayoutAction to a held seller), `failureReason`
`SETTLEMENT_RELEASE_CANCELED`, hold reasons `seller_suspended` /
`seller_payouts_disabled`, a `422` for an ordinary iyzico payout whose
metadata names no transaction, `422 PAYOUT_TRANSACTION_UNVERIFIED` (named
transactions without `metadata.paymentId`) and
`422 PAYOUT_TRANSACTION_NOT_DESTINATION` (a named transaction that is not
the seller's item of that payment), `422 PAYOUT_SALE_ID_INVALID` /
`422 PAYOUT_PAYMENT_ID_INVALID` (a `paymentId` / `orderId` that is not a
string or a number).

## Flow 5: a subscription the service recharges (iyzico tokenized)

This is the only subscription mode a marketplace-activated iyzico account
can run. A hosted subscription on such an entry is a design-time error.

1. **Design:** in the entry's `configuration[]`, set
   `subscriptionMode: tokenized` and `savedCardThreeDSMode: verifyOnce`, plus
   a way to save the card: `directCardEntry: true`, or
   `storePaymentMethod: true` (subscription or checkout block) for the hosted form.
   On the order object, add `checkout` and `subscription` blocks, and set
   `subscription.configuration.statusProperty` so that the order row shows
   its subscription status. Put the buyer's role in the subscription
   block's `subscribeRoles` (and `cancelRoles`, if the buyer may cancel
   here), not in `checkRoles`: `checkRoles` gates all three routes, so a
   buyer listed there could also re-price the subscription and cancel it at
   once. See [Who may subscribe, re-price and cancel](#who-may-subscribe-re-price-and-cancel).
   Ask iyzico to allow non-3DS charges.
2. **Plans:** seed the plan catalog and call
   `POST /v1/payments/admin/plans/provision`. Nothing is called at iyzico.
3. **The opening order:** create it with the plan amount (it pays the
   first period). Pay it and save the card (Flow 1, with
   `saveCard: true`). The buyer passes 3-D Secure.
4. **Wait for `success` on the return page.** Subscribe from the page the
   buyer's browser returns to, once
   `GET /v1/<object>paymentstatusbyorderid/:orderId` reads `success`.
5. **Subscribe:** `POST /v1/subscribe<object>/:orderId` with
   `{ "providerPlanId": "<plan code>" }`, signed in as the buyer. Store
   `metadata.subscriptionId` (the row id) and `providerSubscriptionId`
   (`itok_<uuid>`).
6. **Recharges** run by themselves every period, on the card pinned at
   subscribe. On a non-production deployment, an operator can run the next one
   at once with
   `POST /v1/payments/admin/recharge-now/<object>/:subscriptionId`.
7. **Cancel:** `DELETE /v1/<object>subscription/:id?when=immediately|period_end`.
   **Re-price:** `PATCH` the same path with `{ "providerPlanId": ... }`.
   `:id` is the row id or `itok_<uuid>`. Neither call reaches iyzico; both
   write the row. With per-route roles, a buyer gets
   `403 SUBSCRIPTION_OPERATOR_REQUIRED` for `when=immediately` and for a
   `providerPlanId`: those stay with a platform operator or the project's
   own api.

**The subscribe is safe to repeat.** A second subscribe of the same order
answers `200` with the open subscription and `metadata.replayed: true`.
Two concurrent subscribes open one row. A subscribe after a cancel opens a
new row. `afterSubscriptionCreated` runs once per opened row. See
[One live subscription per order](../actions/subscription-action.md#one-live-subscription-per-order).

**The client opens the subscription.** A paid opening order does not open
the subscription by itself: if the buyer's browser closes between the
payment and the subscribe call, the order stays paid and no recharge is
scheduled. Call the subscribe again when the buyer comes back (it is safe to
repeat), or list paid opening orders that have no subscription row and
retry or refund them from your own job.

**Card rules:** the card is pinned at subscribe (the named card, else the
default, else the most recent). Its verified mark is read once, at
subscribe. The buyer changes the card of an open subscription with
`POST /v1/<object>subscription/:subscriptionId/payment-method`: a saved,
verified card of their own re-pins an active subscription, and a past_due one
pays its outstanding cycle on the new card at once. A refused, failed or
abandoned change leaves the old card pinned and the dunning schedule exactly
as it was (a subscription dunning had parked stays parked). See
[Subscriptions in tokenized mode](../providers/payment.md#subscriptions-in-tokenized-mode-subscriptionmode-tokenized).
The card change route takes the `change` gate (`changeRoles`, else the
shared gate). Under `verifyOnce` an active subscription can switch only to a
card a 3-D Secure payment has verified: a card added through
`POST /v1/payment-methods/add` is not verified. Send a new card through the
change route instead: on an active subscription it is verified by a small
3-D Secure charge that is voided at once. The buyer reads the pinned
card with `GET /v1/<object>subscription/:subscriptionId/payment-method`
(`{ paymentMethodId, last4, brand, threeDSVerified }`, null with a reason
when the card left the wallet; owner-only, same gate as the change). On the
past_due new-card form,
`paymentUserParams.makeDefault: true` beside `saveCard: true` also makes the
filed card the wallet default; the subscription is re-pinned to it either
way. See also
[Saved cards](../providers/payment.md#saved-cards) for cards saved before the
verified mark existed.

**Codes:** `409 SUBSCRIPTION_OPENING_PAYMENT_NOT_SETTLED` (not paid yet, or
the card is still being filed: retry), `409 SUBSCRIPTION_STORED_CARD_REQUIRED`,
`409 SUBSCRIPTION_ALREADY_OPEN`, `409 SUBSCRIPTION_PLAN_NOT_PROVISIONED`,
`403 PAYMENT_METHOD_NOT_OWNED`, `403 PAYMENT_ROLE_REQUIRED`,
`403 SUBSCRIPTION_OPERATOR_REQUIRED`,
`409 RECHARGE_NOT_DUE`, recharge `failureReason`
`RECHARGE_REQUIRES_3DS_VERIFIED_CARD`. At design time:
`IYZICO_TOKENIZED_SUBSCRIPTION_NO_CARD_SAVE`,
`IYZICO_TOKENIZED_SUBSCRIPTION_THREE_DS_MODE_MISSING`,
`IYZICO_TOKENIZED_SUBSCRIPTION_ACTION_SUBSCRIBE` (subscribe through the
route, never a `SubscriptionAction`) and
`PAYMENT_PROVIDER_MARKETPLACE_SUBSCRIPTION_INTERLOCK` /
`IYZICO_SUBSCRIPTION_MARKETPLACE_INTERLOCK`.

Detail:
[Subscriptions in tokenized mode](../providers/payment.md#subscriptions-in-tokenized-mode-subscriptionmode-tokenized)
(the signup step by step, cancel and re-price, and `recharge-now` as a test
tool). Adyen's tokenized mode has open gaps of its own (see the
[Adyen section](../providers/payment.md#adyen)).

## Flow 6: a hosted subscription (the provider runs the cycle)

1. **Design:** a `subscription` block on a plain (non-marketplace) entry.
   On iyzico this is the default `subscriptionMode: hosted`.
2. **Provision the plans** at the provider:
   `POST /v1/payments/admin/plans/provision`.
3. **Subscribe:** `POST /v1/subscribe<object>/:orderId` with
   `{ "providerPlanId": ..., "returnUrl": ... }`. On iyzico the answer opens
   the hosted subscription form, and the row stays `pending_provider` until
   the form returns. On Stripe a first payment that needs 3-D Secure
   answers `nextAction`.
4. **Grant the plan on `active`**, never on the subscribe answer.

The subscribe writes a claim row before it calls the provider. While that
row is `pending_provider`, a second subscribe gets
`409 SUBSCRIPTION_SUBSCRIBE_PENDING`. A cancel of a direct-create claim younger than 15
minutes gets the same `409`; an older unknown claim remains held for reconciliation. iyzico sends
no cancel or expiry webhook, so the service reconciles hosted subscriptions
itself: its scheduler worker reads open rows back from iyzico and records a
status that moved, and an operator can refresh one with
`POST /v1/<object>subscription/:subscriptionId/refresh`. See
[Subscriptions in hosted mode](../providers/payment.md#subscriptions-in-hosted-mode-default).

A create whose answer was lost (a timeout, a provider 5xx) keeps its
attempt. Stripe may re-send the same provider idempotency key only while the
original durable `createdAt` is valid, not in the future, and less than 23 hours
old. Revival and `updatedAt` do not renew that age. At the boundary, with an
invalid or missing time, or for PayPal and other providers without an established
safe subscription retry horizon, the unknown attempt is held for reconciliation
and a new subscribe gets `409`. Local cancel retains an unknown direct-create
claim, including legacy and stale claims. An iyzico hosted-form cancel first
reads the form: a confirmed subscription is canceled at iyzico under its real
reference; an unconfirmed form closes locally. A failed result read or provider
cancel leaves the row available for retry. See
[A failed subscribe and its retry](../actions/subscription-action.md#a-failed-subscribe-and-its-retry).

A retry through a create API may have a new order id. For hosted subscriptions,
the service checks the persisted owner, provider and plan (and tenant where
present) for an unresolved `pending_provider` row. It returns
`409 SUBSCRIPTION_IN_PROGRESS` naming the earlier subscription and order,
without opening another provider subscription. With `onActionError: throwError`,
the create API rolls back the refused new order; the earlier order remains the
anchor of its unresolved attempt. Concurrent new orders use the
same database claim while that attempt is unresolved. Different owners or
plans remain independent. Once the earlier attempt is resolved, this check
allows a new subscription; it is not a general limit on subscriptions per buyer.

**Stale `pending_provider` rows are swept.** Every service with a hosted or
tokenized subscription object runs a pending-subscription sweeper (one pass
at boot, then every 15 minutes by default; the interval can be set to `0` to
disable it). It reads the rows still `pending_provider` after a minimum age
(1 hour by default, longer than a hosted form's token life):

- an iyzico hosted form row (`pending:checkout:<token>`) is settled from the
  form's result exactly as the buyer's return would settle it: confirmed
  takes iyzico's reference and status and runs `afterSubscriptionCreated`
  once (a late return records nothing twice), refused ends
  `provider_failed`;
- a row that names a real provider subscription is read back from the
  provider and moved to the reported status (one
  `subscription.created` for a started one); a provider 404 ends it
  `provider_failed`;
- a direct-create claim (`pending:...`) names nothing the provider can be
  asked about: the sweeper logs `SubscriptionPendingUnresolved` once per row
  with the order, and leaves it for an operator.

A subscription settlement is a compare-and-set on the row still being
`pending_provider` or `provider_failed` under the provider id that was read,
so an adopted provider id or a closed lifecycle state is never overwritten.
A hosted form row is written through the buyer's return: a confirmed form can
settle an earlier refused read that left the same sentinel `provider_failed`,
with the lifecycle event deduped by the shared `cf-return-subscription-<token>`
id. A local cancel that wins this comparison cannot be overwritten by a late
return. Bounded sweep passes retain their keyset cursor, so unresolved older
rows do not starve newer attempts. The per-object counts of `pending_provider`
and `provider_failed` rows are the `payment_subscription_journal` gauges on
`GET /v1/payments/admin/metrics`: alarm on them.

A `SubscriptionAction` with `stage: subscribe` keeps the same rule as the
route: an order with a live subscription answers it (`metadata.replayed`),
or `409 SUBSCRIPTION_SUBSCRIBE_PENDING` / `SUBSCRIPTION_ALREADY_OPEN`,
without calling the provider; two concurrent subscribes of one order open
one subscription. See
[SubscriptionAction: one live subscription per order](../actions/subscription-action.md#one-live-subscription-per-order).

## Who may subscribe, re-price and cancel

The three injected subscription routes are `POST /v1/subscribe<object>/:orderId`,
`PATCH /v1/<object>subscription/:id` (re-price) and
`DELETE /v1/<object>subscription/:id` (cancel). By default one list,
`subscription.configuration.checkRoles`, gates all three. If the buyer's role
is in it, the buyer can also re-price to a cheaper plan (the entitlement your
project derives from its own plan field stays the dearer one) and cancel at
once, past your own plan-change and cancel apis.

Give each route its own list instead:

```json
"subscription": {
  "objectIsSubscriptionObject": true,
  "configuration": {
    "providerName": "iyzicoMain",
    "subscribeRoles": ["user"],
    "cancelRoles": ["user"],
    "checkRoles": ["admin"]
  }
}
```

- `subscribeRoles`, `changeRoles`, `cancelRoles`: a non-empty list gates its
  own route. An empty or unset list keeps the shared gate (`checkRoles`, else
  `routeAccess`). `changeRoles` gates the `PATCH` and, on a tokenized iyzico
  subscription, the buyer's card change
  (`POST` and `GET /v1/<object>subscription/:id/payment-method`). To let the
  buyer change the card, put the buyer's role in `changeRoles` and leave
  `nonOperatorReprice` unset: plan changes stay operator-only, and the buyer
  may also toggle `cancelAtPeriodEnd` on the `PATCH`.
- `nonOperatorReprice`, `nonOperatorImmediateCancel`: may a caller who is not
  a platform payment operator send a `providerPlanId` on the `PATCH`, or
  `when=immediately` on the `DELETE`? `true` admits, `false` refuses with
  `403 SUBSCRIPTION_OPERATOR_REQUIRED`. When unset they REFUSE as soon as the
  block declares any per-route list, and admit otherwise. A platform payment
  operator is `superAdmin`, `admin` or `saasAdmin` (`superAdmin` or
  `saasAdmin` on a multi-tenant project), or a service caller that names no
  user. The buyer may still cancel at period end and toggle
  `cancelAtPeriodEnd`.
- Provider caveat: PayPal and iyzico hosted subscriptions have no period-end
  cancel, so every `DELETE` on them cancels immediately whatever `when` says.
  On those providers `nonOperatorImmediateCancel: false` cannot hold the buyer
  to a period-end cancel; keep the buyer off the route with `cancelRoles`.

A block that sets none of these keys behaves as before. Hiding the routes in
the frontend is not a gate: a crafted request reaches them.

**Events of the subscription table:** the `sys_<X>` payment tables publish
`-created` once per row (on a hosted subscribe it carries the pending claim
row) and `-updated` once per write that lands (a status write, a cancel, a
recharge advance, a hosted subscribe's confirmation). These are row-change
events, not business facts: one status change can take several writes. For a
status feed, use the lifecycle events (`publishLifecycleEvents`) or the
`statusProperty` mirror, and keep a `-dbevent-` listener idempotent.

## Flow 7: webhooks with one URL and several services

- Every service that carries a payment block gets
  `POST /v1/payments/webhook/<providerName>`; the service verifies the
  webhook and runs it. Never author a webhook API for payment events.
- An iyzico merchant panel takes ONE URL. When several services bind the
  same entry, declare `webhookOwnerService` as a FIELD of the entry (not a
  `configuration[]` item) and register only the owner's URL. The owner
  relays the other services' events to them. The browser-return routes stay
  per service.
- Use the service's public URL (with any gateway prefix). Prove it
  with an unsigned POST, which must answer `401 SIGNATURE_INVALID`. iyzico
  must have signature V3 enabled.

Detail: [Webhook routing](./payment-workflow.md#webhook-routing) and the iyzico
section
[Webhook verification and events](../providers/payment.md#webhook-verification-and-events)
(the relay fails safe on iyzico's redelivery).

**Codes:** design time `PAYMENT_WEBHOOK_OWNER_UNDECLARED`,
`PAYMENT_WEBHOOK_OWNER_NOT_A_CARRIER`; run time `401 SIGNATURE_INVALID`,
`403 WEBHOOK_RELAY_NOT_OWNER`.

## Flow 8: refunds and disputes

- **Refund route:** `POST /v1/<object>refundpayment/:orderId`. By default
  only a platform payment operator may call it
  (`checkout.configuration.refundRouteAccess: operator`). A buyer refund
  belongs on an authored Business API with a `RefundAction`, where your own
  rules run. Send an `Idempotency-Key` per refund the user asks for.
- **Answers:** `200` with the refund; a retry with the same key answers the
  same refund. `409 REFUND_IN_PROGRESS`, `409 IDEMPOTENCY_KEY_REUSED`,
  `409 REFUND_POSSIBLE_DUPLICATE` (a second equal partial refund without a
  key), `403 OPERATOR_REQUIRED`.
- **Disputes:** the provider's dispute events reach the
  `afterDisputeOpened` / `afterDisputeEvidenceRequired` / `afterDisputeWon` /
  `afterDisputeLost` hooks. iyzico disputes are handled in the iyzico panel:
  the per-dispute calls answer `501`.
- **On a held seller share** a refund or a dispute changes the release
  (Flow 4).

Detail: [RefundAction](../actions/refund-action.md) and
[The refund route has its own gate](./payment-workflow.md#role-gates-on-the-injected-routes).

## Flow 9: invoices and fiscal documents

- `invoicing.configuration.issuePolicy: onPaymentCaptured` issues the
  invoice from the payment's capture. `fiscalization.configuration.submitPolicy:
  onInvoiceFinalized` then submits the fiscal document. See
  [Declarative triggers](./invoice-fiscalization-chain.md#declarative-triggers-who-starts-each-leg).
- A tokenized iyzico recharge issues its period invoice, once per cycle. A
  hosted renewal issues through `onPaymentCaptured` on the subscription object,
  or `onSubscriptionInvoicePaid` on an invoicing object whose `sourceObjectName`
  names that subscription object. Each provider invoice is issued once. The fiscal buyer party reads only the
  invoiced row, so copy an organisation's tax number onto it.
- Off production, a fiscal integrator without credentials runs as a mock.
  On production it answers
  `503 FISCAL_PROVIDER_UNAVAILABLE`; under `continueRoute` the document is
  recorded `failed`, and you resubmit it once the credentials are in place.
  See [Credential fallback](../providers/fiscal.md#credential-fallback).
- Uyumsoft vendor numbering keeps three series types: e-Fatura, e-Arsiv and
  e-Arsiv Internet Satis. An internet-sale e-Arsiv (one with a website) is
  numbered from an Internet Satis series, and a plain e-Arsiv `serialPrefix`
  is ignored there. Set `eArchiveInternetSerialPrefix` on the provider entry
  to choose that series; unset, Uyumsoft uses the account's default one.
  Platform numbering is not affected: the full number is used as sent. See
  [Fiscal providers](../providers/fiscal.md) (serial numbering).
- A simulated capture's invoice is never sent to a real integrator
  (`409 FISCAL_SIMULATED_SOURCE_REFUSED` on a manual submit).

## Testing without card data

**Mock mode** covers Stripe, iyzico and Adyen. A provider whose
credentials are missing falls back to the mock silently: check
`GET /v1/payments/mock-status`, where the entry must read `mock: false`
before a real test. In mock mode, `POST /v1/<object>mockauthenticate/:orderId`
completes an open hosted payment. An operator can also call
`POST /v1/payments/admin/simulate-capture/<object>/<orderId>`, which drives a
started payment to captured. It runs only in mock mode, on a
non-production deployment: a real sandbox provider answers
`409 SIMULATE_CAPTURE_REAL_PROVIDER`. See
[Testing with mock mode](./payment-workflow.md#testing-with-mock-mode)
and [Simulated captures are for mock mode only](./payment-workflow.md#simulated-captures-are-for-mock-mode-only).

**A real sandbox** is the proof that counts. Automated tooling never types
or reads card numbers or keys: the order is started through the injected
route, a person completes the bank page in a browser with a sandbox test
card, and the order is then refreshed and its status, events and logs read.
For a vendor rule nobody has measured, write a probe script that the person
runs with their own credentials. See also
[Testing without card data](../providers/payment.md#testing-without-card-data).

## Open gaps to design around

These are current behaviours, each with its workaround on the linked page:

- A new card on an ACTIVE tokenized subscription needs a separate save first;
  the card change route takes a new card only for a past_due one
  ([Subscriptions in tokenized mode](../providers/payment.md#subscriptions-in-tokenized-mode-subscriptionmode-tokenized)).
- A `period_end` cancel leaves the row `active` after the period
  ([Subscriptions in tokenized mode](../providers/payment.md#subscriptions-in-tokenized-mode-subscriptionmode-tokenized)).
- The `sys_` payment tables publish row-change database events, not
  business events; build a feed on `publishLifecycleEvents` instead.
- iyzico reports no seller payout state yet, so `payoutEnabled` holds
  nothing on iyzico (the platform suspension does). iyzico's sub-merchant
  state field is not measured, and neither is what iyzico's approval pays
  after a partial refund: the service books the pro-rata remainder
  ([Marketplace (sub-merchants)](../providers/payment.md#marketplace-sub-merchants)).
- A card filed by a payment is not the default card
  ([Saved cards](../providers/payment.md#saved-cards)).
- The Adyen tokenized subscribe route's row writes
  ([Adyen](../providers/payment.md#adyen)).
- A hosted renewal on a cross-sourced invoicing object needs
  `issuePolicy: onSubscriptionInvoicePaid` and a subscription source
  ([Subscriptions in hosted mode](../providers/payment.md#subscriptions-in-hosted-mode-default)).

## See also

- [Payment workflow](./payment-workflow.md): the model and every object setting
- [3-D Secure and buyer redirects](./payment-3ds-and-redirects.md)
- [Payment providers](../providers/payment.md): behaviour per brand, including iyzico
- [Invoice and fiscalization chain](./invoice-fiscalization-chain.md)
- [PaymentAction](../actions/payment-action.md), [RefundAction](../actions/refund-action.md),
  [PayoutAction](../actions/payout-action.md), [SubscriptionAction](../actions/subscription-action.md)
