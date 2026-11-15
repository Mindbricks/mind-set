# NotificationServiceSettings

**Level:** `chapter` · **Family:** [NotificationServiceSettings](../ontology/families.md#notificationservicesettings) (domain `NotificationService`)

**Ontology:** [NotificationServiceSettings in Part 1](../ontology/NotificationServiceSettings.md)

Defines the basic notification configuration for the project. Provider credentials live under projectSettings.notificationProvidersSettings.notificationProviders[]; this chapter only holds module-level UX prompt and default-provider-name selection.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `documentation` | [`ModuleDocumentation`](./ModuleDocumentation.md) | no |  |  |  | Module-level frontend UX prompt for notification centers, bell icons, toasts, read/unread presentation, categorization and email style. It does not configure backend notification delivery. |
| `serviceOptions` | [`NotificationServiceOptions`](./NotificationServiceOptions.md) | yes |  |  |  | Defines the default notification provider per channel and storage policy. References entries in projectSettings.notificationProvidersSettings.notificationProviders[] by name. |

## Constraints

Property rules:

- `serviceOptions` must be present. (`REQUIRED_FIELD_MISSING`)
