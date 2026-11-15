# SendSmsAction

**Level:** `section` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [SendSmsAction in Part 2](../spec/SendSmsAction.md)

**Extends:** [BusinessApiAction](./BusinessApiAction.md)

Sends an SMS message using a configured SMS provider. The recipient phone number, message content, and sender ID are defined using MScript expressions. Useful for OTPs, short notifications, or alerts.

## Contained in

- [BusinessApiActionStore](./BusinessApiActionStore.md) as `sendSmsActions` (a list)

Blueprint paths:

- `authentication.businessLogic.actions.sendSmsActions`
- `services.businessLogic.actions.sendSmsActions`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
