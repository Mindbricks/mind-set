---
title: SendWhatsAppAction
---

# SendWhatsAppAction

`SendWhatsAppAction` sends a WhatsApp Business message via a configured native notification provider. Two provider variants are supported: **Meta WhatsApp Cloud API** (`provider: "whatsapp"`) and **Twilio's WhatsApp channel** (`provider: "twilio"` with `kind: "whatsapp"`). Free-form text inside the 24-hour customer-service window and registered-template sends for re-engagement are both supported.

## When to use it

- Reply to a customer within the 24-hour session window with free-form text.
- Re-engage outside the session window via a Business-Manager-approved template.
- Send a transactional confirmation (delivery, appointment, OTP) when WhatsApp is the customer's preferred channel.

For email, SMS, or push use the sibling actions: [`SendMailAction`](./send-mail-action.md), [`SendSmsAction`](./send-sms-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md).

A null, undefined, empty, or whitespace-only `to` is refused with
`ApiError(400, 'Notification recipient is empty')` before provider setup or sending.
The recipient expression is evaluated once, and a non-empty recipient is sent
as a string.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `provider` | `String` | ◐ | Codename of the configured WhatsApp provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: "whatsapp"` (or `kind: "multi"`). Required (`REQUIRED_FIELD_MISSING`) when the project declares a whatsapp or `multi` provider; there is no fallback to a project default. May be omitted only in a project that declares no whatsapp provider: the action then sends to the built-in WhatsApp sink on every deployment, production included, and validation warns once with `WHATSAPP_FLOWS_GO_TO_SINK`. |
| `subject` | `MScript` |   | Optional subject prefix. Most WhatsApp clients ignore it: safe to leave null. |
| `body` | `MScript` | ✓ | Expression evaluating to the free-form message body. Used as the WhatsApp text payload when no `template` is set. Required for session-window sends. |
| `to` | `MScript` | ✓ | Expression evaluating to the recipient phone in E.164 format (with or without the leading `+`). Must be a WhatsApp-opted-in number. |
| `from` | `MScript` |   | Optional sender override. For the Twilio variant: a WhatsApp-enabled sender like `"whatsapp:+14155238886"`; falls back to the deployment-configured default when omitted. |
| `template` | `String` |   | Optional WhatsApp Business Manager template name. Required for sends outside the 24-hour customer-service window. Without a template the message is sent as free-form text inside the session window. Meta expects the registered template name; Twilio expects the `contentSid` of a template registered in the Twilio console. |
| `templateVariables` | `MScript` |   | Optional expression evaluating to the template parameters: an array (Meta) or a JSON-stringifiable object (Twilio). Used only when `template` is set. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

Two message modes:

- **Free-form text**: set `body`, leave `template` unset. Only delivers inside the 24-hour customer-service window (the WhatsApp business policy).
- **Template send**: set `template` (+ optional `templateVariables`). Required to re-engage a user outside the session window. Provider-specific:
  - Meta Cloud API: `template` is the registered template name; `templateVariables` is the array of parameter values.
  - Twilio: `template` is the `contentSid` of a registered template; `templateVariables` is a JSON-stringifiable object of variables.

At runtime the action:

1. Resolves `provider` to an entry in `notificationProvidersSettings.notificationProviders[]` at compile time. With no `provider` in a project that declares no whatsapp provider, it resolves to the built-in last-resort `__whatsappsink__` entry instead (nothing is decided at runtime). If a named provider has no match, the action logs a runtime warning and is a no-op; project validation reports that name as `UNKNOWN_NOTIFICATION_PROVIDER`.
2. Lazily constructs the provider adapter bound to that entry. Credentials come from the per-provider settings supplied by the deployment.
3. Sends the resolved subject, body, to/from through the provider. When `template` is set, the template name (Meta) or `contentSid` (Twilio) and `templateVariables` travel in the message metadata.

A real provider failure throws `NotificationSendError`; the workflow stage wrapper handles it per `onActionError`.

## Examples

In-session free-form reply:

```json
{
  "name": "replyInSession",
  "provider": "whatsapp",
  "body": { "js": "`Your order ${this.order.code} is on the way.`" },
  "to": { "js": "this.customer.phone" }
}
```

Template re-engagement (Meta variant) outside the session window:

```json
{
  "name": "sendShippingNudge",
  "provider": "whatsapp",
  "to": { "js": "this.customer.phone" },
  "template": "shipping_nudge_v3",
  "templateVariables": { "js": "[this.customer.firstName, this.order.code]" }
}
```

Template send via Twilio:

```json
{
  "name": "sendAppointmentReminder",
  "provider": "twilio_wa",
  "to": { "js": "this.patient.phone" },
  "from": { "js": "'whatsapp:+14155238886'" },
  "template": "HX1234567890abcdef",
  "templateVariables": { "js": "{ 1: this.patient.firstName, 2: this.appointment.time }" }
}
```

## Errors

- `provider` not found in `notificationProvidersSettings.notificationProviders[]`: project validation reports `UNKNOWN_NOTIFICATION_PROVIDER` (a wrong `kind` is `INCOMPATIBLE_PROVIDER_KIND`); if generated anyway, the action logs a runtime warning and returns `false` (no-op).
- Free-form send to a number outside the session window: rejected by the provider; surfaced via `onActionError`.
- Recipient not opted in: rejected by the provider.
- Provider send failure: `NotificationSendError`; surfaced via `onActionError`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`SendMailAction`](./send-mail-action.md), [`SendSmsAction`](./send-sms-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md): sibling notification actions.
- WhatsApp providers (Meta, Twilio): [notification providers](../providers/notification.md).
