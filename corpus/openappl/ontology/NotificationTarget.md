# NotificationTarget

**Level:** `section` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [NotificationTarget in Part 2](../spec/NotificationTarget.md)

Defines a recipient or list of recipients for an event notification. Targets are derived from the notification data and can be conditional. By default `targetKind: 'userId'` resolves to an authenticated user and the system looks up the user's email/phone/devices via auth-service. Set `targetKind` to one of `email` / `phoneNumber` / `whatsappPhone` / `telegramHandle` / `deviceToken` when the resolved value at `targetPathInData` is already the direct contact handle — typically when notifying non-users (leads, opted-in subscribers, etc.) whose contact details live in the application database, not the auth user table. The AUDIENCE kinds `role` / `userGroup` address a set of users instead of a payload-sourced value: `targetValue` names a declared role value or user group, the notification service asks the auth service (M2M) for the matching users at delivery time, and each resolved user then follows the normal `userId` delivery path (dedup across targets included).

## Contained in

- [EventNotification](./EventNotification.md) as `targets` (a list)

Blueprint paths:

- `notificationService.eventNotifications.targets`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
