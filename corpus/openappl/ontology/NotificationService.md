# NotificationService

**Level:** `module` · **Family:** [NotificationService](./families.md#notificationservice)

**Specification:** [NotificationService in Part 2](../spec/NotificationService.md)

Defines the global notification configuration for the project. Includes provider defaults (under NotificationServiceSettings.serviceOptions) and event-driven notification behaviors. Geofences are NOT declared here — they are runtime data managed via the GeoFence DataObject emitted by the notification factory; EventNotifications match fences at runtime via fenceTags / fenceFilter (see GeofenceTrigger).

## Contained in

- [Project](./Project.md) as `notificationService`

Blueprint paths:

- `notificationService`

## Contains

- `serviceSettings`: [NotificationServiceSettings](./NotificationServiceSettings.md)
- `eventNotifications`: [EventNotification](./EventNotification.md), a list
- `whatsappIngress`: [WhatsAppIngressSettings](./WhatsAppIngressSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
