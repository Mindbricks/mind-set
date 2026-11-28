# ContentModeration

**Level:** `section` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [ContentModeration in Part 2](../spec/ContentModeration.md)

Decision moderation of content that is not a DataObject write: objectModeration applied to RealtimeHub messages and outbound notification content. It is the SAME mechanism as ObjectModeration, not a second one: ONE framework-owned `choice` question, `verdict`, over { accept, reject, review } with `policy` as its instructions, the same `confidenceThreshold` (below it a verdict goes to review), the same `onProviderError` posture, the same two-tier reasons (`wantReason` + `escalateTo`) and the same review row shape (`sys_<X>ModerationReview`, decided through the same injected reviewer Business APIs). What differs is the surface: a held message or notification is not written anywhere until a reviewer accepts it, and the accept DELIVERS it (the room receives the message, the recipients the notification). A ContentModel uses its own `contentModeration` block, an ObjectModeration the framework applies to the content objects it synthesizes. Hub and notification moderation is implemented for nodejs, java, dotnet, rust and python; other unported languages retain OBJECT_MODERATION_LANGUAGE_UNSUPPORTED.

## Contained in

- [EventNotification](./EventNotification.md) as `contentModeration`
- [RealtimeHub](./RealtimeHub.md) as `contentModeration`

Blueprint paths:

- `notificationService.eventNotifications.contentModeration`
- `services.realtimeHubs.contentModeration`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
