# PaymentAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [PaymentAction in Part 2](../spec/PaymentAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Calls the proper native payment provider functions according to the current stage of payment lifecycle. The bound provider is selected by `providerName` (lookup into projectSettings.paymentProvidersSettings.paymentProviders[]). The legacy `gateway` field is preserved for back-compat with pre-PaymentProvider-refactor configs — when only `gateway` is set, it resolves to a `legacyStripe` provider via the runtime compat shim. WHERE THE CALLER'S PAYMENT CONTROLS COME FROM: a `start` stage builds the provider intent from the OWNING API'S BOUND REQUEST PARAMETERS - the emitted action spreads that request-parameter blob into the intent input and PaymentManager reads `return_url`, `paymentMethodId` and `providerOptions` off it. The money facts (amount / currency / orderId / customer) come from the parent DataObject's checkout block bindings against the PERSISTED order row, never from the caller, so those three keys are the only values a caller ever contributes. An api that declares no requestParameter at a caller-supplied `httpLocation` (`body`, or `query` on a bodyless method) can receive none of them - design-time finding PAYMENT_START_NO_CALLER_PARAMS. The consequence that bites hardest is `return_url`: with a hosted-checkout provider (iyzico Checkout Form) the buyer's browser leaves for the provider and returns to the service's own `/v1/payments/checkout-return/<provider>` route, which redirects 303 to the ticket's `metadata.returnUrl` - stamped from `return_url` at start - and, when the ticket carries none, answers a minimal JSON confirmation instead. That JSON is documented behaviour, not an error: the payment succeeds and the buyer's browser simply stops on it. An iyzico saved card's 3-D Secure ends the same way on the generated `/v1/payments/threeds-return/<provider>` route, which calls 3dsecure/auth itself, so an iyzico design authors no `complete` stage. Neither does a Stripe design (Stripe.js finishes the intent and the generated webhook route records it) nor an Adyen design (its details step is the generated `PATCH /v1/complete<object>payment/:orderId` route); of the native providers only PayPal's capture after the buyer approved needs an authored `complete` stage.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `paymentActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.paymentActions`
- `services.businessLogic.actions.paymentActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
