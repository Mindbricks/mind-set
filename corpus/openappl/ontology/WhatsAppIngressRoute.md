# WhatsAppIngressRoute

**Level:** `section` · **Family:** [WhatsAppIngressSettings](./families.md#whatsappingresssettings) (domain `NotificationService`)

**Specification:** [WhatsAppIngressRoute in Part 2](../spec/WhatsAppIngressRoute.md)

One explicit listener on a WhatsApp provider's door. The matching events are published to `<codename>-whatsapp-route-<name>` (one envelope per message / status / other change, the same event shape as the implicit topics). `exclusive: true` takes the matching events AWAY from the implicit consumers — for example a human-desk number whose messages must never reach the agent.

## Contained in

- [WhatsAppIngressSettings](./WhatsAppIngressSettings.md) as `routes` (a list)

Blueprint paths:

- `notificationService.whatsappIngress.routes`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
