# EventNotification

**Level:** `chapter` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [EventNotification in Part 2](../spec/EventNotification.md)

Defines a single event-triggered notification within the project. The trigger is either a Kafka topic (triggerSource='kafka', the default — eventDataSettings.channel names the topic) or a geofence crossing (triggerSource='geofence' — geofenceTrigger names the fences + action). Delivered as email, SMS, push, telegram, whatsapp, or in-app message depending on jobType. Both MScript condition slots, the event-level eventDataSettings.condition and each NotificationTarget.condition, evaluate against the SAME null-normalized receiver: `this.payload`, `this.dataSource`, `this.old`, `this.actor` and `this.metadata` each read as an empty object when the event does not carry them, and a chain rooted at one of those five is null-safe at every link past the root, so a missing-data read evaluates as `undefined` at ANY DEPTH instead of throwing. That can change whether the notification fires, so see eventDataSettings.condition before relying on it. A chain rooted at a declared member is null-safe at EVERY link past the root, so `this.dataSource.owner.tier` on an event with no `owner` folds to `undefined` and answers false - a silent skip, with nothing recorded. On the nodejs listener only a chain rooted OUTSIDE those five members (`this.target.isPublic`, `this.data.owner.id`) still throws, and only that case is recorded as a failed delivery. Which reads fail rather than fold is a per-listener property and not portable: see the LANGUAGE NOTE on eventDataSettings.condition before relying on the failure row.

## Contained in

- [NotificationService](./NotificationService.md) as `eventNotifications` (a list)

Blueprint paths:

- `notificationService.eventNotifications`

## Contains

- `eventNotificationBasics`: [EventNotificationBasics](./EventNotificationBasics.md)
- `eventDataSettings`: [EventDataSettings](./EventDataSettings.md)
- `geofenceTrigger`: [GeofenceTrigger](./GeofenceTrigger.md)
- `targets`: [NotificationTarget](./NotificationTarget.md), a list
- `template`: [NotificationTemplate](./NotificationTemplate.md)
- `contentModeration`: [ContentModeration](./ContentModeration.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
