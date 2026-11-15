# NotificationServiceOptions

**Level:** `section` · **Family:** [NotificationServiceSettings](../ontology/families.md#notificationservicesettings) (domain `NotificationService`)

**Ontology:** [NotificationServiceOptions in Part 1](../ontology/NotificationServiceOptions.md)

Default notification provider per channel plus storage policy. Provider names must resolve to entries in projectSettings.notificationProvidersSettings.notificationProviders[] of compatible `kind`. Each EventNotification may override the default via its own providerName.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `storedNotice` | `Boolean` | no | `false` |  |  | Determines whether notifications will be persisted and listed within the app. If true, notifications are stored in the database and can be retrieved later. If false, they are sent transiently and not stored. Disabling storage can improve performance in simple use cases where tracking historical notifications is unnecessary. |
| `notificationLogRetentionDays` | `Integer` | no | `7` |  |  | Retention window in days for the ES-backed notificationLog index (slice 9.5). Every send attempt across every channel is logged here for the admin audit view; older rows are deleted by an ILM policy / daily cleanup job. Default 7. Set to 0 to disable retention enforcement (logs live forever — only safe with external ES housekeeping). |
| `logRetentionDays` | `Integer` | no | `null` |  | min 1 | Database retention window in days for notificationLog delivery-attempt rows. A positive integer enables an hourly, single-replica sweep that hard-deletes older log rows in bounded batches. Unset or null keeps database logs indefinitely and emits no sweep. New projects start with 90 days; loading an existing project never opts it in. Rendered subject and body are not truncated, and in-app notification rows are never deleted by this setting. The separate notificationLogRetentionDays setting still controls Elasticsearch retention. |
| `defaultEmailProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the default email-channel provider for this project. Must match a notificationProviders[] entry with kind='email' (or kind='multi'). |
| `defaultSmsProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the default SMS-channel provider. Must match a notificationProviders[] entry with kind='sms' (or kind='multi'). |
| `defaultPushProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the default push-channel provider. Must match a notificationProviders[] entry with kind='push' (or kind='multi'). |
| `defaultTelegramProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the default Telegram-channel provider. Must match a notificationProviders[] entry with kind='telegram'. |
| `defaultWhatsappProviderName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Codename of the default WhatsApp-channel provider. Must match a notificationProviders[] entry with kind='whatsapp'. |

## Constraints

Property rules:

- `defaultEmailProviderName`, `defaultSmsProviderName`, `defaultPushProviderName`, `defaultTelegramProviderName`, `defaultWhatsappProviderName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- `logRetentionDays` must be at least 1. (`VALUE_OUT_OF_RANGE`)
