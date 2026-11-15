# WhatsAppIngressSettings

**Level:** `chapter` · **Family:** [WhatsAppIngressSettings](./families.md#whatsappingresssettings) (domain `NotificationService`)

**Specification:** [WhatsAppIngressSettings in Part 2](../spec/WhatsAppIngressSettings.md)

Explicit routes of the WhatsApp inbound dispatcher (`notificationService.whatsappIngress`). Each route publishes the matching events of ONE WhatsApp provider's door to its own topic `<codename>-whatsapp-route-<name>`, in addition to (or, with `exclusive: true`, instead of) the implicit routing to the bound agents / bots and the notification delivery log.

## Contained in

- [NotificationService](./NotificationService.md) as `whatsappIngress`

Blueprint paths:

- `notificationService.whatsappIngress`

## Contains

- `routes`: [WhatsAppIngressRoute](./WhatsAppIngressRoute.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
