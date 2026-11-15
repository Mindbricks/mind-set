# GeofenceTrigger

**Level:** `section` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [GeofenceTrigger in Part 2](../spec/GeofenceTrigger.md)

Geofence trigger spec — applied to EventNotifications with triggerSource='geofence'. Fences are runtime DATA (managed via the GeoFence DataObject the notification factory emits), not design-time assets, so this block declares a RULE that matches fences at crossing time rather than specific fence names.

Matching pipeline at runtime: per crossing event {action, fence, userId, ...}, the notification handler subscribes by `action` (one Kafka topic per action: enter/exit/dwell), then filters by `fenceTags` (any-of match against the fence record's tags array, when set), then evaluates the optional `fenceFilter` MScript against the fence record, then evaluates the optional `condition` MScript against the full event payload. All filters default to 'match' when null.

## Contained in

- [EventNotification](./EventNotification.md) as `geofenceTrigger`

Blueprint paths:

- `notificationService.eventNotifications.geofenceTrigger`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
