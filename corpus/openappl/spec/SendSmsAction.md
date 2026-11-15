# SendSmsAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SendSmsAction in Part 1](../ontology/SendSmsAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Sends an SMS message using a configured SMS provider. The recipient phone number, message content, and sender ID are defined using MScript expressions. Useful for OTPs, short notifications, or alerts.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the configured SMS provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: 'sms'` (or `kind: 'multi'`). The action handler imports the matching native-integration client from `_common/notification-providers/sms/<resolvedProvider>` and calls `provider.send(payload)` directly — no kafka hop, no interservice call. Required (REQUIRED_FIELD_MISSING) when the project declares an sms-capable (sms / multi) provider. May be omitted only in a project that declares NO sms provider: the action then sends to the built-in SMS sink on every deployment, production included (wired at build time), and validation warns once with SMS_FLOWS_GO_TO_SINK. An unresolvable name throws `UnknownNotificationProvider`; a kind mismatch throws `IncompatibleProviderKind` at project-validation time. A service whose action sends to the SMS sink this way gets the mail sink coordinate (MAILSINK_PORT / MAILSINK_USER / MAILSINK_PASS) on preview and stage like a notification-sending service, so nothing is configured for it. |
| `subject` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | Optional subject line, if supported by the SMS provider. Otherwise ignored. Can be used for internal categorization or template labeling. |
| `body` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the message body. This should be a short, plaintext message suitable for mobile delivery. |
| `to` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that resolves to the recipient's phone number (in international format). |
| `from` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | The sender identifier, either a short code or alphanumeric sender name, depending on provider capabilities. |

## Constraints

Property rules:

- `subject`, `body`, `to` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `REQUIRED_FIELD_MISSING` | error | provider is required: this project declares an sms provider, so name it here. |

## Example

Use to send a short SMS via a configured provider — OTPs, delivery alerts, reminders — to a phone number in international format.

```json
{
  "name": "sendOtpSms",
  "description": "Text the one-time verification code to the user's phone.",
  "provider": "twilioSms",
  "to": { "js": "this.data.phone" },
  "from": { "js": "'Example'" },
  "body": { "js": "`Your Example verification code is ${this.otpCode}. It expires in 5 minutes.`" }
}
```
