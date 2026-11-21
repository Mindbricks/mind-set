---
title: IntegrationAction
---

# IntegrationAction

Calls a named method on a **general** (catalogue) integration provider. The provider is identified by its key (e.g. `amazonS3`, `maptiler`); the method name (e.g. `putObject`, `geocodeForward`) matches a verb the provider's adapter exposes.

`IntegrationAction` is the generic escape hatch. **Native** integrations have dedicated action types: do not use `IntegrationAction` for them:

- payments: [`PaymentAction`](./payment-action.md), [`RefundAction`](./refund-action.md), [`PayoutAction`](./payout-action.md), [`SubscriptionAction`](./subscription-action.md)
- email: [`SendMailAction`](./send-mail-action.md)
- SMS: [`SendSmsAction`](./send-sms-action.md)
- push: [`SendPushNotificationAction`](./send-push-notification-action.md)
- WhatsApp: [`SendWhatsAppAction`](./send-whatsapp-action.md)
- AI / LLM: [`AiCallAction`](./ai-call-action.md)
- bucket reads/writes: emitted directly by the data object's [`RemoteBucket`](../composition/remote-buckets.md) / [`DbBucket`](../composition/db-buckets.md) patterns

## When to use it

- Talk to a third-party API that is modelled in the project's integration catalogue.
- Re-use shared configuration (credentials, endpoint, defaults) declared once at the catalogue level.
- For unmodelled APIs use [`ApiCallAction`](./api-call-action.md): free-form HTTP without the catalogue.

## Configuration

Inherits the common fields from [`BusinessApiAction`](../../spec/BusinessApiAction.md).

| Property | Type | Req | Description |
|---|---|---|---|
| `provider` | `String` | yes | Provider key matching a row in the project's integration catalogue. |
| `action` | `String` | yes | Method name exposed by the provider's adapter (e.g. `putObject`, `geocodeForward`). |
| `parameters` | `IntegrationParameter[]` | no | Named inputs to pass to the method. |

`IntegrationParameter` fields:

| Property | Type | Req | Description |
|---|---|---|---|
| `parameterName` | `String` | yes | The argument name expected by the method. |
| `parameterValue` | `MScript` | yes | Expression yielding the argument value (from `this`, session, parameters, or prior actions). |

## Behaviour

The action:

1. Builds the parameter object by evaluating each `parameters[i].parameterValue` and binding it under `parameters[i].parameterName`.
2. **Resolves an integration client by integration NAME.** An integration entry's `name` defaults to its `provider`, so a project that never names an integration is keyed by provider. Each name has its own configuration and its own client instance. The action's `provider` is resolved to a name at build time: an integration NAMED so wins, else the one integration of that provider. A client registered for a provider serves every integration of that provider, each constructed with its own configuration; a client registered under a name serves that integration only. When a client resolves, the action asks it to execute `action` with the parameter object and returns its result.
3. **Falls back to the project's mcpbff service.** When no in-process client is available for the service, the call is made over the signed machine-to-machine bridge to the project's mcpbff service with the SAME resolved name, which resolves the catalogue adapter and executes the action there. The mcpbff host is keyed by the same NAME: it carries one row per referenced integration name, and each name has its own configuration. The catalogue class is registered once per provider and serves every name of that provider, each constructed with its own configuration. A bare provider reaches its integration only when that provider has exactly one integration; a bare provider shared by two or more names is ambiguous and answers "not hosted" (404).
4. Returns the call result. It is stored on `this.<contextPropertyName>` (when set) and added to the response when `writeToResponse` is true.

The action does not care which underlying transport the adapter uses (REST, SDK, gRPC), or which of the two paths above resolved it: only that the integration client's adapter exposes a single `execute(action, params)` entry. Neither path calls a named method directly, so an adapter with no `execute` would fail only at runtime; the catalogue therefore refuses to make such an adapter `active` (`INTEGRATION_ADAPTER_NO_EXECUTE`).

## Example

Upload a file via the catalogue-configured Amazon S3 integration:

```json
{
  "name": "uploadInvoice",
  "writeToResponse": false,
  "contextPropertyName": "uploadInfo",
  "provider": "amazonS3",
  "action": "putObject",
  "parameters": [
    { "parameterName": "bucket",      "parameterValue": { "js": "process.env.INVOICE_BUCKET" } },
    { "parameterName": "key",         "parameterValue": { "js": "`invoices/${this.order.id}.pdf`" } },
    { "parameterName": "body",        "parameterValue": { "js": "this.invoicePdf" } },
    { "parameterName": "contentType", "parameterValue": { "js": "'application/pdf'" } }
  ]
}
```

Geocode an address:

```json
{
  "name": "geocodeShipping",
  "writeToResponse": false,
  "contextPropertyName": "geo",
  "provider": "maptiler",
  "action": "geocodeForward",
  "parameters": [
    { "parameterName": "query", "parameterValue": { "js": "this.order.shippingAddress.formatted" } }
  ]
}
```

## Errors

- Unknown `provider` or `action` throws from the integration client: the catalogue row or method name does not exist.
- Adapter-level failures (auth, rate limit, 4xx/5xx) propagate per `onActionError`. Use `completeApi` to surface them on `this.<actionName>Error`.

## See also

- [`ApiCallAction`](./api-call-action.md): free-form HTTP without the catalogue
- [`IntegrationParameter`](../../spec/IntegrationParameter.md)
- [External service integration](../capabilities/external-service-integration.md)
