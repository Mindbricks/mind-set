# EventDataSettings

**Level:** `section` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [EventDataSettings in Part 2](../spec/EventDataSettings.md)

Defines how the event notification extracts and processes data from incoming Kafka messages. This includes the data source, paths to relevant information, and any additional data to include in the notification.

## Contained in

- [EventNotification](./EventNotification.md) as `eventDataSettings`

Blueprint paths:

- `notificationService.eventNotifications.eventDataSettings`

## Contains

- `includeData`: [DataMapItem](./DataMapItem.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
