# WhatsAppIngressSettings

**Level:** `chapter` · **Family:** [WhatsAppIngressSettings](../ontology/families.md#whatsappingresssettings) (domain `NotificationService`)

**Ontology:** [WhatsAppIngressSettings in Part 1](../ontology/WhatsAppIngressSettings.md)

Explicit routes of the WhatsApp inbound dispatcher (`notificationService.whatsappIngress`). Each route publishes the matching events of ONE WhatsApp provider's door to its own topic `<codename>-whatsapp-route-<name>`, in addition to (or, with `exclusive: true`, instead of) the implicit routing to the bound agents / bots and the notification delivery log.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `routes` | [`WhatsAppIngressRoute`](./WhatsAppIngressRoute.md)[] | no |  |  |  | The explicit routes. Optional; the implicit per-provider routing covers the common case. |

## Constraints

Property rules:

- The items of `routes` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
