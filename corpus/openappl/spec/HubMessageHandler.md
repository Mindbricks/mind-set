# HubMessageHandler

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubMessageHandler in Part 1](../ontology/HubMessageHandler.md)

**Name:** an instance is named by `messageType`.

Intercepts a specific custom message type and routes it through an MScript before broadcast. The script receives the message, sender session, room record, and service library, and returns an object controlling accept/reject, broadcast targets, message modifications, persistence, and server-generated messages. Use for game moves, bids, collaborative edits, or any message that needs server-side validation or state management.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `messageType` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | The custom message type name to intercept. Must match a name from customMessageTypes in HubMessageSettings. When a client sends a message of this type, the handler script is called instead of the standard broadcast flow. |
| `script` | [`MScript`](./MScript.md) | yes |  |  | MScript kind `code` | MScript called when a message of this type is received. Context: 'session' (sender session), 'message' ({ type, content }), 'roomId', 'room' (room DataObject record), 'lib' (service library). Must return an object: { accept: Boolean, rejectReason?: String, broadcast?: Boolean, broadcastTo?: 'all'\|'others'\|'sender'\|String[], modifiedContent?: Object, persist?: Boolean, serverMessages?: [{ type: String, content: Object, to: 'all'\|'others'\|'sender'\|String[], persist?: Boolean }] }. Example: `{ "js": "lib.chess.processMove(roomId, session, message)" }`. |

## Constraints

Property rules:

- `messageType`, `script` must be present. (`REQUIRED_FIELD_MISSING`)
- `messageType` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
