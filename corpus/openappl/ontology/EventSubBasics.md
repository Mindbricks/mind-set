# EventSubBasics

**Level:** `section` · **Family:** [EventSubscription](./families.md#eventsubscription) (domain `Service`)

**Specification:** [EventSubBasics in Part 2](../spec/EventSubBasics.md)

Core identity of the event subscription. The name becomes the namespace path `/<service>-api/events/{name}` for WebSocket transport (a Socket.IO namespace on Node.js) or the SSE endpoint `/<service>-api/events/{name}/stream` for SSE transport, `<service>-api` being the owning service's public route.

## Contained in

- [EventSubscription](./EventSubscription.md) as `basics`

Blueprint paths:

- `services.eventSubscriptions.basics`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
