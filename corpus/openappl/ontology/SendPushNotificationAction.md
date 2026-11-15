# SendPushNotificationAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SendPushNotificationAction in Part 2](../spec/SendPushNotificationAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Sends a push notification using a configured provider (e.g., Firebase, OneSignal). Subject and body are rendered via MScript and sent to the recipient device or user ID. Suitable for in-app or mobile alerts.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `sendPushNotificationActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.sendPushNotificationActions`
- `services.businessLogic.actions.sendPushNotificationActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
