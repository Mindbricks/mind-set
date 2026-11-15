# HubKafkaEvent

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubKafkaEvent in Part 1](../ontology/HubKafkaEvent.md)

**Name:** an instance is named by `name`.

Bridges a Kafka topic message into the hub as a room-scoped event. When a matching message arrives on the configured Kafka topic, the filterExpression is evaluated. If it passes, the targetRoomExpression extracts the room ID, and the event is broadcast to all clients in that room. Use for backend-driven updates like participant changes, status transitions, or external system notifications.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Event name emitted to room clients when a matching Kafka message arrives. Example: 'participantAdded', 'statusChanged'. |
| `description` | `String` | no |  |  |  | Human-readable description of what this Kafka-bridged event represents. |
| `topic` | `String` | yes |  |  |  | Kafka topic to subscribe to. The hub creates a consumer for this topic and evaluates incoming messages against the filterExpression. |
| `filterExpression` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript expression evaluated against each Kafka message to decide if it should be bridged. Has access to 'data' (the parsed message payload). Example: `{ "js": "data.eventType === 'participant.added'" }`. If omitted, all messages on the topic are bridged. |
| `targetRoomExpression` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript expression to extract the target room ID from the Kafka message. Has access to 'data'. Example: `{ "js": "data.chatId" }`. The event is broadcast only to clients in this room. |

## Constraints

Property rules:

- `name`, `topic`, `targetRoomExpression` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
