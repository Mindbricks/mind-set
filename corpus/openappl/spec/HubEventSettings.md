# HubEventSettings

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubEventSettings in Part 1](../ontology/HubEventSettings.md)

Configures standard events, auto-bridged DataObject events, custom events, and external Kafka events. Standard events (typing, recording, read receipts, delivery receipts, presence) are toggleable -- the framework generates the socket handlers; they are broadcast only, never persisted. Auto-bridge relays the create, update and delete events of every DataObject of the hub's service to hub rooms. Custom events and Kafka events remain for app-specific signals and external sources. Event names in these fields are the Node.js runtime's: Java and Python emit the same typing, recording and receipt events but no `hub:online` or `hub:offline`, .NET has no recording, delivery-receipt, online or offline events, and the Go hub implements none of these settings.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enableTypingIndicator` | `Boolean` | no | `false` |  |  | When true, enables built-in typing/stopTyping events. Clients emit 'hub:event' with event 'typing' and the server broadcasts 'hub:typing' / 'hub:stopTyping' to room members. Ephemeral (not persisted). |
| `enableRecordingIndicator` | `Boolean` | no | `false` |  |  | When true, enables built-in recording/stopRecording events for voice message recording state. Clients emit `hub:event` with event 'recording' or 'stopRecording' and the server broadcasts `hub:recording` or `hub:stopRecording` { roomId, userId } to the other room members. Ephemeral (not persisted). |
| `enableReadReceipts` | `Boolean` | no | `false` |  |  | When true, enables built-in read receipt events. Clients emit `hub:event` with event 'messageRead' and data { lastReadTimestamp }, and the server broadcasts `hub:messageRead` { roomId, userId, lastReadTimestamp } to room members, the sender included (server time when no timestamp is sent). Ephemeral (not persisted): a client that needs read state across sessions must store it itself. |
| `enableDeliveryReceipts` | `Boolean` | no | `false` |  |  | When true, enables built-in delivery receipt events. Clients emit `hub:event` with event 'messageDelivered' and data { messageId } when a message is received, and the server broadcasts `hub:messageDelivered` { roomId, userId, messageId } to room members, the sender included. Ephemeral (not persisted). |
| `enablePresence` | `Boolean` | no | `false` |  |  | When true, enables built-in online and offline presence events: the server broadcasts `hub:online` { roomId, userId } to a room on a socket's first join of it, and `hub:offline` { roomId, userId } to every room the socket had joined when it disconnects. There is no away state. Ephemeral. The `hub:presence` joined and left frames are sent whatever this flag says. |
| `autoBridgeDataEvents` | `Boolean` | no | `true` |  |  | When true (default), the hub subscribes to the Kafka create, update and delete events of every DataObject of its service (the room object, membership objects, the hub's own message and moderation objects and any other) and relays each one to one room as `hub:<objectName>.<verb>` (declared object name; verb created, updated or deleted) with the payload `{ roomId, ...record }`. The room is the record's `<roomDataObject>Id` field, else its roomId, else its own id; a record without one is not relayed. If 'system' message type is enabled, each relayed event is also stored as a system message `{ systemAction: '<objectName>.<verb>', systemData: record }` in the room's history (stored, not broadcast). |
| `customEvents` | [`HubCustomEvent`](./HubCustomEvent.md)[] | no |  |  |  | App-specific events beyond the standard set, each declared with a name, a direction and an ephemeral flag. The declarations are informational: a client's `hub:event` `{ roomId, event, data }` whose event no enabled standard toggle handles is relayed to room members, the sender included, as `hub:<event>` `{ roomId, userId, ...data }`, declared or not; direction and ephemeral change nothing at runtime, and custom events are never persisted. Use for domain-specific interactions like collaborative cursor tracking or custom notifications that don't fit built-in standard events. |
| `kafkaEvents` | [`HubKafkaEvent`](./HubKafkaEvent.md)[] | no |  |  |  | External Kafka topic events to bridge into hub rooms. Use for events from other services or topics not covered by auto-bridge (which handles only the DataObjects of the hub's own service). Each entry specifies a topic, an optional filter expression, and a target room expression (default `data.roomId \|\| data.id`); room members receive `hub:<name>` `{ roomId, ...record }`. Nothing is persisted. |

## Constraints

Property rules:

- The items of `customEvents` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
- The items of `kafkaEvents` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
