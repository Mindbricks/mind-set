# VerifyWebhookAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [VerifyWebhookAction in Part 2](../spec/VerifyWebhookAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Verifies a webhook call of a provider with its signature secret and reads the parameters and writes them to the context. The bound provider is selected by `providerName` (lookup into projectSettings.paymentProvidersSettings.paymentProviders[]); the verification scheme (hmac / rsa-pub / cert / signature) is derived from the provider's PaymentCapabilities.webhookStyle. A 'refetch' provider (Mangopay) sends unsigned GET hooks and has no signature to verify, so this action refuses it; its hooks are received by the generated GET /v1/payments/webhook/<provider> route. The legacy `provider: 'stripe'` field is preserved for back-compat with pre-PaymentProvider-refactor configs. Payment-lifecycle webhooks need no api: the generated `/v1/payments/webhook/<provider>` route verifies them, stores the event and runs the lifecycle hooks. An authored api running this action cannot drive payment stages either (PaymentAction `complete` / `refresh` / `callback` refuse an anonymous caller), so use it only for a provider notification the design consumes outside the payment lifecycle.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `verifyWebhookActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.verifyWebhookActions`
- `services.businessLogic.actions.verifyWebhookActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
