# HubEventSettings

**Level:** `section` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubEventSettings in Part 2](../spec/HubEventSettings.md)

Configures standard events, auto-bridged DataObject events, custom events, and external Kafka events. Standard events (typing, recording, read receipts, delivery receipts, presence) are toggleable -- the framework generates the socket handlers; they are broadcast only, never persisted. Auto-bridge relays the create, update and delete events of every DataObject of the hub's service to hub rooms. Custom events and Kafka events remain for app-specific signals and external sources. Event names in these fields are the Node.js runtime's: Java and Python emit the same typing, recording and receipt events but no `hub:online` or `hub:offline`, .NET has no recording, delivery-receipt, online or offline events, and the Go hub implements none of these settings.

## Contained in

- [RealtimeHub](./RealtimeHub.md) as `eventSettings`

Blueprint paths:

- `services.realtimeHubs.eventSettings`

## Contains

- `customEvents`: [HubCustomEvent](./HubCustomEvent.md), a list
- `kafkaEvents`: [HubKafkaEvent](./HubKafkaEvent.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
