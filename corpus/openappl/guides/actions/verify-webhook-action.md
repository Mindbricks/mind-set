---
title: VerifyWebhookAction
---

# VerifyWebhookAction

`VerifyWebhookAction` verifies the signature on an inbound webhook from a native payment provider and writes the verified, normalized event to the workflow context. When a Business API of yours receives a provider webhook, run it as the **first** action, so every later action can trust that the payload came from the bound provider.

> **Payment-lifecycle webhooks need no API.** The service generates
> `POST /v1/payments/webhook/<providerName>` for every payment provider entry.
> That route verifies the signature, stores the event in `sys_paymentEvent`,
> moves the payment, subscription, dispute and payout state machines, and
> runs your `lifecycleHooks`
> ([webhook routing](../capabilities/payment-workflow.md#webhook-routing)).
> Use this action only for a provider notification your design consumes
> outside that lifecycle, and do not run payment stages after it: a
> `PaymentAction` with stage `complete`, `refresh` or `callback` requires the
> order owner's session, so an anonymous provider call is refused
> (`401 LOGIN_REQUIRED`). See
> [3-D Secure and buyer redirects](../capabilities/payment-3ds-and-redirects.md)
> for how each provider's payment completes.

Distinguish from [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md): that action signs *our* outbound data with the project's Ed25519 key; `VerifyWebhookAction` verifies an inbound signature *they* produced.

## When to use it

- Consume a payment-provider notification that the generated webhook route does not act on (for example an event the adapter normalizes to `eventType: "unknown"`, which the payment layer records but which moves no state), and gate your own downstream actions on its signature.
- Not for payment completion, captures, refunds, subscriptions, disputes or payouts: the generated webhook route already handles those events.
- The action verifies with the provider entry's own configured secret (see `secretKey` below), so the provider must sign the delivery to your API with that same secret.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `providerName` | `String` |   | The canonical lookup key into `projectSettings.paymentProvidersSettings.paymentProviders[].name`. Read **first**. |
| `provider` | `String` |   | An alternative spelling of the same thing, used only when `providerName` is null. |
| `secretKey` | `MScript` |   | **Advisory, and ignored.** The expression is evaluated and handed to the verifier, but the verifier never reads it: signature material belongs to the configured adapter, which holds the endpoint secret the webhook-registration flow stored for it. You do not need to set it, and setting it cannot make an unconfigured provider verifiable. |

The lookup is `action.providerName ?? action.provider ?? 'default'`. Set at least one of the two: `"default"` is not a real provider name, and the registry refuses it (see **Errors**).

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

At runtime the action:

1. Evaluates `secretKey` MScript against the current context (advisory, see above).
2. Calls the shared webhook verifier with `(providerName, request, secret)`.
3. Resolves the adapter from the payment provider registry. An unconfigured name refuses here.
4. **Step 0: asks whether this adapter can verify anything at all.** If the adapter reports itself unverifiable, the action refuses *before* any signature is examined. See **Errors**.
5. Runs the adapter's `verifyWebhook` and refuses if it fails. When it passes and the adapter also has an async `verifyWebhookAsync` (PayPal, whose documented verification is a call to PayPal's `/v1/notifications/verify-webhook-signature`), that check is always awaited too, exactly as the payment webhook router does. PayPal's sync `verifyWebhook` only checks that the five `PayPal-*` headers are present and the body is JSON, so on its own it would accept a forged webhook.
6. Returns `parseWebhook(...)`, the normalized event, into `contextPropertyName`.

### Raw body

The verifier prefers `request.rawBody`, the unparsed request body captured before JSON parsing, and falls back to `JSON.stringify(request.body)` when it is absent. Byte-exact schemes (Stripe) will correctly fail on the fallback unless the adapter is in local/mock mode. If verification fails for a payload you believe is genuine, check that raw-body retention is on before suspecting the key.

Scoped to providers registered in the payment provider registry (Stripe, PayPal, Adyen, ...). For a webhook from a sender that is not a registered payment provider, use a custom `FunctionCallAction`.

## Example

A Business API that verifies first, then hands an event the payment layer does not map to a library function. `providerName` is the name of the entry in `paymentProviders[]`, not the brand. The action's result is the normalized event (`providerEventId`, `eventType`, `occurredAt`, `resource`, `rawPayload`):

```json
"actions": {
  "verifyWebhookActions": [
    {
      "name": "verifyStripeSignature",
      "providerName": "stripeProd",
      "contextPropertyName": "event"
    }
  ],
  "functionCallActions": [
    {
      "name": "relayUnmappedEvent",
      "condition": { "js": "this.event.eventType === 'unknown'" },
      "callScript": { "js": "LIB.relayProviderNotification(this.event.providerEventId, this.event.rawPayload)" }
    }
  ]
}
```

## Errors

Every refusal is a thrown `PaymentGateError`, carrying `providerName` and a numeric `code`. The action does not catch it, so the API aborts and no downstream action runs.

| `code` | Message | When |
|---|---|---|
| `401` | `webhook_verification_unconfigured: <detail>` | **Step 0.** The adapter reports that it cannot verify anything (its `webhookVerificationUnavailable()` returned non-null). Only `stripe` and `adyen` implement it, and it fires when their signing secret is absent: the NORMAL state right after a deploy, because the webhook-registration API stores the secret afterwards. The `<detail>` names the setting to supply. Nothing is compared against anything; this is deliberately *not* reported as a signature failure, because a process with no key never examined one. |
| `401` | `Webhook signature verification failed` | A signature WAS examined and did not check out: the adapter's `verifyWebhook` returned false, or it passed and the adapter's `verifyWebhookAsync` (when it has one) returned false. Covers a missing/malformed signature header, a body that does not match, a wrong secret, and a PayPal webhook that PayPal's verify-webhook-signature call does not answer `SUCCESS`. |
| `401` | `async_verification_error` | The adapter's `verifyWebhookAsync` threw (for PayPal: the verify call could not be made). The webhook is refused, never accepted unverified; the thrown text goes nowhere near the caller. |
| `404` | `Payment provider "<name>" is not configured. Configured providers: ...` | The resolved name is not in `projectSettings.paymentProvidersSettings.paymentProviders[]`. This is what a `VerifyWebhookAction` with neither `providerName` nor `provider` hits: the lookup falls back to `"default"`, which is not a real provider. |
| `500` | `No adapter registered for provider type "<type>"` | The manifest entry names a provider type for which no adapter is available. |

The two `401`s are a deliberate split: "I have no key" and "your signature is wrong" send an operator to completely different places. The payment webhook ROUTER makes the same distinction on its own leg, where they surface as problem+json with `errorCode` `SIGNATURE_UNVERIFIABLE` and `SIGNATURE_INVALID`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`PaymentAction`](./payment-action.md), [`RefundAction`](./refund-action.md), [`SubscriptionAction`](./subscription-action.md), [`PayoutAction`](./payout-action.md): payment-domain actions. Their webhook events arrive on the generated webhook route, not through this action.
- [`SignDataWithProjectKeyAction`](./sign-data-with-project-key-action.md): outbound signing of *our* messages.
- [`PaymentProvider`](../../spec/PaymentProvider.md), [`PaymentCapabilities`](../../spec/PaymentCapabilities.md).
- [Payment workflow](../capabilities/payment-workflow.md).
- [3-D Secure and buyer redirects](../capabilities/payment-3ds-and-redirects.md).
