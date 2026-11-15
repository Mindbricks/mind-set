# WhatsAppIngressRoute

**Level:** `section` · **Family:** [WhatsAppIngressSettings](../ontology/families.md#whatsappingresssettings) (domain `NotificationService`)

**Ontology:** [WhatsAppIngressRoute in Part 1](../ontology/WhatsAppIngressRoute.md)

**Name:** an instance is named by `name`.

One explicit listener on a WhatsApp provider's door. The matching events are published to `<codename>-whatsapp-route-<name>` (one envelope per message / status / other change, the same event shape as the implicit topics). `exclusive: true` takes the matching events AWAY from the implicit consumers — for example a human-desk number whose messages must never reach the agent.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique route name; the topic is `<codename>-whatsapp-route-<name>`. Must be a valid codeName. |
| `provider` | `String` | yes |  |  |  | The WhatsApp notification provider (`kind: whatsapp`, `provider: whatsapp`) whose door this route listens on. Must name an existing provider (WHATSAPP_ROUTE_UNKNOWN_PROVIDER otherwise). |
| `events` | `WhatsAppIngressEventKind`[] | no |  | `messages`, `statuses`, `other`, `all` |  | Which events of the provider the route takes: `messages`, `statuses`, `other`, or `all`. Absent or empty = all. |
| `messageTypes` | `String`[] | no |  |  |  | For `messages`: only these Meta message types (`text`, `interactive`, `image`, `audio`, `document`, `location`, `reaction`, ...). Absent = every type. |
| `exclusive` | `Boolean` | no | `false` |  |  | When true, the events this route matches are published ONLY to the route topic and no longer reach the implicit consumers (the bound agents / bots for messages, the notification delivery log for statuses). Default false: the route is an additional copy. |

## Constraints

Property rules:

- `name`, `provider` must be present. (`REQUIRED_FIELD_MISSING`)
- `events` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
