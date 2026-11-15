# EventSubscription

**Level:** `chapter` · **Family:** [EventSubscription](../ontology/families.md#eventsubscription) (domain `Service`)

**Ontology:** [EventSubscription in Part 1](../ontology/EventSubscription.md)

**Name:** an instance is named by `basics.name`.

Defines a client-facing Kafka event subscription channel. Clients connect via WebSocket (namespace `/<service>-api/events/{name}`; on Node.js a Socket.IO namespace with the HTTP path `/<service>-api/socket.io/`) or SSE (`GET /<service>-api/events/{name}/stream`), `<service>-api` being the owning service's public route, and subscribe to a subset of the configured topics. Each topic is linked to a DataObject whose authorization config drives the default access control. The designer can override access levels, transform payloads, and add custom auth scripts. Authorization automatically splits mixed-access subscriptions -- less-authorized users receive only the topics they are allowed to see.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `basics` | [`EventSubBasics`](./EventSubBasics.md) | yes |  |  |  | Core identity of the event subscription including its name, description, and transport protocol (WebSocket or SSE). The name determines the WebSocket namespace (`/<service>-api/events/{name}`) or SSE endpoint (`/<service>-api/events/{name}/stream`), `<service>-api` being the owning service's public route. |
| `topics` | [`EventSubTopic`](./EventSubTopic.md)[] | no |  |  |  | An array of Kafka topics exposed through this subscription. Each topic is linked to a DataObject whose authorization config drives default access control. Topics can override access levels, transform payloads, and exclude sensitive fields before delivery to clients. Note that framework-raised topics deliver the unified event ENVELOPE: `{ id, type, source, time, requestId, actor, data: { _type, ...record }, old? }` — the record always sits under `data` (updates additionally carry the previous row under `old`), so payload transforms and field exclusions operate on that `data` shape. Envelopes never include a session or tokens. Use the `getKafkaEventPayloadStructure` tool to see the exact per-topic shape. |
| `auth` | [`EventSubAuth`](./EventSubAuth.md) | yes |  |  |  | Authorization configuration for the subscription. Default auth derives from each topic's DataObject access level (public/protected/private). Supports absoluteRoles to bypass all checks, checkRoles to gate access, and custom MScript auth/filter logic for per-topic and per-event authorization. |

## Constraints

Property rules:

- `basics`, `auth` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `topics` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `EVENT_SUB_TOPIC_OBJECT_UNRESOLVED` | warning | EventSubscription topic "…" names dataObjectName "…", which is not a DataObject of this service. |
| `EXPLICIT_TOPIC_REQUIRED` | error | EventSubscription topic[…] "…" must declare an explicit Kafka topic name. |
| `INVALID_TRANSPORT` | error | EventSubscription basics.transport must be "websocket" or "sse", got "…". |
