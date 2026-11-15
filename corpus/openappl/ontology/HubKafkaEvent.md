# HubKafkaEvent

**Level:** `subsection` · **Family:** [RealtimeHub](./families.md#realtimehub) (domain `Service`)

**Specification:** [HubKafkaEvent in Part 2](../spec/HubKafkaEvent.md)

Bridges a Kafka topic message into the hub as a room-scoped event. When a matching message arrives on the configured Kafka topic, the filterExpression is evaluated. If it passes, the targetRoomExpression extracts the room ID, and the event is broadcast to all clients in that room. Use for backend-driven updates like participant changes, status transitions, or external system notifications.

## Contained in

- [HubEventSettings](./HubEventSettings.md) as `kafkaEvents` (a list)

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.
