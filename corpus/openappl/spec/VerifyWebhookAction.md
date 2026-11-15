# VerifyWebhookAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [VerifyWebhookAction in Part 1](../ontology/VerifyWebhookAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Verifies a webhook call of a provider with its signature secret and reads the parameters and writes them to the context. The bound provider is selected by `providerName` (lookup into projectSettings.paymentProvidersSettings.paymentProviders[]); the verification scheme (hmac / rsa-pub / cert / signature) is derived from the provider's PaymentCapabilities.webhookStyle. A 'refetch' provider (Mangopay) sends unsigned GET hooks and has no signature to verify, so this action refuses it; its hooks are received by the generated GET /v1/payments/webhook/<provider> route. The legacy `provider: 'stripe'` field is preserved for back-compat with pre-PaymentProvider-refactor configs. Payment-lifecycle webhooks need no api: the generated `/v1/payments/webhook/<provider>` route verifies them, stores the event and runs the lifecycle hooks. An authored api running this action cannot drive payment stages either (PaymentAction `complete` / `refresh` / `callback` refuse an anonymous caller), so use it only for a provider notification the design consumes outside the payment lifecycle.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Lookup key into projectSettings.paymentProvidersSettings.paymentProviders[].name. Selects which adapter verifies this webhook. When null/omitted, falls back to the legacy `provider` field. |
| `secretKey` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | An MScript value to represent or to reach the secret key of the webhook signature. Kept for back-compat; new designs let the framework resolve the secret from the PaymentProvider entry's configuration block automatically. |

## Constraints

Property rules:

- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use at the top of a provider-webhook API to verify the inbound call's signature against the bound PaymentProvider and place the parsed event on context for subsequent handling.

```json
{
  "name": "verifyStripeWebhook",
  "description": "Verify the incoming Stripe webhook signature and expose the parsed event.",
  "providerName": "stripeMain",
  "contextPropertyName": "webhookEvent"
}
```
