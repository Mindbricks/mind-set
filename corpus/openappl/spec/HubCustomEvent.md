# HubCustomEvent

**Level:** `subsection` · **Family:** [RealtimeHub](../ontology/families.md#realtimehub) (domain `Service`)

**Ontology:** [HubCustomEvent in Part 1](../ontology/HubCustomEvent.md)

**Name:** an instance is named by `name`.

Declares an app-specific event that clients emit within the hub, for signals like game actions, cursor positions or custom notifications. A client sends `hub:event` `{ roomId, event: '<name>', data }` and room members receive `hub:<name>` `{ roomId, userId, ...data }`. The declaration is informational: the runtime relays undeclared event names the same way, does not validate the payload, and never persists custom events. There is no server-side emitter for custom events; server traffic reaches rooms through hubLogic server messages, kafkaEvents or the auto-bridge.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Event name. Clients send it as the event of a `hub:event` frame and the room receives it as `hub:<name>`. Examples: 'gameOver', 'cursorMove', 'reactionBurst'. Do not reuse a standard event name (typing, stopTyping, recording, stopRecording, messageRead, messageDelivered), which an enabled toggle handles first, or a built-in hub frame name such as 'presence' or 'messageArrived'. Convention: camelCase. |
| `description` | `String` | no |  |  |  | Human-readable description of when and why this event is emitted. |
| `ephemeral` | `Boolean` | no | `true` |  |  | Not read by any runtime: custom events are always broadcast only and never persisted, whatever this flag says. Kept so stored blueprints stay valid. |
| `direction` | `HubEventDirection` | no | `"clientToRoom"` | `clientToRoom`, `serverToClient`, `serverToRoom` |  | Intended sender and audience. Only 'clientToRoom' generates code, in the Node.js runtime: a handler that relays the client's `hub:event` to the room as `hub:<name>`, which the hub does for undeclared names anyway. 'serverToClient' and 'serverToRoom' generate nothing in any runtime; server traffic reaches clients through hubLogic server messages (`hub:messageArrived`, to the room or to listed users), kafkaEvents (`hub:<name>`) or the auto-bridge. |

## Constraints

Property rules:

- `name` must be present. (`REQUIRED_FIELD_MISSING`)
- `direction` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
