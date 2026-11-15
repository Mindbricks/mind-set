# HubMessageSettings

**Level:** `section` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubMessageSettings in Part 1](../ontology/HubMessageSettings.md)

Controls message structure and persistence. Every hub auto-generates a Message DataObject with system fields (id, roomId, senderId, timestamp), a messageType enum column, and a content JSONB column. Designers select which built-in message types to support (text, image, video, etc.) and can define custom message types with app-specific field schemas. Cross-cutting features (reply threading, reactions, forwarded flag) are toggleable across all message types.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `dataObjectName` | `String` | no |  |  | format [codeName](./value-formats.md#codename) | Name for the auto-generated Message DataObject. Must be a valid code name. Convention: '{HubName}Message'. Example: 'ChatHubMessage', 'GameLobbyMessage'. If omitted, defaults to '{hubName}Message'. |
| `messageTypes` | `HubMessageType`[] | no |  | 9 values, see [HubMessageType](#hubmessagetype) |  | Built-in message types to support in this hub. Each type has a known content schema managed by the framework. Select the types relevant to your use case. The messageType column in the DataObject becomes an enum of all selected built-in types plus any custom message type names. |
| `enableReplyTo` | `Boolean` | no | `false` |  |  | When true, adds a 'replyTo' JSON field to all messages for threading/reply support. Contains { id, preview }. Works across all message types. |
| `enableReaction` | `Boolean` | no | `false` |  |  | When true, adds a 'reaction' JSON array field to all messages for emoji reactions. Each entry has emoji, userId, timestamp. Works across all message types. |
| `enableForwarded` | `Boolean` | no | `false` |  |  | When true, adds a 'forwarded' Boolean field to all messages indicating if the message was forwarded from another room. Works across all message types. |
| `customMessageTypes` | [`HubCustomMessageType`](./HubCustomMessageType.md)[] | no |  |  |  | App-specific message types beyond the built-in set. Each custom type defines a name (added to the messageType enum) and a field schema validated at runtime. Use for structured payloads like game moves, bids, polls, or domain-specific actions. The fields are stored in the message's content JSONB column. |

## Allowed values

### HubMessageType

`text`, `image`, `video`, `audio`, `document`, `sticker`, `contact`, `location`, `system`

## Constraints

Property rules:

- `messageTypes` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `dataObjectName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `customMessageTypes` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)
