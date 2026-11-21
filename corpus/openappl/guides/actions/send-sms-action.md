---
title: SendSmsAction
---

# SendSmsAction

`SendSmsAction` sends an SMS via a configured native notification provider (Twilio, Vonage, NetGSM, ...). Recipient phone, body, and sender id are MScript expressions built from context. The action is a native integration: provider selection happens at design time by codename, and the action talks to the provider directly.

## When to use it

- OTPs / verification codes.
- Critical operational alerts where email or push is too slow.
- Short transactional notifications (delivery on its way, ride arriving, appointment reminder).

For email, push, or WhatsApp use the sibling actions: [`SendMailAction`](./send-mail-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md). All four share the same provider-lookup shape.

A null, undefined, empty, or whitespace-only `to` is refused with
`ApiError(400, 'Notification recipient is empty')` before provider setup or sending.
The recipient expression is evaluated once, and a non-empty recipient is sent
as a string.

## Configuration

| Property | Type | Req | Description |
|---|---|---|---|
| `provider` | `String` | ◐ | Codename of the configured SMS provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: "sms"` (or `kind: "multi"`). Required (`REQUIRED_FIELD_MISSING`) when the project declares a sms or `multi` provider; there is no fallback to a project default. May be omitted only in a project that declares no sms provider: the action then sends to the built-in SMS sink on every deployment, production included, and validation warns once with `SMS_FLOWS_GO_TO_SINK`. |
| `subject` | `MScript` | ✓ | Optional subject line, used by providers that support it for categorization or template labeling. Most providers ignore the field: required by the schema but safe to leave as a placeholder. |
| `body` | `MScript` | ✓ | Expression evaluating to the message body. Keep it short and plaintext-friendly. |
| `to` | `MScript` | ✓ | Expression evaluating to the recipient phone number in E.164 format (e.g., `"+12025550110"`). |
| `from` | `MScript` |   | Sender identifier: short code or alphanumeric sender name, depending on provider capabilities. |

Plus the [`BusinessApiAction`](../../spec/BusinessApiAction.md) base properties.

## Behaviour

At runtime the action:

1. Resolves `provider` to an entry in `notificationProvidersSettings.notificationProviders[]` at compile time. With no `provider` in a project that declares no sms provider, it resolves to the built-in last-resort `__smssink__` entry instead (nothing is decided at runtime). If a named provider has no match, the action logs a runtime warning and is a no-op; project validation reports that name as `UNKNOWN_NOTIFICATION_PROVIDER`.
2. Lazily constructs the provider adapter bound to that entry. Credentials come from the per-provider settings supplied by the deployment.
3. Sends the resolved subject, body, to/from through the provider.

No Kafka hop, no interservice call: the send happens inline. A real provider failure throws `NotificationSendError`; the workflow stage wrapper handles it per `onActionError`.

## Example

```json
{
  "name": "sendOtp",
  "provider": "twilio",
  "subject": { "js": "'OTP'" },
  "body": { "js": "`Your verification code is ${this.code}. Valid for 5 minutes.`" },
  "to": { "js": "this.user.phone" },
  "from": { "js": "'Acme'" }
}
```

## Errors

- `provider` not found in `notificationProvidersSettings.notificationProviders[]`: project validation reports `UNKNOWN_NOTIFICATION_PROVIDER` (a wrong `kind` is `INCOMPATIBLE_PROVIDER_KIND`); if generated anyway, the action logs a runtime warning and returns `false` (no-op).
- Phone in non-E.164 format: typically rejected by the provider; surfaces via `onActionError`.
- Provider send failure: `NotificationSendError`; surfaced via `onActionError`.

## See also

- [`BusinessApiAction`](../../spec/BusinessApiAction.md): parent class.
- [`SendMailAction`](./send-mail-action.md), [`SendPushNotificationAction`](./send-push-notification-action.md), [`SendWhatsAppAction`](./send-whatsapp-action.md): sibling notification actions.
- SMS providers (Twilio, Vonage, Netgsm, Amazon SNS): [notification providers](../providers/notification.md).
