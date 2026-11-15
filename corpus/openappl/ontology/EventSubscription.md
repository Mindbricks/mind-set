# EventSubscription

**Level:** `chapter` · **Family:** [EventSubscription](./families.md#eventsubscription) (domain `Service`)

**Specification:** [EventSubscription in Part 2](../spec/EventSubscription.md)

Defines a client-facing Kafka event subscription channel. Clients connect via WebSocket (namespace `/<service>-api/events/{name}`; on Node.js a Socket.IO namespace with the HTTP path `/<service>-api/socket.io/`) or SSE (`GET /<service>-api/events/{name}/stream`), `<service>-api` being the owning service's public route, and subscribe to a subset of the configured topics. Each topic is linked to a DataObject whose authorization config drives the default access control. The designer can override access levels, transform payloads, and add custom auth scripts. Authorization automatically splits mixed-access subscriptions -- less-authorized users receive only the topics they are allowed to see.

## Contained in

- [Service](./Service.md) as `eventSubscriptions` (a list)

Blueprint paths:

- `services.eventSubscriptions`

## Contains

- `basics`: [EventSubBasics](./EventSubBasics.md)
- `topics`: [EventSubTopic](./EventSubTopic.md), a list
- `auth`: [EventSubAuth](./EventSubAuth.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
