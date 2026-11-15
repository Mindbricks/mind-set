# NotificationService

**Level:** `module` · **Family:** [NotificationService](../ontology/families.md#notificationservice)

**Ontology:** [NotificationService in Part 1](../ontology/NotificationService.md)

Defines the global notification configuration for the project. Includes provider defaults (under NotificationServiceSettings.serviceOptions) and event-driven notification behaviors. Geofences are NOT declared here — they are runtime data managed via the GeoFence DataObject emitted by the notification factory; EventNotifications match fences at runtime via fenceTags / fenceFilter (see GeofenceTrigger).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `serviceSettings` | [`NotificationServiceSettings`](./NotificationServiceSettings.md) | yes |  |  |  | NotificationServiceSettings defines the basic notification configuration for the project — module-level UX prompt + default-provider-name selection. |
| `eventNotifications` | [`EventNotification`](./EventNotification.md)[] | no |  |  |  | An array of event-based notification definitions. These are triggered either by a Kafka topic (triggerSource='kafka', default) or by a geofence crossing (triggerSource='geofence'). Each entry defines how and where a notification should be delivered. |
| `whatsappIngress` | [`WhatsAppIngressSettings`](./WhatsAppIngressSettings.md) | no |  |  |  | OPTIONAL — extra listeners on the WhatsApp (Meta Cloud) inbound dispatcher. The dispatcher itself needs no configuration: every WhatsApp notification provider (`kind: whatsapp`, `provider: whatsapp`) gets ONE door `/v1/whatsapp-webhooks/meta/<providerName>` on the notification service, verified with that provider's `whatsappAppSecret`, and its events are routed per provider — inbound messages to the agents and mcpbff exposures whose chat surface names the provider (`chatSurfaces[].provider`), delivery statuses to the notification delivery log, other field changes to `<codename>-whatsapp-inbound-other`, and events nothing is bound to to `<codename>-whatsapp-inbound-unrouted`. Declare a route here only for an EXTRA listener that needs its own topic or exclusivity; a plain extra consumer subscribes to `<codename>-whatsapp-inbound-message` with an AgentKafkaController or a kafka-controller BusinessApi and filters on `data.providerName`. |

## Constraints

Property rules:

- `serviceSettings` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `eventNotifications` must have distinct names (`eventNotificationBasics.name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
