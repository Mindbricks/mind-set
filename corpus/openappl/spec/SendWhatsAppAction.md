# SendWhatsAppAction

**Level:** `section` · **Family:** [BusinessApiActionStore](../ontology/families.md#businessapiactionstore) (domain `BusinessApi`)

**Ontology:** [SendWhatsAppAction in Part 1](../ontology/SendWhatsAppAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md); the properties it declares apply here too.

Sends a WhatsApp Business message using a configured WhatsApp provider — either Meta WhatsApp Cloud API (provider='whatsapp') or Twilio's WhatsApp channel (provider='twilio' with kind='whatsapp'). Supports free-form text sends inside the 24-hour customer-service window AND template-based sends (mandatory outside the window). With `template` set the provider sends the approved template: Meta sends `{ type: 'template', template: { name, language: { code }, components } }`, Twilio sends `{ contentSid, contentVariables }` with no body. Without it the message is free-form text, which Meta (131047) and Twilio (63016) refuse outside the window after accepting the request - design-time warning WHATSAPP_FREEFORM_OUTSIDE_WINDOW. LANGUAGE NOTE: the template send is implemented by the nodejs, dotnet and java actions and providers; the other language targets still send free-form text (ports pending).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `provider` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the configured WhatsApp provider. Must match an entry in `projectSettings.notificationProvidersSettings.notificationProviders[].name` with `kind: 'whatsapp'` (or `kind: 'multi'`). The action handler imports the matching native-integration client from `_common/notification-providers/whatsapp/<resolvedProvider>` and calls `provider.send(payload)` directly. Required (REQUIRED_FIELD_MISSING) when the project declares a whatsapp-capable (whatsapp / multi) provider: there is no project-default fallback on this action. May be omitted only in a project that declares NO whatsapp provider: the action then sends to the built-in WhatsApp sink on every deployment, production included (wired at build time), validation warns once with WHATSAPP_FLOWS_GO_TO_SINK listing the action, and the service gets the mail sink coordinate (MAILSINK_*) on preview and stage. An unresolvable name throws `UnknownNotificationProvider`; a kind mismatch throws `IncompatibleProviderKind` at project-validation time. When the named provider's credentials are not set, the send goes to the built-in WhatsApp sink on the dev, preview and stage deployments (stored in the mail sink as a mail to `whatsapp-<digits>@whatsapp-sink.invalid`) and fails on production. |
| `subject` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional subject prefix for the message — combined with `body` when supported by the provider variant. Most WhatsApp clients ignore subject lines; safe to leave null. |
| `body` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that evaluates to the free-form message body. Used as the WhatsApp text payload when no `template` is set. Required for session-window sends. |
| `to` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | An MScript expression that resolves to the recipient phone in E.164 format (with or without the leading '+'). Must be a WhatsApp-opted-in number. |
| `from` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional sender override. For Twilio variant: a WhatsApp-enabled sender like 'whatsapp:+14155238886'; falls back to env-configured default. |
| `template` | `String` | no |  |  |  | Optional approved WhatsApp template. Required for sends outside the 24-hour customer-service window; absent, the message is sent as free-form text, which is delivered only inside the window (WHATSAPP_FREEFORM_OUTSIDE_WINDOW warning). For a Meta Cloud API provider it is the approved template name (`^[a-z0-9_]+$`, e.g. `order_shipped`); for a Twilio provider it is the Content SID (`^HX[0-9a-f]{32}$`). Case-sensitive and never rewritten; the format is checked against the resolved provider at design time (WHATSAPP_TEMPLATE_NAME_INVALID, ERROR). When set, `body` / `subject` are not sent. |
| `templateVariables` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript that resolves to the template parameters. Used only when `template` is set. For Meta it becomes `template.components`: an array of component objects (`[{ type: 'body', parameters: [...] }]`) is sent as is, and an array of plain values (`[this.order.number, this.order.trackingUrl]`) is the shorthand for the body text parameters {{1}}, {{2}}, ... in order. For Twilio it becomes `contentVariables` (JSON-stringified): an object (`{ '1': ..., '2': ... }`) as is, an array numbered from 1. |
| `templateLanguage` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript that resolves to the Meta template language code (`'en'`, `'tr'`, `'pt_BR'`, or a per-recipient read such as `this.customer.language`). Used only when `template` is set; empty or null means `en`. Twilio ignores it (a Content SID names one language). |

## Constraints

Property rules:

- `body`, `to` must be present. (`REQUIRED_FIELD_MISSING`)
- `provider` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

## Example

Use to send a WhatsApp Business message — free-form text inside the 24h session window, or a registered template (with variables) for re-engagement outside it.

```json
{
  "name": "sendShippingWhatsApp",
  "description": "Send a templated shipping-update WhatsApp with order number and tracking link.",
  "provider": "metaWhatsapp",
  "to": { "js": "this.customer.phone" },
  "template": "shipping_update",
  "templateLanguage": { "js": "'en'" },
  "templateVariables": { "js": "[this.order.number, this.order.trackingUrl]" }
}
```
