# NotificationProvidersSettings

**Level:** `section` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [NotificationProvidersSettings in Part 1](../ontology/NotificationProvidersSettings.md)

Container for notification provider configurations (email, SMS, push, Telegram, WhatsApp). Each entry is a named provider that can be referenced by EventNotification.providerName, sendMailAction.provider, sendSmsAction.provider, sendPushNotificationAction.provider, and sendWhatsAppAction.provider. The generator emits NOTIFICATION_PROVIDER_<NAME>_* environment variables per provider so service code can construct an SDK client at runtime without revisiting the project config. Mail has a BUILT-IN fallback: if a selected email provider's credentials are incomplete at runtime, the framework sinks the message into a mock SMTP endpoint rather than failing, so mail flows are exercisable in preview without a real mailbox. The sink is framework-owned — it is never declared in this list — so declare your real provider (or none) and add no placeholder entry. A message to a RESERVED non-deliverable recipient (an email domain under .invalid, .test, .example or .localhost, example.com / example.net / example.org, or a phone number in the fiction ranges +1 NXX 555-0100..0199 and +44 7700 900000..900999) is always stored in the channel's built-in sink and never handed to a real provider, on every deployment including production, so demo data cannot get a provider account flagged for bounces.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `notificationProviders` | [`NotificationProvider`](./NotificationProvider.md)[] | no |  |  |  | List of configured notification providers. Add one entry per messaging account you want available. Multiple entries can share the same provider type (e.g. two Twilio accounts, or one Twilio for SMS and one for WhatsApp). |

## Constraints

Property rules:

- The items of `notificationProviders` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
