---
title: Payment
---

# 9.4 Payment

A data object becomes payable by declaring `checkout` (one-time payment of an order),
`subscription` (recurring payment) or `marketplace` (payments split with sellers) in its
`objectSettings`. The compiler then adds payment routes, system objects, a webhook and
status events to the object's service. Everything is provider-neutral: the provider is a
technical selector of the project.

## Activation and configuration

| Blueprint | Effect |
|---|---|
| `projectSettings.paymentProvidersSettings.paymentProviders[]` | named providers: `provider` brand (`stripe`, `paypal`, `iyzico`, `adyen`, `paddle`, `lemonsqueezy`, `mangopay`, `custom`), capabilities, configuration |
| `objectSettings.checkout` (`objectIsAnOrderObject`) | the object is an order: which properties hold the amount, currency, status and owner, how payment results map to order statuses, lifecycle hooks |
| `objectSettings.subscription` | plan, customer and status properties, dunning, who may subscribe, change or cancel |
| `objectSettings.marketplace` | seller account, application fee, settlement and payout rules |

A provider's capabilities (one-time, refunds, subscriptions, marketplace, saved cards,
3-D Secure, webhook style) are fixed by its brand and may only be narrowed. A blueprint
that asks a provider for a capability it lacks is a validation error.

## System data objects

| Object | For | Content |
|---|---|---|
| `sys_<X>Payment` | checkout | one payment ticket per order: `orderId` (unique), `providerName`, `paymentId`, `statusLiteral`, `amount`, `currency`, `redirectUrl`, `failureReason` |
| `sys_<X>Subscription`, `sys_<X>SubscriptionPlan`, `sys_<X>Invoice` | subscription | subscription state, plans, invoices |
| `sys_<X>Refund`, `sys_<X>Dispute` | checkout | refunds and disputes |
| `sys_<X>ConnectedAccount`, `sys_<X>Payout` | marketplace | seller accounts and payouts |
| `sys_paymentEvent` | the service | normalised inbound provider events, idempotent on the provider's event id |
| `sys_paymentCustomer`, `sys_paymentMethod` | the project (in `auth`) | the user's payment identity and saved methods |

`<X>` is the model name of the order object (`Order`).

## Route families

Routes are under `/v1` of the owning service; `<x>` is the lower-cased object name.

| Family | Representative routes |
|---|---|
| Checkout | `PATCH /v1/start<x>payment/:orderId`, `PATCH /v1/refresh<x>payment/:orderId`, `GET /v1/<x>paymentbyorderid/:orderId`, `GET /v1/<x>paymentstatusbyorderid/:orderId` |
| Subscription | `POST /v1/subscribe<x>/:orderId`, `PATCH\|DELETE /v1/<x>subscription/:subscriptionId` |
| Marketplace | `POST /v1/<x>payout`, `/v1/payments/connected-accounts…`, `/v1/payments/payouts…` |
| Webhook | `POST /v1/payments/webhook/:providerName` |
| Browser returns | `POST /v1/payments/checkout-return/:providerName`, `POST /v1/payments/threeds-return/:providerName` |
| Saved methods | `GET /v1/payment-methods/list`, `POST /v1/payment-methods/add`, `DELETE /v1/payment-methods/delete/:paymentMethodId` |
| Operators | `/v1/payments/admin/…` (events, replay, health) |
| Mock status | `GET /v1/payments/mock-status` |

> Generated table goes here (S9): the payment route catalogue per activated pattern and
> provider capability.

## Starting a payment

`PATCH /v1/start<x>payment/:orderId` with `{ "paymentUserParams": { "paymentMethodId"?, "return_url"? } }`:

- The amount, currency and customer **MUST** come from the stored order, never from the
  request.
- A concurrent start for the same order **MUST** answer **409** `PAYMENT_START_IN_FLIGHT`
  without calling the provider. An open intent for an unchanged order is resumed.
- The answer carries `statusLiteral` (`success`, `started`, `failed`, `amount_mismatch`,
  …), `provider`, `providerName` and `nextAction`:
  `{ requiresAction, requiresRedirect, redirectToUrl, clientSecret, raw, actionExpiresAt }`,
  or `null` when the buyer has nothing to do.

Completion is owned by the generated system: for providers that confirm by webhook or by
a browser return, the blueprint declares no completion API. The 3-D Secure and redirect
returns post to the browser-return routes, which settle the payment and redirect to the
start's `return_url`.

## Webhooks

`POST /v1/payments/webhook/:providerName` **MUST**:

1. verify the provider's signature with the provider's own scheme and headers (for
   example `stripe-signature`, `paddle-signature`, `x-iyz-signature-v3`, PayPal's
   transmission headers), and refuse unverifiable requests with **400** or **401**;
2. normalise the event and store it in `sys_paymentEvent`, idempotent on the provider's
   event id;
3. answer **200**, and then advance the payment's state asynchronously, at most once per
   stored event.

A storage failure answers **500**, so that the provider retries.

> **To verify:** which refusal classes answer 400 and which 401.

## States

| Machine | States |
|---|---|
| Payment intent | `pending` → `requires_action` → `authorized` → `captured` → `partially_refunded` → `refunded`; `canceled`; `failed`; `captured` ↔ `disputed` |
| Ticket `statusLiteral` | `started`, `success`, `failed`, `canceled`, `refunded`, `partially_refunded`, `disputed`, `amount_mismatch`, `captured_after_cancel` |
| Subscription | `trialing` → `active` → `past_due` → `canceled` \| `expired`; `active` ↔ `paused` |
| Payout | `scheduled` → `in_transit` → `paid` (→ `returned`); `failed` |

A capture whose amount differs from the ticket **MUST** end in `amount_mismatch`, never in
`success`.

## Events

| Topic | When |
|---|---|
| `<objectName>-payment-updated` | every change of a ticket's status |
| `<objectName>-payment-paymentdone` | a change into `success` |
| `<serviceCodename>-lcevent-<family>-<object>-<event>` | lifecycle events, when `publishLifecycleEvents` is true; delivered at least once with a `dedupeKey` |

Only the writer that changed the status announces it.

> **To verify:** the payment-status topics carry no project prefix and keep the object
> name's casing ([chapter 7](07-event-bus.md#72-topic-families)).

## Without credentials

A provider entry without complete credentials runs in mock mode for brands that have a
mock (the reference: `stripe`, `iyzico`, `adyen`); other brands refuse every call by name
and send nothing ([chapter 10](10-configuration-and-secrets.md#103-missing-provider-credentials)).
The webhook signing secret is stored by the service itself, encrypted, not in the
environment.
