# NotificationServiceOptions

**Level:** `section` · **Family:** [NotificationServiceSettings](./families.md#notificationservicesettings) (domain `NotificationService`)

**Specification:** [NotificationServiceOptions in Part 2](../spec/NotificationServiceOptions.md)

Default notification provider per channel plus storage policy. Provider names must resolve to entries in projectSettings.notificationProvidersSettings.notificationProviders[] of compatible `kind`. Each EventNotification may override the default via its own providerName.

## Contained in

- [NotificationServiceSettings](./NotificationServiceSettings.md) as `serviceOptions`

Blueprint paths:

- `notificationService.serviceSettings.serviceOptions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
