# SubscriptionConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [SubscriptionConfig in Part 2](../spec/SubscriptionConfig.md)

Configuration for recurring subscriptions on a DataObject. Provider-binding via `providerName`. The framework wires up plan creation (where applicable), customer attachment, renewal webhooks, and cancellation flows. Requires the bound PaymentProvider to support subscriptions (capabilities.supportsSubscriptions=true). On a TOKENIZED provider (subscriptionSemantics 'tokenized', e.g. Adyen) the subscription opt-in also implies the object's `sys_<X>Payment` ticket table and the payment intent machine: the framework's recharge scheduler records every cycle's charge there (`orderId` = the subscription row id, `metadata.recharge: true`) and the provider webhook reconciles it, whether or not the object also opts into `checkout`. No checkout API (start / refresh / callback routes, ticket CRUD APIs) is added by the subscription opt-in alone; hosted and checkout-driven providers run their own cycle and get no extra table. 3-D SECURE ON STRIPE: a subscription whose FIRST payment needs the buyer (authentication, or a declined card) is created `incomplete`; the subscribe answer then carries `nextAction` (`requiresAction`, `clientSecret`, `paymentStatus`, `hostedInvoiceUrl`) for the frontend to finish with Stripe.js, and the row reads `past_due` (never an entitled state) until Stripe's `invoice.paid` makes it `active`; unfinished, Stripe expires it after 23 hours (`expired`). A RENEWAL that needs authentication reaches `afterInvoicePaymentFailed` with `resource.requiresAction: true` and `resource.hostedInvoiceUrl`, the page where the buyer authenticates. Grant the plan on `active` (`afterInvoicePaid` / `afterSubscriptionRenewed`), never on `afterSubscriptionCreated` alone. HOSTED SUBSCRIPTION FORM ON IYZICO: iyzico takes the card only on its hosted subscription Checkout Form, so a subscribe (the raw route or a SubscriptionAction `subscribe`) answers a row `pending_provider` under the `providerSubscriptionId` `pending:checkout:<token>`, plus `checkoutForm` (`token`, `checkoutFormContent`, `paymentPageUrl`, `tokenExpireTime`) for the frontend to show. iyzico POSTs the token to the service's own `/v1/payments/subscription-checkout-return/<provider>` (derived from SERVICE_URL), which reads the result from iyzico, never from the body: ACTIVE makes the row `active` and fires `afterSubscriptionCreated` once; another reported status (`past_due`, `trialing`) is stored without that hook; a refusal is `provider_failed`. The buyer's email, name and surname come from `metadata.buyer` or the caller's session (400 SUBSCRIPTION_BUYER_EMAIL_REQUIRED without an email). A `pending_provider` row grants nothing. A cancel first reads the form from iyzico: a form that produced no subscription closes locally, a confirmed subscription is canceled at iyzico under its real reference, and a failed read or provider cancel leaves the row available for retry.

## Contained in

- [Subscription](./Subscription.md) as `configuration`

## Contains

- `lifecycleHooks`: [LifecycleHook](./LifecycleHook.md), a list

## References

- `planProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `customerProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `trialDaysProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `cancelAtPeriodEndProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `statusProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
