# CheckoutConfig

**Level:** `subsection` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [CheckoutConfig in Part 2](../spec/CheckoutConfig.md)

Configuration for provider-neutral one-time payments. Provider-binding is explicit via `providerName` (lookup into projectSettings.paymentProvidersSettings.paymentProviders[]). Property bindings (amount / currency / status / owner) are PropRefer paths into the parent DataObject. Lifecycle hooks replace the legacy edgeFunctionOnStatusChange / edgeFunctionPaymentDone / afterPaymentCreations fields — designers can author multiple per-trigger MScript handlers in one place. HOSTED-CHECKOUT RETURN: when the bound provider settles through a hosted checkout form (iyzico Checkout Form), the vendor callback ALWAYS points at the service's own `/v1/payments/checkout-return/<provider>` route, derived from SERVICE_URL and never from a request body. That route settles the ticket and then redirects the buyer 303 to the ticket's `metadata.returnUrl`, which is stamped from the `return_url` supplied in the payment user params of the START call. With no `return_url` there is nothing to redirect to and the route answers a minimal JSON confirmation (`ok`, `orderId`, `paymentId`, `paymentStatus`, `statusLiteral`, `requestId`) - documented behaviour, but the buyer's browser stops there, so the buyer's return to the application depends entirely on `return_url` being present. The mounted payment route takes it as `body.paymentUserParams.return_url` on `PATCH /v1/start<object>payment/:orderId`; an api that drives the flow with a start-stage PaymentAction takes it from its OWN declared requestParameters (PAYMENT_START_NO_CALLER_PARAMS is the design-time finding when it declares none). A buyer who pays on the hosted form but never comes back (tab closed) is settled the same way, once, from iyzico's Checkout Form webhook (`CHECKOUT_FORM_AUTH`) on `/v1/payments/webhook/<provider>`, which the merchant points at the service in iyzico's panel. 3-D SECURE RETURN: a saved-card iyzico start (3dsecure/initialize) sends the service's own `/v1/payments/threeds-return/<provider>` as the vendor callback, likewise derived from SERVICE_URL. iyzico posts the bank-challenge outcome there; the route resolves the ticket by the posted paymentId plus the attempt's conversationId, calls 3dsecure/auth itself (forwarding conversationData) when the bank reports mdStatus=1, settles the ticket success / failed / amount_mismatch, runs the payment lifecycle hooks, and redirects 303 to `metadata.returnUrl` with `orderId` and `status` query parameters (the same JSON confirmation without one). The start answer for that shape is not a redirect: the frontend renders `next_action.threeDSHtmlContent`. No designer-authored complete stage is involved for either iyzico shape. 3-D SECURE BY PROVIDER: Stripe completes in the browser (Stripe.js) and the generated webhook route records it, with no return route; Adyen completes through the generated `PATCH /v1/complete<object>payment/:orderId` route with the `details` Adyen Web returns; iyzico through the two return routes above. A design never authors a complete, callback or webhook stage for these three providers.

## Contained in

- [Checkout](./Checkout.md) as `configuration`

## Contains

- `mapPaymentResultToOrderStatus`: [PaymentResultMap](./PaymentResultMap.md)
- `orderItemRelation`: [StripeOrderItemRelation](./StripeOrderItemRelation.md)
- `lifecycleHooks`: [LifecycleHook](./LifecycleHook.md), a list

## References

- `orderIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `amountProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `currencyProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `orderStatusProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `orderStatusUpdateDateProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)
- `orderOwnerIdProperty` names an instance of [DataProperty](./DataProperty.md) (type [PropRefer](./PropRefer.md), chosen from `>basicSettings.name`)

## Referenced by

No property of another pattern names this pattern.
